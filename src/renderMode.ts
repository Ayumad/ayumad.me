import { createContext, useContext } from "react";

export const renderModes = [
  { value: "ascii", label: "ASCII" },
  { value: "dither", label: "Dither" },
  { value: "glitch", label: "Glitch" },
  { value: "particles", label: "Particles" },
  { value: "crt", label: "CRT" },
] as const;

export type RenderMode = (typeof renderModes)[number]["value"];

export function isRenderMode(value: string | undefined): value is RenderMode {
  return renderModes.some((mode) => mode.value === value);
}

export const RenderModeContext = createContext<RenderMode>("ascii");

export function useRenderMode() {
  return useContext(RenderModeContext);
}
