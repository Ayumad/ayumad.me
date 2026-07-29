import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";

interface Interval {
  name: string;
  numerator: number;
  denominator: number;
}

interface SignalSettings {
  interval: Interval;
  phase: number;
  harmonic: number;
}

interface AudioGraph {
  context: AudioContext;
  xOscillator: OscillatorNode;
  yOscillator: OscillatorNode;
  gain: GainNode;
}

const intervals: Interval[] = [
  { name: "FIFTH", numerator: 3, denominator: 2 },
  { name: "THIRD", numerator: 5, denominator: 4 },
  { name: "SEVENTH", numerator: 7, denominator: 5 },
  { name: "FOURTH", numerator: 4, denominator: 3 },
];

const bayer4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

const toneRamp = " .,:;+*#@";
const baseFrequency = 55;
const driftFrequency = 0.022;
const outputGain = 0.018;

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function structuralGlyph(angle: number, crossing: boolean) {
  if (crossing) return "+";

  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  if (normalized < Math.PI * 0.125 || normalized >= Math.PI * 0.875) return "-";
  if (normalized < Math.PI * 0.375) return "\\";
  if (normalized < Math.PI * 0.625) return "|";
  return "/";
}

function signal(angle: number, phase: number, harmonic: number) {
  return (
    (Math.sin(angle + phase) +
      harmonic * Math.sin(angle * 2 - phase * 0.5)) /
    (1 + harmonic)
  );
}

function createWave(
  context: AudioContext,
  phase: number,
  harmonic: number,
) {
  const scale = 1 / (1 + harmonic);
  const real = new Float32Array(3);
  const imaginary = new Float32Array(3);

  real[1] = Math.sin(phase) * scale;
  imaginary[1] = Math.cos(phase) * scale;
  real[2] = Math.sin(-phase * 0.5) * harmonic * scale;
  imaginary[2] = Math.cos(-phase * 0.5) * harmonic * scale;

  return context.createPeriodicWave(real, imaginary, {
    disableNormalization: true,
  });
}

function updateAudioGraph(graph: AudioGraph, settings: SignalSettings) {
  const { context, xOscillator, yOscillator } = graph;
  const now = context.currentTime;
  const xFrequency =
    settings.interval.numerator * baseFrequency + driftFrequency;
  const yFrequency = settings.interval.denominator * baseFrequency;

  xOscillator.frequency.cancelScheduledValues(now);
  yOscillator.frequency.cancelScheduledValues(now);

  if (context.state === "running") {
    xOscillator.frequency.setTargetAtTime(xFrequency, now, 0.015);
    yOscillator.frequency.setTargetAtTime(yFrequency, now, 0.015);
  } else {
    xOscillator.frequency.setValueAtTime(xFrequency, now);
    yOscillator.frequency.setValueAtTime(yFrequency, now);
  }

  xOscillator.setPeriodicWave(
    createWave(context, settings.phase, settings.harmonic),
  );
  yOscillator.setPeriodicWave(
    createWave(context, 0, settings.harmonic),
  );
}

export default function AsciiOscilloscope() {
  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const settingsRef = useRef<SignalSettings>({
    interval: intervals[0],
    phase: Math.PI / 2,
    harmonic: 0.12,
  });
  const renderNowRef = useRef<(() => void) | null>(null);
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const suspendTimerRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [intervalIndex, setIntervalIndex] = useState(0);
  const [phaseDegrees, setPhaseDegrees] = useState(90);
  const [harmonic, setHarmonic] = useState(0.12);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const reducedMotion = useReducedMotion();
  const interval = intervals[intervalIndex];
  const phase = (phaseDegrees / 180) * Math.PI;

  useEffect(() => {
    const container = containerRef.current;
    const output = outputRef.current;
    if (!container || !output) return;

    let columns = 64;
    let rows = 34;
    let intensity = new Float32Array(columns * rows);
    let direction = new Float32Array(columns * rows);
    let animationFrame = 0;
    let previousFrame = 0;
    let visible = !document.hidden;

    const configureGrid = () => {
      const width = container.clientWidth || 620;
      columns = width < 430 ? 42 : width < 610 ? 52 : 64;
      rows = width < 430 ? 28 : width < 610 ? 31 : 34;
      intensity = new Float32Array(columns * rows);
      direction = new Float32Array(columns * rows);
      output.style.setProperty("--scope-columns", columns.toString());
    };

    const plot = (x: number, y: number, angle: number, strength: number) => {
      const column = Math.round((x * 0.43 + 0.5) * (columns - 1));
      const row = Math.round((0.5 - y * 0.43) * (rows - 1));
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
          intensity[neighbor] + strength * 0.23,
        );
        direction[neighbor] = angle;
      }
    };

    const render = (time: number) => {
      const settings = settingsRef.current;
      const drift = reducedMotion
        ? 0
        : (time / 1000) * Math.PI * 2 * driftFrequency;
      const samples = 1700;

      for (let index = 0; index < intensity.length; index += 1) {
        intensity[index] *= 0.76;
      }

      let previousX = 0;
      let previousY = 0;

      for (let sample = 0; sample <= samples; sample += 1) {
        const theta = (sample / samples) * Math.PI * 2;
        const x = signal(
          settings.interval.numerator * theta + drift,
          settings.phase,
          settings.harmonic,
        ) * 0.94;
        const y = signal(
          settings.interval.denominator * theta,
          0,
          settings.harmonic,
        ) * 0.94;

        if (sample > 0) {
          const deltaX = x - previousX;
          const deltaY = y - previousY;
          const scaledDistance = Math.hypot(
            deltaX * columns * 0.43,
            deltaY * rows * 0.43,
          );
          const steps = Math.max(1, Math.ceil(scaledDistance));
          const angle = Math.atan2(-deltaY * rows, deltaX * columns);

          for (let step = 1; step <= steps; step += 1) {
            const amount = step / steps;
            plot(
              mix(previousX, x, amount),
              mix(previousY, y, amount),
              angle,
              0.58,
            );
          }
        }

        previousX = x;
        previousY = y;
      }

      const lines: string[] = [];
      for (let row = 0; row < rows; row += 1) {
        let line = "";
        for (let column = 0; column < columns; column += 1) {
          const cell = row * columns + column;
          const value = intensity[cell];

          if (value > 0.7) {
            line += structuralGlyph(direction[cell], value > 1.15);
            continue;
          }

          const threshold =
            (bayer4[(row % 4) * 4 + (column % 4)] / 15 - 0.5) * 0.16;
          const level = clamp(value + threshold, 0, 0.99);
          const rampIndex = Math.floor(level * toneRamp.length);
          line += toneRamp[rampIndex] ?? " ";
        }
        lines.push(line);
      }

      output.textContent = lines.join("\n");
    };

    const draw = (time: number) => {
      if (time - previousFrame >= 50) {
        previousFrame = time;
        render(time);
      }
      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const resize = () => {
      configureGrid();
      render(reducedMotion ? 0 : performance.now());
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    configureGrid();
    render(reducedMotion ? 0 : performance.now());
    renderNowRef.current = () =>
      render(reducedMotion ? 0 : performance.now());

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      renderNowRef.current = null;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  useEffect(() => {
    settingsRef.current = { interval, phase, harmonic };
    renderNowRef.current?.();
    if (audioGraphRef.current) {
      updateAudioGraph(audioGraphRef.current, settingsRef.current);
    }
  }, [interval, phase, harmonic]);

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

  const setFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    setPhaseDegrees(Math.round(x * 360));
    setHarmonic(Math.round((1 - y) * 35) / 100);
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

  return (
    <figure
      className="hero-art oscilloscope"
      aria-labelledby="oscilloscope-description"
    >
      <figcaption id="oscilloscope-description" className="sr-only">
        An interactive real-time ASCII XY oscilloscope for musical frequency
        ratios. Drag the trace or use the controls to change its phase and
        shape. Audio is muted by default.
      </figcaption>

      <div className="scope-header" aria-hidden="true">
        <span>XY / 120 BPM</span>
        <span>
          {interval.numerator}:{interval.denominator} {interval.name}
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
        <label className="scope-control scope-ratio">
          <span>Ratio</span>
          <select
            aria-label="Ratio"
            value={intervalIndex}
            onChange={(event) => setIntervalIndex(Number(event.target.value))}
          >
            {intervals.map((item, index) => (
              <option value={index} key={item.name}>
                {item.numerator}:{item.denominator} {item.name}
              </option>
            ))}
          </select>
        </label>

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
          <span>Shape</span>
          <input
            aria-label="Shape"
            type="range"
            min="0"
            max="0.35"
            step="0.01"
            value={harmonic}
            onChange={(event) => setHarmonic(Number(event.target.value))}
          />
          <output>{Math.round(harmonic * 100)}%</output>
        </label>

        <button
          className="scope-audio"
          type="button"
          aria-label={audioEnabled ? "Mute audio" : "Enable audio"}
          aria-pressed={audioEnabled}
          disabled={!audioAvailable}
          onClick={() => void toggleAudio()}
        >
          Audio {audioAvailable ? (audioEnabled ? "on" : "off") : "n/a"}
        </button>
      </div>

      <div className="scope-footer" aria-hidden="true">
        <span>
          X {Math.round(interval.numerator * baseFrequency + driftFrequency)} Hz
        </span>
        <span>PHASE {phaseDegrees}°</span>
        <span>Y {interval.denominator * baseFrequency} Hz</span>
      </div>
    </figure>
  );
}
