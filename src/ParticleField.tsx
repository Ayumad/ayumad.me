import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { useRenderMode } from "./renderMode";

const glyphSets = {
  ascii: [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"],
  dither: [" ", " ", "░", "▒", "▓", "█"],
  glitch: [" ", ".", "/", "\\", "<", ">", "#"],
  particles: [" ", " ", "·", "•", "●", "✦"],
  crt: [" ", " ", ".", ":", "+", "*"],
} as const;

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const renderMode = useRenderMode();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let visible = !document.hidden;
    let previousFrame = 0;
    const cell =
      renderMode === "particles"
        ? 16
        : renderMode === "dither"
          ? 19
          : renderMode === "glitch"
            ? 18
          : renderMode === "crt"
            ? 27
            : 24;
    const glyphs = glyphSets[renderMode];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (time - previousFrame < 120) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }
      previousFrame = time;
      context.clearRect(0, 0, width, height);

      const theme = document.documentElement.dataset.theme;
      const baseColor =
        theme === "light"
          ? renderMode === "glitch"
            ? "rgba(49, 75, 71, 0.2)"
            : "rgba(0, 111, 104, 0.18)"
          : renderMode === "glitch"
            ? "rgba(229, 244, 242, 0.16)"
            : "rgba(72, 239, 208, 0.16)";
      const splitCyan =
        theme === "light"
          ? "rgba(0, 111, 104, 0.26)"
          : "rgba(72, 239, 208, 0.3)";
      const splitViolet =
        theme === "light"
          ? "rgba(80, 86, 141, 0.2)"
          : "rgba(119, 127, 196, 0.28)";
      context.fillStyle = baseColor;
      context.font = `10px "SFMono-Regular", "Cascadia Code", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor =
        theme === "light"
          ? "rgba(0, 111, 104, 0.22)"
          : "rgba(72, 239, 208, 0.34)";
      context.shadowBlur =
        renderMode === "crt" ? 7 : renderMode === "dither" ? 1 : 2.5;

      const phase = time * 0.00008;
      const columns = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);

      for (let row = 0; row <= rows; row += 1) {
        for (let column = 0; column <= columns; column += 1) {
          const x = column * cell;
          const y = row * cell;
          const leftField = Math.max(
            0,
            1 - Math.hypot(x - width * 0.05, y - height * 0.78) / (width * 0.48),
          );
          const rightField = Math.max(
            0,
            1 - Math.hypot(x - width * 0.93, y - height * 0.12) / (width * 0.42),
          );
          const wave = (Math.sin(column * 0.48 + row * 0.3 + phase) + 1) * 0.08;
          const densityBoost =
            renderMode === "particles"
              ? 0.06
              : renderMode === "dither"
                ? 0.02
                : renderMode === "crt"
                  ? -0.02
                  : 0;
          const density =
            Math.max(leftField, rightField) + wave - 0.14 + densityBoost;

          if (density <= 0) continue;
          const glyphIndex = Math.min(glyphs.length - 1, Math.floor(density * glyphs.length));
          const glitchOffset =
            renderMode === "glitch" &&
            (row * 11 + Math.floor(time / 70)) % 37 < 3
              ? ((row + Math.floor(time / 70)) % 2 === 0 ? 8 : -8)
              : 0;
          const glyph = glyphs[glyphIndex];

          if (renderMode === "glitch") {
            context.fillStyle = splitViolet;
            context.fillText(glyph, x + glitchOffset - 2, y);
            context.fillStyle = splitCyan;
            context.fillText(glyph, x + glitchOffset + 2, y);
            context.fillStyle = baseColor;
          } else {
            context.fillText(glyph, x, y);
          }
        }
      }

      if (renderMode === "glitch") {
        const burst = Math.floor(time / 90);
        for (let band = 0; band < 3; band += 1) {
          const y = (burst * (97 + band * 53) + band * 181) % height;
          const bandHeight = band === 1 ? 2 : 1;
          context.fillStyle = band % 2 === 0 ? splitCyan : splitViolet;
          context.fillRect(0, y, width, bandHeight);
        }
        context.fillStyle = baseColor;
      }

      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, renderMode]);

  if (reducedMotion) return null;

  return (
    <canvas
      className="particle-field"
      data-render-mode={renderMode}
      ref={canvasRef}
      aria-hidden="true"
    />
  );
}
