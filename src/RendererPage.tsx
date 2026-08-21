/**
 * RendererPage.tsx — /renderer — standalone scope built on renderer-v2.
 * Signal → clock → frame buffer → adapters. One rAF, pauses off-screen.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useScope, type RenderMode } from "./renderer-v2/useScope";
import { renderModes } from "./renderMode";
import type { SignalSettings } from "./renderer-v2/signal";

interface PresetDef {
  id: string;
  label: string;
  generator: string;
  xRatio: number;
  yRatio: number;
  form: number;
  scale: number;
  motion: number;
}

const presets: PresetDef[] = [
  { id: "wave", label: "Wave", generator: "lissajous", xRatio: 1, yRatio: 1, form: 0, scale: 0.85, motion: 1 },
  { id: "figure8", label: "Figure 8", generator: "lissajous", xRatio: 1, yRatio: 2, form: 0, scale: 0.8, motion: 1 },
  { id: "lissajous", label: "Lissajous 3:2", generator: "lissajous", xRatio: 3, yRatio: 2, form: 0.15, scale: 0.75, motion: 0.6 },
  { id: "star", label: "Star", generator: "star", xRatio: 1, yRatio: 1, form: 0.5, scale: 0.9, motion: 0.4 },
  { id: "hex", label: "Hexagon", generator: "polygon", xRatio: 1, yRatio: 1, form: 0, scale: 0.9, motion: 0.4 },
];

const defaultSettings: SignalSettings = {
  preset: "figure8",
  generator: "lissajous",
  dimension: "2d",
  frequency: 220,
  xRatio: 1,
  yRatio: 2,
  phase: 0,
  form: 0,
  rotation: 0,
  scale: 0.8,
  motion: 1,
  copies: 1,
};

export default function RendererPage() {
  const initial = useMemo(
    () => ({
      settings: defaultSettings,
      mode: (localStorage.getItem("ayumad-renderer") as RenderMode) || "ascii",
      units: 140,
    }),
    [],
  );

  const { state, dispatch, hostRef, preRef, canvasRef } = useScope(initial);
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
        form: p.form,
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
