"use strict";

function createActiveMachine(panel, { wall, getJSON, setText, ageText, onFeed }) {
  const HISTORY_MS = 15 * 60000;
  const FRESH_MS = 95000;
  const RECENT_INPUT_MS = 5 * 60000;
  const HANDOFF_MS = 30000;
  const GAP_MS = 75000;
  const name = panel.querySelector("#machine-name");
  const status = panel.querySelector("#machine-status");
  const metrics = panel.querySelector(".machine-metrics");
  const range = panel.querySelector(".machine-range");
  const axis = panel.querySelector(".machine-axis");
  const plots = [...panel.querySelectorAll("[data-metric]")].map((row) => ({
    key: row.dataset.metric,
    value: row.querySelector("b"),
    trace: row.querySelector(".machine-trace"),
  }));
  let snapshot = null;
  let feed = null;
  let enabled = wall;
  let pending = false;
  let failed = false;
  let selected = null;
  let handoff = null;

  function records(now) {
    const list = (feed ?? snapshot)?.machines;
    if (!Array.isArray(list)) return [];
    return list.filter((machine) => typeof machine?.name === "string" && Array.isArray(machine.samples))
      .map((machine) => {
        const samples = machine.samples.filter((sample) => Number.isFinite(sample?.sampled_at)
          && sample.sampled_at <= now + 10000);
        return { id: machine.id, name: machine.name, samples, latest: samples.at(-1) };
      })
      .filter((machine) => machine.latest);
  }

  function choose(devices, now) {
    const input = (machine) => machine.latest.last_input_at ?? -Infinity;
    const inUse = devices.filter(({ latest }) => now - latest.sampled_at <= FRESH_MS
      && latest.unlocked === true && Number.isFinite(latest.last_input_at)
      && now - latest.last_input_at <= RECENT_INPUT_MS);
    const candidate = inUse.sort((a, b) => input(b) - input(a))[0];
    const current = devices.find((machine) => machine.id === selected);
    if (candidate && current && candidate.id !== current.id) {
      if (handoff?.id !== candidate.id) handoff = { id: candidate.id, since: now };
      if (now - handoff.since < HANDOFF_MS) return current;
    }
    handoff = null;
    const lastUsed = devices.sort((a, b) => input(b) - input(a) || b.latest.sampled_at - a.latest.sampled_at)[0];
    return candidate ?? lastUsed;
  }

  function graph(samples, key, end) {
    let path = "";
    let previous = null;
    for (const sample of samples) {
      const time = sample.sampled_at;
      if (time < end - HISTORY_MS || time > end) continue;
      const value = sample[key];
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        previous = null;
        continue;
      }
      const point = `${(266 - (end - time) / HISTORY_MS * 264).toFixed(1)} ${(34 - value * .32).toFixed(1)}`;
      path += previous !== null && time - previous <= GAP_MS ? `L${point}` : `M${point}l.01 0`;
      previous = time;
    }
    return path;
  }

  function render() {
    panel.hidden = !enabled;
    if (!enabled) {
      setText(name, "");
      setText(status, "");
      for (const plot of plots) {
        setText(plot.value, "—");
        plot.trace.removeAttribute("d");
      }
      return;
    }
    const now = Date.now();
    const machine = choose(records(now), now);
    selected = machine?.id ?? null;
    metrics.hidden = axis.hidden = range.hidden = !machine;
    if (!machine) {
      panel.dataset.state = failed ? "error" : "empty";
      setText(name, "");
      setText(status, failed ? "Feed unavailable" : "Waiting for readings");
      return;
    }
    const { latest } = machine;
    const age = Math.max(0, now - latest.sampled_at);
    const stale = age > FRESH_MS;
    const inUse = latest.unlocked === true && Number.isFinite(latest.last_input_at)
      && now - latest.last_input_at <= RECENT_INPUT_MS;
    panel.dataset.state = stale ? "stale" : "ready";
    setText(name, machine.name);
    setText(status, stale ? `Sampled ${ageText(Math.floor(age / 1000))}`
      : inUse ? "In use" : latest.last_input_at ? "Last used" : "Idle");
    for (const plot of plots) {
      const value = latest[plot.key];
      setText(plot.value, Number.isFinite(value) ? `${Math.round(value)}%` : "—");
      plot.trace.setAttribute("d", graph(machine.samples, plot.key, latest.sampled_at));
    }
  }

  async function poll() {
    if (!wall || !enabled || document.hidden || pending) return;
    pending = true;
    try {
      const data = await getJSON("./machine-resources.json");
      if (!Array.isArray(data?.machines)) throw new Error("invalid workstation feed");
      if (enabled) feed = data;
      failed = false;
    } catch {
      failed = true;
    } finally {
      pending = false;
      render();
      onFeed();
    }
  }

  return {
    poll,
    desktopSpotify() {
      return enabled ? (feed ?? snapshot)?.desktop_spotify : null;
    },
    update(data) {
      enabled = wall ? data?.public !== true : Boolean(data && !data.public && data.machine_resources);
      snapshot = enabled ? data?.machine_resources : null;
      if (!enabled) {
        feed = null;
        selected = handoff = null;
      }
      render();
    },
  };
}
