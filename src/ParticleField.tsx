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
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;
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
      const dpr =
        renderMode === "particles"
          ? 1
          : Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawParticleMotion = (time: number, theme: string | undefined) => {
      const isLight = theme === "light";
      const cyan = isLight ? "0, 111, 104" : "72, 239, 208";
      const violet = isLight ? "80, 86, 141" : "119, 127, 196";
      const densityScale = width < 700 ? 0.58 : width > 1600 ? 0.82 : 0.9;
      const pointerReach = Math.min(width, height) * 0.24;
      const centers = [
        { x: width * 0.08, y: height * 0.76, rx: width * 0.23, ry: height * 0.22, count: 52 },
        { x: width * 0.9, y: height * 0.16, rx: width * 0.21, ry: height * 0.19, count: 48 },
        { x: width * 0.58, y: height * 0.54, rx: width * 0.16, ry: height * 0.15, count: 42 },
        { x: width * 0.27, y: height * 0.2, rx: width * 0.15, ry: height * 0.14, count: 40 },
        { x: width * 0.82, y: height * 0.8, rx: width * 0.18, ry: height * 0.17, count: 44 },
      ];

      context.save();
      context.globalCompositeOperation = isLight ? "source-over" : "lighter";
      context.lineCap = "round";

      centers.forEach((center, group) => {
        const count = Math.round(center.count * densityScale);
        const direction = group === 1 ? -1 : 1;
        const speed = direction * (0.00012 + group * 0.000015);
        const points: Array<{ x: number; y: number; color: string }> = [];

        for (let index = 0; index < count; index += 1) {
          const seed = index / count;
          const phase = seed * Math.PI * 2 + time * speed;
          const ripple = 1 + Math.sin(time * 0.0007 + index * 1.7) * 0.1;
          const wobble = Math.sin(phase * 3 + group) * (8 + group * 3);
          let x =
            center.x +
            Math.cos(phase) * center.rx * ripple +
            Math.sin(phase * 2.4) * 13;
          let y =
            center.y +
            Math.sin(phase) * center.ry * ripple +
            wobble;

          if (pointerActive) {
            const dx = x - pointerX;
            const dy = y - pointerY;
            const distance = Math.hypot(dx, dy);

            if (distance > 0 && distance < pointerReach) {
              const force =
                (1 - distance / pointerReach) * (12 + (index % 7) * 2.5);
              const offsetX = (dx / distance) * force;
              const offsetY = (dy / distance) * force;
              x += offsetX;
              y += offsetY;
            }
          }

          const pulse = (Math.sin(time * 0.0012 + index * 0.91) + 1) * 0.5;
          const alpha = 0.16 + pulse * 0.38;
          const color = (index + group) % 5 === 0 ? violet : cyan;
          const radius = 0.65 + (index % 4) * 0.3 + pulse * 0.55;
          const trailScale = direction * (0.012 + (index % 4) * 0.002);
          const previousX = x + Math.sin(phase) * center.rx * trailScale;
          const previousY = y - Math.cos(phase) * center.ry * trailScale;
          points.push({ x, y, color });

          context.strokeStyle = `rgba(${color}, ${alpha * 0.42})`;
          context.lineWidth = Math.max(0.45, radius * 0.42);
          context.beginPath();
          context.moveTo(previousX, previousY);
          context.lineTo(x, y);
          context.stroke();

          context.fillStyle = `rgba(${color}, ${alpha})`;
          context.shadowBlur = 0;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();

          if (index % 11 === 0) {
            const glowRadius = radius * (4.6 + pulse);
            const glow = context.createRadialGradient(
              x,
              y,
              radius,
              x,
              y,
              glowRadius,
            );
            glow.addColorStop(0, `rgba(${color}, ${alpha * 0.28})`);
            glow.addColorStop(1, `rgba(${color}, 0)`);
            context.fillStyle = glow;
            context.beginPath();
            context.arc(x, y, glowRadius, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = `rgba(${color}, ${alpha * 0.24})`;
            context.lineWidth = 0.6;
            context.beginPath();
            context.arc(x, y, radius + 3.5 + pulse * 2, 0, Math.PI * 2);
            context.stroke();
          }
        }

        context.shadowBlur = 0;
        points.forEach((point, index) => {
          if (index % 2 !== 0) return;
          const neighbor = points[index + 1];
          if (!neighbor) return;
          const distance = Math.hypot(point.x - neighbor.x, point.y - neighbor.y);
          const limit = width < 700 ? 62 : 92;
          if (distance > limit) return;

          context.strokeStyle = `rgba(${point.color}, ${(1 - distance / limit) * 0.12})`;
          context.lineWidth = 0.5;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        });

        for (let ring = 0; ring < 2; ring += 1) {
          const progress = (time * 0.00016 + group * 0.17 + ring * 0.5) % 1;
          const radius = 14 + progress * Math.min(center.rx, center.ry) * 0.88;
          context.setLineDash([1.2, 7]);
          context.strokeStyle = `rgba(${group % 2 === 0 ? cyan : violet}, ${(1 - progress) * 0.13})`;
          context.lineWidth = 0.75;
          context.beginPath();
          context.arc(center.x, center.y, radius, 0, Math.PI * 2);
          context.stroke();
        }
        context.setLineDash([]);
      });

      const streamCount = Math.round(
        Math.max(36, Math.min(78, width / 18)) * densityScale,
      );
      for (let ribbon = 0; ribbon < 2; ribbon += 1) {
        for (let index = 0; index < streamCount; index += 1) {
          const seed = index / streamCount;
          const progress =
            (seed + time * (0.00002 + ribbon * 0.000008) + ribbon * 0.37) % 1;
          const depth = 0.35 + ((index * 7) % 13) / 20;
          const x = width * (0.02 + progress * 0.96);
          const wave =
            Math.sin(progress * Math.PI * (3 + ribbon) + time * 0.00025 + ribbon) *
            height *
            0.045;
          const y =
            height * (ribbon === 0 ? 0.36 : 0.64) +
            (index % 5 - 2) * height * 0.012 +
            wave;
          const trail = 3 + depth * 7;
          const color = (index + ribbon) % 6 === 0 ? violet : cyan;

          context.strokeStyle = `rgba(${color}, ${0.09 + depth * 0.11})`;
          context.lineWidth = 0.45 + depth * 0.45;
          context.beginPath();
          context.moveTo(x - trail, y + trail * 0.18);
          context.lineTo(x, y);
          context.stroke();

          context.fillStyle = `rgba(${color}, ${0.18 + depth * 0.22})`;
          context.shadowBlur = 0;
          context.beginPath();
          context.arc(x, y, 0.55 + depth * 0.8, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.restore();
    };

    const draw = (time: number) => {
      const frameDelay = renderMode === "particles" ? 32 : 120;
      if (time - previousFrame < frameDelay) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }
      previousFrame = time;
      context.clearRect(0, 0, width, height);

      const theme = document.documentElement.dataset.theme;
      if (renderMode === "particles") {
        drawParticleMotion(time, theme);
        if (visible) animationFrame = window.requestAnimationFrame(draw);
        return;
      }

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
            renderMode === "dither"
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
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
    };
    const onPointerLeave = () => {
      pointerActive = false;
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
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
