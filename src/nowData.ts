import type { NowEntry } from "./siteContent";

export const nowUpdated = "July 29, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Building",
    marker: "01",
    title: "Hermes Server",
    description:
      "Running Hermes from a headless Mac mini so the rest of my devices can connect to one backend.",
    detail: "Mac mini · Hermes · Tailscale · remote clients",
  },
  {
    label: "Learning",
    marker: "02",
    title: "Custom Linux",
    description:
      "Building my own Arch and Hyprland setup on a Panasonic Let's Note, then using the X220t to learn NixOS.",
    detail: "Arch · Hyprland · NixOS · old ThinkPads",
  },
  {
    label: "Tuning",
    marker: "03",
    title: "Two 2.1 Systems",
    description:
      "Working on speaker placement, crossover, and room correction at my desk and in the living room.",
    detail: "Q150 · SB-1000 Pro · Kube 12b · WiiM",
  },
  {
    label: "Designing",
    marker: "04",
    title: "Ayumad.me",
    description:
      "Turning this site into an accurate index of what I use, what I build, and what I am learning.",
    detail: "TypeScript · motion · dither · ASCII",
  },
];
