import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useRenderMode } from "./renderMode";

type PresetId =
  | "wave"
  | "circle"
  | "triangle"
  | "square"
  | "star"
  | "hex"
  | "spiral"
  | "knot"
  | "orbit";
type GeneratorId =
  | "wave"
  | "lissajous"
  | "spiral"
  | "star"
  | "polygon"
  | "orbit";
type DimensionMode = "2d" | "3d";

interface SignalSettings {
  preset: PresetId;
  generator: GeneratorId;
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

interface Preset {
  id: PresetId;
  label: string;
  generator: GeneratorId;
  xRatio: number;
  yRatio: number;
  phaseDegrees: number;
  form: number;
  rotationDegrees: number;
  scale: number;
  motion: number;
}

interface RandomVariant {
  preset: PresetId;
  scale: number;
  motion: number;
  octave: 0 | 1 | 2;
  units: 72 | 96 | 120;
}

interface Point {
  x: number;
  y: number;
}

interface Point3D extends Point {
  z: number;
}

interface ProjectedPoint extends Point {
  depth: number;
}

interface Curve3D {
  points: Point3D[];
}

interface SpatialView {
  yaw: number;
  pitch: number;
  yawRate: number;
  pitchRate: number;
}

interface AudioGraph {
  context: AudioContext;
  xOscillator: OscillatorNode;
  yOscillator: OscillatorNode;
  gain: GainNode;
}

interface MusicalNote {
  midi: number;
  name: string;
  frequency: number;
}

const presets: Preset[] = [
  {
    id: "wave",
    label: "WAVE",
    generator: "wave",
    xRatio: 2,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.16,
  },
  {
    id: "circle",
    label: "CIRCLE",
    generator: "lissajous",
    xRatio: 1,
    yRatio: 1,
    phaseDegrees: 90,
    form: 0,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.14,
  },
  {
    id: "triangle",
    label: "TRIANGLE",
    generator: "polygon",
    xRatio: 3,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.12,
  },
  {
    id: "square",
    label: "SQUARE",
    generator: "polygon",
    xRatio: 4,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 45,
    scale: 0.98,
    motion: 0.12,
  },
  {
    id: "star",
    label: "STAR",
    generator: "star",
    xRatio: 5,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.86,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.16,
  },
  {
    id: "hex",
    label: "HEX",
    generator: "polygon",
    xRatio: 6,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.12,
  },
  {
    id: "spiral",
    label: "SPIRAL",
    generator: "spiral",
    xRatio: 3,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.18,
  },
  {
    id: "knot",
    label: "KNOT",
    generator: "lissajous",
    xRatio: 3,
    yRatio: 2,
    phaseDegrees: 90,
    form: 0,
    rotationDegrees: 0,
    scale: 0.94,
    motion: 0.2,
  },
  {
    id: "orbit",
    label: "ORBIT",
    generator: "orbit",
    xRatio: 5,
    yRatio: 3,
    phaseDegrees: 0,
    form: 0.93,
    rotationDegrees: 0,
    scale: 0.94,
    motion: 0.18,
  },
];

const randomVariants: RandomVariant[] = [
  { preset: "wave", scale: 0.96, motion: 0.14, octave: 0, units: 72 },
  { preset: "wave", scale: 0.88, motion: 0.18, octave: 2, units: 120 },
  { preset: "circle", scale: 0.96, motion: 0.14, octave: 0, units: 96 },
  { preset: "circle", scale: 0.86, motion: 0.18, octave: 1, units: 120 },
  { preset: "triangle", scale: 0.98, motion: 0.12, octave: 0, units: 72 },
  { preset: "triangle", scale: 0.86, motion: 0.18, octave: 2, units: 120 },
  { preset: "square", scale: 0.98, motion: 0.12, octave: 0, units: 72 },
  { preset: "square", scale: 0.86, motion: 0.18, octave: 2, units: 120 },
  { preset: "star", scale: 0.96, motion: 0.14, octave: 0, units: 96 },
  { preset: "star", scale: 0.84, motion: 0.18, octave: 1, units: 96 },
  { preset: "hex", scale: 0.96, motion: 0.12, octave: 0, units: 72 },
  { preset: "hex", scale: 0.86, motion: 0.16, octave: 2, units: 120 },
  { preset: "spiral", scale: 0.96, motion: 0.16, octave: 0, units: 96 },
  { preset: "spiral", scale: 0.84, motion: 0.2, octave: 1, units: 120 },
  { preset: "knot", scale: 0.94, motion: 0.18, octave: 0, units: 96 },
  { preset: "knot", scale: 0.82, motion: 0.2, octave: 1, units: 120 },
  { preset: "orbit", scale: 0.94, motion: 0.18, octave: 0, units: 96 },
  { preset: "orbit", scale: 0.82, motion: 0.2, octave: 1, units: 120 },
];

const defaultPreset =
  presets.find((preset) => preset.id === "star") ?? presets[0];
const bayer4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];
const toneRamp = " .,:;+*#@";
const crtRamp = "  .:-=+*#@";
const ditherRamp = "  ░▒▓█";
const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const frequencyStartMidi = 21;
const frequencyOctaves = 3;
const semitonesPerOctave = 12;
const musicalNotes: MusicalNote[] = Array.from(
  { length: frequencyOctaves * semitonesPerOctave + 1 },
  (_, index) => {
    const midi = frequencyStartMidi + index;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    return {
      midi,
      name: `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}`,
      frequency: Number(frequency.toFixed(2)),
    };
  },
);
const outputGain = 0.018;
const fourierHarmonics = 48;
const audioSamples = 512;
const renderUnitOptions = [48, 72, 96, 120] as const;

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function radians(degrees: number) {
  return (degrees / 180) * Math.PI;
}

function nearestMusicalNote(frequency: number) {
  return musicalNotes.reduce((nearest, note) =>
    Math.abs(note.frequency - frequency) <
    Math.abs(nearest.frequency - frequency)
      ? note
      : nearest,
  );
}

function formatFrequency(frequency: number) {
  return Number.isInteger(frequency) ? frequency.toString() : frequency.toFixed(2);
}

function structuralGlyph(angle: number, crossing: boolean) {
  if (crossing) return "+";

  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  if (normalized < Math.PI * 0.125 || normalized >= Math.PI * 0.875) return "-";
  if (normalized < Math.PI * 0.375) return "\\";
  if (normalized < Math.PI * 0.625) return "|";
  return "/";
}

function harmonicSignal(angle: number, phase: number, form: number) {
  const harmonic = form * 0.38;
  return (
    (Math.sin(angle + phase) +
      harmonic * Math.sin(angle * 2 - phase * 0.5)) /
    (1 + harmonic)
  );
}

function starPoint(theta: number, points: number, form: number): Point {
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
    };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % vertexCount);
  return {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
}

function polygonPoint(theta: number, sides: number, form: number): Point {
  const sideCount = Math.round(clamp(sides, 3, 9));
  const position = (theta / (Math.PI * 2)) * sideCount;
  const vertex = Math.floor(position) % sideCount;
  const amount = position - Math.floor(position);

  const getVertex = (index: number) => {
    const angle = (index * Math.PI * 2) / sideCount - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % sideCount);
  const polygon = {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
  const circle = { x: Math.cos(theta - Math.PI / 2), y: Math.sin(theta - Math.PI / 2) };

  return {
    x: mix(circle.x, polygon.x, form),
    y: mix(circle.y, polygon.y, form),
  };
}

function sampledCurve3D(
  samples: number,
  pointAt: (amount: number) => Point3D,
  closed = true,
): Curve3D {
  const pointCount = closed ? samples + 1 : samples;
  const divisor = closed ? samples : samples - 1;

  return {
    points: Array.from({ length: pointCount }, (_, index) =>
      pointAt(index / divisor),
    ),
  };
}

function prismScene(
  sides: number,
  radius: number,
  depth: number,
  innerRadius?: number,
): Curve3D[] {
  const vertexCount = innerRadius === undefined ? sides : sides * 2;
  const start = sides === 4 ? -Math.PI / 4 : -Math.PI / 2;
  const vertices = Array.from({ length: vertexCount }, (_, index) => {
    const angle = start + (index * Math.PI * 2) / vertexCount;
    const vertexRadius =
      innerRadius !== undefined && index % 2 === 1 ? innerRadius : radius;
    return {
      x: Math.cos(angle) * vertexRadius,
      y: Math.sin(angle) * vertexRadius,
    };
  });

  const face = (z: number): Curve3D => ({
    points: [
      ...vertices.map((point) => ({ ...point, z })),
      { ...vertices[0], z },
    ],
  });

  return [
    face(-depth),
    face(depth),
    ...vertices.map((point) => ({
      points: [
        { ...point, z: -depth },
        { ...point, z: depth },
      ],
    })),
  ];
}

function waveScene(): Curve3D[] {
  const wavePoint = (amount: number, strand: number): Point3D => {
    const phase = amount * Math.PI * 4;
    return {
      x: mix(-0.78, 0.78, amount),
      y: Math.sin(phase + strand * 0.16) * 0.25,
      z: strand * 0.105,
    };
  };

  return [
    ...[-3, -2, -1, 0, 1, 2, 3].map((strand) =>
      sampledCurve3D(84, (amount) => wavePoint(amount, strand), false),
    ),
    ...Array.from({ length: 17 }, (_, index) => {
      const amount = index / 16;
      return {
        points: [wavePoint(amount, -3), wavePoint(amount, 3)],
      };
    }),
  ];
}

function torusScene(): Curve3D[] {
  const majorRadius = 0.48;
  const minorRadius = 0.25;
  const torusPoint = (u: number, v: number): Point3D => ({
    x: (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
    y: minorRadius * Math.sin(v),
    z: (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
  });

  return [
    ...Array.from({ length: 6 }, (_, index) => {
      const v = (index / 6) * Math.PI * 2;
      return sampledCurve3D(64, (amount) =>
        torusPoint(amount * Math.PI * 2, v),
      );
    }),
    ...Array.from({ length: 12 }, (_, index) => {
      const u = (index / 12) * Math.PI * 2;
      return sampledCurve3D(28, (amount) =>
        torusPoint(u, amount * Math.PI * 2),
      );
    }),
  ];
}

function pyramidScene(): Curve3D[] {
  const base = Array.from({ length: 3 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 3;
    return {
      x: Math.cos(angle) * 0.62,
      y: -0.42,
      z: Math.sin(angle) * 0.62,
    };
  });
  const apex = { x: 0, y: 0.68, z: 0 };

  return [
    { points: [...base, base[0]] },
    ...base.map((point) => ({ points: [point, apex] })),
  ];
}

function knotScene(): Curve3D[] {
  return [-0.035, 0, 0.035].map((offset) =>
    sampledCurve3D(108, (amount) => {
      const theta = amount * Math.PI * 2;
      const minorRadius = 0.19 + offset;
      const ring = 0.49 + minorRadius * Math.cos(theta * 3);
      return {
        x: ring * Math.cos(theta * 2),
        y: minorRadius * Math.sin(theta * 3),
        z: ring * Math.sin(theta * 2),
      };
    }),
  );
}

function helixScene(): Curve3D[] {
  const helixPoint = (amount: number, rail: number): Point3D => {
    const theta = amount * Math.PI * 6;
    const radius = 0.46 + rail * 0.035;
    return {
      x: Math.cos(theta) * radius,
      y: mix(-0.7, 0.7, amount),
      z: Math.sin(theta) * radius,
    };
  };

  return [
    ...[-1, 0, 1].map((rail) =>
      sampledCurve3D(120, (amount) => helixPoint(amount, rail), false),
    ),
    ...Array.from({ length: 19 }, (_, index) => {
      const amount = index / 18;
      return {
        points: [helixPoint(amount, -1), helixPoint(amount, 1)],
      };
    }),
  ];
}

function orbitScene(): Curve3D[] {
  const orbitalCircle = (amount: number, tilt: number): Point3D => {
    const theta = amount * Math.PI * 2;
    return {
      x: Math.cos(theta) * 0.68,
      y: Math.sin(theta) * Math.cos(tilt) * 0.68,
      z: Math.sin(theta) * Math.sin(tilt) * 0.68,
    };
  };

  return [
    ...[0, Math.PI / 3, -Math.PI / 3].map((tilt) =>
      sampledCurve3D(72, (amount) => orbitalCircle(amount, tilt)),
    ),
    sampledCurve3D(108, (amount) => {
      const theta = amount * Math.PI * 2;
      return {
        x: Math.cos(theta * 3) * 0.58,
        y: Math.sin(theta) * 0.5,
        z: Math.sin(theta * 3) * 0.58,
      };
    }),
  ];
}

function projectPoint3D(
  point: Point3D,
  yaw: number,
  pitch: number,
): ProjectedPoint {
  const yawCosine = Math.cos(yaw);
  const yawSine = Math.sin(yaw);
  const pitchCosine = Math.cos(pitch);
  const pitchSine = Math.sin(pitch);
  const rotatedX = point.x * yawCosine + point.z * yawSine;
  const yawDepth = -point.x * yawSine + point.z * yawCosine;
  const rotatedY = point.y * pitchCosine - yawDepth * pitchSine;
  const depth = point.y * pitchSine + yawDepth * pitchCosine;
  const perspective = 3.4 / (4 - depth);

  return {
    x: rotatedX * perspective * 1.08,
    y: rotatedY * perspective * 1.08,
    depth,
  };
}

const spatialScenes: Record<PresetId, Curve3D[]> = {
  wave: waveScene(),
  circle: torusScene(),
  triangle: pyramidScene(),
  square: prismScene(4, 0.68, 0.48),
  star: prismScene(5, 0.7, 0.25, 0.31),
  hex: prismScene(6, 0.7, 0.3),
  spiral: helixScene(),
  knot: knotScene(),
  orbit: orbitScene(),
};

const spatialGeometryNames: Record<PresetId, string> = {
  wave: "wave-surface",
  circle: "torus",
  triangle: "pyramid",
  square: "cube",
  star: "star-prism",
  hex: "hexagonal-prism",
  spiral: "helix",
  knot: "torus-knot",
  orbit: "orbital-cage",
};

const spatialViews: Record<PresetId, SpatialView> = {
  wave: { yaw: 0.68, pitch: -0.48, yawRate: 0.75, pitchRate: 0.22 },
  circle: { yaw: 0.35, pitch: -0.68, yawRate: 0.55, pitchRate: 0.72 },
  triangle: { yaw: 0.72, pitch: -0.46, yawRate: 0.82, pitchRate: 0.34 },
  square: { yaw: 0.7, pitch: -0.5, yawRate: 0.78, pitchRate: 0.31 },
  star: { yaw: 0.58, pitch: -0.54, yawRate: 0.72, pitchRate: 0.28 },
  hex: { yaw: 0.68, pitch: -0.48, yawRate: 0.76, pitchRate: 0.3 },
  spiral: { yaw: 0.46, pitch: -0.26, yawRate: 0.88, pitchRate: 0.24 },
  knot: { yaw: 0.52, pitch: -0.34, yawRate: 0.84, pitchRate: 0.27 },
  orbit: { yaw: 0.44, pitch: -0.28, yawRate: 0.7, pitchRate: 0.4 },
};

function copyLayout(index: number, count: number) {
  if (count === 2) {
    return {
      center: { x: index === 0 ? -0.5 : 0.5, y: 0 },
      scale: 0.43,
    };
  }

  if (count === 4) {
    return {
      center: {
        x: index % 2 === 0 ? -0.5 : 0.5,
        y: index < 2 ? 0.5 : -0.5,
      },
      scale: 0.4,
    };
  }

  if (count === 8) {
    return {
      center: {
        x: [-0.72, -0.24, 0.24, 0.72][index % 4],
        y: index < 4 ? 0.5 : -0.5,
      },
      scale: 0.2,
    };
  }

  return { center: { x: 0, y: 0 }, scale: 1 };
}

function signalPoint(theta: number, settings: SignalSettings): Point {
  const normalizedTheta =
    ((theta / (Math.PI * 2)) % 1 + 1) % 1;
  const copyPosition = normalizedTheta * settings.copies;
  const copyIndex = Math.min(
    settings.copies - 1,
    Math.floor(copyPosition),
  );
  const localTheta =
    (copyPosition - Math.floor(copyPosition)) * Math.PI * 2;
  const livePhase = settings.phase;
  const liveRotation = settings.rotation;
  let point: Point;

  if (settings.generator === "wave") {
    const progress = localTheta / (Math.PI * 2);
    point = {
      x: progress * 2 - 1,
      y:
        Math.sin(progress * Math.PI * 2 * settings.xRatio + livePhase) *
        0.46,
    };
  } else if (settings.generator === "spiral") {
    const progress = localTheta / (Math.PI * 2);
    const radius = 0.08 + progress * 0.84;
    const angle =
      progress * Math.PI * 2 * settings.xRatio - Math.PI / 2 + livePhase;
    point = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  } else if (settings.generator === "star") {
    point = starPoint(
      (localTheta + livePhase) * Math.max(1, settings.yRatio),
      settings.xRatio,
      settings.form,
    );
  } else if (settings.generator === "polygon") {
    point = polygonPoint(
      (localTheta + livePhase) * Math.max(1, settings.yRatio),
      settings.xRatio,
      settings.form,
    );
  } else if (settings.generator === "orbit") {
    const outer = Math.max(2, settings.xRatio);
    const inner = Math.min(Math.max(1, settings.yRatio), outer - 1);
    const difference = outer - inner;
    const distance = 0.2 + settings.form * inner;
    const denominator = difference + distance;
    point = {
      x:
        (difference * Math.cos(inner * localTheta) +
          distance * Math.cos(difference * localTheta + livePhase)) /
        denominator,
      y:
        (difference * Math.sin(inner * localTheta) -
          distance * Math.sin(difference * localTheta + livePhase)) /
        denominator,
    };
  } else {
    point = {
      x: harmonicSignal(settings.xRatio * localTheta, livePhase, settings.form),
      y: harmonicSignal(settings.yRatio * localTheta, 0, settings.form),
    };
  }

  const cosine = Math.cos(liveRotation);
  const sine = Math.sin(liveRotation);
  const rotated = {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
  const layout = copyLayout(copyIndex, settings.copies);
  return {
    x: (layout.center.x + rotated.x * layout.scale) * settings.scale,
    y: (layout.center.y + rotated.y * layout.scale) * settings.scale,
  };
}

function createStereoWaves(context: AudioContext, settings: SignalSettings) {
  const xSamples = new Float32Array(audioSamples);
  const ySamples = new Float32Array(audioSamples);

  for (let sample = 0; sample < audioSamples; sample += 1) {
    const theta = (sample / audioSamples) * Math.PI * 2;
    const point = signalPoint(theta, settings);
    xSamples[sample] = point.x;
    ySamples[sample] = point.y;
  }

  const xReal = new Float32Array(fourierHarmonics + 1);
  const xImaginary = new Float32Array(fourierHarmonics + 1);
  const yReal = new Float32Array(fourierHarmonics + 1);
  const yImaginary = new Float32Array(fourierHarmonics + 1);

  for (let harmonic = 1; harmonic <= fourierHarmonics; harmonic += 1) {
    let xCosine = 0;
    let xSine = 0;
    let yCosine = 0;
    let ySine = 0;

    for (let sample = 0; sample < audioSamples; sample += 1) {
      const angle = (harmonic * sample * Math.PI * 2) / audioSamples;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      xCosine += xSamples[sample] * cosine;
      xSine += xSamples[sample] * sine;
      yCosine += ySamples[sample] * cosine;
      ySine += ySamples[sample] * sine;
    }

    const scale = 2 / audioSamples;
    xReal[harmonic] = xCosine * scale;
    xImaginary[harmonic] = xSine * scale;
    yReal[harmonic] = yCosine * scale;
    yImaginary[harmonic] = ySine * scale;
  }

  return {
    xWave: context.createPeriodicWave(xReal, xImaginary, {
      disableNormalization: true,
    }),
    yWave: context.createPeriodicWave(yReal, yImaginary, {
      disableNormalization: true,
    }),
  };
}

function updateAudioGraph(graph: AudioGraph, settings: SignalSettings) {
  const { context, xOscillator, yOscillator } = graph;
  const now = context.currentTime;

  xOscillator.frequency.cancelScheduledValues(now);
  yOscillator.frequency.cancelScheduledValues(now);

  if (context.state === "running") {
    xOscillator.frequency.setTargetAtTime(settings.frequency, now, 0.015);
    yOscillator.frequency.setTargetAtTime(settings.frequency, now, 0.015);
  } else {
    xOscillator.frequency.setValueAtTime(settings.frequency, now);
    yOscillator.frequency.setValueAtTime(settings.frequency, now);
  }

  const { xWave, yWave } = createStereoWaves(context, settings);
  xOscillator.setPeriodicWave(xWave);
  yOscillator.setPeriodicWave(yWave);
}

function settingsFromPreset(
  preset: Preset,
  frequency = 55,
): SignalSettings {
  return {
    preset: preset.id,
    generator: preset.generator,
    dimension: "2d",
    frequency,
    xRatio: preset.xRatio,
    yRatio: preset.yRatio,
    phase: radians(preset.phaseDegrees),
    form: preset.form,
    rotation: radians(preset.rotationDegrees),
    scale: preset.scale,
    motion: preset.motion,
    copies: 1,
  };
}

export default function AsciiOscilloscope() {
  const initialSettings = settingsFromPreset(defaultPreset);
  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const settingsRef = useRef<SignalSettings>(initialSettings);
  const renderNowRef = useRef<((clear?: boolean) => void) | null>(null);
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const suspendTimerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const runningRef = useRef(true);
  const [presetId, setPresetId] = useState<PresetId>(initialSettings.preset);
  const [dimension, setDimension] = useState<DimensionMode>(
    initialSettings.dimension,
  );
  const [frequency, setFrequency] = useState(initialSettings.frequency);
  const [scale, setScale] = useState(initialSettings.scale);
  const [motion, setMotion] = useState(initialSettings.motion);
  const [octave, setOctave] = useState(0);
  const [renderUnits, setRenderUnits] = useState(72);
  const [running, setRunning] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const reducedMotion = useReducedMotion();
  const renderMode = useRenderMode();
  const preset = presets.find((item) => item.id === presetId) ?? defaultPreset;
  const copies = 2 ** octave;
  const musicalNote = nearestMusicalNote(frequency);

  useEffect(() => {
    const container = containerRef.current;
    const output = outputRef.current;
    if (!container || !output) return;

    let columns = 72;
    let rows = 30;
    let intensity = new Float32Array(columns * rows);
    let direction = new Float32Array(columns * rows);
    let animationFrame = 0;
    let previousFrame = 0;
    let previousClock = performance.now();
    let visible = !document.hidden;
    let horizontalCorrection = 1;
    let plotHalfHeight = 0.45;
    let clippedSamples = 0;

    const configureGrid = () => {
      const width = container.clientWidth || 680;
      const height = container.clientHeight || 390;
      columns = renderUnits;
      const fontSize = clamp((width / columns) * 1.58, 4.8, 22);
      rows = Math.round(clamp(height / (fontSize * 0.94), 16, 72));
      const physicalGridWidth = (columns - 1) * fontSize * 0.6;
      const physicalGridHeight = (rows - 1) * fontSize * 0.91;
      horizontalCorrection = Math.min(
        1,
        physicalGridHeight / physicalGridWidth,
      );
      plotHalfHeight = 0.5 - 1 / (rows - 1);
      intensity = new Float32Array(columns * rows);
      direction = new Float32Array(columns * rows);
      output.style.setProperty("--scope-columns", columns.toString());
      output.style.setProperty("--scope-font-size", `${fontSize}px`);
    };

    const plot = (x: number, y: number, angle: number, strength: number) => {
      const column = Math.round(
        (x * horizontalCorrection * plotHalfHeight + 0.5) * (columns - 1),
      );
      const row = Math.round((0.5 - y * plotHalfHeight) * (rows - 1));
      if (column < 1 || column >= columns - 1 || row < 1 || row >= rows - 1) {
        clippedSamples += 1;
        return;
      }

      const center = row * columns + column;
      intensity[center] = Math.min(1.6, intensity[center] + strength);
      direction[center] = angle;

      for (const neighbor of [
        center - 1,
        center + 1,
        center - columns,
        center + columns,
      ]) {
        intensity[neighbor] = Math.min(
          0.7,
          intensity[neighbor] + strength * 0.22,
        );
        direction[neighbor] = angle;
      }
    };

    const render = (clear = false) => {
      if (clear) intensity.fill(0);
      clippedSamples = 0;
      const current = settingsRef.current;
      const time = reducedMotion ? 0 : elapsedRef.current / 1000;
      const renderFrame = Math.floor(elapsedRef.current / 80);
      const samples = 1900;
      const persistence =
        renderMode === "crt"
          ? 0.84
          : renderMode === "particles"
            ? 0.54
            : renderMode === "dither"
              ? 0.64
              : 0.72;

      for (let index = 0; index < intensity.length; index += 1) {
        intensity[index] *= persistence;
      }

      const motionHead =
        (time * current.motion * 3.6) % (Math.PI * 2);

      if (current.dimension === "3d") {
        const spin = time * current.motion * 2.4;
        const view = spatialViews[current.preset];
        const yaw = view.yaw + spin * view.yawRate;
        const pitch = view.pitch + spin * view.pitchRate;
        const scene = spatialScenes[current.preset];
        const totalSegments = scene.reduce(
          (total, curve) => total + Math.max(0, curve.points.length - 1),
          0,
        );
        let segmentNumber = 0;

        for (let copyIndex = 0; copyIndex < current.copies; copyIndex += 1) {
          const layout = copyLayout(copyIndex, current.copies);

          for (const curve of scene) {
            for (let index = 1; index < curve.points.length; index += 1) {
              const from = projectPoint3D(curve.points[index - 1], yaw, pitch);
              const to = projectPoint3D(curve.points[index], yaw, pitch);
              const fromPoint = {
                x:
                  (layout.center.x + from.x * layout.scale) *
                  current.scale,
                y:
                  (layout.center.y + from.y * layout.scale) *
                  current.scale,
              };
              const toPoint = {
                x:
                  (layout.center.x + to.x * layout.scale) *
                  current.scale,
                y:
                  (layout.center.y + to.y * layout.scale) *
                  current.scale,
              };
              const deltaX = toPoint.x - fromPoint.x;
              const deltaY = toPoint.y - fromPoint.y;
              const scaledDistance = Math.hypot(
                deltaX * columns * horizontalCorrection * plotHalfHeight,
                deltaY * rows * plotHalfHeight,
              );
              const steps = Math.max(1, Math.ceil(scaledDistance));
              const angle = Math.atan2(
                -deltaY * rows,
                deltaX * columns * horizontalCorrection,
              );
              const progress =
                (segmentNumber / Math.max(1, totalSegments)) * Math.PI * 2;
              const trailDistance =
                ((motionHead - progress) % (Math.PI * 2) + Math.PI * 2) %
                (Math.PI * 2);
              const headDistance = Math.abs(
                Math.atan2(
                  Math.sin(progress - motionHead),
                  Math.cos(progress - motionHead),
                ),
              );
              const traceHead =
                current.motion > 0
                  ? Math.exp(
                      -(headDistance * headDistance) / 0.035,
                    )
                  : 0;
              const traceTail =
                current.motion > 0 ? Math.exp(-trailDistance * 1.25) : 0;
              const depth =
                clamp(((from.depth + to.depth) * 0.5 + 0.8) / 1.6, 0, 1);
              const strength =
                0.32 + depth * 0.38 + traceTail * 0.32 + traceHead * 0.58;

              for (let step = 1; step <= steps; step += 1) {
                const amount = step / steps;
                plot(
                  mix(fromPoint.x, toPoint.x, amount),
                  mix(fromPoint.y, toPoint.y, amount),
                  angle,
                  strength,
                );
              }

              segmentNumber += 1;
            }
          }
        }
      } else {
        let previousPoint = signalPoint(0, current);

        for (let sample = 1; sample <= samples; sample += 1) {
          const theta = (sample / samples) * Math.PI * 2;
          const point = signalPoint(theta, current);
          const deltaX = point.x - previousPoint.x;
          const deltaY = point.y - previousPoint.y;
          const flyback =
            current.copies > 1 && Math.hypot(deltaX, deltaY) > 0.55;
          if (flyback) {
            previousPoint = point;
            continue;
          }
          const scaledDistance = Math.hypot(
            deltaX * columns * horizontalCorrection * plotHalfHeight,
            deltaY * rows * plotHalfHeight,
          );
          const steps = Math.max(1, Math.ceil(scaledDistance));
          const angle = Math.atan2(
            -deltaY * rows,
            deltaX * columns * horizontalCorrection,
          );
          const headDistance = Math.abs(
            Math.atan2(
              Math.sin(theta - motionHead),
              Math.cos(theta - motionHead),
            ),
          );
          const trailDistance =
            ((motionHead - theta) % (Math.PI * 2) + Math.PI * 2) %
            (Math.PI * 2);
          const traceHead =
            current.motion > 0
              ? Math.exp(-(headDistance * headDistance) / 0.035)
              : 0;
          const traceTail =
            current.motion > 0 ? Math.exp(-trailDistance * 1.25) : 0;
          const strength =
            current.motion > 0
              ? 0.42 + traceTail * 0.46 + traceHead * 0.7
              : 0.62;

          for (let step = 1; step <= steps; step += 1) {
            const amount = step / steps;
            plot(
              mix(previousPoint.x, point.x, amount),
              mix(previousPoint.y, point.y, amount),
              angle,
              strength,
            );
          }

          previousPoint = point;
        }
      }

      const lines: string[] = [];
      for (let row = 0; row < rows; row += 1) {
        let line = "";
        for (let column = 0; column < columns; column += 1) {
          const glitchBand =
            renderMode === "glitch" &&
            (row * 13 + renderFrame) % 47 < 3;
          const sourceColumn = clamp(
            column +
              (glitchBand
                ? (row + renderFrame) % 2 === 0
                  ? 2
                  : -2
                : 0),
            0,
            columns - 1,
          );
          const cell = row * columns + sourceColumn;
          const value = intensity[cell];

          if (renderMode === "dither") {
            const orderedThreshold =
              bayer4[(row % 4) * 4 + (column % 4)] / 15;
            const level = clamp(value * 0.94 - orderedThreshold * 0.32, 0, 0.99);
            const rampIndex = Math.floor(level * ditherRamp.length);
            line += ditherRamp[rampIndex] ?? " ";
            continue;
          }

          if (renderMode === "particles") {
            const particleGate = (row * 19 + column * 31 + renderFrame) % 7;
            line +=
              value > 1.08
                ? "●"
                : value > 0.72
                  ? particleGate < 5
                    ? "•"
                    : " "
                  : value > 0.34 && particleGate < 3
                    ? "·"
                    : " ";
            continue;
          }

          if (
            renderMode === "glitch" &&
            value > 0.22 &&
            (row * 31 + column * 17 + renderFrame) % 61 === 0
          ) {
            line += ["<", ">", "#", "/", "\\"][
              (row + column + renderFrame) % 5
            ];
            continue;
          }

          if (value > 0.7) {
            line += structuralGlyph(direction[cell], value > 1.14);
            continue;
          }

          const threshold =
            (bayer4[(row % 4) * 4 + (column % 4)] / 15 - 0.5) * 0.16;
          const level = clamp(value + threshold, 0, 0.99);
          const ramp = renderMode === "crt" ? crtRamp : toneRamp;
          const rampIndex = Math.floor(level * ramp.length);
          line += ramp[rampIndex] ?? " ";
        }
        lines.push(line);
      }

      output.textContent = lines.join("\n");
      output.dataset.clippedSamples = clippedSamples.toString();
      output.dataset.dimension = current.dimension;
      output.dataset.units = columns.toString();
      output.dataset.rows = rows.toString();
      output.dataset.geometry =
        current.dimension === "3d"
          ? spatialGeometryNames[current.preset]
          : current.preset;
    };

    const draw = (time: number) => {
      const delta = Math.min(100, time - previousClock);
      previousClock = time;
      if (runningRef.current) elapsedRef.current += delta;

      if (runningRef.current && time - previousFrame >= 50) {
        previousFrame = time;
        render();
      }

      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const resize = () => {
      configureGrid();
      render(true);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      previousClock = performance.now();
      if (visible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    configureGrid();
    render(true);
    renderNowRef.current = (clear = false) => render(clear);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (!reducedMotion && visible) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      renderNowRef.current = null;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, renderMode, renderUnits]);

  useEffect(() => {
    const nextSettings: SignalSettings = {
      preset: presetId,
      generator: preset.generator,
      dimension,
      frequency,
      xRatio: preset.xRatio,
      yRatio: preset.yRatio,
      phase: radians(preset.phaseDegrees),
      form: preset.form,
      rotation: radians(preset.rotationDegrees),
      scale,
      motion,
      copies,
    };
    settingsRef.current = nextSettings;
    renderNowRef.current?.(true);
    if (audioGraphRef.current) {
      updateAudioGraph(audioGraphRef.current, nextSettings);
    }
  }, [
    presetId,
    preset,
    dimension,
    frequency,
    scale,
    motion,
    copies,
  ]);

  useEffect(() => {
    runningRef.current = running;
    renderNowRef.current?.();
  }, [running]);

  useEffect(
    () => () => {
      if (suspendTimerRef.current !== null) {
        window.clearTimeout(suspendTimerRef.current);
      }
      const graph = audioGraphRef.current;
      if (graph) {
        graph.xOscillator.stop();
        graph.yOscillator.stop();
        void graph.context.close();
      }
    },
    [],
  );

  const createAudioGraph = () => {
    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return null;

    const context = new AudioContextClass({ latencyHint: "interactive" });
    const xOscillator = context.createOscillator();
    const yOscillator = context.createOscillator();
    const merger = context.createChannelMerger(2);
    const gain = context.createGain();

    gain.gain.value = 0;
    xOscillator.connect(merger, 0, 0);
    yOscillator.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(context.destination);

    const graph = { context, xOscillator, yOscillator, gain };
    updateAudioGraph(graph, settingsRef.current);
    xOscillator.start();
    yOscillator.start();
    audioGraphRef.current = graph;
    return graph;
  };

  const toggleAudio = async () => {
    if (suspendTimerRef.current !== null) {
      window.clearTimeout(suspendTimerRef.current);
      suspendTimerRef.current = null;
    }

    const graph = audioGraphRef.current ?? createAudioGraph();
    if (!graph) {
      setAudioAvailable(false);
      return;
    }

    if (audioEnabled) {
      const now = graph.context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(graph.gain.gain.value, now);
      graph.gain.gain.linearRampToValueAtTime(0, now + 0.06);
      setAudioEnabled(false);
      suspendTimerRef.current = window.setTimeout(() => {
        void graph.context.suspend();
        suspendTimerRef.current = null;
      }, 90);
      return;
    }

    try {
      await graph.context.resume();
      updateAudioGraph(graph, settingsRef.current);
      const now = graph.context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(0.0001, now);
      graph.gain.gain.exponentialRampToValueAtTime(outputGain, now + 0.08);
      setAudioEnabled(true);
    } catch {
      setAudioAvailable(false);
      setAudioEnabled(false);
    }
  };

  const applyPreset = (id: PresetId) => {
    const next = presets.find((item) => item.id === id) ?? defaultPreset;
    elapsedRef.current = 0;
    renderNowRef.current?.(true);
    setPresetId(next.id);
    setScale(next.scale);
    setMotion(next.motion);
  };

  const randomize = () => {
    const variant =
      randomVariants[Math.floor(Math.random() * randomVariants.length)];
    elapsedRef.current = 0;
    setPresetId(variant.preset);
    setScale(variant.scale);
    setMotion(variant.motion);
    setOctave(variant.octave);
    setRenderUnits(variant.units);
    setRunning(true);
  };

  const toggleDimension = () => {
    elapsedRef.current = 0;
    renderNowRef.current?.(true);
    setDimension((current) => (current === "2d" ? "3d" : "2d"));
  };

  return (
    <figure
      className="hero-art oscilloscope"
      aria-labelledby="oscilloscope-description"
    >
      <figcaption id="oscilloscope-description" className="sr-only">
        An interactive real-time ASCII XY oscilloscope instrument. Choose a
        curated geometric shape, switch between 2D and 3D geometry, tune its
        note, scale, motion, multiplier, and character-grid resolution, or
        enable optional stereo audio. Audio is muted by default.
      </figcaption>

      <div className="scope-header" aria-hidden="true">
        <span>XY / VECTOR {dimension.toUpperCase()}</span>
        <span>
          {preset.label} / {musicalNote.name} {formatFrequency(frequency)} HZ /{" "}
          {copies}X
        </span>
      </div>

      <div
        className="scope-stage"
        ref={containerRef}
        aria-hidden="true"
      >
        <div className="scope-axis scope-axis-x" />
        <div className="scope-axis scope-axis-y" />
        <pre className="oscilloscope-grid" ref={outputRef} />
        <span className="scope-origin">0</span>
      </div>

      <div className="scope-controls">
        <div className="scope-shapes" role="group" aria-label="Shape">
          {presets.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-label={`${item.label} shape`}
              aria-pressed={presetId === item.id}
              onClick={() => applyPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="scope-control">
          <span>Hz</span>
          <input
            aria-label="Frequency"
            aria-valuetext={`${musicalNote.name}, ${formatFrequency(frequency)} hertz`}
            type="range"
            min={musicalNotes[0].midi}
            max={musicalNotes[musicalNotes.length - 1].midi}
            step="1"
            value={musicalNote.midi}
            onChange={(event) => {
              const note = musicalNotes.find(
                (candidate) => candidate.midi === Number(event.target.value),
              );
              if (note) setFrequency(note.frequency);
            }}
          />
          <output>
            {musicalNote.name} {formatFrequency(frequency)}
          </output>
        </label>

        <label className="scope-control">
          <span>Scale</span>
          <input
            aria-label="Scale"
            type="range"
            min="0.7"
            max="1"
            step="0.01"
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          />
          <output>{Math.round(scale * 100)}%</output>
        </label>

        <label className="scope-control">
          <span>Motion</span>
          <input
            aria-label="Motion"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={motion}
            onChange={(event) => setMotion(Number(event.target.value))}
          />
          <output>{Math.round(motion * 100)}%</output>
        </label>

        <label className="scope-control">
          <span>Multiply</span>
          <input
            aria-label="Multiplier"
            type="range"
            min="0"
            max="3"
            step="1"
            value={octave}
            onChange={(event) => setOctave(Number(event.target.value))}
          />
          <output>{copies}×</output>
        </label>

        <label className="scope-control scope-units">
          <span>Units</span>
          <input
            aria-label="Render units"
            aria-valuetext={`${renderUnits} horizontal character units`}
            type="range"
            min={renderUnitOptions[0]}
            max={renderUnitOptions[renderUnitOptions.length - 1]}
            step="24"
            value={renderUnits}
            onChange={(event) => setRenderUnits(Number(event.target.value))}
          />
          <output>{renderUnits}</output>
        </label>

        <div className="scope-actions">
          <button
            className="scope-dimension"
            type="button"
            aria-label={
              dimension === "3d" ? "Show 2D geometry" : "Show 3D geometry"
            }
            title={dimension === "3d" ? "2D geometry" : "3D geometry"}
            aria-pressed={dimension === "3d"}
            onClick={toggleDimension}
          >
            <span className="scope-icon-3d" aria-hidden="true">
              3D
            </span>
          </button>
          <button
            type="button"
            aria-label={running ? "Pause animation" : "Run animation"}
            title={running ? "Pause" : "Run"}
            aria-pressed={running}
            onClick={() => setRunning((current) => !current)}
          >
            <span
              className={`scope-action-icon ${
                running ? "scope-icon-pause" : "scope-icon-play"
              }`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            aria-label="Randomize"
            title="Randomize"
            onClick={randomize}
          >
            <span
              className="scope-action-icon scope-icon-random"
              aria-hidden="true"
            />
          </button>
          <button
            className="scope-audio"
            type="button"
            aria-label={
              audioAvailable
                ? audioEnabled
                  ? "Mute audio"
                  : "Enable audio"
                : "Audio unavailable"
            }
            title={
              audioAvailable
                ? audioEnabled
                  ? "Mute audio"
                  : "Enable audio"
                : "Audio unavailable"
            }
            aria-pressed={audioEnabled}
            disabled={!audioAvailable}
            onClick={() => void toggleAudio()}
          >
            <span
              className={`scope-action-icon ${
                audioEnabled ? "scope-icon-audio-on" : "scope-icon-audio-off"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="scope-footer" aria-hidden="true">
        <span>SHAPE {preset.label}</span>
        <span>
          {dimension.toUpperCase()} / {renderUnits}U /{" "}
          {Math.round(scale * 100)}%
        </span>
        <span>OCT +{octave}</span>
      </div>
    </figure>
  );
}
