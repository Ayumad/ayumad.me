import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useRenderMode, type RenderMode } from "./renderMode";
import {
  asciiGlyphForLuminance,
  bayerThreshold,
  pixelLuminance,
  sampleArtworkParticles,
  type ArtworkParticle,
} from "./spotifyArtworkMath";

const SAMPLE_SIZE = 96;
const OUTPUT_SIZE = 128;
const FRAME_INTERVAL = 1000 / 24;

interface ArtworkPalette {
  background: string;
  cyan: string;
  violet: string;
  text: string;
}

function readPalette(): ArtworkPalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    background: styles.getPropertyValue("--bg").trim() || "#040707",
    cyan: styles.getPropertyValue("--cyan").trim() || "#48efd0",
    violet: styles.getPropertyValue("--violet").trim() || "#777fc4",
    text: styles.getPropertyValue("--text").trim() || "#e5f4f2",
  };
}

function samplePixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width = SAMPLE_SIZE,
) {
  const index = (Math.min(SAMPLE_SIZE - 1, y) * width + Math.min(SAMPLE_SIZE - 1, x)) * 4;
  return {
    red: data[index],
    green: data[index + 1],
    blue: data[index + 2],
  };
}

function drawAscii(
  context: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  palette: ArtworkPalette,
  time: number,
) {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.font = '700 6px "JetBrains Mono", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  const columns = 24;
  const rows = 24;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sampleX = Math.floor((column / columns) * SAMPLE_SIZE);
      const sampleY = Math.floor((row / rows) * SAMPLE_SIZE);
      const pixel = samplePixel(data, sampleX, sampleY);
      const tone = pixelLuminance(pixel.red, pixel.green, pixel.blue);
      const glyph = asciiGlyphForLuminance(tone);
      if (glyph === " ") continue;
      context.globalAlpha = 0.3 + tone * 0.7;
      context.fillStyle = tone > 0.72 ? palette.text : palette.cyan;
      context.fillText(glyph, column * 5.35 + 2.7, row * 5.35 + 2.7);
    }
  }

  context.globalAlpha = 0.24;
  context.fillStyle = palette.cyan;
  context.fillRect(0, (time * 0.025) % OUTPUT_SIZE, OUTPUT_SIZE, 1);
  context.globalAlpha = 1;
}

function drawDither(
  context: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  palette: ArtworkPalette,
) {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const block = 4;
  const cells = OUTPUT_SIZE / block;

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const sampleX = Math.floor((x / cells) * SAMPLE_SIZE);
      const sampleY = Math.floor((y / cells) * SAMPLE_SIZE);
      const pixel = samplePixel(data, sampleX, sampleY);
      const tone = pixelLuminance(pixel.red, pixel.green, pixel.blue);
      const threshold = bayerThreshold(x, y);
      if (tone < threshold * 0.92) continue;
      context.globalAlpha = 0.46 + tone * 0.54;
      context.fillStyle = (x + y) % 5 === 0 && tone < 0.62 ? palette.violet : palette.cyan;
      context.fillRect(x * block, y * block, block - 0.7, block - 0.7);
    }
  }
  context.globalAlpha = 1;
}

function drawGlitch(
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  palette: ArtworkPalette,
  time: number,
) {
  context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.filter = "contrast(1.28) saturate(0.7)";
  context.drawImage(source, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.filter = "none";
  context.globalCompositeOperation = "screen";

  const burst = Math.floor(time / 1050) % 4 === 0;
  for (let band = 0; band < 5; band += 1) {
    const y = (band * 29 + Math.floor(time * 0.015)) % OUTPUT_SIZE;
    const height = 3 + (band % 3) * 2;
    const shift = burst ? ((band % 2 === 0 ? 1 : -1) * (4 + band * 2)) : band % 2;
    context.save();
    context.beginPath();
    context.rect(0, y, OUTPUT_SIZE, height);
    context.clip();
    context.globalAlpha = 0.42;
    context.filter = band % 2 === 0 ? "sepia(1) saturate(5) hue-rotate(125deg)" : "sepia(1) saturate(4) hue-rotate(220deg)";
    context.drawImage(source, shift, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.restore();
  }

  context.filter = "none";
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.28;
  context.fillStyle = palette.cyan;
  context.fillRect(0, (time * 0.055) % OUTPUT_SIZE, OUTPUT_SIZE, 1);
  context.globalAlpha = 1;
}

function drawParticles(
  context: CanvasRenderingContext2D,
  particles: ArtworkParticle[],
  palette: ArtworkPalette,
  time: number,
) {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const seconds = time / 1000;
  const settle = Math.min(1, seconds / 0.75);

  particles.forEach((particle, index) => {
    const orbit = (1 - settle) * (24 + (index % 9) * 2);
    const driftX = Math.sin(seconds * 0.7 + particle.phase) * 1.2;
    const driftY = Math.cos(seconds * 0.55 + particle.phase) * 1.2;
    const x = particle.x * OUTPUT_SIZE + Math.cos(particle.phase) * orbit + driftX;
    const y = particle.y * OUTPUT_SIZE + Math.sin(particle.phase) * orbit + driftY;
    context.globalAlpha = 0.36 + particle.tone * 0.64;
    context.fillStyle = index % 7 === 0 ? palette.violet : palette.cyan;
    context.beginPath();
    context.arc(x, y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawCrt(
  context: CanvasRenderingContext2D,
  lowResolution: HTMLCanvasElement,
  palette: ArtworkPalette,
  time: number,
) {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.imageSmoothingEnabled = false;
  context.filter = "grayscale(0.72) sepia(0.8) saturate(3.2) hue-rotate(105deg) contrast(1.2)";
  context.drawImage(lowResolution, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.filter = "none";

  context.globalAlpha = 0.25;
  context.fillStyle = palette.background;
  for (let y = 1; y < OUTPUT_SIZE; y += 3) {
    context.fillRect(0, y, OUTPUT_SIZE, 1);
  }
  context.globalAlpha = 0.34;
  context.fillStyle = palette.cyan;
  context.fillRect(0, (time * 0.02) % OUTPUT_SIZE, OUTPUT_SIZE, 2);
  context.globalAlpha = 1;
}

function drawArtworkFrame(
  mode: RenderMode,
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  crtSource: HTMLCanvasElement,
  data: Uint8ClampedArray,
  particles: ArtworkParticle[],
  palette: ArtworkPalette,
  time: number,
) {
  if (mode === "ascii") drawAscii(context, data, palette, time);
  if (mode === "dither") drawDither(context, data, palette);
  if (mode === "glitch") drawGlitch(context, source, palette, time);
  if (mode === "particles") drawParticles(context, particles, palette, time);
  if (mode === "crt") drawCrt(context, crtSource, palette, time);
}

function useThemeRevision() {
  const [revision, setRevision] = useState(() => document.documentElement.dataset.theme ?? "dark");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setRevision(document.documentElement.dataset.theme ?? "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return revision;
}

export function SpotifyArtwork({
  artwork,
  album,
  compact = false,
}: {
  artwork: string;
  album: string | null | undefined;
  compact?: boolean;
}) {
  const mode = useRenderMode();
  const reducedMotion = useReducedMotion();
  const themeRevision = useThemeRevision();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null);
  const imageFailed = failedArtwork === artwork;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let cancelled = false;
    let visible = true;
    let animationFrame = 0;
    let lastFrame = -FRAME_INTERVAL;
    let resumeAnimation: (() => void) | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (!visible) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else {
        resumeAnimation?.();
      }
    }, { rootMargin: "80px" });
    observer.observe(wrapper);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resumeAnimation?.();
      } else {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = artwork;
    setReady(false);

    image.onload = () => {
      if (cancelled) return;
      const source = document.createElement("canvas");
      source.width = SAMPLE_SIZE;
      source.height = SAMPLE_SIZE;
      const sourceContext = source.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      sourceContext.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const crtSource = document.createElement("canvas");
      crtSource.width = 42;
      crtSource.height = 42;
      const crtContext = crtSource.getContext("2d");
      if (!crtContext) return;
      crtContext.drawImage(source, 0, 0, 42, 42);

      let imageData: ImageData;
      try {
        imageData = sourceContext.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      } catch {
        return;
      }

      const palette = readPalette();
      const particles = sampleArtworkParticles(
        imageData.data,
        SAMPLE_SIZE,
        SAMPLE_SIZE,
      );
      const animated = !reducedMotion && mode !== "dither";
      let didSetReady = false;
      const startedAt = performance.now();

      const render = (time: number) => {
        if (cancelled) return;
        if (!visible || document.visibilityState !== "visible") {
          animationFrame = 0;
          return;
        }
        if (time - lastFrame >= FRAME_INTERVAL) {
          drawArtworkFrame(
            mode,
            context,
            source,
            crtSource,
            imageData.data,
            particles,
            palette,
            Math.max(0, time - startedAt),
          );
          lastFrame = time;
          if (!didSetReady) {
            didSetReady = true;
            setReady(true);
          }
        }
        if (animated) animationFrame = requestAnimationFrame(render);
      };

      if (animated) {
        resumeAnimation = () => {
          if (
            animationFrame === 0 &&
            visible &&
            document.visibilityState === "visible"
          ) {
            animationFrame = requestAnimationFrame(render);
          }
        };
        resumeAnimation();
      } else {
        drawArtworkFrame(
          mode,
          context,
          source,
          crtSource,
          imageData.data,
          particles,
          palette,
          900,
        );
        setReady(true);
      }
    };

    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrame);
      image.onload = null;
    };
  }, [artwork, mode, reducedMotion, themeRevision]);

  return (
    <div
      ref={wrapperRef}
      className={`spotify-artwork-renderer ${compact ? "is-compact" : ""} ${ready ? "is-ready" : ""}`}
      data-art-mode={mode}
    >
      {imageFailed ? (
        <span
          className="spotify-artwork-image spotify-artwork-image-fallback"
          role="img"
          aria-label={
            album
              ? `Album artwork unavailable for ${album}`
              : "Spotify album artwork unavailable"
          }
        >
          ♪
        </span>
      ) : (
        <img
          className="spotify-artwork-image"
          src={artwork}
          alt={album ? `Album art for ${album}` : "Spotify album art"}
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setFailedArtwork(artwork)}
        />
      )}
      <canvas
        ref={canvasRef}
        className="spotify-artwork-canvas"
        width={OUTPUT_SIZE}
        height={OUTPUT_SIZE}
        aria-hidden="true"
      />
      <span className="spotify-artwork-effect" aria-hidden="true" />
    </div>
  );
}
