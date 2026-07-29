export type ProjectStatus = "completed" | "in-progress" | "planned";

export interface NavItem {
  label: string;
  path: string;
  index: string;
}

export interface ShowcaseTopic {
  title: string;
  eyebrow: string;
  summary: string;
  items: string[];
  ascii: string;
  tone: "lime" | "coral" | "cyan";
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  story: string;
  stack: string[];
  status: ProjectStatus;
  year: string;
}

export interface SystemLayer {
  index: string;
  title: string;
  description: string;
  items: string[];
  signal: string;
}

export interface NowEntry {
  label: string;
  marker: string;
  title: string;
  description: string;
  detail: string;
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
  external?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Home", path: "/", index: "00" },
  { label: "Work", path: "/showcase", index: "01" },
  { label: "Projects", path: "/projects", index: "02" },
  { label: "Systems", path: "/systems", index: "03" },
  { label: "Now", path: "/now", index: "04" },
  { label: "About", path: "/about", index: "05" },
  { label: "Contact", path: "/contact", index: "06" },
];

export const showcaseTopics: ShowcaseTopic[] = [
  {
    title: "AI + Notes",
    eyebrow: "Knowledge",
    summary:
      "Local models, retrieval, and note workflows for working with a personal knowledge base.",
    items: ["RAG assistants", "Obsidian workflows", "Local LLMs", "Memory systems"],
    ascii: "  notes ──> chunks\n               │\n  prompt ──> retrieve ──> answer",
    tone: "lime",
  },
  {
    title: "Homelab",
    eyebrow: "Infrastructure",
    summary:
      "One workstation divided into storage, compute, and self-hosted services.",
    items: ["Proxmox VE", "ZFS storage", "GPU passthrough", "Self-hosted services"],
    ascii: "  [ P520 ]\n    ├── storage / 4TB\n    ├── compute / RTX 3060\n    └── services / local",
    tone: "coral",
  },
  {
    title: "Audio",
    eyebrow: "Sound",
    summary:
      "DAC and amplifier chains, EQ, music tools, and visual representations of sound.",
    items: ["DAC / amp chains", "EQ tuning", "Music technology", "Audio visualization"],
    ascii: "  source ~~~> DAC ~~~> amp\n                         │\n                    headphones ))",
    tone: "cyan",
  },
];

export const projects: Project[] = [
  {
    slug: "owlbot",
    title: "Owlbot",
    summary: "An AI chatbot built to help Foothill College students find their way.",
    story:
      "Owlbot handles common questions about admissions, financial aid, course registration, and campus resources. The interesting problem was not only matching questions—it was translating a sprawling institutional knowledge base into answers students could actually use.",
    stack: ["Python", "NLP", "FAQ matching"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "delulubot",
    title: "DeluluBot",
    summary: "An emotion-aware chatbot built during CalHacks 10.0.",
    story:
      "DeluluBot detects emotional tone and changes how it responds. The hack explored an uneasy boundary: how far can a system simulate empathy before that simulation starts to feel genuine to the person using it?",
    stack: ["Python", "Sentiment analysis", "CalHacks"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "audio-visualization",
    title: "Audio Visualization",
    summary: "Cymatics and machine learning turned into a visual study of sound.",
    story:
      "This project combines Chladni pattern generation with machine learning to create visual representations of audio. It grew from a fascination with the strange bridge between physical vibration, music, and computer vision.",
    stack: ["Python", "TensorFlow", "Audio processing"],
    status: "completed",
    year: "2024",
  },
  {
    slug: "homelab-build",
    title: "Homelab Build",
    summary: "A Proxmox server stack for local AI, media, and owned infrastructure.",
    story:
      "A ThinkStation P520 anchors the build with a 4TB storage pool, an RTX 3060 passed through for local inference, and Docker-based services on Debian. The goal is a useful system whose layers stay understandable.",
    stack: ["Proxmox VE", "ZFS", "RTX 3060", "Debian"],
    status: "in-progress",
    year: "Now",
  },
];

export const systemLayers: SystemLayer[] = [
  {
    index: "L1",
    title: "AI",
    description:
      "Tools for retrieval, reasoning, and memory.",
    items: ["RAG", "Local LLMs", "Prompt workflows", "Hermes agent"],
    signal: "context → retrieve → reason",
  },
  {
    index: "L2",
    title: "Hardware",
    description:
      "Machines, storage, and compute for local services.",
    items: ["P520 homelab", "GPU planning", "Servers", "ZFS storage"],
    signal: "power → compute → services",
  },
  {
    index: "L3",
    title: "Audio",
    description:
      "Playback, production, measurement, and listening.",
    items: ["DAC / amp chains", "EQ", "Music production", "Measurement"],
    signal: "source → shape → listen",
  },
  {
    index: "L4",
    title: "Knowledge",
    description:
      "Notes and memory systems for connected ideas.",
    items: ["Obsidian vault", "Daily briefs", "Mnemosyne memory", "Public notes"],
    signal: "capture → connect → recall",
  },
];

export const futureIdeas = [
  "Spotify listening room",
  "Movie journal",
  "Steam activity",
  "Reading log",
  "Gear journal",
  "AI-ush lab",
];

export const socialLinks: SocialLink[] = [
  {
    label: "Email",
    href: "mailto:hello@ayumad.me",
    handle: "hello@ayumad.me",
  },
  {
    label: "GitHub",
    href: "https://github.com/ayumad",
    handle: "@ayumad",
    external: true,
  },
];

export const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Ayumad.me — Ayush Madhukar",
    description:
      "Projects and notes by Ayush Madhukar across AI, audio, hardware, and self-hosted systems.",
  },
  "/showcase": {
    title: "Work — Ayumad.me",
    description: "Work across AI and notes, homelab infrastructure, and audio.",
  },
  "/projects": {
    title: "Projects — Ayumad.me",
    description: "Selected projects by Ayush Madhukar, from useful chatbots to local infrastructure.",
  },
  "/systems": {
    title: "Systems — Ayumad.me",
    description: "The AI, hardware, audio, and knowledge layers behind Ayush's work.",
  },
  "/now": {
    title: "Now — Ayumad.me",
    description: "What Ayush is currently building, learning, tuning, and designing.",
  },
  "/about": {
    title: "About — Ayumad.me",
    description: "About Ayush Madhukar, a Computer Engineering student and lifelong technologist.",
  },
  "/contact": {
    title: "Contact — Ayumad.me",
    description: "Contact Ayush Madhukar by email or find his work on GitHub.",
  },
};
