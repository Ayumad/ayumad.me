function createHermesFlow() {
  const turn = Math.PI * 2;
  const exit = 1.08;
  const lanes = [0, .5, .25, .75, .125, .625].map((fraction) => (fraction + .06) * turn);
  const streamSlots = new Map();
  const receiptLabels = { succeeded: "completed", failed: "failed", delivered: "delivered" };
  const headlines = {
    idle: "Idle",
    working: "Working",
    attention: "Needs attention",
    stale: "Feed delayed",
    unavailable: "Telemetry unavailable",
    empty: "Awaiting telemetry",
  };
  const asList = (value) => Array.isArray(value) ? value : [];
  const nameOf = (value) => typeof value === "string" ? value.trim().slice(0, 96) : "";
  let seed = 120157;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const particleCount = 2980;
  const particles = Array.from({ length: particleCount }, (_, index) => ({
    orbit: (index + random()) / particleCount * turn,
    twist: (index % 9) / 9 * turn + (random() - .5) * .54,
    scatter: random() ** .72,
    light: random(),
    x: null,
    y: null,
  }));
  const sparks = Array.from({ length: 104 }, () => ({
    direction: exit + (random() - .5) * 2.3,
    speed: .28 + random() * .92,
    light: .25 + random() * .75,
  }));
  let reading = {};
  let scope;
  let sourceTime = -Infinity;
  let result = null;
  const seenReceipts = new Set();
  let releases = [];
  let tone = "empty";
  let clock = 0;
  let lastFrame;
  let currents = [];

  function matchStreams(running, active) {
    const limit = Math.min(lanes.length, Math.floor(active ?? running.length));
    const ids = [...new Set(running.map((run) => "run:" + run.run_id))].slice(0, limit);
    for (let index = ids.length; index < limit; index += 1) ids.push("count:" + index);
    for (const id of streamSlots.keys()) {
      if (!ids.includes(id)) streamSlots.delete(id);
    }
    for (const id of ids) {
      if (!streamSlots.has(id)) {
        const occupied = [...streamSlots.values()];
        streamSlots.set(id, lanes.find((phase) => !occupied.includes(phase)));
      }
    }
    currents = [...streamSlots.values()];
  }

  function accept(data, active, failing, animate) {
    const at = Date.parse(data.generated_at);
    if (sourceTime !== -Infinity && (!Number.isFinite(at) || at < sourceTime)) return;
    const flow = data.public ? null : data.hermes?.flow;
    const currentRuns = asList(flow?.runs).filter((run) => typeof run?.run_id === "string" && nameOf(run.job));
    const running = currentRuns.filter((run) => run.phase === "running");
    const pending = currentRuns.find((run) => run.phase === "delivery_pending");
    const reportedFailures = data.public ? [] : asList(data.hermes?.cron_failing);
    reading = { active, failing, running, pending, failure: nameOf(reportedFailures[0]?.name) };

    if (!Number.isFinite(at) || at <= sourceTime) return;
    const receipts = new Map();
    for (const item of asList(flow?.receipts)) {
      if (!Object.hasOwn(receiptLabels, item?.outcome) || typeof item.run_id !== "string" || !nameOf(item.job)) continue;
      const time = Date.parse(item.at);
      if (!Number.isFinite(time) || time > at) continue;
      const key = item.run_id + ":" + item.outcome;
      if (!receipts.has(key)) receipts.set(key, { ...item, time });
    }
    const ordered = [...receipts.entries()].sort(([, a], [, b]) => a.time - b.time
      || Number(a.outcome === "delivered") - Number(b.outcome === "delivered"));
    for (const [key, receipt] of ordered) {
      if (seenReceipts.has(key)) continue;
      seenReceipts.add(key);
      if (seenReceipts.size > 192) seenReceipts.delete(seenReceipts.values().next().value);
      if (!result || receipt.time >= result.time) result = receipt;
      if (animate && sourceTime !== -Infinity && receipt.time > sourceTime && receipt.outcome !== "failed") {
        releases.push({ time: clock, delivered: receipt.outcome === "delivered" });
      }
    }
    sourceTime = at;
    releases = releases.slice(-3);
  }

  function update(data, { active, failing, stale, unavailable, animate }) {
    const nextScope = data.public ? "public" : "private";
    if (scope !== nextScope) {
      scope = nextScope;
      reading = {};
      sourceTime = -Infinity;
      result = null;
      seenReceipts.clear();
      streamSlots.clear();
      releases = [];
    }
    if ((!stale && !unavailable) || (stale && sourceTime === -Infinity)) {
      accept(data, active, failing, animate && !stale);
    }
    const { running = [], pending, failure } = reading;
    tone = stale ? "stale" : unavailable ? "unavailable" : reading.failing > 0 ? "attention"
      : reading.active > 0 ? "working" : reading.active === 0 && reading.failing === 0 ? "idle" : "empty";
    const retry = failure && running.some((run) => run.retry === true && nameOf(run.job) === failure);
    let detail = tone === "stale" ? "Showing last confirmed values" : "";
    if (tone === "attention" && failure) detail = failure + (retry ? " retry in progress" : " · elevated failure rate");
    if (tone !== "stale" && tone !== "unavailable" && !detail) {
      if (pending) detail = nameOf(pending.job) + " · delivery pending";
      else if (running.length) detail = [...new Set(running.map((run) => nameOf(run.job)))].slice(0, 2).join(" · ");
    }

    matchStreams(running, reading.active);
    if (!animate || stale || unavailable) releases = [];
    return {
      tone, headline: headlines[tone], detail, active: reading.active, failing: reading.failing,
      result: result ? nameOf(result.job) + " " + receiptLabels[result.outcome] : null,
    };
  }

  function draw(ctx, { width, height, origin, colors, time, animate }) {
    const step = lastFrame === undefined ? 0 : Math.max(0, Math.min(.15, (time - lastFrame) / 1000));
    lastFrame = time;
    if (animate) clock += step * (tone === "stale" ? .22 : 1);
    const dim = tone === "stale" || tone === "unavailable" || tone === "empty";
    const scale = Math.min(width * .258, height * .5);
    const size = width < 450 ? .79 : 1;
    const rotation = -.39;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const tilt = .56 + Math.sin(clock * .20) * .05;
    const jammed = tone === "attention";
    const queued = !dim && !!reading.pending;
    const heated = clock * .74;
    const heads = dim ? [] : currents.map((phase) => phase + heated);

    function point(orbit, twist, radius) {
      const shell = 1 + Math.cos(twist) * radius;
      const depth = Math.sin(twist) * radius;
      const horizontal = Math.cos(orbit) * shell;
      const vertical = Math.sin(orbit) * shell * tilt + depth * .83;
      return {
        x: origin.x + (horizontal * cosine - vertical * sine) * scale,
        y: origin.y + (horizontal * sine + vertical * cosine) * scale,
        depth: (Math.sin(orbit) + 1) * .34 + (Math.sin(twist) + 1) * .16,
      };
    }

    for (const p of particles) {
      let angle = p.orbit + clock * .19;
      const gap = Math.cos(angle - exit);
      const fault = jammed && gap > .91;
      const caught = queued && !fault && gap > .94;
      if (fault || caught) angle = exit + Math.sin(angle - exit) * (fault ? .62 : .83);
      const twist = p.twist + angle * 3.1 - clock * .24;
      const shell = (.07 + p.scatter * .22) * (fault ? 1.10 : 1);
      const { x, y, depth } = point(angle, twist, shell);
      const current = heads.some((head) => Math.cos(angle - head) > .953);
      const bright = current || fault || caught;
      const color = fault ? colors.warn : bright && p.light > .77 ? colors.text : colors.cyan;
      const alpha = (dim ? .39 : 1) * Math.min(.96, .11 + depth * .3 + p.light * .34 + (bright ? .36 : 0));
      const dot = size * (.72 + p.light * .98 + (bright ? .34 : 0));

      if (animate && p.light > .65 && p.x !== null && step > 0) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (Math.abs(dx) + Math.abs(dy) < 14) {
          ctx.beginPath();
          ctx.moveTo(x - dx * (bright ? 4.8 : 2.4), y - dy * (bright ? 4.8 : 2.4));
          ctx.lineTo(x, y);
          ctx.lineWidth = dot * .6;
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha * .46;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, dot, dot);
      p.x = x;
      p.y = y;
    }

    if (animate) {
      releases = releases.filter((release) => clock - release.time < 2.3);
      const gate = point(exit, 0, .07);
      for (const [index, release] of releases.entries()) {
        const age = clock - release.time;
        const reach = scale * age * (release.delivered ? .47 : .27);
        for (const spark of sparks) {
          const angle = spark.direction + index * .18 - .27;
          const dx = Math.cos(angle) * spark.speed * reach;
          const dy = Math.sin(angle) * spark.speed * reach * .75;
          ctx.globalAlpha = (1 - age / 2.3) * spark.light;
          ctx.fillStyle = colors.cyan;
          ctx.fillRect(gate.x + dx, gate.y + dy, 1 + spark.light, 1 + spark.light);
        }
      }
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  return { update, draw };
}
