/**
 * ai.js — semantic search for ayumad.me/ai (static, zero-backend).
 *
 * Loads once at build time into public/ai/ai.js by build-ai-section.mjs.
 * Strategy:
 *   1. fetch search-index.json (precomputed embeddings for every note/folder/tag)
 *   2. on first query, lazily import the vendored transformers.js web build and
 *      embed the query with the SAME model used at build (all-MiniLM-L6-v2 q8,
 *      vendored under /ai/model/ — no HF/CDN dependency for weights)
 *   3. cosine vs note vectors + folder/tag "topic" vectors → top results
 *   4. if the model/runtime can't load (offline, blocked CDN), fall back to
 *      lexical token scoring so search still works
 *
 * UI: lives in the topbar; '/' or Cmd/Ctrl-K focuses, Esc closes, ↑/↓ move,
 * Enter opens. No dependencies, plain ES module.
 */
(() => {
  "use strict";
  const INDEX_URL = "/ai/search-index.json";
  const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
  const input = document.getElementById("ai-search");
  const panel = document.getElementById("ai-panel");
  if (!input || !panel) return;

  let index = null;
  let embedQuery = null; // (text) => Float32Array, once model is ready
  let modelPromise = null; // in-flight init, shared so waiters don't double-load
  let modelTried = false;
  let mode = "engine-loading";
  const results = []; // active result entries (from last render)
  let activeIdx = -1;
  let debounce = null;

  /* ---------- index ---------- */
  async function loadIndex() {
    const res = await fetch(INDEX_URL, { cache: "force-cache" });
    const j = await res.json();
    j.notes.forEach((n) => { n.vec = decodeVec(n.vec); });
    j.folders.forEach((f) => { f.vec = decodeVec(f.vec); });
    j.tags.forEach((t) => { t.vec = decodeVec(t.vec); });
    return j;
  }
  function decodeVec(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }
  function cosine(a, b) {
    let d = 0;
    for (let i = 0; i < a.length; i++) d += a[i] * b[i];
    return d; // vectors are normalized → cosine in [-1,1]
  }

  /* ---------- model (lazy, single shared load) ---------- */
  function initModel() {
    if (modelPromise) return modelPromise;
    modelTried = true;
    modelPromise = (async () => {
      // Library from jsdelivr, PINNED 4.2.0 (the official vanilla-JS pattern):
      // the web bundle has bare imports (onnxruntime-web/webgpu) that only a
      // bundler or jsdelivr's ESM rewrite can resolve, and committing the raw
      // file trips GitHub's secret scanner on a false "Mistral API key" match
      // (the library's own Mistral model-registry class names). The MODEL is
      // still vendored locally at /ai/model/ — allowRemoteModels=false.
      const mod = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0");
      const { pipeline, env } = mod;
      env.localModelPath = "/ai/model/";
      env.allowRemoteModels = false;
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1; // no cross-origin isolation needed
        env.backends.onnx.wasm.proxy = false;
        // leave wasmPaths default (jsdelivr, version-matched by the bundle)
      }
      const extractor = await pipeline("feature-extraction", MODEL_ID, { quantized: true, dtype: "q8" });
      embedQuery = async (text) => {
        const out = await extractor(text.slice(0, 800), { pooling: "mean", normalize: true });
        return new Float32Array(out.data);
      };
      mode = "semantic";
    })().catch((e) => {
      console.warn("[ai] semantic search unavailable, using lexical fallback:", e);
      mode = "lexical";
    });
    return modelPromise;
  }

  /* ---------- scoring ---------- */
  function tokenize(s) {
    return (s.toLowerCase().match(/[a-z0-9][a-z0-9'’-]*/g) || []).filter((t) => t.length > 1);
  }
  function highlight(text, tokens) {
    if (!tokens.length) return text;
    let out = text;
    for (const t of tokens.slice(0, 6)) {
      const re = new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      out = out.replace(re, (m) => `<b>${m}</b>`);
    }
    return out;
  }
  function scoreLexical(q, note) {
    const tokens = tokenize(q);
    if (!tokens.length) return 0;
    const titleT = tokenize(note.title);
    const tagT = (note.tags || []).join(" ").toLowerCase().split(/\s+/).filter(Boolean);
    const bodyT = tokenize(note.excerpt);
    let s = 0;
    for (const t of tokens) {
      if (titleT.includes(t)) s += 2.2; // title hits are strong
      if (tagT.includes(t)) s += 1.4;
      if (bodyT.includes(t)) s += 1.0;
    }
    return s;
  }

  async function search(q) {
    q = q.trim();
    if (!index) index = await loadIndex();
    if (!embedQuery) await (modelPromise || initModel()); // wait for shared load (resolves to lexical on failure)

    const queryTokens = tokenize(q);
    let noteScores;
    if (mode === "semantic") {
      const qv = await embedQuery(q);
      noteScores = index.notes.map((n) => {
        let s = cosine(qv, n.vec);
        // small lexical boost for exact token matches in title/folder/tags
        if (queryTokens.length) {
          const titleT = tokenize(n.title);
          const tagT = (n.tags || []).join(" ").toLowerCase();
          const folderT = (n.folder || "").toLowerCase();
          for (const t of queryTokens) {
            if (titleT.includes(t)) s += 0.09;
            else if (tagT.includes(t)) s += 0.04;
            else if (folderT.includes(t)) s += 0.03;
          }
        }
        return { ...n, s };
      });
    } else {
      noteScores = index.notes.map((n) => ({ ...n, s: scoreLexical(q, n) }));
    }
    noteScores.sort((a, b) => b.s - a.s);

    // topics: folders + tags scored the same way (semantic cosine or lexical)
    let folderScores, tagScores;
    if (mode === "semantic") {
      const qv = await embedQuery(q);
      folderScores = index.folders
        .map((f) => ({ kind: "folder", ...f, s: cosine(qv, f.vec) + (f.name.toLowerCase().includes(q.toLowerCase()) ? 0.08 : 0) }))
        .sort((a, b) => b.s - a.s);
      tagScores = index.tags
        .map((t) => ({ kind: "tag", ...t, s: cosine(qv, t.vec) + (t.name.toLowerCase().includes(q.toLowerCase()) ? 0.08 : 0) }))
        .sort((a, b) => b.s - a.s);
    } else {
      folderScores = index.folders
        .map((f) => ({ kind: "folder", ...f, s: scoreLexical(q, { title: f.name, tags: [], excerpt: f.name }) }))
        .sort((a, b) => b.s - a.s);
      tagScores = index.tags
        .map((t) => ({ kind: "tag", ...t, s: scoreLexical(q, { title: t.name, tags: [], excerpt: t.name }) }))
        .sort((a, b) => b.s - a.s);
    }
    const topics = [...folderScores.slice(0, 4), ...tagScores.slice(0, 4)]
      .filter((t) => t.s > (mode === "semantic" ? 0.28 : 0.01))
      .slice(0, 6);
    // drop zero-scoring lexical topics
    const nonZero = topics.filter((t) => t.s > 0);
    return { notes: noteScores, topics: nonZero };
  }

  /* ---------- render ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function render({ notes, topics }, q) {
    const tokens = tokenize(q);
    results.length = 0;
    activeIdx = -1;

    const topNotes = notes.filter((n) => n.s > 0.05).slice(0, 8);
    if (!topNotes.length) {
      panel.innerHTML = `<div class="ai-empty">no matches — try broader terms, or a topic like <i>context</i> / <i>rag</i> / <i>evals</i></div>`;
      panel.hidden = false;
      return;
    }

    let html = "";
    if (topics.length) {
      html += `<div class="ai-sec">topics</div><div class="ai-topics">`;
      for (const t of topics) {
        if (t.kind === "folder") {
          html += `<a class="ai-chip" href="${t.url || "/ai/"}">${esc(t.name)} <span class="n">(${t.count})</span></a>`;
        } else {
          html += `<a class="ai-chip" href="#" data-tag="${esc(t.name)}">#${esc(t.name)} <span class="n">(${t.count})</span></a>`;
        }
      }
      html += `</div>`;
    }
    html += `<div class="ai-sec">notes${mode === "lexical" ? " · lexical" : ""}</div>`;
    topNotes.forEach((n, i) => {
      const meta = [n.folder || "Root", (n.tags || []).slice(0, 3).join(" · ")].filter(Boolean).join(" — ");
      html += `<a class="ai-hit${i === 0 ? " active" : ""}" href="${esc(n.url)}" data-i="${i}">
        <div class="t">${esc(n.title)}</div>
        <div class="m">${esc(meta)} · ${Math.round(Math.max(0, Math.min(1, n.s)) * 100)}%</div>
        <div class="x">${highlight(esc(n.excerpt), tokens)}</div>
      </a>`;
      results.push(n);
    });
    if (mode === "semantic" && topNotes.length) {
      html += `<div class="ai-state">semantic search — ${index.notes.length} notes indexed, model local</div>`;
    } else if (mode === "lexical") {
      html += `<div class="ai-state">keyword fallback (model offline) — ${index.notes.length} notes</div>`;
    }
    panel.innerHTML = html;
    panel.hidden = false;
    panel.querySelectorAll(".ai-chip[data-tag]").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        input.value = chip.dataset.tag;
        run();
      });
    });
  }

  async function run() {
    const q = input.value;
    if (q.length < 2) { panel.hidden = true; return; }
    if (!index) {
      panel.innerHTML = `<div class="ai-state">loading index…</div>`;
      panel.hidden = false;
    }
    try {
      const out = await search(q);
      render(out, q);
    } catch (e) {
      console.error("[ai] search failed:", e);
      panel.innerHTML = `<div class="ai-empty">search failed — ${esc(String(e.message || e))}</div>`;
      panel.hidden = false;
    }
  }
  function onInput() {
    clearTimeout(debounce);
    debounce = setTimeout(run, 160);
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if ((e.key === "/" || (e.metaKey || e.ctrlKey) && e.key === "k") && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
      input.select();
      run();
    }
    if (document.activeElement !== input) return;
    if (e.key === "Escape") { panel.hidden = true; input.blur(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const hits = panel.querySelectorAll(".ai-hit");
      if (!hits.length) return;
      activeIdx = e.key === "ArrowDown" ? (activeIdx + 1) % hits.length : (activeIdx - 1 + hits.length) % hits.length;
      hits.forEach((h, i) => h.classList.toggle("active", i === activeIdx));
      hits[activeIdx].scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = panel.querySelector(".ai-hit.active") || panel.querySelector(".ai-hit");
      if (hit) window.location.href = hit.getAttribute("href");
    }
  });
  input.addEventListener("input", onInput);
  input.addEventListener("focus", () => { if (input.value.length >= 2) run(); });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== input) panel.hidden = true;
  });

  // load the model only when the user shows intent (focus or '/' key) —
  // a visitor who never searches pays zero download for the 36MB model+wasm
  const warmIfNeeded = () => { if (!modelTried) initModel().catch(() => {}); };
  input.addEventListener("focus", () => { warmIfNeeded(); if (input.value.length >= 2) run(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) { if (document.activeElement !== input) warmIfNeeded(); }
  });
  window.addEventListener("load", () => {
    setTimeout(() => { fetch(INDEX_URL, { cache: "force-cache" }).catch(() => {}); }, 300);
  });
})();