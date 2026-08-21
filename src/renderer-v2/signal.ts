/**
 * signal.ts — pure signal layer for the XY scope.
 * Extracted from AsciiOscilloscope.tsx (origin/main, ef4d86f).
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
  phase: number;
  form: number;
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

/** Harmonic basis — same math as the original harmonicSignal(). */
export function harmonicSignal(angle: number, phase: number, form: number): number {
  return (
    Math.sin(angle + phase) +
    form * Math.sin(2 * (angle + phase)) +
    (form / 2) * Math.sin(3 * (angle + phase))
  );
}

/** Star polygon point (from starPoint()). */
function starPoint(theta: number, points: number, form: number): Vec3 {
  const sector = (theta * points) / (Math.PI * 2);
  const sectorAngle = (sector % 1) * ((Math.PI * 2) / points);
  const alternate = Math.floor(sector) % 2 === 0 ? 1 : 1 - form * 0.5;
  const radius = alternate;
  return {
    x: Math.cos(sectorAngle) * radius,
    y: Math.sin(sectorAngle) * radius,
    z: 0,
  };
}

/** Regular polygon point (from polygonPoint()). */
function polygonPoint(theta: number, sides: number, form: number): Vec3 {
  const sector = (theta * sides) / (Math.PI * 2);
  const edge = sector % 1;
  const vertexA = Math.floor(sector) % sides;
  const vertexB = (vertexA + 1) % sides;
  const angleA = (vertexA / sides) * Math.PI * 2;
  const angleB = (vertexB / sides) * Math.PI * 2;
  const ax = Math.cos(angleA), ay = Math.sin(angleA);
  const bx = Math.cos(angleB), by = Math.sin(angleB);
  return { x: ax + (bx - ax) * edge, y: ay + (by - ay) * edge, z: 0 };
}

/**
 * Sample the signal at time t.
 * t drives rotation/motion; all params come from settings.
 * Returns a preallocated Frame (reused across calls — zero GC pressure).
 */
export function sample(
  settings: SignalSettings,
  t: number,
  units: number,
  frame: Frame,
): Frame {
  const count = units;
  ensureCapacity(frame, count);
  const timeScale = t * settings.motion * 0.001;
  const rot = radians(settings.rotation) + timeScale;

  let i = 0;
  for (let s = 0; s < count; s += 1) {
    const theta = (s / count) * Math.PI * 2;
    // Base curve by generator id (subset wired; presets map onto these)
    let p: Vec3;
    switch (settings.generator) {
      case "star":
        p = starPoint(theta, 5, settings.form);
        break;
      case "polygon":
        p = polygonPoint(theta, 6, settings.form);
        break;
      case "lissajous":
      case "wave":
      default:
        p = {
          x: harmonicSignal(theta * settings.xRatio, settings.phase, settings.form),
          y: harmonicSignal(theta * settings.yRatio, 0, settings.form),
          z: 0,
        };
        break;
    }

    // Rotation in-plane + gentle z wobble for 3d mode
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const rx = p.x * cosR - p.y * sinR;
    const ry = p.x * sinR + p.y * cosR;
    const rz =
      settings.dimension === "3d"
        ? Math.sin(theta * 2 + timeScale) * 0.35
        : 0;

    frame.points[i] = rx * settings.scale;
    frame.points[i + 1] = ry * settings.scale;
    frame.points[i + 2] = rz * settings.scale;

    // Beam intensity: brighter where the beam moves slower (denser curvature)
    const speed = Math.hypot(rx, ry);
    frame.intensity[s] = clamp(0.55 + 0.45 * (1 - speed * 0.5), 0, 1);
    i += 3;
  }
  frame.count = count;
  return frame;
}

let capacity = 0;
function ensureCapacity(frame: Frame, count: number) {
  if (capacity >= count && frame.points.length >= count * 3) return;
  capacity = Math.max(count, capacity);
  frame.points = new Float32Array(capacity * 3);
  frame.intensity = new Float32Array(capacity);
}

export function createFrame(initialUnits = 120): Frame {
  capacity = initialUnits;
  return {
    points: new Float32Array(initialUnits * 3),
    intensity: new Float32Array(initialUnits),
    count: 0,
  };
}
