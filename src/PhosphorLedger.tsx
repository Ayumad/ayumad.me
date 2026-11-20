import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { JournalPost } from "./journalContent";
import "./phosphorLedger.css";

const dates = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const dither = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

function PhosphorField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof CanvasRenderingContext2D === "undefined") return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let phase = 0;
    let frame = 0;
    let previous = 0;
    let visible = typeof IntersectionObserver === "undefined";
    let ink = getComputedStyle(canvas).getPropertyValue("--cyan").trim();

    const paint = () => {
      if (!width || !height || document.hidden || !visible) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = ink;
      const cell = width < 450 ? 3.6 : 4.5;
      for (let row = 0; row * cell < height; row += 1) {
        const y = row * cell / height;
        for (let column = 0; column * cell < width; column += 1) {
          const x = column * cell / width;
          const spine = .88 - x * .22 + Math.sin(x * 6.6 - phase * .31) * .12;
          const distance = (y - spine) * 7.8;
          const wave = Math.exp(-distance * distance * .36) * Math.sin(Math.PI * (.14 + .8 * x));
          const ridges = .22 + .78 * (.5 + .5 * Math.sin(x * 26 + y * 27 - phase * .67)) ** 2.6;
          const echo = Math.exp(-((distance + 1.55) ** 2) * 1.25) * (.12 + .12 * Math.sin(x * 11 + phase * .22) ** 2);
          const threshold = (dither[row % 8][column % 8] + .5) / 64;
          const signal = wave * ridges + echo - threshold;
          if (signal <= 0) continue;
          context.globalAlpha = signal > .44 ? .85 : signal > .20 ? .49 : .21;
          const side = cell * (signal > .44 ? .57 : .40);
          context.fillRect(column * cell, row * cell, side, side);
        }
      }
      context.globalAlpha = 1;
    };

    function step(time: number) {
      frame = 0;
      if (!visible || document.hidden || reduced.matches) return;
      if (!previous || time - previous >= 46) {
        if (previous) phase += Math.min(.085, (time - previous) / 1000);
        previous = time;
        paint();
      }
      frame = window.requestAnimationFrame(step);
    }

    function synchronize() {
      if (visible && !document.hidden && !reduced.matches) {
        if (!frame) frame = window.requestAnimationFrame(step);
      } else {
        window.cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
      }
      if (reduced.matches) paint();
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(1.75, window.devicePixelRatio || 1);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      paint();
    };

    const theme = new MutationObserver(() => {
      ink = getComputedStyle(canvas).getPropertyValue("--cyan").trim();
      paint();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const dimensions = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    dimensions?.observe(canvas);
    const viewport = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    });
    viewport?.observe(canvas);
    resize();
    synchronize();
    reduced.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("resize", resize);
    return () => {
      theme.disconnect();
      dimensions?.disconnect();
      viewport?.disconnect();
      window.cancelAnimationFrame(frame);
      reduced.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="phosphor-field" aria-hidden="true" />;
}

export default function PhosphorLedger({ posts }: { posts: readonly JournalPost[] }) {
  const [latest, ...recent] = posts.slice(0, 4);
  if (!latest) return null;

  return (
    <section className="phosphor-ledger section-shell" aria-labelledby="phosphor-title">
      <header className="phosphor-header">
        <h2 id="phosphor-title">Phosphor Ledger</h2>
        <Link className="text-link" to="/journal">All journal entries <span aria-hidden="true">↗</span></Link>
      </header>
      <div className="phosphor-sheet">
        <Link className="phosphor-feature" to={"/journal/" + latest.slug}>
          <PhosphorField />
          <div className="phosphor-copy">
            <p className="label">Latest entry</p>
            <h3>{latest.title}</h3>
            <time dateTime={latest.date}>{dates.format(new Date(latest.date))}</time>
          </div>
          <span className="phosphor-arrow" aria-hidden="true">↗</span>
        </Link>
        {recent.length > 0 && (
          <div className="phosphor-history">
            <h3 className="label">Recent entries</h3>
            <ol>
              {recent.map((post) => (
                <li key={post.slug}>
                  <Link to={"/journal/" + post.slug}>
                    <span className="phosphor-stamp" aria-hidden="true" />
                    <span className="phosphor-entry">
                      <strong>{post.title}</strong>
                      <time dateTime={post.date}>{dates.format(new Date(post.date))}</time>
                    </span>
                    <span className="phosphor-arrow" aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
