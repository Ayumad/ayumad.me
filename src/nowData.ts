import type { NowEntry } from "./siteContent";

export const nowUpdated = "July 29, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Building",
    marker: "01",
    title: "Hermes Agent",
    description:
      "Running Hermes from a headless Mac mini with 13 cron jobs — morning briefs, interview prep, session journals, question prompts. Multi-model routing between Mimo V2.5, Kimi K3, and DeepSeek depending on task complexity.",
    detail: "Mac mini · Mnemosyne · Tailscale · OpenCode Go",
  },
  {
    label: "Deploying",
    marker: "02",
    title: "RAG Assistant",
    description:
      "Indexing the Obsidian vault for retrieval-augmented question answering. The pipeline is done, deployment is pending. Goal: let Hermes pull context from notes without exposing the private parts of the vault.",
    detail: "Python · RAG · Embeddings · Obsidian",
  },
  {
    label: "Learning",
    marker: "03",
    title: "Custom Linux",
    description:
      "Building my own Arch and Hyprland setup on a Panasonic Let's Note, then using the X220t to learn NixOS. Different distros, different philosophies, same instinct — push the defaults until they break.",
    detail: "Arch · Hyprland · NixOS · old ThinkPads",
  },
  {
    label: "Tuning",
    marker: "04",
    title: "Two 2.1 Systems",
    description:
      "Working on speaker placement, crossover, and room correction at my desk and in the living room. Desktop chain: WiiM Ultra → ZA3 → Q150 + SB-1000 Pro. Living room: RX-V677 → Q150 + Kube 12b.",
    detail: "Q150 · SB-1000 Pro · Kube 12b · WiiM",
  },
  {
    label: "Designing",
    marker: "05",
    title: "Ayumad.me",
    description:
      "Turning this site into an accurate index of what I use, what I build, and what I am learning. This iteration adds field notes, a gear inventory, and a Hermes deep-dive.",
    detail: "TypeScript · motion · dither · ASCII",
  },
  {
    label: "Researching",
    marker: "06",
    title: "Voice Assistant",
    description:
      "Exploring wake-word detection, local STT with Whisper, and TTS with Piper. The constraint: no cloud APIs for the core loop. Everything local or self-hosted.",
    detail: "Whisper · Piper · Wake word · Local inference",
  },
];
