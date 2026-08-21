/**
 * useScope.ts — React binding. One hook, one clock, adapter swap on mode change.
 * Settings live in a reducer; URL + localStorage sync happen here.
 */

import { useEffect, useRef, useReducer, useState } from "react";
import { startClock, type ClockHandle } from "./clock";
import { asciiAdapter, canvasAdapter, type Adapter } from "./adapters";
import type { Frame, SignalSettings } from "./signal";

export type RenderMode = "ascii" | "dither" | "glitch" | "particles" | "crt";

export interface ScopeState {
  settings: SignalSettings;
  mode: RenderMode;
  units: number;
}

type Action =
  | { type: "settings"; patch: Partial<SignalSettings> }
  | { type: "mode"; mode: RenderMode }
  | { type: "units"; units: number };

function reducer(state: ScopeState, action: Action): ScopeState {
  switch (action.type) {
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "mode":
      return { ...state, mode: action.mode };
    case "units":
      return { ...state, units: action.units };
  }
}

export function useScope(initial: ScopeState, energy?: () => number) {
  const [state, dispatch] = useReducer(reducer, initial);
  const hostRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<ClockHandle | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Grid metrics for the ASCII adapter — measured from the real host element
  // after layout settles, and re-measured on resize. (A mount-time useMemo
  // ran before CSS applied and locked in a tiny 54x16 grid.)
  const [grid, setGrid] = useState({ cols: 80, rows: 24 });
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      // Probe with the SAME font the grid actually renders in (--mono), not
      // the root font — mismatch made cols/rows wildly wrong on wide screens.
      const probe = document.createElement("span");
      const preFont = getComputedStyle(host);
      probe.style.fontFamily = preFont.fontFamily;
      probe.style.fontSize = preFont.fontSize;
      probe.style.fontWeight = preFont.fontWeight;
      probe.style.whiteSpace = "pre";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.textContent = "@".repeat(10);
      document.body.appendChild(probe);
      const cw = probe.getBoundingClientRect().width / 10 || 9;
      probe.remove();
      const w = host.clientWidth || 800;
      const h = host.clientHeight || 400;
      setGrid((prev) => {
        const next = {
          cols: Math.max(20, Math.floor(w / cw)),
          rows: Math.max(10, Math.floor(h / (cw * 1.6))),
        };
        return next.cols === prev.cols && next.rows === prev.rows ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let adapter: Adapter;
    if (state.mode === "ascii") {
      const pre = preRef.current;
      if (!pre) return;
      adapter = asciiAdapter(pre, grid.cols, grid.rows);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      adapter = canvasAdapter(canvas, {
        mode: state.mode,
        trails: state.mode === "particles",
      });
    }

    const ro = new ResizeObserver(() => adapter.resize?.());
    ro.observe(host);

    clockRef.current = startClock({
      canvas: host,
      settings: () => stateRef.current.settings,
      units: () => stateRef.current.units,
      energy,
      draw: (frame: Frame) => adapter.draw(frame),
    });

    return () => {
      clockRef.current?.stop();
      ro.disconnect();
      adapter.destroy?.();
    };
  }, [state.mode, grid.cols, grid.rows]);

  // Persist mode
  useEffect(() => {
    localStorage.setItem("ayumad-renderer", state.mode);
    document.documentElement.dataset.renderer = state.mode;
  }, [state.mode]);

  return { state, dispatch, hostRef, preRef, canvasRef };
}
