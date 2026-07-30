import type { NowEntry } from "./siteContent";

export const nowUpdated = "July 30, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Building",
    marker: "01",
    title: "Hermes",
    description:
      "Refining the Mac mini-based personal agent around durable workflows, scoped memory, and interfaces that can change without rebuilding the backend.",
    detail: "Mac mini · private mesh · agent workflows",
  },
  {
    label: "Connecting",
    marker: "02",
    title: "RAG Assistant",
    description:
      "Designing a visibility-aware bridge between the Obsidian vault and Hermes so retrieval stays grounded without flattening the notebook into one unrestricted dataset.",
    detail: "Python · retrieval · metadata · Obsidian",
  },
  {
    label: "Configuring",
    marker: "03",
    title: "Two Bazzite PCs",
    description:
      "Giving two compact Radeon systems distinct roles with a controller-friendly Linux surface: one higher-end 4K machine and one secondary system for testing and play.",
    detail: "Bazzite · RX 9070 XT · RX 9060 XT",
  },
  {
    label: "Tuning",
    marker: "04",
    title: "Headphone Stack",
    description:
      "Listening across the LCD-X, Edition XS, and HD 660S2 from the FiiO K13 R2R, with each headphone kept for a clearly different presentation.",
    detail: "K13 R2R · LCD-X · Edition XS · HD 660S2",
  },
  {
    label: "Designing",
    marker: "05",
    title: "Ayumad.me",
    description:
      "Turning the site into a public map of projects, systems, gear, and writing while keeping the underlying private vault outside the deployment boundary.",
    detail: "React · TypeScript · motion · Markdown",
  },
  {
    label: "Researching",
    marker: "06",
    title: "Voice Assistant",
    description:
      "Exploring a local-first voice client that reuses Hermes instead of becoming a second assistant stack.",
    detail: "Speech-to-text · text-to-speech · wake word",
  },
];
