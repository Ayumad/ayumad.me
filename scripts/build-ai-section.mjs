#!/usr/bin/env node
/**
 * build-ai-section.mjs — publish the AI-Engineering curriculum as a public,
 * self-contained static section at ayumad.me/ai.
 *
 * Reads:  ~/Documents/Main/AI-Engineering/** (the vault is the source of truth)
 * Writes: public/ai/ in THIS repo (must be COMMITTED — Vercel has no vault access)
 *
 * Preserves the vault's folder structure and content exactly:
 *   - one .html per note, same folders (URL-encoded segments), .md stripped
 *   - wikilinks resolved within the curriculum; out-of-scope → inert dimmed span
 *   - body kept byte-faithful (incl. the ← prev · Home · next → bars the notes carry)
 *   - index.html = AI_Home.md, plus a folder-browsing index at the bottom
 *   - visual style mirrors ayumad.me/vault (same tokens, mono, CRT scanlines)
 *
 * Semantic search (ayumad.me/ai):
 *   - embeds every note (title + folder + tags + excerpt) with
 *     Xenova/all-MiniLM-L6-v2 (q8) at build time → search-index.json (+ folders/tags
 *     as "topic" vectors so a query also surfaces related topics)
 *   - vendors the same model + transformers.web.min.js into public/ai/model+vendor
 *     so the client embeds queries locally — no CDN/API dependency, no cost
 *   - client (ai.js) lazy-loads the model on first search; lexical fallback if
 *     the runtime can't load
 *
 * Links are ROOT-ABSOLUTE (/ai/...) — never relative. Relative hrefs from deep
 * folders (../, ./) break on static hosts: `./` resolves to the folder URL,
 * which Vercel answers with its SPA catch-all (200 + wrong page).
 *
 * Run:  node scripts/build-ai-section.mjs   (from the ayumad.me repo root)
 * Env:  AI_VAULT_DIR override for the vault source (default ~/Documents/Main)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { pipeline as makeExtractor, env as hfEnv } from "@huggingface/transformers";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = process.env.AI_VAULT_DIR || path.join(process.env.HOME, "Documents", "Main");
const srcDir = path.join(vaultRoot, "AI-Engineering");
const outDir = path.join(repoRoot, "public", "ai");
const URL_BASE = "/ai/";
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

if (!fs.existsSync(srcDir)) throw new Error(`AI-Engineering source not found: ${srcDir}`);
console.log(`reading ${srcDir}`);

// ---------- collect notes ----------
const notes = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(srcDir, full).replaceAll(path.sep, "/");
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) notes.push({ full, rel });
  }
}
walk(srcDir);
notes.sort((a, b) => a.rel.localeCompare(b.rel));

// ---------- helpers (mirror build-vault-site.mjs semantics) ----------
function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: text };
  const meta = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.trim() || /^\s/.test(line)) continue;
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return { meta, body: text.slice(end + 4).replace(/^\n/, "") };
}
const LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]+)?(\|[^\]]+)?\]\]/g;

// title index for shortest-path link resolution
const byTitle = new Map();
for (const n of notes) {
  const text = fs.readFileSync(n.full, "utf8");
  const h1 = /^#\s+(.+?)\s*$/m.exec(text);
  const title = h1 ? h1[1].trim() : path.basename(n.rel, ".md");
  n.title = title;
  byTitle.set(title.toLowerCase(), byTitle.get(title.toLowerCase()) || n.rel);
  byTitle.set(path.basename(n.rel, ".md").toLowerCase(), n.rel);
}

// ---------- slugs: short, stable, unique URLs (flat, extensionless) ----------
// "The Gist of It" → /ai/the-gist-of-it. The old folder-structure URLs
// (`/ai/00%20Start%20Here/The%20Gist%20of%20It.html`) get generated redirect
// pages so anything already shared keeps working.
const slugByRel = new Map(); // rel -> slug (AI_Home.md handled separately → /ai/)
const usedSlugs = new Set();
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
for (const n of notes) {
  if (n.rel === "AI_Home.md") continue;
  let base = slugify(n.title) || slugify(path.basename(n.rel, ".md")) || "note";
  let slug = base, i = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
  usedSlugs.add(slug);
  slugByRel.set(n.rel, slug);
}

function resolveTarget(raw) {
  const t = raw.trim();
  if (t.includes("/")) {
    const p = t.endsWith(".md") ? t : t + ".md";
    if (fs.existsSync(path.join(srcDir, p))) return p;
  }
  return byTitle.get(t.toLowerCase()) || null;
}

/** URL for a note from anywhere: root-absolute, short slug, no extension. */
function hrefFor(fromRel, rel) {
  if (rel === "AI_Home.md") return URL_BASE;
  return URL_BASE + slugByRel.get(rel);
}

/** Convert wikilinks in a body: in-scope → markdown link, else inert dimmed span. */
function resolveWikilinks(body, fromRel) {
  return body.replace(
    LINK_RE,
    (m, target, rest) => {
      const alias = rest && rest.startsWith("|") ? rest.slice(1) : null;
      const rel = resolveTarget(target);
      if (!rel) {
        const label = alias || target.split("/").pop();
        return `<span class="wl-x">${escapeHtml(label)}</span>`;
      }
      const label = alias || rel.slice(0, -3).split("/").pop();
      return `[${label.replace(/[[\]]/g, "")}](${hrefFor(fromRel, rel)})`;
    }
  );
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- render each note ----------
const records = notes.map((n) => {
  const text = fs.readFileSync(n.full, "utf8");
  const { meta, body } = parseFrontmatter(text);
  return { ...n, meta, body };
});

// ---------- semantic search: embeddings + index ----------
function plainExcerpt(body) {
  return body
    .replace(/^#\s+[^\n]*$/m, "")          // drop the H1 (it's the title)
    .replace(/[[\]#>*`~|]/g, " ")          // coarse markdown strip
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}
function vecToB64(vec) {
  const buf = new Float32Array(vec).buffer;
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function buildSearchIndex() {
  hfEnv.cacheDir = path.join(repoRoot, ".hf-cache");
  console.log("loading embedding model (q8)…");
  const extractor = await makeExtractor("feature-extraction", MODEL_ID, { quantized: true, dtype: "q8" });
  const embed = async (text) => {
    const o = await extractor(text.slice(0, 800), { pooling: "mean", normalize: true });
    return Array.from(o.data);
  };

  const notesIdx = [];
  const folderVectors = new Map(); // folder -> {name, vecs:[], url}
  const tagCounts = new Map();     // tag -> {count, vecs:[]}
  for (const r of records) {
    const folder = r.rel.includes("/") ? r.rel.split("/").slice(0, -1).join("/") : "";
    const tags = (r.meta.tags || "").replace(/[\[\]"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
    const excerpt = plainExcerpt(r.body);
    const vec = await embed(`${r.title}. ${folder ? folder + ". " : ""}${tags.join(", ")}. ${excerpt}`);
    notesIdx.push({
      url: hrefFor(r.rel, r.rel),
      title: r.title,
      folder,
      tags,
      excerpt,
      vec: vecToB64(vec),
    });
    // topic vectors: folders get a query-like embedding of their name+hub title
    if (folder) {
      folderVectors.set(folder, folderVectors.get(folder) || { name: folder, vecs: [], url: null });
      folderVectors.get(folder).vecs.push(vec);
    }
    for (const t of tags) {
      tagCounts.set(t, tagCounts.get(t) || { count: 0, vecs: [] });
      tagCounts.get(t).count += 1;
      tagCounts.get(t).vecs.push(vec);
    }
    process.stdout.write(`·`);
  }
  process.stdout.write("\n");

  // folder topics: embed folder name (its notes' vectors also contribute via avg below)
  const foldersIdx = [];
  for (const [name, f] of folderVectors) {
    const hub = records.find((r) => {
      const folder = r.rel.includes("/") ? r.rel.split("/").slice(0, -1).join("/") : "";
      return folder === name && /hub/i.test(r.title);
    });
    f.url = hub ? hrefFor(hub.rel, hub.rel) : null;
    const vec = await embed(`folder ${name}: ${name}`);
    foldersIdx.push({ name, url: f.url, count: f.vecs.length, vec: vecToB64(vec) });
  }

  // tag topics: only tags on >=2 notes, embedded from the tag name
  const tagsIdx = [];
  for (const [name, t] of tagCounts) {
    if (t.count < 2) continue;
    const vec = await embed(`tag ${name}`);
    tagsIdx.push({ name, count: t.count, vec: vecToB64(vec) });
  }

  const index = {
    version: 1,
    model: MODEL_ID,
    builtBy: "build-ai-section.mjs",
    notes: notesIdx,
    folders: foldersIdx,
    tags: tagsIdx,
  };
  fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify(index));
  console.log(`search-index.json: ${notesIdx.length} notes, ${foldersIdx.length} folders, ${tagsIdx.length} tags`);
}

// ---------- vendor the client runtime (model only) ----------
// ONLY the quantized model is vendored. The transformers.js library is
// imported from jsdelivr (pinned version) at runtime: its web bundle has bare
// imports (onnxruntime-web/webgpu) that only a bundler or jsdelivr's ESM
// rewrite can resolve, and committing it trips GitHub secret-push-protection
// on a false "Mistral API key" match (library model-registry class names).
function vendorRuntime() {
  const hfCache = path.join(repoRoot, ".hf-cache", ...MODEL_ID.split("/"));
  const modelDir = path.join(outDir, "model", ...MODEL_ID.split("/"));
  fs.mkdirSync(modelDir, { recursive: true });
  for (const f of ["config.json", "tokenizer.json", "tokenizer_config.json"]) {
    fs.copyFileSync(path.join(hfCache, f), path.join(modelDir, f));
  }
  const onnxDir = path.join(modelDir, "onnx");
  fs.mkdirSync(onnxDir, { recursive: true });
  fs.copyFileSync(path.join(hfCache, "onnx", "model_quantized.onnx"), path.join(onnxDir, "model_quantized.onnx"));
  console.log("vendored quantized model (library loads from pinned jsdelivr CDN)");
}

// ---------- visual style (mirrors ayumad.me/vault) ----------
const CSS = `:root{
  --bg:#000000;--surface:#0a0a0a;--raised:#101014;--hover:#16161c;
  --border:#1e1e26;--border-strong:#2e2e3a;
  --text:#e8e6de;--muted:#a8a597;--faint:#6f6e66;
  --accent:#c4b5fd;--accent-strong:#e0d7ff;--accent-dim:rgba(196,181,253,.10);
  --phos:#7ef0b2;--cyan:#67e8f9;--amber:#fcd34d;--red:#ff6b81;
  --glow-r:rgba(255,0,60,.35);--glow-c:rgba(0,255,240,.30);
  --mono:'3270 Nerd Font','IBM Plex Mono','SF Mono',ui-monospace,Menlo,monospace;
  --text-font:'IBM Plex Mono','SF Mono',ui-monospace,Menlo,monospace; /* readable face for body prose */
  --radius:4px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--mono);font-size:14px;
  line-height:1.66;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
::selection{background:rgba(126,240,178,.25);color:#fff}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:5px;border:2px solid var(--bg)}
::-webkit-scrollbar-track{background:transparent}

/* ---------- CRT atmosphere (same as vault) ---------- */
body::before{content:"";position:fixed;inset:0;z-index:999;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.14) 0px,rgba(0,0,0,.14) 1px,transparent 1px,transparent 4px);
  animation:scanlines 12s linear infinite;mix-blend-mode:multiply}
body::after{content:"";position:fixed;inset:-100%;z-index:998;pointer-events:none;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  animation:grain 7s steps(10) infinite}
@keyframes scanlines{from{background-position:0 0}to{background-position:0 100%}}
@keyframes grain{0%,100%{transform:translate(0)}10%{transform:translate(-5%,-5%)}20%{transform:translate(-10%,5%)}30%{transform:translate(5%,-10%)}40%{transform:translate(-5%,15%)}50%{transform:translate(-10%,5%)}60%{transform:translate(15%)}70%{transform:translateY(10%)}80%{transform:translate(-15%)}90%{transform:translate(10%,5%)}}
@keyframes flicker{0%,100%{opacity:1}48%{opacity:.985}50%{opacity:.96}52%{opacity:.99}}
.crt-title{animation:flicker 4s infinite}
@media (prefers-reduced-motion: reduce){
  body::before,body::after,.crt-title{animation:none}
  *{transition:none!important}
}

/* ---------- shell ---------- */
.page{max-width:880px;margin:0 auto;padding:34px 44px 64px;min-height:100vh}
.topbar{height:42px;display:flex;align-items:center;gap:10px;padding:0 18px;
  border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:50}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12.5px;letter-spacing:.03em;color:var(--phos);white-space:nowrap;text-decoration:none}
.brand:hover{color:var(--phos);text-shadow:0 0 8px rgba(126,240,178,.5)}
.brand-dot{width:7px;height:7px;border-radius:50%;background:var(--phos);box-shadow:0 0 8px rgba(126,240,178,.8);animation:modernPulse 2.4s infinite}
@keyframes modernPulse{0%,100%{opacity:1}50%{opacity:.45}}
.crumbs{font-size:11.5px;color:var(--faint);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.crumbs b{color:var(--phos);font-weight:550}

/* ---------- topbar nav: Home + prev/next + search ---------- */
.tb-nav{display:flex;align-items:center;gap:4px}
.tb-btn{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:11.5px;
  color:var(--muted);text-decoration:none;padding:3px 9px;border:1px solid var(--border);
  border-radius:3px;background:var(--raised);white-space:nowrap;transition:border-color .12s,color .12s}
.tb-btn:hover{border-color:var(--phos);color:var(--text)}
.tb-btn.home{color:var(--phos);border-color:var(--border-strong)}
.tb-btn.home:hover{box-shadow:0 0 8px rgba(126,240,178,.25)}
.tb-btn:disabled{opacity:.35;pointer-events:none}
.tb-search{position:relative;margin-left:auto;min-width:140px;max-width:240px;flex:0 1 240px}
#ai-search{width:100%;background:var(--raised);border:1px solid var(--border);border-radius:3px;
  color:var(--text);font-family:var(--mono);font-size:12px;padding:5px 10px;outline:none;transition:border-color .12s}
#ai-search::placeholder{color:var(--faint)}
#ai-search:focus{border-color:var(--cyan);box-shadow:0 0 8px rgba(103,232,249,.2)}
#ai-panel{position:absolute;top:calc(100% + 6px);right:-120px;width:420px;max-width:calc(100vw - 40px);
  background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--radius);
  box-shadow:0 12px 40px rgba(0,0,0,.65);overflow:hidden;display:flex;flex-direction:column;max-height:min(72vh,560px)}
#ai-panel[hidden]{display:none}
.ai-sec{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:var(--faint);
  padding:10px 14px 4px;border-top:1px solid var(--border)}
.ai-sec:first-child{border-top:none}
.ai-hit{display:block;padding:8px 14px;text-decoration:none;color:var(--text)}
.ai-hit:hover,.ai-hit.active{background:var(--hover)}
.ai-hit .t{color:var(--phos);font-size:12.5px}
.ai-hit:hover .t,.ai-hit.active .t{color:var(--accent-strong)}
.ai-hit .m{color:var(--faint);font-size:10.5px;margin:1px 0 3px}
.ai-hit .x{color:var(--muted);font-size:11px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ai-hit .x b{color:var(--amber);font-weight:500}
.ai-topics{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px}
.ai-chip{font-family:var(--mono);font-size:11px;color:var(--cyan);text-decoration:none;
  border:1px dashed var(--border-strong);border-radius:3px;padding:2px 8px;background:var(--raised)}
.ai-chip:hover{border-color:var(--cyan);color:var(--accent-strong)}
.ai-chip .n{color:var(--faint)}
.ai-state{padding:12px 14px;color:var(--faint);font-size:11px}
.ai-empty{padding:14px;color:var(--faint);font-size:11.5px}
kbd{font-family:var(--mono);font-size:10px;color:var(--faint);border:1px solid var(--border);
  border-radius:3px;padding:0 4px;margin-left:6px}

/* ---------- markdown (terminal document, same as vault) ---------- */
.md{font-family:var(--text-font);font-size:16px;line-height:1.72;color:var(--text)}
.md h1{font-size:26px;font-weight:600;letter-spacing:.01em;margin:0 0 22px;line-height:1.25;color:var(--text);font-family:var(--mono)}
.md h1::before{content:"█ ";color:var(--phos);font-size:18px}
.md h2{font-size:19px;font-weight:600;margin:38px 0 13px;padding-bottom:7px;border-bottom:1px solid var(--border);font-family:var(--mono)}
.md h2::before{content:"## ";color:var(--faint)}
.md h3{font-size:16.5px;font-weight:600;margin:28px 0 9px;font-family:var(--mono)}
.md h3::before{content:"### ";color:var(--faint)}
.md h4{font-size:15px;font-weight:600;margin:22px 0 7px;color:var(--cyan);font-family:var(--mono)}
.md p{margin:12px 0}
.md ul,.md ol{margin:12px 0;padding-left:28px}
.md li{margin:5px 0}.md li::marker{color:var(--phos)}
.md a{color:var(--cyan);text-decoration:none;border-bottom:1px solid transparent}
.md a:hover{text-decoration:underline;text-shadow:0 0 8px rgba(103,232,249,.4)}
.md a.wl{border-bottom:1px dashed rgba(126,240,178,.35);color:var(--phos)}
.md span.wl-x{color:var(--faint);cursor:default}
.md strong,.md b{color:var(--text);font-weight:650}
.md code{font-family:var(--mono);font-size:.88em;background:var(--raised);border:1px solid var(--border);
  border-radius:3px;padding:1px 6px;color:var(--amber)}
.md pre{background:#050507;border:1px solid var(--border);border-radius:var(--radius);
  padding:14px 16px;overflow-x:auto;margin:18px 0}
.md pre code{background:none;border:none;padding:0;color:var(--phos);font-size:13.5px;line-height:1.6;text-shadow:0 0 6px rgba(126,240,178,.25)}
.md blockquote{border-left:2px solid var(--phos);background:rgba(126,240,178,.05);
  padding:10px 18px;border-radius:0 3px 3px 0;margin:18px 0;color:var(--muted);font-size:15px}
.md blockquote p{margin:5px 0}
.md hr{border:none;border-top:1px dashed var(--border-strong);margin:32px 0}
.md table{border-collapse:collapse;margin:18px 0;width:100%;font-size:14px}
.md th{background:var(--raised);font-weight:600;text-align:left;color:var(--cyan)}
.md th,.md td{border:1px solid var(--border);padding:7px 12px;line-height:1.5}
.md tr:hover td{background:var(--hover)}
.md img{max-width:100%;border-radius:var(--radius);border:1px solid var(--border)}
.md input[type=checkbox]{accent-color:var(--phos);margin-right:7px;transform:translateY(1px)}
.md .task-done{text-decoration:line-through;color:var(--faint)}
.fm{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 26px}
.fm span{font-family:var(--mono);font-size:10.5px;color:var(--muted);background:var(--raised);
  border:1px solid var(--border);border-radius:3px;padding:2px 9px}
.fm span b{color:var(--faint);font-weight:500}

/* ---------- nav bar + tree + footer ---------- */
.bar{display:flex;gap:8px;align-items:stretch;justify-content:center;flex-wrap:wrap;
  margin-top:48px;padding-top:20px;border-top:1px solid var(--border)}
.bar a,.bar span{flex:1 1 0;text-align:center;padding:8px 14px;border:1px solid var(--border);
  border-radius:var(--radius);color:var(--muted);text-decoration:none;font-size:12.5px;background:var(--surface);min-width:140px}
.bar a:hover{border-color:var(--phos);color:var(--text)}
.bar .sep{flex:0 0 auto;min-width:0;border:none;background:none;color:var(--faint);padding:8px 2px}
.tree{margin-top:40px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);padding:18px 20px}
.tree h2{font-size:10.5px;text-transform:uppercase;letter-spacing:.18em;color:var(--faint);margin-bottom:14px}
.tree ul{list-style:none;padding-left:1.1em;margin:.3em 0;border-left:1px solid var(--border)}
.tree>ul{border-left:none;padding-left:0}
.tree li{margin:.18em 0}
.tree .cnt{color:var(--faint);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase}
.tree a{display:block;padding:2.5px 8px;margin-left:-8px;border-radius:3px;color:var(--muted);text-decoration:none;font-size:12.5px}
.tree a:hover{color:var(--text);background:var(--hover)}
footer{display:flex;align-items:center;gap:12px;border-top:1px solid var(--border-strong);
  background:#030304;padding:11px 18px;position:sticky;bottom:0;z-index:40;font-size:12px;color:var(--faint)}
footer .ps{color:var(--phos);font-weight:600;white-space:nowrap}
footer a{color:var(--muted);text-decoration:none}
footer a:hover{color:var(--phos)}
.foot-path{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
@media(max-width:900px){
  .page{padding:22px 18px 48px}
  #status{display:none}
  .crumbs{display:none}
  .tb-search{max-width:170px;flex:1 1 170px}
  #ai-panel{right:-80px;width:min(420px,calc(100vw - 30px))}
}
@media(max-width:640px){
  .tb-btn{padding:3px 6px;font-size:10.5px}
  .tb-search{min-width:100px;max-width:130px}
}
@media print{body::before,body::after,.topbar,footer{display:none}body{background:#fff;color:#000}.page{max-width:none}}`;

function renderTreeIndex() {
  // folder → [notes in reading order (folder-major, title order)]
  const folders = new Map();
  for (const r of records) {
    const folder = path.dirname(r.rel) === "." ? "Root" : r.rel.split("/").slice(0, -1).join("/");
    if (!folders.has(folder)) folders.set(folder, []);
    folders.get(folder).push(r);
  }
  const ordered = [...folders.keys()].sort();
  const lis = ordered
    .map((f) => {
      const items = folders
        .get(f)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((r) => `<li><a href="${hrefFor("AI_Home.md", r.rel)}">${escapeHtml(r.title)}</a></li>`)
        .join("");
      const cnt = folders.get(f).length;
      const id = "f-" + f.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return `<li id="${id}"><span class="cnt">${escapeHtml(f)} (${cnt})</span><ul>${items}</ul></li>`;
    })
    .join("");
  return `<section class="tree"><h2>All notes by folder</h2><ul>${lis}</ul></section>`;
}

function topbarHtml(r) {
  const prev = r.meta.prev ? resolveTarget(r.meta.prev) : null;
  const next = r.meta.next ? resolveTarget(r.meta.next) : null;
  const isHome = r.rel === "AI_Home.md";
  const crumbPath = isHome ? "~/ai" : `~/ai/${escapeHtml(slugByRel.get(r.rel))}`;
  const prevBtn = prev
    ? `<a class="tb-btn" rel="prev" href="${hrefFor(r.rel, prev)}" title="${escapeHtml(prev.slice(0, -3).split("/").pop())}">←</a>`
    : `<span class="tb-btn" disabled title="no previous note">←</span>`;
  const nextBtn = next
    ? `<a class="tb-btn" rel="next" href="${hrefFor(r.rel, next)}" title="${escapeHtml(next.slice(0, -3).split("/").pop())}">→</a>`
    : `<span class="tb-btn" disabled title="no next note">→</span>`;
  return `<header class="topbar">
  <a class="brand" href="${URL_BASE}" title="AI Engineering home"><span class="brand-dot"></span>AYUMAD/AI</a>
  <span class="crumbs">${crumbPath}</span>
  <nav class="tb-nav" aria-label="Note navigation">
    <a class="tb-btn home" href="${URL_BASE}" title="Home">⌂ Home</a>
    ${prevBtn}${nextBtn}
  </nav>
  <div class="tb-search" role="search">
    <input id="ai-search" type="text" placeholder="Search the curriculum…" autocomplete="off" spellcheck="false" aria-label="Search the curriculum">
    <div id="ai-panel" hidden></div>
  </div>
  <span id="status">${records.length} notes<kbd>/</kbd></span>
</header>`;
}

function pageHtml(r) {
  // The emitted <h1> below already comes from the body's first H1 (see title
  // derivation) — drop that heading from the body so titles never render twice.
  let bodyText = r.body.replace(/^\n+/, "");
  const h1m = /^#\s+(.+?)\s*$/m.exec(bodyText);
  if (h1m && h1m[1].trim() === r.title) {
    bodyText = bodyText.replace(/^#\s+[^\n]*\n?/, "").replace(/^\n+/, "");
  }
  const bodyHtml = marked.parse(resolveWikilinks(bodyText, r.rel), { gfm: true, breaks: false });
  const prev = r.meta.prev ? resolveTarget(r.meta.prev) : null;
  const next = r.meta.next ? resolveTarget(r.meta.next) : null;
  const nav = [
    prev ? `<a rel="prev" href="${hrefFor(r.rel, prev)}">← ${escapeHtml(prev.slice(0, -3).split("/").pop())}</a>` : "<span></span>",
    `<a rel="home" href="${hrefFor(r.rel, "AI_Home.md")}">Home</a>`,
    next ? `<a rel="next" href="${hrefFor(r.rel, next)}">${escapeHtml(next.slice(0, -3).split("/").pop())} →</a>` : "<span></span>",
  ].join('<span class="sep">·</span>');
  const tags = (r.meta.tags || "").replace(/[\[\]"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
  const fm = [
    r.meta.status ? `<span><b>status</b> ${escapeHtml(r.meta.status)}</span>` : "",
    r.meta.updated ? `<span><b>updated</b> ${escapeHtml(r.meta.updated)}</span>` : "",
    r.meta.area ? `<span><b>area</b> ${escapeHtml(r.meta.area)}</span>` : "",
    tags.length ? `<span><b>tags</b> ${tags.map((t) => escapeHtml(t.trim())).join(", ")}</span>` : "",
  ].filter(Boolean).join("");
  const desc = (r.meta.summary || r.title).replace(/"/g, "&quot;").slice(0, 160);
  const isHome = r.rel === "AI_Home.md";
  const footPath = isHome ? "AI_Home.md" : r.rel;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${desc}">
<title>${escapeHtml(r.title)} — AI Engineering</title>
<link rel="stylesheet" href="${URL_BASE}ai.css">
</head><body>
${topbarHtml(r)}
<div class="page">
<main>
<article class="md">
<h1 class="crt-title">${escapeHtml(r.title)}</h1>
${fm ? `<div class="fm">${fm}</div>` : ""}
${bodyHtml}
</article>
${isHome ? renderTreeIndex() : ""}
<nav class="bar" id="section-nav">${nav}</nav>
</main>
</div>
<footer><span class="ps">❯</span><span class="foot-path">cat ${footPath}</span><a href="${URL_BASE}">index</a><a href="https://ayumad.me">ayumad.me</a></footer>
<script type="module" src="${URL_BASE}ai.js"></script>
</body></html>`;
}

// ---------- write ----------
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "ai.css"), CSS);

/** Tiny HTML redirect so old folder-structure URLs keep working. */
function redirectPage(title, targetUrl) {
  const abs = "https://ayumad.me" + targetUrl;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — AI Engineering</title>
<meta http-equiv="refresh" content="0; url=${abs}">
<link rel="canonical" href="${abs}">
</head><body>
<p style="font-family:monospace">Moved → <a href="${abs}">${targetUrl}</a></p>
</body></html>`;
}

let written = 0;
let redirected = 0;
for (const r of records) {
  // new canonical home: root of the section, where the "home" note lives
  if (r.rel === "AI_Home.md") {
    fs.writeFileSync(path.join(outDir, "index.html"), pageHtml(r));
    written++;
    continue;
  }
  // every other note: flat file at /ai/<slug>.html (Vercel cleanUrls serves
  // /ai/<slug> extensionless)
  const slug = slugByRel.get(r.rel);
  fs.writeFileSync(path.join(outDir, slug + ".html"), pageHtml(r));
  written++;
  // keep the old folder-structure URL alive with a redirect stub. cleanUrls
  // 308s `X.html` → `X` (extensionless) when X.html exists, so the stub must be
  // present BOTH as `.html` (to trigger the clean redirect) AND extensionless
  // (the redirect's destination) — otherwise the old URL falls to the SPA.
  if (path.posix.dirname(r.rel) !== ".") {
    const oldRelNoMd = r.rel.slice(0, -3); // "04 Workflows and Orchestration/Workflow Patterns"
    const htmlStub = path.join(outDir, ...oldRelNoMd.split("/")) + ".html";
    const cleanStub = path.join(outDir, ...oldRelNoMd.split("/"));
    const stubBody = redirectPage(r.title, hrefFor(r.rel, r.rel));
    fs.mkdirSync(path.dirname(htmlStub), { recursive: true });
    fs.writeFileSync(htmlStub, stubBody);
    fs.writeFileSync(cleanStub, stubBody);
    redirected++;
  }
}
fs.copyFileSync(path.join(repoRoot, "scripts", "ai-search-client.js"), path.join(outDir, "ai.js"));
console.log(`wrote ${written} pages + ${redirected} old-path redirects + ai.css → ${outDir}`);
await buildSearchIndex();
vendorRuntime();
console.log("done");