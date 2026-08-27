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

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = process.env.AI_VAULT_DIR || path.join(process.env.HOME, "Documents", "Main");
const srcDir = path.join(vaultRoot, "AI-Engineering");
const outDir = path.join(repoRoot, "public", "ai");
const URL_BASE = "/ai/";

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

function resolveTarget(raw) {
  const t = raw.trim();
  if (t.includes("/")) {
    const p = t.endsWith(".md") ? t : t + ".md";
    if (fs.existsSync(path.join(srcDir, p))) return p;
  }
  return byTitle.get(t.toLowerCase()) || null;
}

/** URL for a note from anywhere: root-absolute, folder structure preserved. */
function hrefFor(fromRel, rel) {
  if (rel === "AI_Home.md") return URL_BASE;
  const toNoMd = rel.slice(0, -3);
  return URL_BASE + toNoMd.split("/").map(encodeURIComponent).join("/") + ".html";
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

// Visual style mirrors ayumad.me/vault: same tokens, mono type, CRT overlay,
// .md terminal typography, .fm chips. (Extracted from the vault site shell.)
const CSS = `:root{
  --bg:#000000;--surface:#0a0a0a;--raised:#101014;--hover:#16161c;
  --border:#1e1e26;--border-strong:#2e2e3a;
  --text:#d8d6c8;--muted:#8a8878;--faint:#55534a;
  --accent:#c4b5fd;--accent-strong:#e0d7ff;--accent-dim:rgba(196,181,253,.10);
  --phos:#7ef0b2;--cyan:#67e8f9;--amber:#fcd34d;--red:#ff6b81;
  --glow-r:rgba(255,0,60,.35);--glow-c:rgba(0,255,240,.30);
  --mono:'3270 Nerd Font','IBM Plex Mono','SF Mono',ui-monospace,Menlo,monospace;
  --radius:4px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--mono);font-size:13.5px;
  line-height:1.62;text-rendering:optimizeLegibility}
::selection{background:rgba(126,240,178,.25);color:#fff}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:5px;border:2px solid var(--bg)}
::-webkit-scrollbar-track{background:transparent}

/* ---------- CRT atmosphere (same as vault) ---------- */
body::before{content:"";position:fixed;inset:0;z-index:999;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0px,rgba(0,0,0,.22) 1px,transparent 1px,transparent 3px);
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
.topbar{height:42px;display:flex;align-items:center;gap:14px;padding:0 18px;
  border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:50}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12.5px;letter-spacing:.03em;color:var(--phos);white-space:nowrap}
.brand-dot{width:7px;height:7px;border-radius:50%;background:var(--phos);box-shadow:0 0 8px rgba(126,240,178,.8);animation:modernPulse 2.4s infinite}
@keyframes modernPulse{0%,100%{opacity:1}50%{opacity:.45}}
.crumbs{font-size:11.5px;color:var(--faint);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.crumbs b{color:var(--phos);font-weight:550}
#status{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:var(--faint)}
#status b{color:var(--muted);font-weight:500}

/* ---------- markdown (terminal document, same as vault) ---------- */
.md h1{font-size:22px;font-weight:600;letter-spacing:.01em;margin:0 0 20px;line-height:1.3;color:var(--text)}
.md h1::before{content:"█ ";color:var(--phos);font-size:16px}
.md h2{font-size:16.5px;font-weight:600;margin:36px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.md h2::before{content:"## ";color:var(--faint)}
.md h3{font-size:14px;font-weight:600;margin:26px 0 8px}
.md h3::before{content:"### ";color:var(--faint)}
.md h4{font-size:13px;font-weight:600;margin:20px 0 6px;color:var(--cyan)}
.md p{margin:10px 0}.md ul,.md ol{margin:10px 0;padding-left:26px}
.md li{margin:3.5px 0}.md li::marker{color:var(--phos)}
.md a{color:var(--cyan);text-decoration:none}
.md a:hover{text-decoration:underline;text-shadow:0 0 8px rgba(103,232,249,.4)}
.md a.wl{border-bottom:1px dashed rgba(126,240,178,.35);color:var(--phos)}
.md span.wl-x{color:var(--faint);cursor:default}
.md code{font-family:var(--mono);font-size:.9em;background:var(--raised);border:1px solid var(--border);
  border-radius:3px;padding:1px 6px;color:var(--amber)}
.md pre{background:#050507;border:1px solid var(--border);border-radius:var(--radius);
  padding:14px 16px;overflow-x:auto;margin:16px 0}
.md pre code{background:none;border:none;padding:0;color:var(--phos);font-size:12.3px;line-height:1.55;text-shadow:0 0 6px rgba(126,240,178,.25)}
.md blockquote{border-left:2px solid var(--phos);background:rgba(126,240,178,.05);
  padding:10px 18px;border-radius:0 3px 3px 0;margin:16px 0;color:var(--muted)}
.md blockquote p{margin:4px 0}
.md hr{border:none;border-top:1px dashed var(--border-strong);margin:30px 0}
.md table{border-collapse:collapse;margin:16px 0;width:100%;font-size:12.5px}
.md th{background:var(--raised);font-weight:600;text-align:left;color:var(--cyan)}
.md th,.md td{border:1px solid var(--border);padding:6px 11px}
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
}
@media print{body::before,body::after,.topbar,footer{display:none}body{background:#fff;color:#000}.page{max-width:none}}`;

function renderTreeIndex() {
  // folder → [notes in reading order (as authored: folder-major, title order)]
  const folders = new Map();
  for (const r of records) {
    const folder = path.dirname(r.rel) === "." ? "·\u00A0Root" : r.rel.split("/").slice(0, -1).join("/");
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
      const label = f === "·\u00A0Root" ? "Root" : escapeHtml(f);
      const cnt = folders.get(f).length;
      return `<li><span class="cnt">${label} (${cnt})</span><ul>${items}</ul></li>`;
    })
    .join("");
  return `<section class="tree"><h2>All notes by folder</h2><ul>${lis}</ul></section>`;
}

function pageHtml(r) {
  const bodyHtml = marked.parse(resolveWikilinks(r.body, r.rel), { gfm: true, breaks: false });
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
  const crumbPath = isHome ? "~/ai" : `~/ai/${escapeHtml(r.rel.slice(0, -3))}`;
  const footPath = isHome ? "AI_Home.md" : r.rel;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${desc}">
<title>${escapeHtml(r.title)} — AI Engineering</title>
<link rel="stylesheet" href="${URL_BASE}ai.css">
</head><body>
<header class="topbar">
  <span class="brand"><span class="brand-dot"></span>AYUMAD/AI</span>
  <span class="crumbs">${crumbPath}</span>
  <span id="status">${records.length} notes · <b>public</b></span>
</header>
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
</body></html>`;
}

// ---------- write ----------
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "ai.css"), CSS);
let written = 0;
for (const r of records) {
  const relNoMd = r.rel.slice(0, -3);
  const outFile = relNoMd === "AI_Home" ? path.join(outDir, "index.html") : path.join(outDir, ...relNoMd.split("/")) + ".html";
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, pageHtml(r));
  written++;
}
console.log(`wrote ${written} pages + ai.css → ${outDir}`);