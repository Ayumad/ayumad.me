import { sample, createFrame, type Frame, type SignalSettings } from "./signal";

export interface ClockHandle {
  stop: () => void;
  renderOnce: () => void;
  setPlaying: (playing: boolean) => void;
}

export function startClock(opts: {
  canvas: HTMLElement;
  settings: () => SignalSettings;
  units: () => number;
  energy?: () => number;
  draw: (frame: Frame) => void;
}) {
  const frame = createFrame(opts.units());
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const step = 80;
  let raf = 0;
  let playing = true;
  let visible = false;
  let elapsed = 0;
  let last = 0;
  let accumulator = 0;

  const paint = () => {
    sample(opts.settings(), elapsed, opts.units(), frame, opts.energy?.() ?? 0);
    opts.draw(frame);
  };

  const tick = (now: number) => {
    accumulator += Math.min(now - last, 250);
    last = now;
    if (accumulator >= step) {
      const steps = Math.floor(accumulator / step);
      elapsed += steps * step;
      accumulator %= step;
      paint();
    }
    raf = requestAnimationFrame(tick);
  };

  function sync() {
    const ready = playing && visible && !document.hidden && !media.matches;
    if (ready && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!ready && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.01 });
  observer.observe(opts.canvas);
  document.addEventListener("visibilitychange", sync);
  media.addEventListener("change", sync);
  paint();

  return {
    stop() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
    },
    renderOnce: paint,
    setPlaying(next: boolean) {
      playing = next;
      sync();
    },
  } satisfies ClockHandle;
}
