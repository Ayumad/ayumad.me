import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";
import { useRenderMode } from "./renderMode";

type PresetId =
  | "line"
  | "circle"
  | "eight"
  | "knot"
  | "rose"
  | "star"
  | "polygon"
  | "orbit";
type GeneratorId = "lissajous" | "rose" | "star" | "polygon" | "orbit";

interface SignalSettings {
  preset: PresetId;
  generator: GeneratorId;
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

interface Point {
  x: number;
  y: number;
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
    id: "line",
    label: "LINE",
    generator: "lissajous",
    xRatio: 1,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.04,
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
    motion: 0.08,
  },
  {
    id: "eight",
    label: "EIGHT",
    generator: "lissajous",
    xRatio: 2,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.04,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.15,
  },
  {
    id: "knot",
    label: "KNOT",
    generator: "lissajous",
    xRatio: 3,
    yRatio: 2,
    phaseDegrees: 90,
    form: 0.12,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.22,
  },
  {
    id: "rose",
    label: "ROSE",
    generator: "rose",
    xRatio: 5,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.78,
    rotationDegrees: -90,
    scale: 0.96,
    motion: 0.18,
  },
  {
    id: "star",
    label: "STAR",
    generator: "star",
    xRatio: 5,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.82,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.12,
  },
  {
    id: "polygon",
    label: "POLYGON",
    generator: "polygon",
    xRatio: 6,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.9,
    rotationDegrees: -90,
    scale: 0.96,
    motion: 0.1,
  },
  {
    id: "orbit",
    label: "ORBIT",
    generator: "orbit",
    xRatio: 5,
    yRatio: 3,
    phaseDegrees: 0,
    form: 0.58,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.2,
  },
];

const defaultPreset = presets[3];
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
const musicalNotes: MusicalNote[] = Array.from(
  { length: 32 },
  (_, index) => {
    const midi = 26 + index;
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

function signalPoint(
  theta: number,
  settings: SignalSettings,
  time: number,
): Point {
  const normalizedTheta =
    ((theta / (Math.PI * 2)) % 1 + 1) % 1;
  const copyPosition = normalizedTheta * settings.copies;
  const copyIndex = Math.min(
    settings.copies - 1,
    Math.floor(copyPosition),
  );
  const localTheta =
    (copyPosition - Math.floor(copyPosition)) * Math.PI * 2;
  const livePhase = settings.phase + time * settings.motion * 0.28;
  const liveRotation = settings.rotation + time * settings.motion * 0.08;
  let point: Point;

  if (settings.generator === "rose") {
    const radius =
      (1 - settings.form) * 0.84 +
      settings.form * Math.cos(Math.max(2, settings.xRatio) * localTheta + livePhase);
    const angle = Math.max(1, settings.yRatio) * localTheta;
    point = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
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

function createStereoWaves(
  context: AudioContext,
  settings: SignalSettings,
  time: number,
) {
  const xSamples = new Float32Array(audioSamples);
  const ySamples = new Float32Array(audioSamples);

  for (let sample = 0; sample < audioSamples; sample += 1) {
    const theta = (sample / audioSamples) * Math.PI * 2;
    const point = signalPoint(theta, settings, time);
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

function updateAudioGraph(
  graph: AudioGraph,
  settings: SignalSettings,
  time: number,
) {
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

  const { xWave, yWave } = createStereoWaves(context, settings, time);
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
  const draggingRef = useRef(false);
  const elapsedRef = useRef(0);
  const runningRef = useRef(true);
  const audioEnabledRef = useRef(false);
  const [presetId, setPresetId] = useState<PresetId>(initialSettings.preset);
  const [generator, setGenerator] = useState<GeneratorId>(
    initialSettings.generator,
  );
  const [frequency, setFrequency] = useState(initialSettings.frequency);
  const [xRatio, setXRatio] = useState(initialSettings.xRatio);
  const [yRatio, setYRatio] = useState(initialSettings.yRatio);
  const [phaseDegrees, setPhaseDegrees] = useState(90);
  const [form, setForm] = useState(initialSettings.form);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [scale, setScale] = useState(initialSettings.scale);
  const [motion, setMotion] = useState(initialSettings.motion);
  const [octave, setOctave] = useState(0);
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
    let lastAudioUpdate = 0;
    let visible = !document.hidden;

    const configureGrid = () => {
      const width = container.clientWidth || 680;
      const height = container.clientHeight || 390;
      columns = width < 430 ? 48 : width < 610 ? 60 : 72;
      const fontSize = Math.min(14.5, (width / columns) * 1.58);
      rows = Math.round(clamp(height / (fontSize * 0.94), 24, 34));
      intensity = new Float32Array(columns * rows);
      direction = new Float32Array(columns * rows);
      output.style.setProperty("--scope-columns", columns.toString());
      output.style.setProperty("--scope-font-size", `${fontSize}px`);
    };

    const plot = (x: number, y: number, angle: number, strength: number) => {
      const column = Math.round((x * 0.495 + 0.5) * (columns - 1));
      const row = Math.round((0.5 - y * 0.495) * (rows - 1));
      if (column < 1 || column >= columns - 1 || row < 1 || row >= rows - 1) return;

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

      let previousPoint = signalPoint(0, current, time);

      for (let sample = 1; sample <= samples; sample += 1) {
        const theta = (sample / samples) * Math.PI * 2;
        const point = signalPoint(theta, current, time);
        const deltaX = point.x - previousPoint.x;
        const deltaY = point.y - previousPoint.y;
        const flyback = current.copies > 1 && Math.hypot(deltaX, deltaY) > 0.55;
        if (flyback) {
          previousPoint = point;
          continue;
        }
        const scaledDistance = Math.hypot(
          deltaX * columns * 0.495,
          deltaY * rows * 0.495,
        );
        const steps = Math.max(1, Math.ceil(scaledDistance));
        const angle = Math.atan2(-deltaY * rows, deltaX * columns);

        for (let step = 1; step <= steps; step += 1) {
          const amount = step / steps;
          plot(
            mix(previousPoint.x, point.x, amount),
            mix(previousPoint.y, point.y, amount),
            angle,
            0.6,
          );
        }

        previousPoint = point;
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
    };

    const draw = (time: number) => {
      const delta = Math.min(100, time - previousClock);
      previousClock = time;
      if (runningRef.current) elapsedRef.current += delta;

      if (runningRef.current && time - previousFrame >= 50) {
        previousFrame = time;
        render();
      }

      if (
        audioEnabledRef.current &&
        runningRef.current &&
        time - lastAudioUpdate >= 250 &&
        audioGraphRef.current
      ) {
        lastAudioUpdate = time;
        updateAudioGraph(
          audioGraphRef.current,
          settingsRef.current,
          elapsedRef.current / 1000,
        );
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
  }, [reducedMotion, renderMode]);

  useEffect(() => {
    const nextSettings: SignalSettings = {
      preset: presetId,
      generator,
      frequency,
      xRatio,
      yRatio,
      phase: radians(phaseDegrees),
      form,
      rotation: radians(rotationDegrees),
      scale,
      motion,
      copies,
    };
    settingsRef.current = nextSettings;
    renderNowRef.current?.(true);
    if (audioGraphRef.current) {
      updateAudioGraph(
        audioGraphRef.current,
        nextSettings,
        elapsedRef.current / 1000,
      );
    }
  }, [
    presetId,
    generator,
    frequency,
    xRatio,
    yRatio,
    phaseDegrees,
    form,
    rotationDegrees,
    scale,
    motion,
    copies,
  ]);

  useEffect(() => {
    runningRef.current = running;
    renderNowRef.current?.();
  }, [running]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

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
    updateAudioGraph(graph, settingsRef.current, elapsedRef.current / 1000);
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
      audioEnabledRef.current = false;
      setAudioEnabled(false);
      suspendTimerRef.current = window.setTimeout(() => {
        void graph.context.suspend();
        suspendTimerRef.current = null;
      }, 90);
      return;
    }

    try {
      await graph.context.resume();
      updateAudioGraph(graph, settingsRef.current, elapsedRef.current / 1000);
      const now = graph.context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(0.0001, now);
      graph.gain.gain.exponentialRampToValueAtTime(outputGain, now + 0.08);
      audioEnabledRef.current = true;
      setAudioEnabled(true);
    } catch {
      setAudioAvailable(false);
      setAudioEnabled(false);
    }
  };

  const applyPreset = (id: PresetId) => {
    const next = presets.find((item) => item.id === id) ?? defaultPreset;
    setPresetId(next.id);
    setGenerator(next.generator);
    setXRatio(next.xRatio);
    setYRatio(next.yRatio);
    setPhaseDegrees(next.phaseDegrees);
    setForm(next.form);
    setRotationDegrees(next.rotationDegrees);
    setScale(next.scale);
    setMotion(next.motion);
  };

  const randomize = () => {
    const next = presets[Math.floor(Math.random() * presets.length)];
    const pointBased =
      next.generator === "star" || next.generator === "polygon";
    elapsedRef.current = 0;
    setPresetId(next.id);
    setGenerator(next.generator);
    setXRatio(
      pointBased
        ? 3 + Math.floor(Math.random() * 7)
        : 1 + Math.floor(Math.random() * 9),
    );
    setYRatio(1 + Math.floor(Math.random() * 5));
    setPhaseDegrees(Math.round(Math.random() * 360));
    setForm(Number((0.15 + Math.random() * 0.8).toFixed(2)));
    setRotationDegrees(Math.round(-180 + Math.random() * 360));
    setScale(Number((0.72 + Math.random() * 0.28).toFixed(2)));
    setMotion(Number((0.04 + Math.random() * 0.66).toFixed(2)));
    setOctave(Math.floor(Math.random() * 4));
    setRunning(true);
  };

  const setFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    setPhaseDegrees(Math.round(x * 360));
    setForm(Math.round((1 - y) * 100) / 100);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setFromPointer(event);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setFromPointer(event);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const updateRatio = (
    value: string,
    setter: (next: number) => void,
  ) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) setter(Math.round(clamp(parsed, 1, 9)));
  };

  return (
    <figure
      className="hero-art oscilloscope"
      aria-labelledby="oscilloscope-description"
    >
      <figcaption id="oscilloscope-description" className="sr-only">
        An interactive real-time ASCII XY oscilloscope instrument. Choose a
        geometric shape, change its frequency and geometry, multiply it into
        octave copies, drag the trace, or use the controls. Stereo audio is
        muted by default.
      </figcaption>

      <div className="scope-header" aria-hidden="true">
        <span>XY / VECTOR</span>
        <span>
          {preset.label} / {musicalNote.name} {formatFrequency(frequency)} HZ /{" "}
          {copies}X
        </span>
      </div>

      <div
        className="scope-stage"
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        aria-hidden="true"
      >
        <div className="scope-axis scope-axis-x" />
        <div className="scope-axis scope-axis-y" />
        <pre className="oscilloscope-grid" ref={outputRef} />
        <span className="scope-origin">0</span>
        <span className="scope-drag">DRAG</span>
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

        <div
          className="scope-control scope-ratio"
          role="group"
          aria-labelledby="scope-ratio-label"
        >
          <span id="scope-ratio-label">Ratio</span>
          <input
            aria-label="X ratio"
            type="number"
            min="1"
            max="9"
            value={xRatio}
            onChange={(event) => updateRatio(event.target.value, setXRatio)}
          />
          <span aria-hidden="true">:</span>
          <input
            aria-label="Y ratio"
            type="number"
            min="1"
            max="9"
            value={yRatio}
            onChange={(event) => updateRatio(event.target.value, setYRatio)}
          />
        </div>

        <label className="scope-control">
          <span>Phase</span>
          <input
            aria-label="Phase"
            type="range"
            min="0"
            max="360"
            step="1"
            value={phaseDegrees}
            onChange={(event) => setPhaseDegrees(Number(event.target.value))}
          />
          <output>{phaseDegrees}°</output>
        </label>

        <label className="scope-control">
          <span>Form</span>
          <input
            aria-label="Form"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={form}
            onChange={(event) => setForm(Number(event.target.value))}
          />
          <output>{Math.round(form * 100)}%</output>
        </label>

        <label className="scope-control">
          <span>Rotate</span>
          <input
            aria-label="Rotation"
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotationDegrees}
            onChange={(event) => setRotationDegrees(Number(event.target.value))}
          />
          <output>{rotationDegrees}°</output>
        </label>

        <label className="scope-control">
          <span>Scale</span>
          <input
            aria-label="Scale"
            type="range"
            min="0.55"
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
          <span>Copies</span>
          <input
            aria-label="Copies"
            type="range"
            min="0"
            max="3"
            step="1"
            value={octave}
            onChange={(event) => setOctave(Number(event.target.value))}
          />
          <output>{copies}×</output>
        </label>

        <div className="scope-actions">
          <button
            type="button"
            aria-label={running ? "Pause animation" : "Run animation"}
            aria-pressed={running}
            onClick={() => setRunning((current) => !current)}
          >
            {running ? "Pause" : "Run"}
          </button>
          <button type="button" onClick={randomize}>
            Random
          </button>
          <button
            className="scope-audio"
            type="button"
            aria-label={audioEnabled ? "Mute audio" : "Enable audio"}
            aria-pressed={audioEnabled}
            disabled={!audioAvailable}
            onClick={() => void toggleAudio()}
          >
            {audioAvailable ? (audioEnabled ? "Audio on" : "Audio off") : "No audio"}
          </button>
        </div>
      </div>

      <div className="scope-footer" aria-hidden="true">
        <span>X:Y {xRatio}:{yRatio}</span>
        <span>PHASE {phaseDegrees}°</span>
        <span>OCT +{octave}</span>
      </div>
    </figure>
  );
}
