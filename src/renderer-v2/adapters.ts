/**
 * adapters.ts — display adapters: translate the canonical Frame into pixels.
 * Each adapter is a thin "how do I draw this buffer" module.
 * ASCII first (the default); canvas raster shared by dither/particles/glitch/crt.
 */

import type { Frame } from "./signal";

const RAMP = " .:-=+*#%@"; // light→dark; index by intensity
const GLYPHS = [" ", ".", ":", "+", "*", "#", "@"]; // structural subset

export interface Adapter {
  draw: (frame: Frame) => void;
  resize?: () => void;
  destroy?: () => void;
}

/** ASCII adapter — writes into an existing <pre>, no string concat per cell. */
export function asciiAdapter(pre: HTMLPreElement, cols: number, rows: number): Adapter {
  const buf = new Uint8Array(cols * rows); // glyph indices
  const lineBuf: string[] = new Array(rows);
  return {
    draw(frame) {
      buf.fill(0);
      const w = pre.clientWidth || 1;
      const h = pre.clientHeight || 1;
      for (let i = 0; i < frame.count; i += 1) {
        const x = frame.points[i * 3];
        const y = frame.points[i * 3 + 1];
        // Map [-1..1] → grid
        const col = Math.floor(((x + 1) / 2) * cols);
        const row = Math.floor(((1 - y) / 2) * rows);
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
        const idx = row * cols + col;
        const level = Math.min(
          GLYPHS.length - 1,
          Math.floor(frame.intensity[i] * GLYPHS.length),
        );
        if (level > buf[idx]) buf[idx] = level; // max-blend (phosphor add)
      }
      for (let r = 0; r < rows; r += 1) {
        let line = "";
        for (let c = 0; c < cols; c += 1) {
          line += GLYPHS[buf[r * cols + c]];
        }
        lineBuf[r] = line;
      }
      pre.textContent = lineBuf.join("\n");
    },
  };
}

/**
 * Canvas adapter base — shared by dither/particles/glitch/crt.
 * Draws points as phosphor dots with additive glow; mode styling via options.
 */
export function canvasAdapter(
  canvas: HTMLCanvasElement,
  opts: { mode: "dither" | "particles" | "glitch" | "crt"; trails?: boolean },
): Adapter {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  let w = 0, h = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const bayer4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  return {
    resize,
    draw(frame) {
      if (opts.trails) {
        // Fade existing pixels without painting background (canvas stays transparent)
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      // Phosphor color comes from CSS (color: var(--cyan) on the canvas),
      // so light/dark theming flows through automatically.
      ctx.fillStyle = getComputedStyle(canvas).color || "#48efd0";

      const cx = w / 2, cy = h / 2;
      const spread = Math.min(w, h) * 0.42;

      for (let i = 0; i < frame.count; i += 1) {
        const px = cx + frame.points[i * 3] * spread;
        const py = cy - frame.points[i * 3 + 1] * spread;
        const inten = frame.intensity[i];

        if (opts.mode === "dither") {
          const bx = Math.floor(px) & 3, by = Math.floor(py) & 3;
          const threshold = (bayer4[by][bx] + 0.5) / 16;
          if (inten > threshold) {
            ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
          }
          continue;
        }

        // particles / glitch / crt: glowing dots
        const size = opts.mode === "crt" ? 2.5 : 2;
        ctx.globalAlpha = 0.35 + inten * 0.65;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);

        if (opts.mode === "glitch") {
          // occasional row displacement
          if ((i * 31 + Math.floor(px)) % 97 < 3) {
            const shift = ((i % 5) - 2) * 6;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(px - size / 2 + shift, py - size / 2, size, size);
          }
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
