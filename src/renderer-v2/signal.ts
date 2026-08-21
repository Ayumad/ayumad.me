/**
 * signal.ts — pure signal layer for the XY scope.
 * Generator math ported verbatim from AsciiOscilloscope.tsx signalPoint()
 * (origin/main ef4d86f) so shapes match the homepage scope exactly.
 * No DOM, no React. sample() is a pure function of time + params.
 */

export type DimensionMode = "2d" | "3d";

export interface SignalSettings {
  preset: string;
  generator: string;
  dimension: DimensionMode;
  frequency: number;
  xRatio: number;
  yRatio: number;
  /** radians */
  phase: number;
  form: number;
  /** radians */
  rotation: number;
  scale: number;
  motion: number;
  copies: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** One canonical frame: point cloud with per-point intensity [0..1]. */
export interface Frame {
  points: Float32Array; // xyz triplets
  intensity: Float32Array; // per-point brightness
  count: number;
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export const radians = (deg: number) => (deg * Math.PI) / 180;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Harmonic basis — identical to AsciiOscilloscope.harmonicSignal(). */
function harmonicSignal(angle: number, phase: number, form: number): number {
  const harmonic = form * 0.38;
  return (
    (Math.sin(angle + phase) +
      harmonic * Math.sin(angle * 2 - phase * 0.5)) /
    (1 + harmonic)
  );
}

/** Star polygon point — identical to AsciiOscilloscope.starPoint(). */
function starPoint(theta: number, points: number, form: number): Vec3 {
  const pointCount = Math.round(clamp(points, 3, 9));
  const vertexCount = pointCount * 2;
  const position = (theta / (Math.PI * 2)) * vertexCount;
  const vertex = Math.floor(position) % vertexCount;
  const amount = position - Math.floor(position);

  const getVertex = (index: number) => {
    const angle = (index * Math.PI) / pointCount - Math.PI / 2;
    const radius = index % 2 === 0 ? 1 : 1 - form * 0.72;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 0,
    };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % vertexCount);
  return {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
    z: 0,
  };
}

/** Regular polygon point — identical to AsciiOscilloscope.polygonPoint(). */
function polygonPoint(theta: number, sides: number, form: number): Vec3 {
  const sideCount = Math.round(clamp(sides, 3, 9));
  const position = (theta / (Math.PI * 2)) * sideCount;
  const vertex = Math.floor(position) % sideCount;
  const amount = position - Math.floor(position);

  const getVertex = (index: number) => {
    const angle = (index * Math.PI * 2) / sideCount - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % sideCount);
  const polygon = {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
  const circle = {
    x: Math.cos(theta - Math.PI / 2),
    y: Math.sin(theta - Math.PI / 2),
  };

  return {
    x: mix(circle.x, polygon.x, form),
    y: mix(circle.y, polygon.y, form),
    z: 0,
  };
}

/** Multi-copy layout — identical to AsciiOscilloscope.copyLayout(). */
function copyLayout(index: number, count: number): {
  center: Vec3;
  scale: number;
} {
  if (count === 2) {
    return {
      center: { x: index === 0 ? -0.5 : 0.5, y: 0, z: 0 },
      scale: 0.43,
    };
  }
  if (count === 4) {
    return {
      center: {
        x: index % 2 === 0 ? -0.5 : 0.5,
        y: index < 2 ? 0.5 : -0.5,
        z: 0,
      },
      scale: 0.4,
    };
  }
  if (count === 8) {
    return {
      center: {
        x: [-0.72, -0.24, 0.24, 0.72][index % 4],
        y: index < 4 ? 0.5 : -0.5,
        z: 0,
      },
      scale: 0.2,
    };
  }
  return { center: { x: 0, y: 0, z: 0 }, scale: 1 };
}

/**
 * Sample the signal at time t.
 * t drives rotation/motion; energy [0..1] (e.g. music liveliness) gently
 * speeds motion and breathes phase. Returns a preallocated Frame.
 */
export function sample(
  settings: SignalSettings,
  t: number,
  units: number,
  frame: Frame,
  energy = 0,
): Frame {
  const count = Math.max(2, Math.floor(units));
  ensureCapacity(frame, count);

  const liveMotion = settings.motion * (1 + energy * 0.9);
  const timeScale = t * liveMotion * 0.001;
  const liveRotation = radians(settings.rotation) + timeScale;
  const livePhase =
    settings.phase + Math.sin(t * 0.0007) * 0.35 * energy;

  let i = 0;
  for (let s = 0; s < count; s += 1) {
    const theta = (s / count) * Math.PI * 2;
    const normalizedTheta = (((theta / (Math.PI * 2)) % 1) + 1) % 1;
    const copyPosition = normalizedTheta * settings.copies;
    const copyIndex = Math.min(
      settings.copies - 1,
      Math.floor(copyPosition),
    );
    const localTheta =
      (copyPosition - Math.floor(copyPosition)) * Math.PI * 2;

    let p: Vec3;
    switch (settings.generator) {
      case "wave": {
        const progress = localTheta / (Math.PI * 2);
        p = {
          x: progress * 2 - 1,
          y:
            Math.sin(progress * Math.PI * 2 * settings.xRatio + livePhase) *
            0.46,
          z: 0,
        };
        break;
      }
      case "spiral": {
        const progress = localTheta / (Math.PI * 2);
        const radius = 0.08 + progress * 0.84;
        const angle =
          progress * Math.PI * 2 * settings.xRatio - Math.PI / 2 + livePhase;
        p = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
        };
        break;
      }
      case "star":
        p = starPoint(
          (localTheta + livePhase) * Math.max(1, settings.yRatio),
          settings.xRatio,
          settings.form,
        );
        break;
      case "polygon":
        p = polygonPoint(
          (localTheta + livePhase) * Math.max(1, settings.yRatio),
          settings.xRatio,
          settings.form,
        );
        break;
      case "rose": {
        const petals = Math.max(2, Math.round(settings.xRatio));
        const radius = Math.cos(petals * localTheta + livePhase);
        p = {
          x: Math.cos(localTheta) * radius,
          y: Math.sin(localTheta) * radius,
          z: 0,
        };
        break;
      }
      case "orbit": {
        const outer = Math.max(2, settings.xRatio);
        const inner = Math.min(Math.max(1, settings.yRatio), outer - 1);
        const difference = outer - inner;
        const distance = 0.2 + settings.form * inner;
        const denominator = difference + distance;
        p = {
          x:
            (difference * Math.cos(inner * localTheta) +
              distance * Math.cos(difference * localTheta + livePhase)) /
            denominator,
          y:
            (difference * Math.sin(inner * localTheta) -
              distance * Math.sin(difference * localTheta + livePhase)) /
            denominator,
          z: 0,
        };
        break;
      }
      // lissajous / wave-generator fallback
      default:
        p = {
          x: harmonicSignal(settings.xRatio * localTheta, livePhase, settings.form),
          y: harmonicSignal(settings.yRatio * localTheta, 0, settings.form),
          z: 0,
        };
        break;
    }

    // Rotation applied after generation, matching the original pipeline.
    const cosine = Math.cos(liveRotation);
    const sine = Math.sin(liveRotation);
    const rx = p.x * cosine - p.y * sine;
    const ry = p.x * sine + p.y * cosine;

    const layout = copyLayout(copyIndex, settings.copies);
    const rz =
      settings.dimension === "3d"
        ? Math.sin(theta * 2 + timeScale) * 0.35
        : 0;

    frame.points[i] = (layout.center.x + rx * layout.scale) * settings.scale;
    frame.points[i + 1] =
      (layout.center.y + ry * layout.scale) * settings.scale;
    frame.points[i + 2] = rz * settings.scale;

    // Beam intensity: brighter where the trace moves slower (dense curvature).
    const speed = Math.hypot(rx, ry);
    frame.intensity[s] = clamp(
      0.55 + 0.45 * (1 - speed * 0.5) + energy * 0.15,
      0,
      1,
    );
    i += 3;
  }
  frame.count = count;
  return frame;
}

function ensureCapacity(frame: Frame, count: number) {
  if (frame.points.length >= count * 3 && frame.intensity.length >= count) {
    return;
  }
  const capacity = Math.max(count, Math.ceil(frame.points.length / 3) * 2);
  frame.points = new Float32Array(capacity * 3);
  frame.intensity = new Float32Array(capacity);
}

export function createFrame(initialUnits = 120): Frame {
  return {
    points: new Float32Array(Math.max(2, initialUnits) * 3),
    intensity: new Float32Array(Math.max(2, initialUnits)),
    count: 0,
  };
}
