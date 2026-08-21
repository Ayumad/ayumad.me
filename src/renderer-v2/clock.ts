/**
 * clock.ts — the ONE rAF loop for the whole scope.
 * Fixed-timestep sim; pauses off-screen, on hidden tab, and under
 * prefers-reduced-motion (renders a single static frame instead).
 * Always paints one frame on start so a background-tab load is never blank.
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
  /** Music/ambient liveliness [0..1]; speeds motion and breathes phase. */
  energy?: () => number;
  draw: (frame: Frame) => void;
}): ClockHandle {
  let units = opts.units();
  const frame = createFrame(units);
  let raf = 0;
  let running = true;
  let visible = true;
  let elapsed = 0;
  let last = performance.now();
  const SIM_STEP = 80; // ms — matches original renderFrame cadence
  let acc = 0;

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  const paint = () => {
    sample(opts.settings(), elapsed, units, frame, opts.energy?.() ?? 0);
    opts.draw(frame);
  };

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
      const nextUnits = opts.units();
      if (nextUnits !== units) {
        units = nextUnits; // sample() grows the frame buffer as needed
      }
    }

    paint();

    raf = requestAnimationFrame(tick);
  };

  // Off-screen pause — IntersectionObserver on the host element
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.01 });
  io.observe(opts.canvas);

  const onVisibility = () => {
    // Re-paint once on return so the stage isn't stale.
    if (!document.hidden && running && media.matches) paint();
  };
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(tick);
  // First paint NOW — rAF may not fire for ages in a hidden tab,
  // which used to leave /renderer blank until foregrounding.
  paint();

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    },
    renderOnce() {
      paint();
    },
  };
}
