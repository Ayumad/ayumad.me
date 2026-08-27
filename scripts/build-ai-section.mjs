#!/usr/bin/env node
/**
 * build-ai-section.mjs — publish the AI-Engineering curriculum as a public,
 * self-contained static section at ayumad.me/ai.
 *
 * Reads:  ~/Documents/Main/AI-Engineering/** (the vault is the source of truth)
 * Writes: public/ai/ in THIS repo (must be COMMITTED — Vercel has no vault access)
 *
 * Preserves the vault's folder structure and content exactly:
 *   - one .html per note, same folders (URL-encoded spaces), .md stripped
 *   - wikilinks resolved within the curriculum; out-of-scope → inert dimmed span
 *   - body kept byte-faithful (incl. the ← prev · Home · next → bars the notes carry)
 *   - index.html = AI_Home.md, plus a folder-browsing index at the bottom
 *   - theme tokens copied from the site (--bg #040707, --cyan #48efd0, --violet #777fc4)
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

/** href from the CURRENT note to a resolved note rel. AI_Home.md → ./ */
function hrefFor(fromRel, rel) {
  if (rel === "AI_Home.md") {
    // depth of the current page determines the path back to /ai root
    const depth = fromRel.split("/").length - 1;
    return depth === 0 ? "./" : "../".repeat(depth);
  }
  const fromDir = path.posix.dirname(fromRel);
  const toNoMd = rel.slice(0, -3);
  let relPath = path.posix.relative(fromDir, toNoMd);
  if (!relPath.startsWith(".")) relPath = "./" + relPath;
  return relPath.split("/").map(encodeURIComponent).join("/") + ".html";
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

const CSS = `:root{--bg:#040707;--surface:#0a0f0e;--text:#d8e3e0;--muted:#8fa39e;--line:#1c2b28;--cyan:#48efd0;--violet:#777fc4;--mono:'SF Mono',ui-monospace,Menlo,Consolas,monospace;--sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.7;margin:0;padding:2rem 1rem}
main{max-width:760px;margin:0 auto}
a{color:var(--cyan);text-decoration:none;border-bottom:1px solid transparent}
a:hover{border-bottom-color:var(--cyan)}
h1,h2,h3,h4{color:#eaf6f3;line-height:1.3;margin-top:1.8em}
h1:first-child{margin-top:0}
h1 .wm{color:var(--muted);font-size:.45em;font-weight:500;letter-spacing:.08em;text-transform:uppercase}
code,pre{font-family:var(--mono);font-size:.92em}
code{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:.1em .35em}
pre{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:1rem;overflow-x:auto}
pre code{background:none;border:0;padding:0}
blockquote{border-left:3px solid var(--cyan);margin:1.2em 0;padding:.2em 1em;color:var(--muted);background:var(--surface);border-radius:0 8px 8px 0}
blockquote a{color:var(--cyan)}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.95em}
th,td{border:1px solid var(--line);padding:.45em .7em;text-align:left}
th{background:var(--surface);color:var(--cyan)}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}
ul,ol{padding-left:1.5em}li{margin:.25em 0}
.wl-x{color:var(--muted);opacity:.55;cursor:not-allowed;text-decoration:none;border-bottom:1px dashed var(--line)}
.bar{display:flex;gap:.6em;align-items:center;justify-content:center;flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:.6em 1em;margin-top:2.5em;font-size:.92em}
.bar a[rel=prev]{color:var(--muted)}.bar .sep{color:var(--line)}
.meta{color:var(--muted);font-size:.85em;margin:-.4em 0 1.6em;display:flex;gap:1em;flex-wrap:wrap}
.meta span{white-space:nowrap}
.tree{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:1em 1.4em;font-size:.93em}
.tree ul{list-style:none;padding-left:1.1em;margin:.3em 0}
.tree>ul{padding-left:0}
.tree li{margin:.18em 0}
.tree .cnt{color:var(--muted);font-size:.85em}
footer{max-width:760px;margin:3rem auto 0;color:var(--muted);font-size:.85em;text-align:center;border-top:1px solid var(--line);padding-top:1.2em}
footer a{color:var(--muted)}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{body{background:#fff;color:#000}main{max-width:none}.meta,.tree,#section-nav,footer{display:none}}`;

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
    `<a href="${hrefFor(r.rel, "AI_Home.md")}">Home</a>`,
    next ? `<a rel="next" href="${hrefFor(r.rel, next)}">${escapeHtml(next.slice(0, -3).split("/").pop())} →</a>` : "<span></span>",
  ].join('<span class="sep">·</span>');
  const tags = (r.meta.tags || "").replace(/[\[\]"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
  const metaBits = [
    r.meta.status ? `<span>${escapeHtml(r.meta.status)}</span>` : "",
    r.meta.updated ? `<span>updated ${escapeHtml(r.meta.updated)}</span>` : "",
    tags.length ? `<span>${tags.map((t) => escapeHtml(t.trim())).join(", ")}</span>` : "",
  ].filter(Boolean).join("");
  const desc = (r.meta.summary || r.title).replace(/"/g, "&quot;").slice(0, 160);
  const isHome = r.rel === "AI_Home.md";
  const depth = r.rel.split("/").length - 1;
  const cssHref = (depth === 0 ? "./" : "../".repeat(depth)) + "ai.css";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${desc}">
<title>${escapeHtml(r.title)} — AI Engineering</title>
<link rel="stylesheet" href="${cssHref}">
</head><body>
<main>
<article>
<h1>${isHome ? `<span class="wm">ayumad.me/ai — public curriculum</span><br>` : ""}${escapeHtml(r.title)}</h1>
${metaBits ? `<div class="meta">${metaBits}</div>` : ""}
${bodyHtml}
</article>
${isHome ? renderTreeIndex() : ""}
<nav class="bar" id="section-nav">${nav}</nav>
</main>
<footer>Part of <a href="https://ayumad.me">ayumad.me</a> — AI Engineering curriculum, mirrored from the Obsidian vault · <a href="./">index</a></footer>
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