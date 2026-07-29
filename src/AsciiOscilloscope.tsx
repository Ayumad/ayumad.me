import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Interval {
  name: string;
  numerator: number;
  denominator: number;
}

const score: Interval[] = [
  { name: "FIFTH", numerator: 3, denominator: 2 },
  { name: "THIRD", numerator: 5, denominator: 4 },
  { name: "SEVENTH", numerator: 7, denominator: 5 },
  { name: "FOURTH", numerator: 4, denominator: 3 },
];

const bayer4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

const toneRamp = " .,:;+*#@";

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function smoothstep(value: number) {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
}

function structuralGlyph(angle: number, crossing: boolean) {
  if (crossing) return "+";

  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  if (normalized < Math.PI * 0.125 || normalized >= Math.PI * 0.875) return "-";
  if (normalized < Math.PI * 0.375) return "\\";
  if (normalized < Math.PI * 0.625) return "|";
  return "/";
}

export default function AsciiOscilloscope() {
  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const intervalRef = useRef<HTMLSpanElement>(null);
  const channelARef = useRef<HTMLSpanElement>(null);
  const channelBRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const output = outputRef.current;
    if (!container || !output) return;

    let columns = 64;
    let rows = 34;
    let intensity = new Float32Array(columns * rows);
    let direction = new Float32Array(columns * rows);
    let animationFrame = 0;
    let previousFrame = 0;
    let visible = !document.hidden;

    const configureGrid = () => {
      const width = container.clientWidth || 620;
      columns = width < 430 ? 42 : width < 610 ? 52 : 64;
      rows = width < 430 ? 28 : width < 610 ? 31 : 34;
      intensity = new Float32Array(columns * rows);
      direction = new Float32Array(columns * rows);
      output.style.setProperty("--scope-columns", columns.toString());
    };

    const plot = (x: number, y: number, angle: number, strength: number) => {
      const column = Math.round((x * 0.43 + 0.5) * (columns - 1));
      const row = Math.round((0.5 - y * 0.43) * (rows - 1));
      if (column < 1 || column >= columns - 1 || row < 1 || row >= rows - 1) return;

      const center = row * columns + column;
      intensity[center] = Math.min(1.6, intensity[center] + strength);
      direction[center] = angle;

      const neighbors = [
        center - 1,
        center + 1,
        center - columns,
        center + columns,
      ];

      for (const neighbor of neighbors) {
        intensity[neighbor] = Math.min(0.7, intensity[neighbor] + strength * 0.23);
        direction[neighbor] = angle;
      }
    };

    const render = (time: number) => {
      const scorePosition = time / 5600;
      const measure = Math.floor(scorePosition);
      const localPosition = scorePosition - measure;
      const current = score[measure % score.length];
      const next = score[(measure + 1) % score.length];
      const transition = smoothstep((localPosition - 0.72) / 0.28);
      const xOrder = mix(current.numerator, next.numerator, transition);
      const yOrder = mix(current.denominator, next.denominator, transition);
      const phase = time * 0.00024;
      const rotation = Math.sin(time * 0.00011) * 0.12;
      const pulse = 0.9 + Math.sin(time * 0.0021) * 0.035;
      const cosRotation = Math.cos(rotation);
      const sinRotation = Math.sin(rotation);
      const samples = 1700;

      for (let index = 0; index < intensity.length; index += 1) {
        intensity[index] *= 0.76;
      }

      let previousX = 0;
      let previousY = 0;

      for (let sample = 0; sample <= samples; sample += 1) {
        const theta = (sample / samples) * Math.PI * 2;
        const harmonic = Math.sin((xOrder + yOrder) * theta - phase * 0.65);
        const counterpoint = Math.sin((yOrder * 2 - xOrder) * theta + phase);
        const rawX = (Math.sin(xOrder * theta + phase * 0.25) * 0.82 + harmonic * 0.12) * pulse;
        const rawY =
          (Math.sin(yOrder * theta + Math.PI / 2) * 0.82 + counterpoint * 0.12) * pulse;
        const x = rawX * cosRotation - rawY * sinRotation;
        const y = rawX * sinRotation + rawY * cosRotation;

        if (sample > 0) {
          const deltaX = x - previousX;
          const deltaY = y - previousY;
          const scaledDistance = Math.hypot(
            deltaX * columns * 0.43,
            deltaY * rows * 0.43,
          );
          const steps = Math.max(1, Math.ceil(scaledDistance));
          const angle = Math.atan2(-deltaY * rows, deltaX * columns);

          for (let step = 1; step <= steps; step += 1) {
            const amount = step / steps;
            plot(
              mix(previousX, x, amount),
              mix(previousY, y, amount),
              angle,
              0.58,
            );
          }
        }

        previousX = x;
        previousY = y;
      }

      const lines: string[] = [];
      for (let row = 0; row < rows; row += 1) {
        let line = "";
        for (let column = 0; column < columns; column += 1) {
          const cell = row * columns + column;
          const value = intensity[cell];

          if (value > 0.7) {
            line += structuralGlyph(direction[cell], value > 1.15);
            continue;
          }

          const threshold = (bayer4[(row % 4) * 4 + (column % 4)] / 15 - 0.5) * 0.16;
          const level = Math.max(0, Math.min(0.99, value + threshold));
          const rampIndex = Math.floor(level * toneRamp.length);
          line += toneRamp[rampIndex] ?? " ";
        }
        lines.push(line);
      }

      output.textContent = lines.join("\n");

      if (intervalRef.current) {
        intervalRef.current.textContent =
          transition > 0.5
            ? `${next.numerator}:${next.denominator} ${next.name}`
            : `${current.numerator}:${current.denominator} ${current.name}`;
      }
      if (channelARef.current) {
        channelARef.current.textContent = `CH-A ${Math.round(xOrder * 55)} Hz`;
      }
      if (channelBRef.current) {
        channelBRef.current.textContent = `CH-B ${Math.round(yOrder * 55)} Hz`;
      }
    };

    const draw = (time: number) => {
      if (time - previousFrame >= 50) {
        previousFrame = time;
        render(time);
      }
      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const resize = () => {
      configureGrid();
      render(reducedMotion ? 4400 : performance.now());
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    configureGrid();
    render(reducedMotion ? 4400 : performance.now());

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  return (
    <figure
      className="hero-art oscilloscope"
      aria-labelledby="oscilloscope-description"
    >
      <figcaption id="oscilloscope-description" className="sr-only">
        A real-time ASCII XY oscilloscope tracing musical frequency ratios.
      </figcaption>

      <div className="scope-header" aria-hidden="true">
        <span>XY-SCORE / 120 BPM</span>
        <span ref={intervalRef}>3:2 FIFTH</span>
      </div>

      <div className="scope-stage" ref={containerRef} aria-hidden="true">
        <div className="scope-axis scope-axis-x" />
        <div className="scope-axis scope-axis-y" />
        <pre className="oscilloscope-grid" ref={outputRef} />
        <span className="scope-origin">0</span>
      </div>

      <div className="scope-footer" aria-hidden="true">
        <span ref={channelARef}>CH-A 165 Hz</span>
        <span>PHASE +90</span>
        <span ref={channelBRef}>CH-B 110 Hz</span>
      </div>
    </figure>
  );
}
