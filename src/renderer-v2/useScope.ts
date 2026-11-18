/**
 * useScope.ts — React binding. One hook, one clock, adapter swap on mode change.
 * Settings live in a reducer; the site preference supplies the adapter.
 */

import { useEffect, useRef, useReducer, useState } from "react";
import { startClock, type ClockHandle } from "./clock";
import { asciiAdapter, canvasAdapter, type Adapter } from "./adapters";
import type { RenderMode } from "../renderMode";
import type { SignalSettings } from "./signal";

export interface ScopeState {
  settings: SignalSettings;
  units: number;
}

type Action =
  | { type: "settings"; patch: Partial<SignalSettings> }
  | { type: "units"; units: number };

function reducer(state: ScopeState, action: Action): ScopeState {
  switch (action.type) {
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "units":
      return { ...state, units: action.units };
  }
}

export function useScope(initial: ScopeState, mode: RenderMode, playing: boolean, energy: number) {
  const [state, dispatch] = useReducer(reducer, initial);
  const hostRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<ClockHandle | null>(null);
  const current = useRef({ state, playing, energy });
  useEffect(() => {
    current.current = { state, playing, energy };
    clockRef.current?.setPlaying(playing);
    clockRef.current?.renderOnce();
  }, [state, playing, energy]);

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
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let adapter: Adapter;
    if (mode === "ascii") {
      const pre = preRef.current;
      if (!pre) return;
      adapter = asciiAdapter(pre, grid.cols, grid.rows);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      adapter = canvasAdapter(canvas, {
        mode,
        trails: mode === "particles",
      });
    }

    const ro = new ResizeObserver(() => {
      adapter.resize?.();
      clockRef.current?.renderOnce();
    });
    ro.observe(host);

    clockRef.current = startClock({
      canvas: host,
      settings: () => current.current.state.settings,
      units: () => current.current.state.units,
      energy: () => current.current.energy,
      draw: (frame) => adapter.draw(frame),
    });

    clockRef.current.setPlaying(current.current.playing);

    return () => {
      clockRef.current?.stop();
      clockRef.current = null;
      ro.disconnect();
      adapter.destroy?.();
    };
  }, [mode, grid.cols, grid.rows]);

  return { state, dispatch, hostRef, preRef, canvasRef };
}
