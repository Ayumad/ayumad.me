/* components.js — pure string renderers for the BRIEF §6 component set.
   Everything renders only from the payload; missing values become —. */

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

/* Safe getters: g(obj, "a.b.c") → value or undefined. */
const g = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/* A number, or null (never NaN). */
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/* Payload value → display string; missing → em dash, never invented. */
const val = (v) => (v === undefined || v === null || v === "" ? "—" : esc(v));

const valNum = (v, suffix = "") => {
  const n = num(v);
  return n === null ? '<span class="dash">—</span>' : esc(n.toLocaleString("en-US") + suffix);
};

/* ---- Pill ---- */
function pill(kind, text) {
  return `<span class="pill ${kind}" data-pill>${text}<i></i></span>`;
}

/* ---- Cell ---- */
function cell({ label, value = "—", sub = "", state = "", small = "", meter = null, dotState = "" }) {
  const v = value === "—" ? '<span class="dash">—</span>' : value;
  return `<div class="cell">
    <span class="cell-l">${dotState ? dot(dotState) : ""}${esc(label)}</span>
    <span class="cell-v ${state}">${v}${small ? `<small> ${esc(small)}</small>` : ""}</span>
    ${meter ? `<span class="cell-m"><i class="${meter.cls || ""}" style="width:${Math.max(0, Math.min(100, Number(meter.pct) || 0))}%"></i></span>` : ""}
    ${sub ? `<span class="cell-s">${sub}</span>` : ""}
  </div>`;
}

/* ---- dot ---- */
function dot(state, extra = "") {
  return `<i class="dot ${state} ${extra}" aria-hidden="true"></i>`;
}

/* ---- Spark: 7-day success strip — 6×14 vertical bars, 2px gap, cyan.
   Aggregate rate only (no per-day breakdown in the payload, never invented);
   a 0-run window renders 2px muted stubs. ---- */
function sparkBars(success, runs) {
  const s = num(success);
  if (s === null) {
    return `<span class="spark nodata" title="no runs recorded in 7d">${"<i></i>".repeat(7)}</span>`;
  }
  if (num(runs) === 0) {
    return `<span class="spark" title="no runs in the last 7 days">${'<i class="z"></i>'.repeat(7)}</span>`;
  }
  const cls = s >= 100 ? "f" : s >= 50 ? "p" : "x";
  return `<span class="spark" title="7-day success ${s}%">${`<i class="${cls}"></i>`.repeat(7)}</span>`;
}

/* ---- Bar: 6px, cyan / amber > 80 / red > 90 ---- */
function bar({ label, pct, value = "", right = "" }) {
  const p = num(pct);
  const cls = p === null ? "" : p > 90 ? "bad" : p > 80 ? "warn" : "";
  const vcls = p === null ? "" : p > 90 ? "bad" : p > 80 ? "warn" : "";
  return `<div class="barwrap">
    <div class="barline"><span class="bl">${esc(label)}</span><span class="bv ${vcls}">${valNum(p, "%")} ${value}</span></div>
    <div class="bar" role="img" aria-label="${esc(label)} ${p === null ? "no data" : p + " percent"}">
      <i class="${cls}" style="width:${p === null ? 0 : Math.max(0, Math.min(100, p))}%"></i>
    </div>
    ${right ? `<div class="nodata" style="margin-top:4px">${right}</div>` : ""}
  </div>`;
}

/* ---- Row ---- */
function row({ title, meta = "", right = "", fail = false, disabled = false, drawer = "" }) {
  return `<${disabled ? "div" : "button"} class="row${fail ? " fail" : ""}" ${disabled ? 'aria-disabled="true"' : `data-drawer="${esc(drawer)}"`}>
    <span class="rmain">
      <span class="rtitle">${title}</span>
      ${meta ? `<span class="rmeta">${meta}</span>` : ""}
    </span>
    ${right ? `<span class="rright">${right}</span>` : ""}
  </${disabled ? "div" : "button"}>`;
}

/* ---- Matrix chip ---- */
function chip({ name, state = "off", right = "", cls = "" }) {
  return `<span class="chip ${cls}" title="${esc(name)}">
    ${dot(state)}
    <span class="cn">${esc(name)}</span>
    ${right ? `<span class="cs">${right}</span>` : ""}
  </span>`;
}

/* ---- Timeline row ---- */
function tlRow(ev, idx) {
  const lvl = ["info", "warn", "bad"].includes(ev.level) ? ev.level : "info";
  return `<button class="tl-row" data-drawer="tl:${idx}">
    <i class="node ${lvl}" aria-hidden="true"></i>
    <span class="t">${esc(fmtTimeShort(ev.ts))}</span>
    <span class="tag">${val(ev.source)}</span>
    <span class="x">${val(ev.text)}</span>
  </button>`;
}

/* ---- Banner ---- */
function banner(level, text, right = "") {
  return `<div class="banner ${level}" role="status">
    <i aria-hidden="true"></i><span>${esc(text)}</span>${right ? `<span style="margin-left:auto">${esc(right)}</span>` : ""}
  </div>`;
}

/* ---- state panels: pending / empty / error ---- */
function pendingPanel(what, note = "") {
  return `<div class="state pending" data-state="pending"><span class="t">${esc(what)}</span>${note ? `<span>${esc(note)}</span>` : ""}</div>`;
}

function emptyPanel(what) {
  return `<div class="state" data-state="empty"><span class="t">${esc(what)}</span><span>nothing in the current window</span></div>`;
}

function errorPanel(what, err) {
  return `<div class="state error" data-state="error"><span class="t">${esc(what)}</span><span>${esc(err || "source error")}</span></div>`;
}

/* ---- freshness badge for a section hint ---- */
function sourceBadge(name, sources) {
  const s = (sources || []).find((x) => x && x.name === name);
  if (!s) return `<span class="nodata">${esc(name)} · no source info</span>`;
  if (s.pending) return `<span class="nodata">${esc(name)} · collector pending</span>`;
  if (s.ok === false) return `<span class="nodata" style="color:var(--bad)">${esc(name)} · error ${esc(s.error || "failed")}</span>`;
  const age = num(s.age_s);
  if (s.stale) return `<span class="nodata" style="color:var(--warn)">${esc(name)} · stale ${age === null ? "" : fmtDur(age)}</span>`;
  const ms = num(s.ms);
  return `<span class="nodata">${esc(name)} · ${ms === null ? "ok" : ms + "ms"}</span>`;
}

/* ---- time formatting (all display, no invention) ---- */
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function parseTs(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtClock(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtTimeShort(ts) {
  const d = parseTs(ts);
  if (!d) return "—";
  const now = new Date();
  const t = fmtClock(d);
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
    return t;
  }
  return `${t} · ${MON_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

function fmtWallDate(d) {
  return `${DAY_NAMES[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MON_NAMES[d.getMonth()]}`;
}

function fmtDur(seconds) {
  const s = num(seconds);
  if (s === null) return "—";
  if (s < 60) return `${Math.max(0, Math.round(s))}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function fmtUptime(seconds) {
  const s = num(seconds);
  if (s === null) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtNextRun(ts) {
  const d = parseTs(ts);
  if (!d) return "—";
  return `${fmtClock(d)} ${MON_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

/* "updated 12s ago" style, from the payload's generated_at */
function fmtAge(ts, now = Date.now()) {
  const d = parseTs(ts);
  if (!d) return "—";
  const age = Math.max(0, (now - d.getTime()) / 1000);
  return fmtDur(age);
}

/* kb table for the drawer: raw key/value dump of an object */
function kvTable(obj) {
  const rows = Object.entries(obj || {})
    .map(([k, v]) => {
      const raw = v === null ? "null" : v === undefined ? "undefined" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `<tr><td class="k">${esc(k)}</td><td class="v">${esc(raw)}</td></tr>`;
    })
    .join("");
  return rows ? `<table class="kv">${rows}</table>` : `<div class="nodata">no raw fields</div>`;
}
