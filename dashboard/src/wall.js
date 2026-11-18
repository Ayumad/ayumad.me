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
      <div><div class="wp-word"><span class="dash">…</span></div><div class="wp-sub">connecting to live source · 5s timeout · seed fallback</div></div>
      <div class="wp-kpis">${WALL_KPI_IDS.map((k) => cell({ label: k[0], value: '<span class="dash">…</span>' })).join("")}</div>
    </div>`;
  }
  const o = g(S.data, "overall") || {};
  const L = g(S.data, "surfaces.personal.listening") || {};
  const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
  const st = o.status === undefined ? null : o.status;
  const mmUp = g(S.data, "surfaces.mac_mini.host.uptime_s");
  const pUp = g(S.data, "surfaces.p520.host.uptime_s");
  const kpis = [
    ["alerts", valNum(o.alerts), num(o.alerts) > 0 ? "warn" : "good", ""],
    ["jobs enabled", valNum(cron.enabled), "good", `/ ${num(cron.total) ?? "—"} total`],
    ["containers running", valNum(L.containers_running), "good", "docker-vm"],
    ["devices online", valNum(L.devices_online), "good", `/ ${num(L.devices_total) ?? "—"} tailnet`],
    ["services up", valNum(L.services_up), "good", `/ ${num(L.services_total) ?? "—"}`],
    ["open tasks", valNum(L.open_tasks), "", `${num(L.overdue_tasks) ?? "—"} overdue`],
    ["school upcoming", valNum(L.assignments_upcoming), "", "next 7 days"],
    ["guests running", valNum(L.guests_running), "good", "proxmox"],
  ];
  return `<div class="wp-status">
    <div class="wp-status-top">
      <div>
        <div class="wp-word" style="color:var(--${st === "ok" ? "cyan" : st === "warn" ? "warn" : "bad"})">${esc(statusWord(st))}</div>
        <div class="wp-sub">mac mini uptime ${mmUp === null || mmUp === undefined ? "—" : fmtUptime(mmUp)} · p520 uptime ${pUp === null || pUp === undefined ? "—" : fmtUptime(pUp)}</div>
      </div>
      <div>
        <div class="wp-clock" id="wp-bigclock">—</div>
        <div class="wp-sub" id="wp-bigdate">—</div>
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

const WALL_KPI_IDS = [["alerts"], ["jobs"], ["containers"], ["devices"], ["services"], ["tasks"], ["school"], ["guests"]];

function wpJobs() {
  const jobs = g(S.data, "surfaces.mac_mini.cron.jobs");
  const pend = g(S.data, "surfaces.mac_mini.cron.pending");
  if (pend || !jobs || !jobs.length) {
    const cron = g(S.data, "surfaces.mac_mini.hermes.cron") || {};
    const note = pend
      ? `collector pending · v2 not wired — per-job rows await the v2 collector`
      : `no cron jobs in payload`;
    return `<div class="wp-jobs" style="grid-template-columns:1fr">
      <div>
        <div class="wp-note">${esc(note)}</div>
        <div class="cells" style="margin-top:14px">
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
  const half = Math.max(0, 13 - fails.length); // failures pinned to the top of the left column
  const left = [...fails, ...rest.slice(0, half)];
  const right = rest.slice(half);
  const wrow = (j) => `<div class="wrow${isFail(j) ? " fail" : ""}">
    <span class="nm">${esc(j.name ?? "—")}</span>
    <span class="nx">${fmtNextRun(j.next_run)}</span>
    <span class="sc">${esc(j.schedule ?? "—")} ${sparkBars(j.success_7d)} ${valNum(j.ok_7d)}/${valNum(j.runs_7d)} ok · ${esc(j.model ?? "—")}</span>
  </div>`;
  return `<div class="wp-jobs"><div>${left.map(wrow).join("")}</div><div>${right.map(wrow).join("")}</div></div>`;
}

function wpHomelab() {
  const p = g(S.data, "surfaces.p520") || {};
  if (p.pending) {
    return `<div class="wp-grid"><div class="wp-note" style="grid-column:span 12">collector pending · v2 not wired — homelab surface awaits the v2 collector</div></div>`;
  }
  const host = p.host || {};
  const pools = p.pools || [];
  const guests = p.guests || [];
  const backups = p.backups || {};
  const smart = p.smart || [];
  const memPct = num(host.mem_used_gb) !== null && num(host.mem_total_gb) ? Math.round((host.mem_used_gb / host.mem_total_gb) * 100) : null;
  return `<div class="wp-grid">
    <div class="cell wp-gauge"><span class="cell-l">p520 uptime</span><span class="cell-v">${fmtUptime(host.uptime_s)}</span><span class="cell-s">${val(host.name)} · proxmox ${val(host.proxmox)}</span></div>
    <div class="cell wp-gauge"><span class="cell-l">load 1/5/15</span><span class="cell-v">${(host.load || []).map((x) => (num(x) === null ? "—" : esc(x))).join(" ")}</span><span class="cell-s">${valNum(host.cores)} cores</span></div>
    <div class="cell wp-gauge"><span class="cell-l">memory</span><span class="cell-v">${valNum(host.mem_used_gb, " GB")}<small> / ${valNum(host.mem_total_gb, " GB")}</small></span><span class="cell-s">failed units ${valNum(host.failed_units)}</span></div>
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
  </div>`;
}

function wpServices() {
  const dv = g(S.data, "surfaces.docker_vm") || {};
  if (dv.pending) {
    return `<div class="wp-matrix"><div class="wp-note">collector pending · v2 not wired — container matrix awaits the v2 collector</div></div>`;
  }
  const counts = dv.counts || {};
  const containers = dv.containers || [];
  const stacks = dv.stacks || [];
  return `<div class="wp-matrix">
    <div class="cells">
      ${cell({ label: "defined", value: valNum(counts.defined) })}
      ${cell({ label: "running", value: valNum(counts.running), state: "good" })}
      ${cell({ label: "stopped", value: valNum(counts.stopped), state: "warn" })}
      ${cell({ label: "unhealthy", value: valNum(counts.unhealthy), state: num(counts.unhealthy) > 0 ? "bad" : "good" })}
    </div>
    ${(stacks.length ? stacks : [...new Set(containers.map((c) => c.stack))].sort())
      .slice(0, 6)
      .map((st) => {
        const list = containers.filter((c) => c.stack === st);
        return `<div class="mxgroup"><div class="gx">${esc(st)} <span class="gc">${list.length}</span></div>
        <div class="matrix">${list.map(containerChip).join("")}</div></div>`;
      })
      .join("")}
  </div>`;
}

function wpMediaPersonal() {
  const m = g(S.data, "surfaces.media") || {};
  const per = g(S.data, "surfaces.personal") || {};
  const t = per.tasks || {};
  const sc = per.school || {};
  const mediaHtml = m.pending
    ? `<div class="wp-note">collector pending · v2 not wired — media surface awaits the v2 collector</div>`
    : (() => {
        const q = m.queues || {};
        const dl = m.downloads || {};
        const jf = m.jellyfin || {};
        const rx = m.remux || {};
        const lb = m.letterboxd || {};
        const rpct = num(rx.queued) + num(rx.completed_today) > 0 ? Math.round(((num(rx.completed_today) || 0) / ((num(rx.completed_today) || 0) + (num(rx.queued) || 0))) * 100) : 0;
        return `<div class="cells">
          ${cell({ label: "radarr queue", value: valNum(q.radarr) })}
          ${cell({ label: "sonarr queue", value: valNum(q.sonarr) })}
          ${cell({ label: "downloads", value: valNum(dl.active), sub: `${valNum(dl.rate_mbps, " mbps")}` })}
          ${cell({ label: "jellyfin", value: valNum(jf.sessions), sub: num(jf.sessions) === 0 ? "idle" : "now playing" })}
        </div>
        <div style="margin-top:14px">
          <div class="barline"><span class="bl">remux pipeline</span><span class="bv">${valNum(rx.queued)} queued · ${valNum(rx.completed_today)} done today</span></div>
          <div class="bar"><i style="width:${rpct}%"></i></div>
        </div>
        <div class="nodata" style="margin-top:10px">letterboxd sync ${lb.stale ? "stale" : "ok"} · ${fmtTimeShort(lb.last_sync)}</div>`;
      })();

  const nextList = (sc.next || []).slice(0, 5);
  const personalHtml = `<div class="cells">
      ${cell({ label: "tasks open", value: valNum(t.open), sub: `${valNum(t.overdue)} overdue` })}
      ${cell({ label: "school upcoming", value: valNum(sc.upcoming) })}
      ${cell({ label: "journal · 7d", value: valNum(g(per, "journal.entries_7d")), sub: `last ${val(g(per, "journal.last"))}` })}
    </div>
    <div class="subhead">school · due next</div>
    <div class="trows">${nextList
      .map(
        (nx) =>
          `<div class="row" style="cursor:default"><span class="rmain"><span class="rtitle">${esc(nx.title ?? "—")}</span><span class="rmeta"><span class="tag">${esc(nx.course ?? "—")}</span>due ${val(nx.due)}</span></span><span class="rright">${parseTs(nx.when) ? fmtClock(parseTs(nx.when)) : "—"}</span></div>`,
      )
      .join("") || `<div class="wp-note">nothing due in window</div>`}</div>`;

  return `<div class="wp-mp">
    <div class="block"><div class="subhead" style="margin-top:0">media</div>${mediaHtml}</div>
    <div class="block"><div class="subhead" style="margin-top:0">personal</div>${personalHtml}</div>
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
  const d = parseTs(g(S.data, "generated_at"));
  if (!d) return { show: false, html: "" };
  const ageS = (Date.now() - d.getTime()) / 1000;
  if (ageS > 300) {
    return { show: true, html: banner("bad", `FEED DOWN · showing last good`, fmtClock(d)) };
  }
  if (ageS > 90) {
    return { show: true, html: banner("warn", `data stale · last update ${fmtClock(d)}`, S.source === "live" ? "retrying live source" : "") };
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
