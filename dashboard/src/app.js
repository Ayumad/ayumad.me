/* app.js — boot, data loading (live v1 → adapted v2, seed fallback),
   web layout, drawer, filters, keyboard, URL state, theme.
   Wall mode lives in wall.js; boot() is invoked at the end of wall.js. */

const AUTH_DATA = "/dashboard/data"; // authenticated v1 snapshot (Vercel function)
const WALL_DATA = "./dashboard.json"; // wall server payload (docker-vm)
const SEED = window.__DASHBOARD_SEED__; // fixture inlined by the build
const LIVE_TIMEOUT_MS = 5000;
const REFRESH_MS = 60000;

const SECTIONS = [
  ["automations", "Automations"],
  ["homelab", "Homelab"],
  ["services", "Services"],
  ["media", "Media"],
  ["personal", "Personal"],
  ["timeline", "Timeline"],
];

const S = {
  source: "sync", // "sync" | "public" | "snapshot" | "live" | "seed" | "stale" | "error"
  data: null, // v2-shaped payload (seed fixture or adapted live v1)
  params: {},
  theme: "dark",
  filters: { automations: "all", tlLevel: "all", tlSource: "all" },
  mem: {}, // per-render arrays for the drawer
  lastLiveOk: null,
  wall: false,
};

/* ---------- URL params ---------- */

function parseParams() {
  const q = new URLSearchParams(location.search);
  S.params = {
    mode: q.get("mode") || "",
    section: q.get("section") || "",
    filter: q.get("filter") || "all",
    level: q.get("level") || "all",
    src: q.get("src") || "all",
    theme: q.get("theme") || "",
    page: q.get("page"),
    fixture: q.has("fixture") || q.has("specimen"),
    dwell: q.get("dwell"),
  };
  if (["all", "failing", "script", "agent"].includes(S.params.filter)) S.filters.automations = S.params.filter;
  if (["all", "info", "warn", "bad"].includes(S.params.level)) S.filters.tlLevel = S.params.level;
  if (S.params.src !== "all") S.filters.tlSource = S.params.src;
  if (S.params.theme === "light" || S.params.theme === "dark") S.theme = S.params.theme;
}

function setParam(key, value) {
  const q = new URLSearchParams(location.search);
  if (value === null || value === "" || value === "all") q.delete(key);
  else q.set(key, value);
  const s = q.toString();
  history.replaceState(null, "", `${location.pathname}${s ? "?" + s : ""}${location.hash}`);
}

/* ---------- v1 → v2 adapter (live payload, honest mapping only) ---------- */

function adaptV1(v1) {
  if (!v1 || typeof v1 !== "object") throw new Error("bad payload");
  const h = v1.hermes || {};
  const hl = v1.homelab || {};
  const now = v1.now || {};

  const hermes = {
    version: h.version ?? null,
    released: h.released ?? null,
    commits_behind: h.commits_behind ?? null,
    cron: {
      total: h.cron_total ?? null,
      enabled: h.cron_active ?? null,
      no_agent: h.cron_no_agent ?? null,
      failing: h.cron_failing_count ?? 0,
    },
    skills: h.skills ?? null,
    mcp_servers: h.mcp_servers ?? null,
    memory: h.memory ?? null,
    disk: h.disk ?? null,
    tokens: h.tokens ?? null,
  };

  const p520 = {
    host: hl.host ?? null,
    guests: (hl.guests || []).map((x) => ({
      id: x.id ?? null,
      name: x.name ?? null,
      type: x.type ?? null,
      status: x.status ?? null,
      mem_mb: x.mem_mb ?? null,
      disk_gb: x.disk_gb ?? null,
    })),
    pools: hl.pools ?? null,
    backups: hl.backups ?? null,
    snapshots: hl.snapshots ?? null,
    scrub_timers: hl.scrub_timers ?? null,
    gpu: hl.gpu
      ? { owner: hl.gpu.owner_name ?? null, owner_vm: hl.gpu.owner_vm ?? null, mode: hl.gpu.mode ?? null }
      : null,
    reachable: hl.reachable ?? null,
  };

  const journalIn7 = (v1.journal || []).filter((e) => {
    if (!e || !e.date || !v1.generated_at) return false;
    const d = new Date(e.date);
    const gen = new Date(v1.generated_at);
    return !Number.isNaN(d) && !Number.isNaN(gen) && (gen - d) / 86400000 <= 7;
  });

  const personal = {
    tasks: v1.tasks
      ? { open: v1.tasks.open ?? null, overdue: v1.tasks.overdue ?? null, items: v1.tasks.items || [] }
      : null,
    school: v1.school
      ? { upcoming: v1.school.upcoming ?? null, courses: v1.school.courses || [], next: v1.school.next || [] }
      : null,
    journal: {
      entries_7d: journalIn7.length,
      last: v1.journal && v1.journal[0] ? v1.journal[0].date : null,
    },
    listening: now,
  };

  const fleet = (v1.fleet || []).map((p) => ({
    name: p.name ?? null,
    os: p.os ?? null,
    online: p.online ?? null,
    self: p.self ?? false,
  }));
  const online = fleet.filter((p) => p.online).length;

  const alerts = (num(now.jobs_failing) || 0) + (num(now.homelab_issues_bad) || 0) + (num(now.homelab_issues_warn) || 0) + (num(now.overdue_tasks) || 0);
  const overall = {
    status:
      (num(now.jobs_failing) || 0) > 0 || (num(now.homelab_issues_bad) || 0) > 0
        ? "bad"
        : alerts > 0 || (num(now.homelab_issues_warn) || 0) > 0
          ? "warn"
          : "ok",
    alerts,
    derived: true,
  };

  const STACKS = (n) => {
    if (/^(sonarr|radarr|prowlarr|bazarr|cleanuparr|jellyseerr|jellyfin|qbittorrent|flaresolverr|gluetun|navidrome|audiobookshelf|suwayomi|calibre-web|kamiyomu|syncthing)/.test(n)) return "media";
    if (/^immich/.test(n)) return "photos";
    if (/^paperless/.test(n)) return "docs";
    if (["forgejo", "code-server", "caddy", "dozzle", "diun"].includes(n)) return "dev";
    if (["homeassistant", "node-red", "mosquitto"].includes(n)) return "home";
    if (["uptime-kuma", "grafana", "prometheus", "scrutiny", "scrutiny-influxdb", "healthchecks", "healthchecks-db", "ntfy", "dashboard-wall"].includes(n)) return "ops";
    if (/^miniflux/.test(n)) return "reading";
    if (n === "actual") return "finance";
    if (n === "vaultwarden") return "security";
    if (["open-webui", "qdrant", "ollama-cpu"].includes(n)) return "ai";
    if (n === "stirling-pdf") return "tools";
    return "other";
  };

  const containerNames = hl.containers?.names || [];
  const dockerVm = hl.containers
    ? {
        counts: {
          defined: hl.containers.total ?? null,
          running: hl.containers.running ?? null,
          stopped:
            hl.containers.total !== null && hl.containers.total !== undefined &&
            hl.containers.running !== null && hl.containers.running !== undefined
              ? hl.containers.total - hl.containers.running
              : null,
          expected_running_stopped: null,
          unhealthy: (hl.containers.unhealthy || []).length,
        },
        containers: containerNames.map((n) => ({ name: n, state: "running", stack: STACKS(n), health: null })),
        stacks: [...new Set(containerNames.map(STACKS))].sort(),
      }
    : { pending: true };

  const media = hl.media
    ? {
        queues: { radarr: hl.media.radarr_queue ?? null, sonarr: hl.media.sonarr_queue ?? null },
        downloads: {
          active: hl.media.torrents_active ?? null,
          rate_mbps: hl.media.down_mbps ?? null,
          torrents: hl.media.torrents ?? null,
        },
        jellyfin: {
          movies: hl.media.jellyfin_movies ?? null,
          series: hl.media.jellyfin_series ?? null,
          episodes: hl.media.jellyfin_episodes ?? null,
        },
        mount: hl.media.mount_free ?? null,
      }
    : { pending: true };

  const sources = [
    { name: "hermes", ok: true, ms: null, stale: false, age_s: 0 },
    { name: "proxmox", ok: hl.reachable !== false, ms: null, stale: hl.reachable === false, age_s: 0, error: hl.reachable === false ? "unreachable" : null },
    { name: "network", ok: true, ms: null, stale: false, age_s: 0 },
    { name: "personal", ok: true, ms: null, stale: false, age_s: 0 },
    { name: "docker_stack", ok: !!hl.containers, ms: null, stale: false, age_s: 0, pending: !hl.containers },
    { name: "media", ok: !!hl.media, ms: null, stale: false, age_s: 0, pending: !hl.media },
    { name: "external", ok: false, ms: null, stale: false, age_s: 0, pending: true, error: "v1 payload has no external surface" },
  ];

  return {
    schema: "ayumad.dashboard/2",
    adapted_from: "v1",
    generated_at: v1.generated_at ?? null,
    generated_on: v1.generated_on ?? null,
    overall,
    surfaces: {
      mac_mini: {
        hermes,
        cron: { pending: true }, // per-job cron rows are not present in v1
      },
      p520,
      docker_vm: dockerVm,
      network: { tailscale: fleet, online, pihole: null, routes: null },
      media,
      personal,
      external: { pending: true },
    },
    timeline: timelineFromV1(v1),
    meta: { sources, kiosk: null, build_ms: null },
  };
}

function timelineFromV1(v1) {
  const ev = [];
  for (const f of (g(v1, "hermes.cron_failing") || [])) {
    if (!f) continue;
    ev.push({
      ts: f.last ?? null,
      level: num(f.ok) === 0 ? "bad" : "warn",
      source: "cron",
      text: `${val(f.name)} — ${num(f.ok) ?? "?"}/${num(f.runs) ?? "?"} ok in window`,
    });
  }
  if (g(v1, "homelab.reachable") === false) {
    ev.push({ ts: g(v1, "homelab.checked_at") ?? null, level: "bad", source: "proxmox", text: "P520 unreachable at last check" });
  } else if (g(v1, "homelab.checked_at")) {
    ev.push({ ts: g(v1, "homelab.checked_at"), level: "info", source: "proxmox", text: "homelab check ok" });
  }
  const nb = g(v1, "homelab.backups");
  if (nb && nb.newest) {
    ev.push({ ts: g(v1, "homelab.checked_at") ?? null, level: "info", source: "backup", text: `newest vzdump ${val(nb.newest_age_h)}h old` });
  }
  for (const j of (v1.journal || []).slice(0, 5)) {
    if (!j || !j.date) continue;
    ev.push({ ts: j.date, level: "info", source: "journal", text: String(j.summary || "").slice(0, 120) || "journal entry" });
  }
  for (const [k, v] of Object.entries(v1.errors || {})) {
    ev.push({ ts: v1.generated_at ?? null, level: "bad", source: k, text: String(v).slice(0, 120) });
  }
  return ev
    .filter((e) => e.ts)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 50);
}

/* ---------- data loading ---------- */
/* Load order: authenticated snapshot (/dashboard/data) → wall live payload
   (./dashboard.json) → embedded seed (wall / file:// / ?fixture=1).
   Behind auth, a failed snapshot is an error state, never fake seed data. */

async function fetchJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", credentials: "same-origin", signal: ctrl.signal });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function useSeed() {
  S.data = SEED;
  S.source = "seed";
}

async function loadData() {
  if (S.params.fixture) {
    useSeed();
    render();
    return;
  }
  try {
    const raw = await fetchJson(AUTH_DATA, LIVE_TIMEOUT_MS);
    S.data = adaptV1(raw);
    S.source = raw.public ? "public" : "snapshot";
    S.lastLiveOk = new Date();
  } catch (err) {
    if (err.status === 401 && location.protocol !== "file:") {
      location.href = "/dashboard/login?next=" + encodeURIComponent(location.pathname);
      return;
    }
    try {
      S.data = adaptV1(await fetchJson(WALL_DATA, LIVE_TIMEOUT_MS));
      S.source = "live";
      S.lastLiveOk = new Date();
    } catch {
      if (S.data) {
        S.source = "stale"; // keep last good data, say so
      } else if (location.protocol === "file:" || S.wall) {
        useSeed();
      } else {
        S.data = null;
        S.source = "error";
      }
    }
  }
  render();
}

/* ---------- shared header bits ---------- */

function pillFor(source) {
  if (source === "live") return pill("live", "LIVE · partial");
  if (source === "public") return pill("seed", "PUBLIC · read-only");
  if (source === "snapshot") return pill("snapshot", "SNAPSHOT · partial");
  if (source === "seed") return pill("seed", "SEED");
  if (source === "stale") return pill("stale", "STALE");
  if (source === "error") return pill("stale", "NO DATA");
  return pill("seed", "SYNC");
}

const waitCopy = (text) => (S.source === "public" ? "sign in for detail" : text);

/* Global mode banner (web): honest about what is on screen.
   SEED → design fixture note · SNAPSHOT → snapshot + age · LIVE → nothing. */
function modeBannerHtml() {
  if (!S.data) return S.source === "error" ? banner("warn", "DATA UNAVAILABLE · snapshot could not be read") : "";
  if (S.source === "public") return banner("mute", "PUBLIC VIEW · read-only · sign in for full detail");
  if (S.source === "seed") return banner("mute", "DESIGN FIXTURE · not live data");
  if (S.source === "snapshot") {
    return banner("mute", `snapshot · ${fmtAge(g(S.data, "generated_at"))} old`);
  }
  return "";
}

/* ---------- web render ---------- */

const app = document.getElementById("app");

function render() {
  document.documentElement.dataset.theme = S.theme;
  document.body.dataset.source = S.source;
  if (S.wall) {
    if (typeof wallRender === "function") wallRender();
    return;
  }
  renderWeb();
}

function statusWord(st) {
  return st === "ok" ? "OK" : st === "warn" ? "ATTENTION" : st === "bad" ? "FAULT" : "—";
}

function heroCells() {
  if (!S.data) {
    return ["status", "alerts", "jobs", "containers", "devices", "tasks"]
      .map((l) => cell({ label: l, value: '<span class="dash">…</span>', sub: "syncing" }))
      .join("");
  }
  const o = g(S.data, "overall") || {};
  const L = g(S.data, "surfaces.personal.listening") || {};
  const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
  const failing = num(cron.failing);
  const cts = g(S.data, "surfaces.docker_vm.counts") || null;
  const alerts = num(o.alerts);
  const st = o.status === undefined ? null : o.status;
  const score = num(o.score);
  return [
    cell({
      label: "status",
      value: statusWord(st),
      state: st === "ok" ? "good" : st === "warn" ? "warn" : st === "bad" ? "bad" : "",
      sub: score === null ? "derived from live counts" : `score ${score}`,
    }),
    cell({ label: "alerts", value: valNum(alerts), state: alerts > 0 ? "warn" : "good", sub: '<span class="slist">failing</span><span class="slist">bad issues</span><span class="slist">overdue</span>' }),
    cell({
      label: "jobs enabled",
      value: valNum(cron.enabled),
      small: `/ ${num(cron.total) ?? "—"}`,
      state: failing > 0 ? "bad" : "good",
      sub: failing === null ? "" : failing > 0 ? `${failing} failing` : "none failing",
    }),
    cell({
      label: "containers running",
      value: valNum(L.containers_running),
      small: cts ? `/ ${num(cts.defined) ?? "—"}` : "",
      sub: cts ? "docker-vm" : waitCopy("total pending v2 collector"),
    }),
    cell({ label: "devices online", value: valNum(L.devices_online), small: `/ ${num(L.devices_total) ?? "—"}`, state: "good", sub: "tailnet" }),
    cell({ label: "open tasks", value: valNum(L.open_tasks), sub: num(L.overdue_tasks) > 0 ? `${L.overdue_tasks} overdue` : "none overdue" }),
  ].join("");
}

function headerHtml() {
  const tabs = SECTIONS.map(
    ([id, label]) =>
      `<button class="tab" data-tab="${id}" aria-current="${S.params.section === id ? "true" : "false"}">${label}</button>`,
  ).join("");
  const src = S.data ? S.source : "sync";
  return `<header class="hdr">
    <div class="hdr-in">
      <a class="brand" href="/">AYUMAD<span class="sl">/</span><span class="dim">OPS</span></a>
      <nav class="tabs" aria-label="Sections">${tabs}</nav>
      <div class="hdr-r" aria-live="polite">
        ${pillFor(src)}
        ${S.source === "public" ? `<a class="signin" href="/dashboard/login?next=%2Fdashboard">SIGN IN</a>` : ""}
        <span class="updated">updated <span class="js-age">${S.data ? fmtAge(g(S.data, "generated_at")) : "—"}</span> ago</span>
        <button class="theme-btn" data-theme-toggle>${S.theme === "dark" ? "LIGHT" : "DARK"}</button>
      </div>
    </div>
  </header>`;
}

const SECTION_LABELS = {
  automations: "Automations",
  homelab: "Homelab",
  services: "Services",
  media: "Media",
  personal: "Personal",
  external: "External",
  timeline: "Timeline",
};

function secHead(id, hint) {
  return `<section class="sec" id="sec-${id}">
    <div class="sec-head">
      <h2>${SECTION_LABELS[id] ?? id}</h2>
      <div class="sec-hint">${hint}</div>
    </div>
    <div class="sec-body">`;
}

function sectionAutomations() {
  const src = (g(S.data, "meta.sources") || []);
  const h = g(S.data, "surfaces.mac_mini.hermes") || {};
  const cron = h.cron || {};
  const jobs = g(S.data, "surfaces.mac_mini.cron.jobs");
  const pend = g(S.data, "surfaces.mac_mini.cron.pending");
  const launchd = g(S.data, "surfaces.mac_mini.launchd");
  const ports = g(S.data, "surfaces.mac_mini.ports");
  const hint = `${sourceBadge("hermes", src)}${pend ? `<span class="nodata">· ${waitCopy("rows pending v2")}</span>` : jobs ? `<span class="nodata">· ${jobs.length} jobs</span>` : ""}`;

  let cells = "";
  if (S.data) {
    const disk = h.disk || {};
    const mem = h.memory || {};
    cells = `<div class="cells">
      ${cell({ label: "cron total", value: valNum(cron.total) })}
      ${cell({ label: "failing", value: valNum(cron.failing), state: num(cron.failing) > 0 ? "bad" : "good" })}
      ${cell({ label: "no agent", value: valNum(cron.no_agent) })}
      ${cell({ label: "skills", value: valNum(h.skills) })}
      ${cell({ label: "memory", value: valNum(mem.working), small: `+ ${num(mem.episodic) ?? "—"} episodic` })}
      ${cell({ label: "disk used", value: valNum(disk.used_pct, "%"), small: `${num(disk.free_gb) ?? "—"} / ${num(disk.size_gb) ?? "—"} GB free`, state: num(disk.used_pct) > 90 ? "bad" : num(disk.used_pct) > 80 ? "warn" : "good" })}
      ${cell({ label: "hermes", value: val(h.version), sub: `released ${val(h.released)} · ${valNum(h.commits_behind)} behind` })}
    </div>`;
  } else {
    cells = pendingPanel("automations summary", "connecting to live source");
  }

  let jobsHtml;
  if (pend) {
    jobsHtml = pendingPanel("per-job cron rows");
  } else if (!jobs || !jobs.length) {
    jobsHtml = emptyPanel("cron jobs");
  } else {
    const list = S.mem.jobs = jobs.slice();
    const flt = S.filters.automations;
    const isFail = (j) =>
      (num(j.success_7d) !== null && j.success_7d < 100) || (j.last_status && j.last_status !== "completed");
    list.sort((a, b) => (isFail(b) ? 1 : 0) - (isFail(a) ? 1 : 0) ||
      (parseTs(a.next_run)?.getTime() ?? Infinity) - (parseTs(b.next_run)?.getTime() ?? Infinity));
    const shown = list
      .map((j, i) => ({ j, i }))
      .filter(({ j }) =>
        flt === "failing" ? isFail(j) : flt === "agent" ? j.no_agent === false : flt === "script" ? j.no_agent === true : true,
      );
    const chips = [
      ["all", "all"], ["failing", `failing ${list.filter(isFail).length}`], ["script", "script"], ["agent", "agent"],
    ]
      .map(([k, l]) => `<button class="fchip" data-filter="${k}" aria-pressed="${flt === k ? "true" : "false"}">${l}</button>`)
      .join("");
    const rows = shown
      .map(({ j, i }) => {
        const stCls = isFail(j) ? "bad" : j.last_status === "completed" ? "good" : "";
        const stTxt = isFail(j) ? "failing" : j.last_status === "completed" ? "ok" : j.last_status ? esc(j.last_status) : "no runs";
        return row({
          title: esc(j.name ?? "—"),
          meta: `${esc(j.schedule ?? "—")} <span class="tag">${esc(j.kind ?? "—")}</span>${j.model ? `<span class="tag">${esc(j.model)}</span>` : ""} ${sparkBars(j.success_7d, j.runs_7d)} <span class="m">${valNum(j.ok_7d)}/${valNum(j.runs_7d)} · 7d</span>`,
          right: `${fmtNextRun(j.next_run)}<span class="st ${stCls}">${stTxt}</span>`,
          fail: isFail(j),
          drawer: `job:${i}`,
        });
      })
      .join("");
    jobsHtml = `<div class="chips" role="group" aria-label="Job filters">${chips}</div>
      <div class="trows">${rows || emptyPanel("jobs matching filter")}</div>`;
  }

  let launchdHtml = "";
  if (launchd && launchd.length) {
    const rows = launchd
      .map((l) =>
        row({
          title: esc(l.label),
          meta: `pid <span class="m">${l.pid === null || l.pid === undefined ? "—" : esc(l.pid)}</span> · last exit <span class="${num(l.last_exit) !== 0 && l.last_exit !== null ? "bad" : "m"}">${valNum(l.last_exit)}</span>`,
          right: `<span class="st ${l.running ? "good" : "off"}">${l.running ? "running" : "stopped"}</span>`,
          disabled: true,
        }),
      )
      .join("");
    launchdHtml = `<div class="subhead">launchd · mac mini</div><div class="trows">${rows}</div>`;
  } else if (S.data) {
    launchdHtml = `<div class="subhead">launchd · mac mini</div><div class="state" data-state="empty"><span class="t">launchd services</span><span>${waitCopy("not in v1 payload · pending v2")}</span></div>`;
  }

  let portsHtml = "";
  if (ports && ports.length) {
    portsHtml = `<div class="subhead">ports · mac mini</div><div class="matrix">${ports
      .map((p) => chip({ name: `${esc(p.name)} · ${valNum(p.port)}`, state: p.state === "listen" ? "good" : "off", right: esc(p.state ?? "—") }))
      .join("")}</div>`;
  } else if (S.data) {
    portsHtml = `<div class="subhead">ports · mac mini</div><div class="state" data-state="empty"><span class="t">listening ports</span><span>${waitCopy("not in v1 payload · pending v2")}</span></div>`;
  }

  return `${secHead("automations", hint)}${cells}
    <div class="subhead">cron jobs · hermes</div>${jobsHtml}
    <div class="subgrid cols-2">
      <div>${launchdHtml}</div>
      <div>${portsHtml}</div>
    </div>
  </section>`;
}

function sectionHomelab() {
  const src = (g(S.data, "meta.sources") || []);
  const p = g(S.data, "surfaces.p520") || {};
  if (p.pending) {
    return `${secHead("homelab", sourceBadge("proxmox", src))}${pendingPanel("P520 host · pools · guests")}</section>`;
  }
  const hint = sourceBadge("proxmox", src);
  const host = p.host || {};
  const guests = p.guests || [];
  const pools = p.pools || [];
  const memPct = num(host.mem_used_gb) !== null && num(host.mem_total_gb) ? Math.round((host.mem_used_gb / host.mem_total_gb) * 100) : null;
  const net = g(S.data, "surfaces.network") || {};

  const gauges = `<div class="cells">
    ${cell({ label: "p520 uptime", value: fmtUptime(host.uptime_s), sub: `${val(host.name)} · proxmox ${val(host.proxmox)}` })}
    ${cell({ label: "load 1 / 5 / 15", value: (host.load || []).map((x) => (num(x) === null ? "—" : esc(x))).join(" "), sub: `${valNum(host.cores)} cores · ${esc(String(host.cpu ?? "—")).slice(0, 28)}` })}
    ${cell({ label: "memory", value: valNum(host.mem_used_gb, " GB"), small: `/ ${valNum(host.mem_total_gb, " GB")}`, state: memPct === null ? "" : memPct > 90 ? "bad" : memPct > 80 ? "warn" : "good", sub: `failed units ${valNum(host.failed_units)}` })}
    ${cell({ label: "guests running", value: valNum(guests.filter((x) => x.status === "running").length), small: `/ ${guests.length || "—"}`, sub: `gpu ${val(g(p, "gpu.owner") ?? "—")}` })}
  </div>`;

  const poolBars = pools
    .map((pl) => {
      const pctv = num(pl.used_pct);
      const vcls = pctv === null ? "" : pctv > 90 ? "bad" : pctv > 80 ? "warn" : "";
      return `<div>${bar({ label: `pool · ${esc(pl.name ?? "—")}`, pct: pl.used_pct, value: `· ${valNum(pl.alloc_gb, " / " + (num(pl.size_gb) === null ? "—" : pl.size_gb.toLocaleString("en-US")) + " GB")}` })}
      <div class="nodata" style="margin-top:6px; display:flex; gap:12px; flex-wrap:wrap;">
        <span>${dot(pl.health === "ONLINE" ? "good" : "bad")} ${val(pl.health)}</span>
        <span>${val(pl.errors)}</span>
      </div>
      <div class="nodata" style="margin-top:3px">${esc(String(pl.scan ?? "—")).slice(0, 110)}</div></div>`;
    })
    .join("");

  const guestChips = guests.length
    ? `<div class="matrix">${guests
        .map((gu) =>
          chip({
            name: `${valNum(gu.id)} ${esc(gu.name ?? "—")}`,
            state: gu.status === "running" ? "good" : "off",
            right: `${esc(gu.type ?? "—")} · ${gu.mem_mb === null || gu.mem_mb === undefined ? "—" : Math.round(gu.mem_mb / 1024) + "g"}`,
          }),
        )
        .join("")}</div>`
    : emptyPanel("guests");

  const smart = p.smart || [];
  const smartHtml = smart.length
    ? `<div class="trows">${smart
        .map((d) =>
          row({
            title: `${esc(d.device ?? "—")} <span class="tag">${esc(d.pool ?? "—")}</span>`,
            meta: `${val(d.health)} · ${d.hours === null || d.hours === undefined ? "—" : esc(d.hours.toLocaleString("en-US")) + "h"}`,
            right: `${d.temp_c === null || d.temp_c === undefined ? "—" : esc(d.temp_c) + "°C"}<span class="st good">smart</span>`,
            disabled: true,
          }),
        )
        .join("")}</div>`
    : `<div class="state" data-state="empty"><span class="t">SMART</span><span>no data in payload</span></div>`;

  const backups = p.backups || {};
  const strip = `<div class="cells">
    ${cell({ label: "backups", value: valNum(backups.count), sub: `newest ${valNum(backups.newest_age_h, "h")} ago · ${esc(String(backups.destination ?? "—")).slice(0, 40)}` })}
    ${cell({ label: "snapshots", value: valNum(p.snapshots) })}
    ${cell({ label: "scrub timers", value: valNum(p.scrub_timers), state: "good" })}
    ${cell({ label: "offsite", value: backups.offsite === false ? "no" : backups.offsite === true ? "yes" : "—", state: backups.offsite === false ? "warn" : "", sub: esc(String(backups.schedule ?? "—")).slice(0, 44) })}
  </div>
  <div class="subhead">SMART</div>${smartHtml}`;

  const peers = net.tailscale || [];
  const online = num(net.online) ?? peers.filter((x) => x.online).length;
  const netHtml = `<div class="subhead">fleet · tailnet ${sourceBadge("network", src)}</div>
    <div class="cells">
      ${cell({ label: "devices online", value: valNum(online), small: `/ ${peers.length || "—"}`, state: "good", sub: "pihole " + val(g(net, "pihole.status") ?? "—") })}
      ${cell({ label: "pihole queries 24h", value: valNum(g(net, "pihole.queries_24h")), sub: `blocked ${valNum(g(net, "pihole.blocked_pct"), "%")}` })}
    </div>
    ${peers.length ? `<div class="matrix">${peers
      .map((pr) =>
        chip({
          name: esc(pr.name ?? "—"),
          state: pr.online ? "good" : "off",
          right: `${pr.self ? "self · " : ""}${esc(pr.os ?? "—")}`,
        }),
      )
      .join("")}</div>` : emptyPanel("tailnet peers")}
    ${(net.routes || []).length ? `<div class="subhead">lan routes</div><div class="matrix">${net.routes
      .map((r) => chip({ name: esc(r.host ?? "—"), state: r.state === "up" ? "good" : "warn", right: esc(r.state ?? "—") }))
      .join("")}</div>` : ""}`;

  return `${secHead("homelab", hint + `<span class="nodata">· ${guests.length} guests</span>`)}
    ${gauges}
    <div class="subhead">zfs pools</div><div class="subgrid cols-2">${poolBars || emptyPanel("pools")}</div>
    <div class="subhead">guests</div>${guestChips}
    <div class="subhead">protection</div>${strip}
    ${netHtml}
  </section>`;
}

function containerChip(c) {
  const stopped = c.state !== "running";
  if (stopped && c.expected_running === false) {
    return chip({ name: esc(c.name ?? "—"), state: "warn", right: "stopped", cls: "stopped-expected" });
  }
  if (c.health === "unhealthy") return chip({ name: esc(c.name ?? "—"), state: "bad", right: "unhealthy" });
  if (stopped) return chip({ name: esc(c.name ?? "—"), state: "bad", right: "down" });
  return chip({ name: esc(c.name ?? "—"), state: c.health === "healthy" ? "good" : "good", right: c.health === "healthy" ? "healthy" : "up" });
}

function sectionServices() {
  const src = (g(S.data, "meta.sources") || []);
  const dv = g(S.data, "surfaces.docker_vm") || {};
  if (dv.pending) {
    return `${secHead("services", sourceBadge("docker_stack", src))}${pendingPanel("container matrix · docker-vm")}</section>`;
  }
  const counts = dv.counts || {};
  const containers = dv.containers || [];
  const stacks = dv.stacks || [];
  const cellsHtml = `<div class="cells">
    ${cell({ label: "defined", value: valNum(counts.defined) })}
    ${cell({ label: "running", value: valNum(counts.running), state: "good" })}
    ${cell({ label: "stopped", value: valNum(counts.stopped), state: num(counts.stopped) > 0 ? "warn" : "" })}
    ${cell({ label: "expected-stopped", value: valNum(counts.expected_running_stopped), state: "warn" })}
    ${cell({ label: "unhealthy", value: valNum(counts.unhealthy), state: num(counts.unhealthy) > 0 ? "bad" : "good" })}
  </div>`;
  const groups = (stacks.length ? stacks : [...new Set(containers.map((c) => c.stack))].sort())
    .map((st) => {
      const list = containers.filter((c) => c.stack === st);
      return `<div class="mxgroup">
        <div class="gx">${esc(st)} <span class="gc">${list.length}</span></div>
        <div class="matrix">${list.map(containerChip).join("")}</div>
      </div>`;
    })
    .join("");
  return `${secHead("services", sourceBadge("docker_stack", src) + `<span class="nodata">· ${containers.length} containers</span>`)}
    ${cellsHtml}
    ${groups || emptyPanel("containers")}
  </section>`;
}

function sectionMedia() {
  const src = (g(S.data, "meta.sources") || []);
  const m = g(S.data, "surfaces.media") || {};
  if (m.pending) {
    return `${secHead("media", sourceBadge("media", src))}${pendingPanel("media queues · remux · jellyfin")}</section>`;
  }
  const q = m.queues || {};
  const dl = m.downloads || {};
  const jf = m.jellyfin || {};
  const rx = m.remux || {};
  const lb = m.letterboxd || {};
  const cellsHtml = `<div class="cells">
    ${cell({ label: "radarr queue", value: valNum(q.radarr) })}
    ${cell({ label: "sonarr queue", value: valNum(q.sonarr) })}
    ${cell({ label: "downloads active", value: valNum(dl.active), sub: `${valNum(dl.rate_mbps, " mbps")} · ${valNum(dl.torrents)} torrents` })}
    ${jf.movies !== undefined && jf.movies !== null
      ? cell({ label: "jellyfin library", value: valNum(jf.movies), sub: `${valNum(jf.series)} series · ${valNum(jf.episodes)} eps` })
      : cell({ label: "jellyfin sessions", value: valNum(jf.sessions), sub: num(jf.sessions) === 0 ? "idle" : "now playing" })}
    ${cell({ label: "remux queued", value: valNum(rx.queued), sub: `${valNum(rx.completed_today)} completed today` })}
    ${cell({ label: "letterboxd sync", value: lb.stale ? "stale" : val(lb.last_sync ? "ok" : "—"), state: lb.stale ? "warn" : "good", sub: fmtTimeShort(lb.last_sync) })}
  </div>`;
  const emptyNote = num(q.radarr) === 0 && num(q.sonarr) === 0 && num(dl.active) === 0
    ? `<div class="state" data-state="empty"><span class="t">media activity</span><span>queues empty · nothing downloading</span></div>`
    : "";
  return `${secHead("media", sourceBadge("media", src))}${cellsHtml}${emptyNote}</section>`;
}

function sectionPersonal() {
  const src = (g(S.data, "meta.sources") || []);
  const p = g(S.data, "surfaces.personal") || {};
  const t = p.tasks || {};
  const sc = p.school || {};
  const ap = p.applications;
  const jn = p.journal || {};
  const L = p.listening || {};
  const hint = sourceBadge("personal", src);

  const tasksRows = (t.items || []).length
    ? `<div class="trows">${(S.mem.tasks = t.items.slice(0, 10))
        .map(
          (it, i) =>
            row({
              title: esc(it.title ?? "—"),
              meta: `<span class="tag">${esc(it.list ?? "—")}</span>due <span class="${it.overdue ? "bad" : "m"}">${val(it.due)}</span>`,
              right: `<span class="st ${it.overdue ? "bad" : "good"}">${it.overdue ? "overdue" : "open"}</span>`,
              fail: !!it.overdue,
              drawer: `task:${i}`,
            }),
        )
        .join("")}</div>`
    : emptyPanel("task items");

  const schoolRows = (sc.next || []).length
    ? `<div class="trows">${(S.mem.school = sc.next.slice(0, 6))
        .map(
          (nx, i) =>
            row({
              title: esc(nx.title ?? "—"),
              meta: `<span class="tag">${esc(nx.course ?? "—")}</span>due ${val(nx.due)}`,
              right: `${parseTs(nx.when) ? fmtClock(parseTs(nx.when)) : "—"}`,
              drawer: `school:${i}`,
            }),
        )
        .join("")}</div>`
    : emptyPanel("upcoming school items");

  const apCells = ap
    ? `<div class="cells">
        ${cell({ label: "applications · week", value: valNum(ap.week) })}
        ${cell({ label: "total sent", value: valNum(ap.total) })}
        ${cell({ label: "weekly cap", value: valNum(ap.cap), sub: num(ap.week) > 0 ? "in progress" : "idle week" })}
      </div>`
    : `<div class="state" data-state="empty"><span class="t">applications</span><span>${waitCopy("not in v1 payload · pending v2")}</span></div>`;

  const lcells = `<div class="cells">
    ${cell({ label: "active projects", value: valNum(L.active_projects) })}
    ${cell({ label: "planned projects", value: valNum(L.planned_projects) })}
    ${cell({ label: "assignments upcoming", value: valNum(L.assignments_upcoming) })}
    ${cell({ label: "jobs failing", value: valNum(L.jobs_failing), state: num(L.jobs_failing) > 0 ? "bad" : "good", small: `/ ${num(L.jobs_total) ?? "—"}` })}
    ${cell({ label: "services up", value: valNum(L.services_up), small: `/ ${num(L.services_total) ?? "—"}` })}
    ${cell({ label: "pools online", value: valNum(L.pools_online), small: `/ ${num(L.pools_total) ?? "—"}` })}
    ${cell({ label: "homelab issues", value: valNum(L.homelab_issues_warn), state: num(L.homelab_issues_bad) > 0 ? "bad" : num(L.homelab_issues_warn) > 0 ? "warn" : "good", sub: `${valNum(L.homelab_issues_bad)} bad` })}
    ${cell({ label: "journal entries · 7d", value: valNum(jn.entries_7d), sub: `last ${val(jn.last)}` })}
  </div>`;

  return `${secHead("personal", hint)}
    <div class="cells">
      ${cell({ label: "tasks open", value: valNum(t.open), sub: `${valNum(t.overdue)} overdue` })}
      ${cell({ label: "overdue", value: valNum(t.overdue), state: num(t.overdue) > 0 ? "bad" : "good" })}
      ${cell({ label: "school upcoming", value: valNum(sc.upcoming), sub: (sc.courses || []).map((c) => esc(c)).join(" · ") || "—" })}
    </div>
    <div class="subgrid cols-2">
      <div><div class="subhead">task items</div>${tasksRows}</div>
      <div><div class="subhead">school · next</div>${schoolRows}</div>
    </div>
    <div class="subhead">applications</div>${apCells}
    <div class="subhead">listening · aggregate</div>${lcells}
  </section>`;
}

function sectionExternal() {
  const src = (g(S.data, "meta.sources") || []);
  const x = g(S.data, "surfaces.external") || {};
  if (x.pending) {
    const hint = S.source === "public" ? `<span class="nodata">sign in for detail</span>` : sourceBadge("external", src);
    return `${secHead("external", hint)}${pendingPanel("vercel · github · offsite backups")}</section>`;
  }
  const v = x.vercel || {};
  const gh = x.github || {};
  const bk = x.backups || {};
  const cellsHtml = `<div class="cells">
    ${cell({ label: "vercel", value: val(v.status), state: v.status === "ready" ? "good" : "warn", sub: `deployed ${fmtTimeShort(v.last_deploy)}` })}
    ${cell({ label: "github issues", value: valNum(gh.open_issues), sub: `last run ${val(gh.last_run)}` })}
    ${cell({ label: "proxmox backup age", value: valNum(bk.proxmox_age_h, "h"), state: num(bk.proxmox_age_h) > 48 ? "warn" : "good", sub: "vzdump newest" })}
    ${cell({ label: "google drive", value: fmtTimeShort(bk.google_drive), sub: "vault backup" })}
  </div>`;
  return `${secHead("external", sourceBadge("external", src))}${cellsHtml}</section>`;
}

function sectionTimeline() {
  const tl = S.data ? (g(S.data, "timeline") || []) : [];
  S.mem.timeline = tl.slice(0, 50);
  const levels = ["info", "warn", "bad"];
  const sources = [...new Set(S.mem.timeline.map((e) => e.source))];
  const lvlChips = ["all", ...levels]
    .map((k) => `<button class="fchip" data-tllevel="${k}" aria-pressed="${S.filters.tlLevel === k ? "true" : "false"}">${k}</button>`)
    .join("");
  const srcChips = ["all", ...sources]
    .map((k) => `<button class="fchip" data-tlsource="${esc(k)}" aria-pressed="${S.filters.tlSource === k ? "true" : "false"}">${esc(k)}</button>`)
    .join("");
  const shown = S.mem.timeline
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => (S.filters.tlLevel === "all" || e.level === S.filters.tlLevel) && (S.filters.tlSource === "all" || e.source === S.filters.tlSource));
  const rows = shown.map(({ e, i }) => tlRow(e, i)).join("");
  return `${secHead("timeline", `<span class="nodata">${S.mem.timeline.length} events · 50 max</span>`)}
    <div class="chips" role="group" aria-label="Timeline filters">
      <span class="nodata">level</span>${lvlChips}<span class="nodata">source</span>${srcChips}
    </div>
    ${rows ? `<div class="tl">${rows}</div>` : emptyPanel("timeline events")}
  </section>`;
}

function footerHtml() {
  if (!S.data) return "";
  const srcs = g(S.data, "meta.sources") || [];
  const okN = srcs.filter((s) => s.ok).length;
  const stN = srcs.filter((s) => s.stale && s.ok !== false).length;
  const erN = srcs.filter((s) => s.ok === false && !s.pending).length;
  const pdN = srcs.filter((s) => s.pending).length;
  const origin =
    S.source === "seed"
      ? "DESIGN FIXTURE · not live data"
      : S.source === "snapshot"
        ? "adapted from v1 snapshot payload"
        : S.source === "stale"
          ? "adapted from v1 live payload · refresh failing"
          : "adapted from v1 live payload";
  return `<footer class="foot">
    <span>generated ${val(g(S.data, "generated_at"))}</span>
    <span>${val(g(S.data, "generated_on"))}</span>
    <span>${val(g(S.data, "schema"))}</span>
    <span>sources ${okN} ok · ${stN} stale · ${erN} error · ${pdN} pending</span>
    <span>${origin}</span>
  </footer>`;
}

function renderWeb() {
  app.innerHTML = `
    <div class="wrap">
      ${headerHtml()}
      ${modeBannerHtml() ? `<div class="mode-strip">${modeBannerHtml()}</div>` : ""}
      <div class="hero">${heroCells()}</div>
      ${S.data ? "" : `<div class="state" data-state="empty" style="margin-top:20px"><span class="t">${S.source === "error" ? "data unavailable" : "connecting"}</span><span>${S.source === "error" ? "the authenticated snapshot could not be read" : "authenticated snapshot → seed fallback"}</span></div>`}
      ${sectionAutomations()}
      ${sectionHomelab()}
      ${sectionServices()}
      ${sectionMedia()}
      ${sectionPersonal()}
      ${sectionExternal()}
      ${sectionTimeline()}
      ${footerHtml()}
      <div class="drawer-back" id="drawer-back" hidden></div>
      <aside class="drawer" id="drawer" data-open="false" role="dialog" aria-modal="true" aria-label="Detail">
        <div class="drawer-head">
          <h3 class="drawer-title" id="drawer-title">—</h3>
          <button class="drawer-close" id="drawer-close">ESC</button>
        </div>
        <div id="drawer-body"></div>
      </aside>
    </div>`;
  wireWeb();
  if (S.params.section) scrollToSection(S.params.section, false);
}

/* ---------- drawer ---------- */

function drawerData(kind, idx) {
  const [table, i] = [kind.split(":")[0], Number(kind.split(":")[1])];
  if (table === "job") return [g(S.mem.jobs, i + ".name") ?? "cron job", S.mem.jobs[i] || {}];
  if (table === "tl") return ["timeline event", S.mem.timeline[i] || {}];
  if (table === "task") return [g(S.mem.tasks, i + ".title") ?? "task", S.mem.tasks[i] || {}];
  if (table === "school") return [g(S.mem.school, i + ".title") ?? "school item", S.mem.school[i] || {}];
  return ["detail", {}];
}

function openDrawer(kind) {
  const drawer = document.getElementById("drawer");
  if (!drawer) return;
  const [title, obj] = drawerData(kind);
  document.getElementById("drawer-title").textContent = String(title);
  document.getElementById("drawer-body").innerHTML = `<div class="nodata" style="margin-bottom:10px">raw fields · source payload</div>${kvTable(obj)}`;
  drawer.dataset.open = "true";
  const back = document.getElementById("drawer-back");
  back.hidden = false;
  document.getElementById("drawer-close").focus();
}

function closeDrawer() {
  const drawer = document.getElementById("drawer");
  if (!drawer || drawer.dataset.open !== "true") return false;
  drawer.dataset.open = "false";
  document.getElementById("drawer-back").hidden = true;
  return true;
}

/* ---------- web wiring ---------- */

function wireWeb() {
  const root = app;

  root.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.tab;
      setParam("section", id);
      S.params.section = id;
      root.querySelectorAll("[data-tab]").forEach((x) => (x.ariaCurrent = x === b ? "true" : "false"));
      scrollToSection(id, true);
    }),
  );

  root.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    S.theme = S.theme === "dark" ? "light" : "dark";
    setParam("theme", S.theme);
    render();
  });

  root.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      S.filters.automations = b.dataset.filter;
      setParam("filter", b.dataset.filter === "all" ? null : b.dataset.filter);
      renderWeb();
    }),
  );

  root.querySelectorAll("[data-tllevel]").forEach((b) =>
    b.addEventListener("click", () => {
      S.filters.tlLevel = b.dataset.tllevel;
      setParam("level", b.dataset.tllevel === "all" ? null : b.dataset.tllevel);
      renderWeb();
    }),
  );

  root.querySelectorAll("[data-tlsource]").forEach((b) =>
    b.addEventListener("click", () => {
      S.filters.tlSource = b.dataset.tlsource;
      setParam("src", b.dataset.tlsource === "all" ? null : b.dataset.tlsource);
      renderWeb();
    }),
  );

  root.querySelectorAll("[data-drawer]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openDrawer(b.dataset.drawer);
    }),
  );

  document.getElementById("drawer-close")?.addEventListener("click", closeDrawer);
  document.getElementById("drawer-back")?.addEventListener("click", closeDrawer);

  // keyboard: j/k row navigation, Enter opens (native buttons), Esc closes drawer
  document.onkeydown = (e) => {
    if (e.key === "Escape" && closeDrawer()) return;
    if (e.key === "Tab") trapDrawerFocus(e);
    if (e.key !== "j" && e.key !== "k") return;
    const rows = [...root.querySelectorAll(".row:not([disabled]), .tl-row")];
    if (!rows.length) return;
    const cur = rows.indexOf(document.activeElement);
    const next = e.key === "j" ? Math.min(rows.length - 1, cur + 1) : Math.max(0, cur - 1);
    rows[next === -1 && e.key === "j" ? 0 : next === -1 ? rows.length - 1 : next].focus();
    e.preventDefault();
  };

  // scrollspy
  let spy = 0;
  window.onscroll = () => {
    clearTimeout(spy);
    spy = setTimeout(() => {
      const y = window.scrollY + 140;
      let cur = "";
      for (const [id] of SECTIONS) {
        const el = document.getElementById("sec-" + id);
        if (el && el.offsetTop <= y) cur = id;
      }
      if (cur && cur !== S.params.section) {
        S.params.section = cur;
        setParam("section", cur);
        root.querySelectorAll("[data-tab]").forEach((x) => (x.ariaCurrent = x.dataset.tab === cur ? "true" : "false"));
      }
    }, 180);
  };
}

function trapDrawerFocus(e) {
  const drawer = document.getElementById("drawer");
  if (!drawer || drawer.dataset.open !== "true") return;
  const f = [...drawer.querySelectorAll("button, [href]")];
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

function scrollToSection(id, smooth) {
  const el = document.getElementById("sec-" + id);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

/* ---------- ticking age ---------- */

setInterval(() => {
  if (S.wall || !S.data) return;
  document.querySelectorAll(".js-age").forEach((el) => {
    el.textContent = fmtAge(g(S.data, "generated_at"));
  });
}, 1000);

/* ---------- boot (called at the end of wall.js) ---------- */

function boot() {
  parseParams();
  S.wall = S.params.mode === "wall";
  document.documentElement.dataset.theme = S.theme;
  if (S.wall) document.body.classList.add("wall");
  render(); // paints the shell immediately (syncing / seed), never blank
  loadData(true).then(() => {
    setInterval(() => loadData(false), REFRESH_MS);
  });
}
