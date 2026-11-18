/* wall.js — ?mode=wall: five rotating pages at 1920×1080, 20 s each,
   fixed alert rail, 2px progress line, burn-in shift, night dim,
   stale banners, pause on reduced-motion / ?page=N / keypress. */

const WALL = {
  built: false,
  idx: 0,
  dwell: 20000,
  lastSwitch: Date.now(),
  paused: false,
  pauseReason: "", // "page" | "key" | "motion"
  lastKey: 0,
  shiftPos: 0,
  tick: null,
};

const WALL_PAGES = ["status", "automations", "homelab", "services", "media+personal"];

function wallShell() {
  return `<div class="wall" id="wall">
    <header class="wall-hdr">
      <span class="wall-brand">AYUMAD<span class="sl" style="color:var(--cyan)">/</span><span style="color:var(--muted)">OPS</span></span>
      <span class="wall-clock" id="wall-clock">—</span>
      <span class="wall-r">
        <span aria-live="polite" id="wall-pill">${pillFor(S.source)}</span>
        <span class="wall-clock" style="font-size:12px;color:var(--muted)" id="wall-page-i">1/5</span>
      </span>
    </header>
    <div class="wall-progress"><i id="wall-prog"></i></div>
    <div class="wall-stage">
      <div class="wall-shift" id="wall-shift">
        ${WALL_PAGES.map((id, i) => `<div class="wall-page" id="wp-${i}" data-active="${i === 0 ? "true" : "false"}"></div>`).join("")}
      </div>
    </div>
    <div class="wall-banner" id="wall-banner" data-show="false"></div>
    <footer class="wall-rail" id="wall-rail"></footer>
  </div>`;
}

/* ---------- page renderers ---------- */

function wpStatus() {
  if (!S.data) {
    return `<div class="wp-status">
      <div class="wp-top">
        <div class="wp-top-main">
          <div class="wp-word"><span class="dash">…</span></div>
          <div class="wp-sub">mac mini — · p520 —</div>
        </div>
        <div class="wp-clockbox">
          <div class="wp-clock" id="wp-bigclock">—</div>
          <div class="wp-date" id="wp-bigdate">—</div>
        </div>
        <div class="wp-alert lvl-none"><i class="mk" aria-hidden="true"></i><span class="wp-alert-t">connecting to live source · snapshot fallback</span></div>
      </div>
      <div class="wp-kpis">
        ${WALL_KPI_IDS.map((k) => `<div class="cell"><span class="cell-l">${esc(k)}</span><span class="cell-v"><span class="dash">…</span></span><span class="cell-s">syncing</span></div>`).join("")}
      </div>
    </div>`;
  }
  const o = g(S.data, "overall") || {};
  const L = g(S.data, "surfaces.personal.listening") || {};
  const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
  const st = o.status === undefined ? null : o.status;
  const mmUp = g(S.data, "surfaces.mac_mini.host.uptime_s");
  const pUp = g(S.data, "surfaces.p520.host.uptime_s");
  const a = wallTopAlert();
  const lvlCls = a.level === "bad" ? "bad" : a.level === "warn" ? "warn" : "none";
  const kpis = [
    ["alerts", valNum(o.alerts), num(o.alerts) > 0 ? "warn" : "good", "failing · bad · overdue"],
    ["jobs enabled", valNum(cron.enabled), "good", `/ ${num(cron.total) ?? "—"} total`],
    ["containers running", valNum(L.containers_running), "good", "docker-vm"],
    ["devices online", valNum(L.devices_online), "good", `/ ${num(L.devices_total) ?? "—"} tailnet`],
    ["services up", valNum(L.services_up), "good", `/ ${num(L.services_total) ?? "—"}`],
    ["open tasks", valNum(L.open_tasks), "", `${num(L.overdue_tasks) ?? "—"} overdue`],
    ["school upcoming", valNum(L.assignments_upcoming), "", "next 7 days"],
    ["guests running", valNum(L.guests_running), "good", "proxmox"],
  ];
  return `<div class="wp-status">
    <div class="wp-top">
      <div class="wp-top-main">
        <div class="wp-word" style="color:var(--${st === "ok" ? "cyan" : st === "warn" ? "warn" : "bad"})">${esc(statusWord(st))}</div>
        <div class="wp-sub">mac mini ${mmUp === null || mmUp === undefined ? "—" : fmtUptime(mmUp)} · p520 ${pUp === null || pUp === undefined ? "—" : fmtUptime(pUp)}</div>
      </div>
      <div class="wp-clockbox">
        <div class="wp-clock" id="wp-bigclock">—</div>
        <div class="wp-date" id="wp-bigdate">—</div>
      </div>
      <div class="wp-alert lvl-${lvlCls}">
        <i class="mk" aria-hidden="true"></i>
        <span class="wp-alert-t">${esc(a.text)}</span>
        <span class="wp-alert-r">${esc(a.right)}</span>
      </div>
    </div>
    <div class="wp-kpis">
      ${kpis
        .map(
          ([label, value, state, sub]) =>
            `<div class="cell"><span class="cell-l">${esc(label)}</span><span class="cell-v ${state}">${value}</span><span class="cell-s">${esc(sub)}</span></div>`,
        )
        .join("")}
    </div>
  </div>`;
}

const WALL_KPI_IDS = ["alerts", "jobs enabled", "containers running", "devices online", "services up", "open tasks", "school upcoming", "guests running"];

function wpJobs() {
  const jobs = g(S.data, "surfaces.mac_mini.cron.jobs");
  const pend = g(S.data, "surfaces.mac_mini.cron.pending");
  if (pend || !jobs || !jobs.length) {
    const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
    const note = pend
      ? `collector pending · v2 not wired — per-job rows await the v2 collector`
      : `no cron jobs in payload`;
    return `<div class="wp-jobs pending">
      <div>
        <div class="wp-note">${esc(note)}</div>
        <div class="cells wp-fill">
          ${cell({ label: "cron total", value: valNum(cron.total) })}
          ${cell({ label: "enabled", value: valNum(cron.enabled), state: "good" })}
          ${cell({ label: "failing", value: valNum(cron.failing), state: num(cron.failing) > 0 ? "bad" : "good" })}
          ${cell({ label: "no agent", value: valNum(cron.no_agent) })}
        </div>
      </div>
    </div>`;
  }
  const isFail = (j) => (num(j.success_7d) !== null && j.success_7d < 100) || (j.last_status && j.last_status !== "completed");
  const sorted = jobs.slice().sort((a, b) => (isFail(b) ? 1 : 0) - (isFail(a) ? 1 : 0) ||
    (parseTs(a.next_run)?.getTime() ?? Infinity) - (parseTs(b.next_run)?.getTime() ?? Infinity));
  const fails = sorted.filter(isFail);
  const rest = sorted.filter((j) => !isFail(j));
  // failures pinned to the top of the left column; columns split evenly so the
  // stretched rows stay the same height on both sides and fill the stage
  const half = Math.max(fails.length, Math.ceil(sorted.length / 2));
  const left = [...fails, ...rest.slice(0, half - fails.length)];
  const right = rest.slice(half - fails.length);
  const wrow = (j) => `<div class="wrow${isFail(j) ? " fail" : ""}">
    <span class="nm">${esc(j.name ?? "—")}</span>
    <span class="nx">${fmtNextRun(j.next_run)}</span>
    <span class="sc">${esc(j.schedule ?? "—")} <span class="tag">${esc(j.kind ?? "—")}</span>${j.model ? `<span class="tag">${esc(j.model)}</span>` : ""} ${sparkBars(j.success_7d, j.runs_7d)} ${valNum(j.ok_7d)}/${valNum(j.runs_7d)} ok · 7d</span>
  </div>`;
  return `<div class="wp-jobs"><div>${left.map(wrow).join("")}</div><div>${right.map(wrow).join("")}</div></div>`;
}

function wpHomelab() {
  const p = g(S.data, "surfaces.p520") || {};
  if (p.pending) {
    return `<div class="wp-grid pending">
      <div class="wp-note" style="grid-column:span 12">collector pending · v2 not wired — homelab surface awaits the v2 collector</div>
      <div class="cells wp-fill" style="grid-column:span 12">
        ${cell({ label: "p520 uptime", value: "—" })}
        ${cell({ label: "load 1/5/15", value: "—" })}
        ${cell({ label: "memory", value: "—" })}
        ${cell({ label: "guests running", value: "—" })}
      </div>
    </div>`;
  }
  const host = p.host || {};
  const pools = p.pools || [];
  const guests = p.guests || [];
  const backups = p.backups || {};
  const smart = p.smart || [];
  const net = g(S.data, "surfaces.network") || {};
  const peers = net.tailscale || [];
  const memPct = num(host.mem_used_gb) !== null && num(host.mem_total_gb) ? Math.round((host.mem_used_gb / host.mem_total_gb) * 100) : null;
  const smartRows = smart.length
    ? `<div class="trows">${smart
        .map((d) => `<div class="wrow static"><span class="nm">${esc(d.device ?? "—")} <span class="tag">${esc(d.pool ?? "—")}</span></span><span class="nx">${d.temp_c === null || d.temp_c === undefined ? "—" : esc(d.temp_c) + "°C"}</span><span class="sc">${val(d.health)} · ${d.hours === null || d.hours === undefined ? "—" : esc(d.hours.toLocaleString("en-US")) + "h"}</span></div>`)
        .join("")}</div>`
    : `<div class="wp-note">no SMART data in payload</div>`;
  return `<div class="wp-grid">
    <div class="cells" style="grid-column:span 12">
      ${cell({ label: "p520 uptime", value: fmtUptime(host.uptime_s), sub: `${val(host.name)} · proxmox ${val(host.proxmox)}` })}
      ${cell({ label: "load 1/5/15", value: (host.load || []).map((x) => (num(x) === null ? "—" : esc(x))).join(" "), sub: `${valNum(host.cores)} cores` })}
      ${cell({ label: "memory", value: valNum(host.mem_used_gb, " GB"), small: `/ ${valNum(host.mem_total_gb, " GB")}`, state: memPct === null ? "" : memPct > 90 ? "bad" : memPct > 80 ? "warn" : "good", sub: `failed units ${valNum(host.failed_units)}` })}
    </div>
    <div class="wp-pools">
      ${pools
        .map((pl) => {
          const pctv = num(pl.used_pct);
          const cls = pctv === null ? "" : pctv > 90 ? "bad" : pctv > 80 ? "warn" : "";
          return `<div><div class="barline"><span class="bl">pool · ${esc(pl.name ?? "—")}</span><span class="bv ${cls}">${valNum(pl.used_pct, "%")} · ${valNum(pl.alloc_gb, " / " + (num(pl.size_gb) === null ? "—" : pl.size_gb.toLocaleString("en-US")) + " GB")}</span></div>
          <div class="bar"><i class="${cls}" style="width:${pctv === null ? 0 : pctv}%"></i></div>
          <div class="nodata" style="margin-top:4px">${dot(pl.health === "ONLINE" ? "good" : "bad")} ${val(pl.health)} · ${val(pl.errors)}</div></div>`;
        })
        .join("") || `<div class="wp-note">no pool data</div>`}
    </div>
    <div class="wp-guests">
      <div class="gx" style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">guests · ${guests.filter((x) => x.status === "running").length}/${guests.length} running</div>
      <div class="matrix">${guests
        .map((gu) =>
          chip({
            name: `${valNum(gu.id)} ${esc(gu.name ?? "—")}`,
            state: gu.status === "running" ? "good" : "off",
            right: `${esc(gu.type ?? "—")} · ${gu.mem_mb === null || gu.mem_mb === undefined ? "—" : Math.round(gu.mem_mb / 1024) + "g"}`,
          }),
        )
        .join("")}</div>
    </div>
    <div class="wp-strip">
      ${cell({ label: "backups", value: valNum(backups.count), sub: `newest ${valNum(backups.newest_age_h, "h")} ago · offsite ${backups.offsite === false ? "no" : backups.offsite === true ? "yes" : "—"}` })}
      ${cell({ label: "snapshots", value: valNum(p.snapshots) })}
      ${cell({ label: "scrub timers", value: valNum(p.scrub_timers), state: "good" })}
      ${cell({ label: "smart", value: smart.length ? `${smart.filter((d) => d.health === "PASSED").length}/${smart.length} passed` : "—", state: "good", sub: smart.length ? "all pools" : "no data in payload" })}
    </div>
    <div class="wp-smart">
      <div class="gx" style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">SMART</div>
      ${smartRows}
    </div>
    <div class="wp-fleet">
      <div class="gx" style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">fleet · tailnet · ${num(net.online) ?? peers.filter((x) => x.online).length}/${peers.length} online</div>
      ${peers.length ? `<div class="matrix">${peers
        .map((pr) => chip({ name: esc(pr.name ?? "—"), state: pr.online ? "good" : "off", right: `${pr.self ? "self · " : ""}${esc(pr.os ?? "—")}` }))
        .join("")}</div>` : `<div class="wp-note">no tailnet peers in payload</div>`}
    </div>
  </div>`;
}

function wpServices() {
  const dv = g(S.data, "surfaces.docker_vm") || {};
  if (dv.pending) {
    return `<div class="wp-matrix pending">
      <div class="wp-note">collector pending · v2 not wired — container matrix awaits the v2 collector</div>
      <div class="cells wp-fill">
        ${cell({ label: "defined", value: "—" })}
        ${cell({ label: "running", value: "—" })}
        ${cell({ label: "stopped", value: "—" })}
        ${cell({ label: "unhealthy", value: "—" })}
      </div>
    </div>`;
  }
  const counts = dv.counts || {};
  const containers = dv.containers || [];
  const stacks = dv.stacks || [];
  const names = stacks.length ? stacks : [...new Set(containers.map((c) => c.stack))];
  // problem stacks first (unexpected stops), then by name; 8 groups fill the stage
  const badIn = (st) => containers.filter((c) => c.stack === st && c.state !== "running" && c.expected_running !== false).length;
  names.sort((x, y) => badIn(y) - badIn(x) || String(x).localeCompare(String(y)));
  const shown = names.slice(0, 8);
  return `<div class="wp-matrix">
    <div class="cells">
      ${cell({ label: "defined", value: valNum(counts.defined) })}
      ${cell({ label: "running", value: valNum(counts.running), state: "good" })}
      ${cell({ label: "stopped", value: valNum(counts.stopped), state: num(counts.stopped) > 0 ? "warn" : "" })}
      ${cell({ label: "unhealthy", value: valNum(counts.unhealthy), state: num(counts.unhealthy) > 0 ? "bad" : "good" })}
    </div>
    ${shown
      .map((st) => {
        const list = containers.filter((c) => c.stack === st);
        return `<div class="mxgroup"><div class="gx">${esc(st)} <span class="gc">${list.length}</span></div>
        <div class="matrix">${list.map(containerChip).join("")}</div></div>`;
      })
      .join("")}
    ${names.length > shown.length ? `<div class="nodata">+ ${names.length - shown.length} stacks not shown · see web view</div>` : ""}
  </div>`;
}

function wpMediaPersonal() {
  const m = g(S.data, "surfaces.media") || {};
  const per = g(S.data, "surfaces.personal") || {};
  const t = per.tasks || {};
  const sc = per.school || {};
  const jn = per.journal || {};
  const rx = m.remux || {};
  const rpct = num(rx.queued) + num(rx.completed_today) > 0 ? Math.round(((num(rx.completed_today) || 0) / ((num(rx.completed_today) || 0) + (num(rx.queued) || 0))) * 100) : 0;
  const mediaHtml = m.pending
    ? `<div class="wp-note">collector pending · v2 not wired — media surface awaits the v2 collector</div>
      <div class="cells wp-fill">
        ${cell({ label: "radarr queue", value: "—" })}
        ${cell({ label: "sonarr queue", value: "—" })}
        ${cell({ label: "downloads", value: "—" })}
        ${cell({ label: "jellyfin", value: "—" })}
        ${cell({ label: "remux queued", value: "—" })}
        ${cell({ label: "letterboxd sync", value: "—" })}
      </div>`
    : (() => {
        const q = m.queues || {};
        const dl = m.downloads || {};
        const jf = m.jellyfin || {};
        const lb = m.letterboxd || {};
        return `<div class="cells">
          ${cell({ label: "radarr queue", value: valNum(q.radarr) })}
          ${cell({ label: "sonarr queue", value: valNum(q.sonarr) })}
          ${cell({ label: "downloads", value: valNum(dl.active), sub: `${valNum(dl.rate_mbps, " mbps")} rate` })}
          ${cell({ label: "jellyfin", value: valNum(jf.sessions), sub: num(jf.sessions) === 0 ? "idle" : "now playing" })}
          ${cell({ label: "remux queued", value: valNum(rx.queued), sub: `${valNum(rx.completed_today)} done today` })}
          ${cell({ label: "letterboxd sync", value: lb.stale ? "stale" : val(lb.last_sync ? "ok" : "—"), state: lb.stale ? "warn" : "good", sub: fmtTimeShort(lb.last_sync) })}
        </div>
        <div style="margin-top:12px">
          <div class="barline"><span class="bl">remux pipeline</span><span class="bv">${valNum(rx.queued)} queued · ${valNum(rx.completed_today)} done today</span></div>
          <div class="bar"><i style="width:${rpct}%"></i></div>
        </div>`;
      })();

  const wrow = (r) => `<div class="wrow${r.fail ? " fail" : ""}">
    <span class="nm">${esc(r.title ?? "—")}</span>
    <span class="nx">${esc(r.right)}</span>
    <span class="sc"><span class="tag">${esc(r.tag ?? "—")}</span>${esc(r.meta)}</span>
  </div>`;
  const school = (sc.next || []).slice(0, 7).map((nx) => ({
    title: nx.title,
    tag: nx.course,
    right: parseTs(nx.when) ? fmtClock(parseTs(nx.when)) : val(nx.due),
    meta: `due ${val(nx.due)}`,
  }));
  const tasks = (t.items || []).slice(0, 7).map((it) => ({
    title: it.title,
    tag: it.list,
    right: it.overdue ? "overdue" : val(it.due),
    meta: `due ${val(it.due)}${it.overdue ? " · overdue" : ""}`,
    fail: !!it.overdue,
  }));
  return `<div class="wp-mp">
    <div class="wp-mp-top">${mediaHtml}</div>
    <div class="cells">
      ${cell({ label: "tasks open", value: valNum(t.open), sub: `${valNum(t.overdue)} overdue` })}
      ${cell({ label: "school upcoming", value: valNum(sc.upcoming), sub: "next 7 days" })}
      ${cell({ label: "journal · 7d", value: valNum(jn.entries_7d), sub: `last ${val(jn.last)}` })}
    </div>
    <div class="wp-mp-cols">
      <div><div class="gx" style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">school · due next</div>
        <div class="wp-list">${school.map(wrow).join("") || `<div class="wp-note">nothing due in window</div>`}</div></div>
      <div><div class="gx" style="font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">tasks · open</div>
        <div class="wp-list">${tasks.map(wrow).join("") || `<div class="wp-note">no open tasks in payload</div>`}</div></div>
    </div>
  </div>`;
}

/* ---------- alert rail + banner ---------- */

function wallTopAlert() {
  if (!S.data) return { level: "info", text: "connecting to live source", right: "" };
  const now = Date.now();
  const L = g(S.data, "surfaces.personal.listening") || {};
  const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
  const cands = [];
  const jf = num(cron.failing) ?? num(L.jobs_failing) ?? 0;
  if (jf > 0) cands.push({ level: "bad", text: `${jf} cron job${jf > 1 ? "s" : ""} failing`, at: now });
  if (num(L.homelab_issues_bad) > 0) cands.push({ level: "bad", text: `${L.homelab_issues_bad} homelab fault${L.homelab_issues_bad > 1 ? "s" : ""}`, at: now });
  if (num(g(S.data, "surfaces.docker_vm.counts.unhealthy")) > 0) {
    cands.push({ level: "bad", text: `${g(S.data, "surfaces.docker_vm.counts.unhealthy")} unhealthy containers`, at: now });
  }
  const age = (t) => (t ? fmtDur((now - t) / 1000) : "");
  for (const e of g(S.data, "timeline") || []) {
    const d = parseTs(e.ts);
    if (!d) continue;
    const ago = now - d.getTime();
    if (ago > 48 * 3600 * 1000) continue;
    cands.push({ level: e.level === "bad" ? "bad" : e.level === "warn" ? "warn" : "info", text: e.text, at: d.getTime() });
  }
  const rank = { bad: 3, warn: 2, info: 1 };
  cands.sort((a, b) => rank[b.level] - rank[a.level] || b.at - a.at);
  if (!cands.length || cands[0].level === "info") {
    const last = (g(S.data, "timeline") || [])[0];
    return {
      level: "none",
      text: `all clear${last ? " · last: " + String(last.text).slice(0, 60) : ""}`,
      right: last ? "last " + age(parseTs(last.ts)?.getTime()) : "",
    };
  }
  const c = cands[0];
  return { level: c.level, text: c.text, right: "last " + age(c.at) };
}

function wallRailHtml() {
  const a = wallTopAlert();
  const cls = a.level === "bad" ? "bad" : a.level === "warn" ? "warn" : "";
  const mark = a.level === "none" ? "✓" : "!";
  const who = S.data
    ? `updated ${fmtAge(g(S.data, "generated_at"))} ago · ${g(S.data, "generated_on") ?? ""}`
    : "syncing";
  return `<span style="color:var(--${a.level === "bad" ? "bad" : a.level === "warn" ? "warn" : "cyan"});font-weight:600">${mark}</span>
    <span class="${cls}" style="${cls ? "" : "color:var(--muted)"}">${esc(a.text)}</span>
    <span class="who">${esc(a.right ? a.right + " · " : "")}${esc(who)}</span>`;
}

function wallBannerHtml() {
  if (!S.data) return { show: false, html: "" };
  // one failed source is not a feed outage — the banner speaks payload mode,
  // never "FEED DOWN" (a payload is always on screen: live, snapshot or seed)
  if (S.source === "seed") return { show: true, html: banner("mute", "DESIGN FIXTURE · not live data") };
  if (S.source === "snapshot") {
    return { show: true, html: banner("mute", `snapshot · ${fmtAge(g(S.data, "generated_at"))} old`) };
  }
  if (S.source === "live" || S.source === "stale") {
    const d = parseTs(g(S.data, "generated_at"));
    if (!d) return { show: false, html: "" };
    const ageS = (Date.now() - d.getTime()) / 1000;
    if (ageS > 90) {
      return { show: true, html: banner(ageS > 300 ? "bad" : "warn", `data stale · last update ${fmtClock(d)}`, "retrying live source") };
    }
  }
  return { show: false, html: "" };
}

/* ---------- rotation engine ---------- */

function wallShow(i, restartProgress = true) {
  WALL.idx = ((i % 5) + 5) % 5;
  WALL.lastSwitch = Date.now();
  document.querySelectorAll(".wall-page").forEach((el, k) => (el.dataset.active = k === WALL.idx ? "true" : "false"));
  const pi = document.getElementById("wall-page-i");
  if (pi) pi.textContent = `${WALL.idx + 1}/5`;
  const prog = document.getElementById("wall-prog");
  if (prog && restartProgress && !WALL.paused) {
    prog.classList.remove("run");
    void prog.offsetWidth; // restart the animation
    prog.style.animationDuration = `${WALL.dwell}ms`;
    prog.classList.add("run");
  } else if (prog) {
    prog.classList.remove("run");
  }
}

function wallPause(reason) {
  if (WALL.pauseReason === "page") return; // pinned stays pinned
  WALL.paused = true;
  WALL.pauseReason = reason;
  WALL.lastKey = Date.now();
  const prog = document.getElementById("wall-prog");
  if (prog) prog.classList.remove("run");
  const pi = document.getElementById("wall-page-i");
  if (pi) pi.textContent = `${WALL.idx + 1}/5 · paused`;
}

function wallResume() {
  WALL.paused = false;
  WALL.pauseReason = "";
  wallShow(WALL.idx);
}

/* ---------- render ---------- */

function wallRender() {
  if (!WALL.built) {
    app.innerHTML = wallShell();
    WALL.built = true;
    const dwell = num(Number(S.params.dwell));
    if (dwell !== null && dwell >= 1000) WALL.dwell = dwell;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) wallPause("motion");
    if (S.params.page) {
      const n = Number(S.params.page);
      if (Number.isInteger(n) && n >= 1 && n <= 5) {
        WALL.idx = n - 1;
        WALL.pauseReason = "page";
        WALL.paused = true;
      }
    }
    document.addEventListener("keydown", () => {
      if (WALL.pauseReason === "page") return;
      wallPause("key");
    });
    // burn-in shift: 1px, 4 positions, 60s cycle
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(() => {
        WALL.shiftPos = (WALL.shiftPos + 1) % 4;
        const el = document.getElementById("wall-shift");
        if (el) {
          const offs = [[0, 0], [1, 0], [1, 1], [0, 1]][WALL.shiftPos];
          el.style.transform = `translate(${offs[0]}px, ${offs[1]}px)`;
        }
      }, 60000);
    }
    wallShow(WALL.idx);
    WALL.tick = setInterval(wallTick, 1000);
  }

  // fill pages from current data (works for syncing, seed and live)
  const pages = [wpStatus, wpJobs, wpHomelab, wpServices, wpMediaPersonal];
  pages.forEach((fn, i) => {
    const el = document.getElementById("wp-" + i);
    if (el) el.innerHTML = fn();
  });

  const pillEl = document.getElementById("wall-pill");
  if (pillEl) pillEl.innerHTML = pillFor(S.source);
  const rail = document.getElementById("wall-rail");
  if (rail) rail.innerHTML = wallRailHtml();
  const b = wallBannerHtml();
  const bannerEl = document.getElementById("wall-banner");
  if (bannerEl) {
    bannerEl.innerHTML = b.html;
    bannerEl.dataset.show = b.show ? "true" : "false";
  }
  wallClockUpdate();
}

function wallClockUpdate() {
  const now = new Date();
  const c = document.getElementById("wall-clock");
  if (c) c.textContent = `${fmtWallDate(now)} ${fmtClock(now)}`;
  const bc = document.getElementById("wp-bigclock");
  if (bc) bc.textContent = fmtClock(now);
  const bd = document.getElementById("wp-bigdate");
  if (bd) bd.textContent = fmtWallDate(now);
  // night dim 22:00–07:00
  const wall = document.getElementById("wall");
  if (wall) wall.classList.toggle("wall-dim", now.getHours() >= 22 || now.getHours() < 7);
}

function wallTick() {
  wallClockUpdate();
  if (WALL.paused) {
    if (WALL.pauseReason === "key" && Date.now() - WALL.lastKey >= 60000) wallResume();
    return;
  }
  if (Date.now() - WALL.lastSwitch >= WALL.dwell) wallShow(WALL.idx + 1);
  // banners + rail react to data age
  const b = wallBannerHtml();
  const bannerEl = document.getElementById("wall-banner");
  if (bannerEl) {
    bannerEl.innerHTML = b.html;
    bannerEl.dataset.show = b.show ? "true" : "false";
  }
  const rail = document.getElementById("wall-rail");
  if (rail) rail.innerHTML = wallRailHtml();
}

/* cold boot: no localStorage, no dialogs, no first-run state anywhere above */

boot();
