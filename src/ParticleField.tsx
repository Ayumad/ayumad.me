import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  alpha: number;
  glyph: string;
}

const glyphs = [".", "·", "+", ":", "*", "0", "1", "╱", "╲"];

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
    let particles: Particle[] = [];
    let visible = !document.hidden;

    const makeParticles = () => {
      const count = Math.min(72, Math.max(28, Math.round(width / 22)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 7,
        speed: Math.random() * 0.12 + 0.025,
        drift: (Math.random() - 0.5) * 0.06,
        alpha: Math.random() * 0.24 + 0.06,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const theme = document.documentElement.dataset.theme;
      const rgb = theme === "light" ? "37, 75, 61" : "183, 255, 71";

      particles.forEach((particle, index) => {
        particle.y -= particle.speed;
        particle.x += particle.drift;

        if (particle.y < -4) {
          particle.y = height + 4;
          particle.x = Math.random() * width;
        }
        if (particle.x < -4) particle.x = width + 4;
        if (particle.x > width + 4) particle.x = -4;

        context.fillStyle = `rgba(${rgb}, ${particle.alpha})`;
        context.font = `${particle.size}px "SFMono-Regular", "Cascadia Code", monospace`;
        context.fillText(particle.glyph, particle.x, particle.y);

        if (index % 7 === 0) {
          const next = particles[(index + 1) % particles.length];
          const distance = Math.hypot(next.x - particle.x, next.y - particle.y);
          if (distance < 150) {
            context.beginPath();
            context.strokeStyle = `rgba(${rgb}, ${Math.min(particle.alpha, 0.08)})`;
            context.setLineDash([2, 7]);
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
      });

      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) {
        window.cancelAnimationFrame(animationFrame);
        draw();
      }
    };

    resize();
    draw();
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
