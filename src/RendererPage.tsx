/**
 * RendererPage.tsx — /renderer — standalone scope built on renderer-v2.
 * Signal → clock → frame buffer → adapters. One rAF, pauses off-screen.
 * Energy modulator: derived from live Spotify playback when available.
 */

import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useScope, type RenderMode } from "./renderer-v2/useScope";
import { renderModes } from "./renderMode";
import { useSpotifyPlayback } from "./useSpotifyPlayback";
import type { SignalSettings } from "./renderer-v2/signal";

interface PresetDef {
  id: string;
  label: string;
  generator: string;
  xRatio: number;
  yRatio: number;
  phaseDegrees: number;
  form: number;
  rotationDegrees: number;
  scale: number;
  motion: number;
}

/** Full preset table — geometry identical to AsciiOscilloscope presets. */
const presets: PresetDef[] = [
  { id: "star", label: "Star", generator: "star", xRatio: 5, yRatio: 1, phaseDegrees: 0, form: 0.86, rotationDegrees: 0, scale: 0.5, motion: 0.16 },
  { id: "hex", label: "Hexagon", generator: "polygon", xRatio: 6, yRatio: 1, phaseDegrees: 0, form: 1, rotationDegrees: 0, scale: 0.5, motion: 0.12 },
  { id: "square", label: "Square", generator: "polygon", xRatio: 4, yRatio: 1, phaseDegrees: 0, form: 1, rotationDegrees: 45, scale: 0.5, motion: 0.12 },
  { id: "circle", label: "Circle", generator: "lissajous", xRatio: 1, yRatio: 1, phaseDegrees: 90, form: 0, rotationDegrees: 0, scale: 0.5, motion: 0.14 },
  { id: "triangle", label: "Triangle", generator: "polygon", xRatio: 3, yRatio: 1, phaseDegrees: 0, form: 1, rotationDegrees: 0, scale: 0.5, motion: 0.12 },
  { id: "figure8", label: "Figure 8", generator: "lissajous", xRatio: 2, yRatio: 1, phaseDegrees: 90, form: 0, rotationDegrees: 0, scale: 0.5, motion: 0.16 },
  { id: "spiral", label: "Spiral", generator: "spiral", xRatio: 3, yRatio: 1, phaseDegrees: 0, form: 0, rotationDegrees: 0, scale: 0.5, motion: 0.18 },
  { id: "knot", label: "Torus Knot", generator: "lissajous", xRatio: 3, yRatio: 2, phaseDegrees: 90, form: 0, rotationDegrees: 0, scale: 0.5, motion: 0.2 },
  { id: "orbit", label: "Orbit", generator: "orbit", xRatio: 5, yRatio: 3, phaseDegrees: 0, form: 0.93, rotationDegrees: 0, scale: 0.5, motion: 0.18 },
  { id: "rose", label: "Rose", generator: "rose", xRatio: 5, yRatio: 1, phaseDegrees: 0, form: 0.92, rotationDegrees: 0, scale: 0.5, motion: 0.15 },
  { id: "octahedron", label: "Octahedron", generator: "polygon", xRatio: 4, yRatio: 1, phaseDegrees: 0, form: 1, rotationDegrees: 0, scale: 0.5, motion: 0.13 },
  { id: "icosahedron", label: "Icosahedron", generator: "star", xRatio: 5, yRatio: 1, phaseDegrees: 0, form: 0.94, rotationDegrees: 0, scale: 0.5, motion: 0.14 },
  { id: "mobius", label: "Mobius", generator: "lissajous", xRatio: 1, yRatio: 2, phaseDegrees: 90, form: 0.18, rotationDegrees: 0, scale: 0.5, motion: 0.18 },
  { id: "wave", label: "Wave Surface", generator: "wave", xRatio: 2, yRatio: 1, phaseDegrees: 0, form: 0, rotationDegrees: 0, scale: 0.5, motion: 0.16 },
];

const defaultSettings: SignalSettings = {
  preset: "figure8",
  generator: "lissajous",
  dimension: "2d",
  frequency: 220,
  xRatio: 2,
  yRatio: 1,
  phase: Math.PI / 2,
  form: 0,
  rotation: 0,
  scale: 0.5,
  motion: 0.16,
  copies: 1,
};

/**
 * Deterministic per-track energy [0..1]: playing state gates it, a hash of
 * title+artists gives each track its own character, and progress drift adds
 * slow evolution. Honest proxy — no audio analysis available client-side.
 */
function trackEnergy(
  playback: { isPlaying?: boolean; state?: string; title?: string | null; artists?: string[]; progressMs?: number | null; durationMs?: number | null } | null,
): number {
  if (!playback || playback.isPlaying !== true) return 0;
  const seedText = `${playback.title ?? ""}|${(playback.artists ?? []).join(",")}`;
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const trackChar = ((h >>> 0) % 1000) / 1000; // stable per track
  const progress = (playback.progressMs ?? 0) / Math.max(1, playback.durationMs ?? 1);
  const drift = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4);
  return Math.min(1, 0.35 + trackChar * 0.45 + drift * 0.2);
}

export default function RendererPage() {
  const initial = useMemo(
    () => ({
      settings: defaultSettings,
      mode: (localStorage.getItem("ayumad-renderer") as RenderMode) || "ascii",
      units: 140,
    }),
    [],
  );

  // Spotify energy flows through a ref so the clock reads it per-frame
  // without React re-renders being involved in the hot path.
  const { playback } = useSpotifyPlayback();
  const energyRef = useRef(0);
  energyRef.current = trackEnergy(playback);

  const { state, dispatch, hostRef, preRef, canvasRef } = useScope(initial, () => energyRef.current);
  const { settings, mode, units } = state;

  const applyPreset = (id: string) => {
    const p = presets.find((item) => item.id === id);
    if (!p) return;
    dispatch({
      type: "settings",
      patch: {
        preset: p.id,
        generator: p.generator,
        xRatio: p.xRatio,
        yRatio: p.yRatio,
        phase: (p.phaseDegrees * Math.PI) / 180,
        form: p.form,
        rotation: (p.rotationDegrees * Math.PI) / 180,
        scale: p.scale,
        motion: p.motion,
      },
    });
  };

  return (
    <section className="section-shell page-section renderer-page">
      <Link className="article-back" to="/">← Home</Link>
      <header className="article-header">
        <p className="label">01 / RENDERER</p>
        <h1>Renderer</h1>
        <p className="article-summary">
          A dedicated XY scope: one signal, one clock, five display adapters.
          This page is the standalone home for the renderer experiment.
        </p>
      </header>

      <div className="scope-stage" ref={hostRef} data-mode={mode}>
        <div className="scope-readout" aria-hidden="true">
          <span>{mode === "ascii" ? "XY MODE" : `${mode.toUpperCase()} ADAPTER`}</span>
          <span>{units} PTS</span>
          <span>{settings.frequency.toFixed(0)} Hz</span>
          <span aria-live="off">ENERGY {(energyRef.current * 100).toFixed(0)}%</span>
        </div>
        {mode === "ascii" ? (
          <pre className="oscilloscope-grid renderer-grid" ref={preRef} aria-label="Oscilloscope display" />
        ) : (
          <canvas className="renderer-canvas" ref={canvasRef} aria-label="Oscilloscope display" />
        )}
      </div>

      <div className="renderer-controls">
        <label className="scope-control">
          <span>Shape</span>
          <select
            aria-label="Shape"
            value={settings.preset}
            onChange={(event) => applyPreset(event.target.value)}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="scope-control">
          <span>Hz</span>
          <input
            aria-label="Frequency"
            type="range"
            min={40}
            max={880}
            step={1}
            value={settings.frequency}
            onChange={(event) =>
              dispatch({ type: "settings", patch: { frequency: Number(event.target.value) } })
            }
          />
        </label>

        <label className="scope-control">
          <span>Motion</span>
          <input
            aria-label="Motion"
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={settings.motion}
            onChange={(event) =>
              dispatch({ type: "settings", patch: { motion: Number(event.target.value) } })
            }
          />
        </label>

        <label className="scope-control">
          <span>Points</span>
          <input
            aria-label="Sample count"
            type="range"
            min={48}
            max={360}
            step={4}
            value={units}
            onChange={(event) => dispatch({ type: "units", units: Number(event.target.value) })}
          />
        </label>

        <div className="scope-control renderer-mode-group" role="group" aria-label="Display adapter">
          <span>Adapter</span>
          <div className="renderer-mode-buttons">
            {renderModes.map((item) => (
              <button
                key={item.value}
                type="button"
                className={mode === item.value ? "active" : ""}
                aria-pressed={mode === item.value}
                onClick={() => dispatch({ type: "mode", mode: item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
