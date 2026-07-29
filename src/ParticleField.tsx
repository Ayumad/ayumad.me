import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const glyphs = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

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
    const cell = 24;

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
      context.fillStyle =
        theme === "light" ? "rgba(0, 111, 104, 0.18)" : "rgba(72, 239, 208, 0.16)";
      context.font = `10px "SFMono-Regular", "Cascadia Code", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

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
          const density = Math.max(leftField, rightField) + wave - 0.14;

          if (density <= 0) continue;
          const glyphIndex = Math.min(glyphs.length - 1, Math.floor(density * glyphs.length));
          context.fillText(glyphs[glyphIndex], x, y);
        }
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
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <canvas className="particle-field" ref={canvasRef} aria-hidden="true" />;
}
