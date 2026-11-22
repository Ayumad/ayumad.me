function createHermesFlow(canvas) {
  const ctx = canvas.getContext("2d");
  const trails = document.createElement("canvas");
  const trail = trails.getContext("2d");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const preferenceKey = "ayumad-renderer";
  const styles = getComputedStyle(canvas);
  const mint = styles.getPropertyValue("--cyan").trim();
  const accent = styles.getPropertyValue("--violet").trim();
  const light = styles.getPropertyValue("--text").trim();
  const amber = styles.getPropertyValue("--warn").trim();
  const mono = styles.getPropertyValue("--mono").trim();
  const turn = Math.PI * 2;
  const slots = [
    { x: .29, y: .46, color: mint }, { x: .70, y: .43, color: accent },
    { x: .49, y: .63, color: mint }, { x: .35, y: .27, color: light },
    { x: .76, y: .65, color: mint }, { x: .54, y: .35, color: accent },
  ];
  const warning = { x: .73, y: .61, color: amber };
  const idle = { x: .50, y: .52, color: mint };
  const runSlots = new Map();
  const seen = new Set();
  const modes = new Set(["ascii", "dither", "glitch", "particles", "crt"]);
  const outcomes = { succeeded: "completed", delivered: "delivered", failed: "failed" };
  const headlines = {
    stale: "Feed delayed",
    unavailable: "Telemetry unavailable",
    attention: "Needs attention",
    working: "Working",
    idle: "Idle",
    empty: "Awaiting telemetry",
  };
  const jobName = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 90) : "";
  const glyphs = [".", ":", "+", "*"];
  const threshold = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let seed = 61779;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const swarm = Array.from({ length: 2900 }, (_, index) => ({
    lane: Math.floor(index / 4) % slots.length,
    fault: index % 4 === 0,
    u: random() * 2 - 1,
    band: Math.floor(random() * 11) / 11,
    angle: random() * turn,
    spread: random(),
    bright: random(),
    x: null,
    y: null,
    vx: 0,
    vy: 0,
  }));
  const dust = Array.from({ length: 325 }, () => ({ x: random(), y: random(), bright: random() }));
  const sparks = Array.from({ length: 106 }, () => ({
    angle: random() * turn, speed: .29 + random() * .87, light: random(),
  }));
  let width = 0;
  let height = 0;
  let renderer = "particles";
  let frame = 0;
  let previousFrame = 0;
  let clock = 0;
  let sourceTime = -Infinity;
  let publicView;
  let reading = {};
  let lastResult = null;
  let stale = false;
  let faded = true;
  let currents = [];
  let releases = [];

  function usePreference() {
    let saved;
    try {
      saved = localStorage.getItem(preferenceKey);
    } catch {
      // Storage can be disabled on a kiosk.
    }
    renderer = modes.has(saved) ? saved : "particles";
    canvas.dataset.renderer = renderer;
    paint(true);
  }

  function readSnapshot(data, active, failing, receivedAt) {
    if (sourceTime !== -Infinity && (!Number.isFinite(receivedAt) || receivedAt < sourceTime)) return;
    const flow = data.public ? null : data.hermes?.flow;
    const runs = Array.isArray(flow?.runs) ? flow.runs : [];
    const running = runs.filter((run) => run?.phase === "running" && typeof run.run_id === "string");
    const capacity = Math.min(slots.length, Math.floor(active ?? running.length));
    const ids = [...new Set(running.map((run) => "run:" + run.run_id))].slice(0, capacity);
    for (let index = ids.length; index < capacity; index += 1) ids.push("count:" + index);
    const previousSlots = new Map(runSlots);
    for (const id of runSlots.keys()) {
      if (!ids.includes(id)) runSlots.delete(id);
    }
    for (const id of ids) {
      if (!runSlots.has(id)) {
        const occupied = [...runSlots.values()];
        runSlots.set(id, slots.findIndex((_, index) => !occupied.includes(index)));
      }
    }
    currents = [];
    for (const index of runSlots.values()) currents[index] = slots[index];
    const flagged = !data.public && Array.isArray(data.hermes?.cron_failing) ? data.hermes.cron_failing[0]?.name : null;
    reading = { active, failing, flagged: jobName(flagged), runningJob: jobName(running[0]?.job) };

    if (!Number.isFinite(receivedAt) || receivedAt <= sourceTime) return;
    for (const receipt of Array.isArray(flow?.receipts) ? flow.receipts : []) {
      if (typeof receipt?.run_id !== "string" || !Object.hasOwn(outcomes, receipt.outcome)) continue;
      const when = Date.parse(receipt.at);
      const key = receipt.run_id + ":" + receipt.outcome;
      if (!Number.isFinite(when) || when > receivedAt || seen.has(key)) continue;
      seen.add(key);
      if (seen.size > 192) seen.delete(seen.values().next().value);
      const name = jobName(receipt.job);
      if (name && (!lastResult || when > lastResult.when || (when === lastResult.when && receipt.outcome === "delivered"))) {
        lastResult = { when, text: name + " " + outcomes[receipt.outcome] };
      }
      if (receipt.outcome !== "failed" && sourceTime !== -Infinity && when > sourceTime && !stale && !motion.matches && !document.hidden) {
        const slot = previousSlots.get("run:" + receipt.run_id) ?? runSlots.get("run:" + receipt.run_id);
        releases.push({ origin: slots[slot] ?? idle, born: clock });
      }
    }
    releases = releases.slice(-3);
    sourceTime = receivedAt;
  }

  function update(data, { active, failing, stale: delayed, unavailable }) {
    if (Boolean(data.public) !== publicView) {
      publicView = Boolean(data.public);
      sourceTime = -Infinity;
      reading = {};
      lastResult = null;
      currents = [];
      runSlots.clear();
      seen.clear();
      releases = [];
    }
    stale = delayed;
    if (!unavailable && (!stale || sourceTime === -Infinity)) {
      readSnapshot(data, active, failing, Date.parse(data.generated_at));
    }
    const state = stale ? "stale" : unavailable ? "unavailable" : reading.failing > 0 ? "attention"
      : reading.active > 0 ? "working" : reading.active === 0 ? "idle" : "empty";
    faded = state === "stale" || state === "unavailable" || state === "empty";
    if (faded || motion.matches || document.hidden) releases = [];
    canvas.dataset.state = state;
    const counts = [];
    if (reading.active !== undefined) counts.push(reading.active + " active");
    if (reading.failing !== undefined) counts.push(reading.failing + " flagged");
    const detail = state === "attention" && reading.flagged ? reading.flagged + " · elevated failure rate"
      : state === "working" && reading.active === 1 ? reading.runningJob : "";
    if (motion.matches) paint(true);
    const sampledAt = counts.length && Number.isFinite(sourceTime) ? sourceTime : null;
    return { state, headline: headlines[state], counts: counts.join(" · "), detail, lastResult, sampledAt };
  }

  function halo(x, y, radius, color, opacity) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "transparent");
    ctx.globalAlpha = opacity;
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function stamp(particle, dot, color, opacity) {
    const x = particle.x;
    const y = particle.y;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    if (renderer === "ascii") {
      if (particle.bright > .25) ctx.fillText(glyphs[Math.floor(particle.bright * glyphs.length)], x, y);
    } else if (renderer === "dither") {
      const col = Math.round(x / 3);
      const row = Math.round(y / 3);
      if (opacity > (threshold[(row & 3) * 4 + (col & 3)] + .5) / 16) {
        ctx.fillRect(col * 3, row * 3, 2, 2);
      }
    } else if (renderer === "glitch") {
      const band = Math.floor(y / 15);
      const slip = ((band + Math.floor(clock * 5)) % 11 === 0) ? Math.sin(clock * 3 + band) * width * .024 : 0;
      ctx.fillRect(x + slip, y, dot * (slip ? 2.2 : 1.1), dot);
    } else {
      ctx.fillRect(x, y, dot, dot);
    }
  }

  function scatter(size, strength) {
    releases = releases.filter((release) => clock - release.born < 2.65);
    for (const release of releases) {
      const age = clock - release.born;
      const fade = (1 - age / 2.65) * strength;
      const x = release.origin.x * width;
      const y = release.origin.y * height;
      const distance = 4 + age * size * .24;
      ctx.strokeStyle = release.origin.color;
      ctx.globalAlpha = fade * fade * .53;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.ellipse(x, y, distance, distance * .59, -.26, 0, turn);
      ctx.stroke();
      for (const spark of sparks) {
        const radius = distance * spark.speed;
        const dx = Math.cos(spark.angle) * radius;
        const dy = Math.sin(spark.angle) * radius * .72;
        ctx.globalAlpha = fade * (.15 + spark.light * .52);
        ctx.lineWidth = .62 + spark.light;
        ctx.beginPath();
        ctx.moveTo(x + dx * .82, y + dy * .82);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }
    }
  }

  function paint(snap) {
    if (!ctx || !width || !height || document.hidden) return;
    const traced = renderer !== "dither" && renderer !== "ascii";
    const strength = faded ? .48 : 1;
    const size = Math.min(width, height * 1.7);
    ctx.clearRect(0, 0, width, height);
    ctx.font = (width < 470 ? "6px " : "8px ") + mono;
    if (trail) {
      if (snap || !traced) trail.clearRect(0, 0, width, height);
      else {
        trail.globalCompositeOperation = "destination-out";
        trail.globalAlpha = 1;
        trail.fillStyle = renderer === "crt" ? "rgba(0,0,0,.085)" : "rgba(0,0,0,.12)";
        trail.fillRect(0, 0, width, height);
        trail.globalCompositeOperation = "source-over";
      }
    }

    ctx.fillStyle = mint;
    for (const point of dust) {
      ctx.globalAlpha = strength * (.055 + point.bright * .14);
      const dot = point.bright > .97 ? 1.5 : .8;
      ctx.fillRect(point.x * width, point.y * height, dot, dot);
    }
    if (reading.failing > 0) halo(warning.x * width, warning.y * height, size * .18, faded ? mint : amber, .19 * strength);
    currents.forEach((slot) => halo(slot.x * width, slot.y * height, size * .24, slot.color, .095 * strength));
    if (trail && !snap && traced) {
      ctx.globalAlpha = 1;
      ctx.drawImage(trails, 0, 0, width, height);
    }

    for (const p of swarm) {
      const failed = p.fault && reading.failing > 0;
      const current = failed ? warning : currents[p.lane];
      const knot = Math.exp(-21 * (p.u - .06) ** 2);
      const spread = (.32 + .68 * Math.sqrt(1 - p.u * p.u)) * (1 - .68 * knot);
      const swirl = p.angle + clock * .46;
      const bend = p.u * 4.4 + clock * .36 + p.band * 2.1;
      const depth = Math.cos(swirl + bend * .61) * spread;
      const wave = Math.sin(bend) * .55 + Math.sin(bend * 1.54 - p.band * 3) * .19;
      const fuzz = (p.spread - .5) * .24;
      let tx = (.5 + (p.u * .428 + depth * .025 + fuzz * .30) * (1 + depth * .067)) * width;
      let ty = (.47 - p.u * .155 + (wave + Math.sin(swirl) * spread * .63 + fuzz) * .248) * height;
      if (current) {
        const orbit = (.11 + p.spread * .89) * Math.sqrt(Math.max(.06, 1 - p.u * p.u));
        const phase = p.angle + clock * (failed ? .44 : 1.19) + p.u * 3.9;
        const radius = size * (failed ? .117 : .205);
        const x = current.x * width + Math.cos(phase) * radius * orbit * 1.3 + p.u * radius * .46;
        const y = current.y * height + Math.sin(phase) * radius * orbit * .64 - p.u * radius * .28;
        const pull = failed ? .89 : .71 + p.spread * .20;
        tx += (x - tx) * pull;
        ty += (y - ty) * pull;
      }
      if (snap || p.x === null) {
        p.x = tx;
        p.y = ty;
        p.vx = 0;
        p.vy = 0;
      } else {
        p.vx = (p.vx + (tx - p.x) * .092) * .81;
        p.vy = (p.vy + (ty - p.y) * .092) * .81;
        p.x += p.vx;
        p.y += p.vy;
      }
      const front = .26 + (depth + 1) * .36;
      const glow = strength * Math.min(.97, front * (.26 + p.bright * .68) + knot * .12 + (failed ? .16 : 0));
      const dot = .7 + front * p.bright * 1.49 + (failed ? .23 : 0);
      const ambient = knot > .62 && p.bright > .86 ? light : p.band > .8 ? accent : mint;
      const color = failed && faded ? mint : current?.color ?? ambient;
      if (traced && p.bright > .29) {
        const target = snap ? ctx : trail ?? ctx;
        target.globalAlpha = glow * (snap ? .24 : .31);
        target.strokeStyle = color;
        target.lineWidth = dot * .52;
        target.beginPath();
        target.moveTo(p.x - (snap ? Math.cos(bend) * 6 : p.vx * 5.6),
          p.y - (snap ? Math.sin(swirl) * 4 : p.vy * 5.6));
        target.lineTo(p.x, p.y);
        target.stroke();
      }
      stamp(p, dot, color, glow);
    }
    if (!motion.matches) scatter(size, strength);
    ctx.globalAlpha = 1;
  }

  function resize() {
    if (!ctx) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (trail) {
      trails.width = canvas.width;
      trails.height = canvas.height;
      trail.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    paint(true);
  }

  function step(now) {
    frame = 0;
    if (motion.matches || document.hidden) return;
    if (!previousFrame || now - previousFrame >= (stale ? 110 : 46)) {
      if (previousFrame) clock += Math.min(.14, (now - previousFrame) / 1000) * (stale ? .24 : 1);
      previousFrame = now;
      paint(false);
    }
    frame = requestAnimationFrame(step);
  }

  function syncMotion() {
    if (!ctx) return;
    if (document.hidden || motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = 0;
      releases = [];
      paint(true);
    } else if (!frame) {
      frame = requestAnimationFrame(step);
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === preferenceKey || event.key === null) usePreference();
  });
  document.addEventListener("visibilitychange", syncMotion);
  motion.addEventListener("change", syncMotion);
  new ResizeObserver(resize).observe(canvas);
  usePreference();
  resize();
  syncMotion();
  return { update };
}
