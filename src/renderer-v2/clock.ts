/**
 * clock.ts — the ONE rAF loop for the whole scope.
 * Fixed-timestep sim; pauses off-screen, on hidden tab, and under
 * prefers-reduced-motion (renders a single static frame instead).
 */

import { sample, createFrame, type Frame, type SignalSettings } from "./signal";

export interface ClockHandle {
  stop: () => void;
  /** Force one frame even when paused (reduced-motion static render). */
  renderOnce: () => void;
}

export function startClock(opts: {
  canvas: HTMLElement;
  settings: () => SignalSettings;
  units: () => number;
  draw: (frame: Frame) => void;
}): ClockHandle {
  const frame = createFrame(opts.units());
  let raf = 0;
  let running = true;
  let visible = true;
  let elapsed = 0;
  let last = performance.now();
  const SIM_STEP = 80; // ms — matches original renderFrame cadence
  let acc = 0;

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  const tick = (now: number) => {
    if (!running) return;
    const dt = Math.min(now - last, 250);
    last = now;

    const paused = !visible || document.hidden || media.matches;
    if (!paused) {
      acc += dt;
      while (acc >= SIM_STEP) {
        elapsed += SIM_STEP;
        acc -= SIM_STEP;
      }
    }

    sample(opts.settings(), elapsed, opts.units(), frame);
    opts.draw(frame);

    raf = requestAnimationFrame(tick);
  };

  // Off-screen pause — IntersectionObserver on the host element
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.01 });
  io.observe(opts.canvas);

  const onVis = () => { /* read in tick */ };
  document.addEventListener("visibilitychange", onVis);
  raf = requestAnimationFrame(tick);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    },
    renderOnce() {
      sample(opts.settings(), elapsed, opts.units(), frame);
      opts.draw(frame);
    },
  };
}
