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
  tone: "lime" | "violet" | "cyan";
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  story: string;
  stack: string[];
  status: ProjectStatus;
  year: string;
  featured?: boolean;
  liveUrl?: string;
}

export interface SystemLayer {
  index: string;
  title: string;
  description: string;
  items: string[];
  signal: string;
}

export interface HermesSection {
  title: string;
  description: string;
  items: string[];
}

export interface GearItem {
  name: string;
  role: string;
  status: "active" | "archived" | "sold";
}

export interface GearCategory {
  category: string;
  items: GearItem[];
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
  external?: boolean;
}

export interface HomeContent {
  intro: string;
  topics: string[];
  current: {
    title: string;
    description: string;
  };
}

export interface NowEntry {
  label: string;
  marker: string;
  title: string;
  description: string;
  detail: string;
}

export interface AboutContent {
  intro: string;
  story: string[];
  education: { school: string; program: string }[];
  skills: string[];
  interests: string[];
}

export const navItems: NavItem[] = [
  { label: "Home", path: "/", index: "00" },
  { label: "Projects", path: "/projects", index: "01" },
  { label: "Gear", path: "/gear", index: "02" },
  { label: "Journal", path: "/journal", index: "03" },
  { label: "Taste", path: "/taste", index: "04" },
  { label: "About", path: "/about", index: "05" },
];

export const homeContent: HomeContent = {
  intro:
    "I break hardware and software until I understand it. Lately that's been local AI, Proxmox, Linux, audio systems, and cameras.",
  topics: ["AI + Notes", "Servers", "Audio", "Linux"],
  current: {
    title: "Hermes",
    description:
      "An AI agent running on a Mac mini. Daily briefs, memory, cron automations, multi-model routing — all connected over Tailscale.",
  },
};

export const showcaseTopics: ShowcaseTopic[] = [
  {
    title: "AI + Notes",
    eyebrow: "Tools",
    summary:
      "Hermes runs on a headless Mac mini and connects from every device over Tailscale. It handles daily briefs, memory, cron automations, and multi-model routing — all from one backend.",
    items: ["Hermes", "Tailscale", "Mnemosyne", "Obsidian", "OpenCode Go"],
    ascii:
      "  DESKTOP ───────┐\n  LAPTOP  ── VPN ├──> MAC MINI\n  IPAD    ───────┘       └── HERMES\n                                  └── MNEMOSYNE",
    tone: "lime",
  },
  {
    title: "Homelab",
    eyebrow: "Server",
    summary:
      "My ThinkStation P520 runs Proxmox. I use it for storage, local AI, media, and services, with the important parts separated from whatever I'm testing that week.",
    items: ["ThinkStation P520", "Proxmox + ZFS", "GPU passthrough", "Docker / LXC"],
    ascii:
      "  [ THINKSTATION P520 ]\n       ├── ZFS ────── 4 TB\n       ├── VM ─────── GPU\n       └── LXC ────── SERVICES",
    tone: "violet",
  },
  {
    title: "Audio",
    eyebrow: "Listening",
    summary:
      "I keep separate desktop and living-room 2.1 systems, compare headphones and IEMs, and spend a lot of time getting placement, crossover, and EQ right. The oscilloscope above is how I see sound.",
    items: ["WiiM Ultra + ZA3", "KEF Q150", "Kube 12b / SB-1000 Pro", "Dusk / Daybreak / Zero:RED"],
    ascii:
      "  DESK   : Q150 ── ZA3 ── WIIM\n                    └───── SB-1000 PRO\n  ROOM   : Q150 ── RX-V677 ── KUBE 12b",
    tone: "cyan",
  },
];

export const projects: Project[] = [
  {
    slug: "crt-lab",
    title: "CRT Lab",
    summary:
      "A local-first signal workstation for routing patterns, images, video, audio, web pages, and emulation through an adjustable CRT display.",
    story:
      "CRT Lab treats whatever you have as an input signal: generated test patterns, local images and video, MP3 waveforms, browser URLs, or user-owned ROMs. The current build combines CRT and oscilloscope views with phosphor presets, live scanline and geometry controls, aspect-ratio locking, drag-and-drop, and fullscreen playback. The goal is a reliable creative lab with clear source errors, local preset storage, keyboard and gamepad input, strong accessibility, and optional capture tools — without uploading source media.",
    stack: ["Signal processing", "Browser media", "EmulatorJS", "Local-first"],
    status: "in-progress",
    year: "Now",
    liveUrl: "https://crt-lab-xi.vercel.app/",
  },
  {
    slug: "hermes-agent",
    title: "Hermes Agent",
    summary: "An AI agent that runs my daily operations — briefs, memory, cron jobs, and multi-model routing.",
    story:
      "Hermes handles morning briefs, interview prep, session journals, and scheduled automations. It runs on a headless Mac mini with Mnemosyne for persistent memory, connects to Telegram and the WebUI, and routes between models depending on the task. The hard part was making it useful without making it expensive.",
    stack: ["Hermes", "Mnemosyne", "Tailscale", "OpenCode Go", "Telegram"],
    status: "in-progress",
    year: "Now",
    featured: true,
  },
  {
    slug: "vault-refactor",
    title: "Vault Refactor",
    summary: "Refactoring my Obsidian vault into a lean, git-backed, self-managing knowledge base.",
    story:
      "The vault had missing plugins, stale paths, and too much historical material mixed into the active notes. I rewired it around a clear structure, restored the required plugin stack, connected it to versioned history, and made the agent instructions describe the current layout. The goal is a knowledge base that stays understandable as it grows.",
    stack: ["Obsidian", "Git", "GitHub", "Hermes"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "rag-assistant",
    title: "RAG Assistant",
    summary: "A retrieval-augmented assistant that answers questions from my Obsidian vault.",
    story:
      "The RAG assistant indexes the Obsidian vault and answers questions grounded in actual notes — build logs, device configs, and project decisions. The indexing pipeline is done; deployment is pending. The point is letting Hermes pull context from my notes without exposing the private parts of the vault to a model.",
    stack: ["Python", "RAG", "Obsidian", "Embeddings"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "daily-brief",
    title: "Daily Brief",
    summary: "Cron jobs that deliver a morning briefing from the vault, tasks, email, and calendar.",
    story:
      "Hermes compiles a brief from the vault, Google Tasks, email, and calendar. Question prompts run through the day, interview prep arrives in the evening, and a session journal closes out the day. It is designed to be set up once and then maintained as infrastructure.",
    stack: ["Hermes Cron", "Obsidian", "Google Tasks", "Google Workspace"],
    status: "completed",
    year: "2026",
  },
  {
    slug: "homelab-build",
    title: "Homelab Build",
    summary: "A P520 running Proxmox for storage, local AI, media, and services.",
    story:
      "The ThinkStation P520 has a ZFS pool and a GPU-passthrough VM. Core services stay separate from experiments so I can break one thing without taking everything else down. The RTX 3060 is the always-on local inference card.",
    stack: ["Proxmox VE", "ZFS", "GPU passthrough", "Docker"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "voice-assistant",
    title: "Voice Assistant",
    summary: "Research into a voice-first interface for Hermes using local speech tools.",
    story:
      "The idea is a wake-word interface that routes speech to local speech-to-text, runs through Hermes, and answers with text-to-speech. The constraint is cost: the core loop should stay local or self-hosted.",
    stack: ["Python", "Whisper", "Piper TTS", "Wake word"],
    status: "planned",
    year: "Planned",
  },
  {
    slug: "owlbot",
    title: "Owlbot",
    summary: "An AI chatbot built to help Foothill College students find their way.",
    story:
      "Owlbot answers questions about admissions, financial aid, registration, and campus resources. The hard part was turning a sprawling institutional knowledge base into answers students could actually use.",
    stack: ["Python", "NLP", "FAQ matching"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "delulubot",
    title: "DeluluBot",
    summary: "An emotion-aware chatbot built during CalHacks 10.0.",
    story:
      "DeluluBot detects sentiment and changes how it responds. It was a short hackathon build and a useful first test of how much tone changes the way a chatbot feels to use.",
    stack: ["Python", "Sentiment analysis", "CalHacks"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "audio-visualization",
    title: "Audio Visualization",
    summary: "Cymatics and machine learning turned into a visual study of sound.",
    story:
      "I combined Chladni-style pattern generation with machine learning to make audio visible. Signal processing, computer vision, and music came together in one project, which later became a Principia STEM Magazine article.",
    stack: ["Python", "TensorFlow", "Audio processing"],
    status: "completed",
    year: "2024",
  },
];

export const systemLayers: SystemLayer[] = [
  {
    index: "L1",
    title: "AI",
    description: "One agent backend, several clients, and my own notes when they are useful.",
    items: ["Hermes server", "Tailscale clients", "OpenCode Go + local models", "Obsidian retrieval"],
    signal: "notes → tools → model → client",
  },
  {
    index: "L2",
    title: "Hardware",
    description: "New and old machines, each set up for a specific job.",
    items: [
      "P520 / Proxmox",
      "Mac mini / Hermes",
      "RTX 5080 desktop / 4K OLED",
      "Zephyrus G14 / RTX 5070 Ti",
      "CF-SV1 / Omarchy + X220t / NixOS",
      "X-T4 / 18–55 + X100VI",
    ],
    signal: "machine → operating system → job",
  },
  {
    index: "L3",
    title: "Audio",
    description: "Two speaker systems plus the headphones and IEMs I compare between them.",
    items: [
      "Desktop: WiiM / ZA3 / Q150 / SB-1000 Pro",
      "Living room: RX-V677 / Q150 / Kube 12b",
      "FiiO K13 R2R",
      "Dusk / Daybreak / Zero:RED",
    ],
    signal: "source → DAC → amp → room",
  },
  {
    index: "L4",
    title: "Knowledge",
    description: "A versioned Obsidian vault structured by agent files, with public writing as a separate layer.",
    items: ["Obsidian vault", "Agent-defined structure", "Derived views (Bases)", "Curated public writing"],
    signal: "question → test → note → reuse",
  },
];

export const hermesSections: HermesSection[] = [
  {
    title: "What Hermes Does",
    description:
      "Hermes is my personal AI agent. It runs the daily operations — morning briefs, interview prep, session journals, and scheduled automations — from a headless Mac mini, and connects from every device over Tailscale.",
    items: [
      "Morning brief — vault, tasks, email, and calendar",
      "Interview prep and question prompts",
      "Session journal and weekly review support",
      "Task and project dispatch",
      "Memory consolidation and vault maintenance",
    ],
  },
  {
    title: "Memory System",
    description:
      "Mnemosyne holds the persistent memory — facts, preferences, insights, and relationships that survive across sessions. Local embeddings keep recall fast, and a knowledge graph connects related memories.",
    items: [
      "Local embeddings for recall",
      "Provider tools for memory and graph queries",
      "Persona facts injected into system prompts",
      "Session search over the message store",
      "Nightly consolidation of working memories",
    ],
  },
  {
    title: "Multi-Model Routing",
    description:
      "Hermes routes between models based on task complexity and cost. Routine work stays lightweight while harder reasoning can use a stronger model when needed.",
    items: [
      "Daily-driver model for routine work",
      "Stronger reasoning model for complex tasks",
      "Cheap tool-heavy fallback model",
      "Provider fallback chains for reliability",
    ],
  },
  {
    title: "Infrastructure",
    description:
      "The system is built around an always-on Mac mini, scheduled jobs, connected clients, and a private vault. Test once, then let the routine run.",
    items: [
      "Cron scheduler with script-first jobs",
      "Telegram and WebUI surfaces",
      "LaunchAgent auto-start on the Mac mini",
      "Tailscale mesh for cross-device access",
      "Obsidian vault with GitHub history",
    ],
  },
];

export const gearCategories: GearCategory[] = [
  {
    category: "Computers",
    items: [
      { name: "Mac mini", role: "Always-on Hermes server, Tailscale node", status: "active" },
      { name: "ThinkStation P520", role: "Proxmox host, ZFS storage, GPU passthrough", status: "active" },
      { name: "RTX 5080 Desktop", role: "Primary desktop, 4K OLED, gaming", status: "active" },
      { name: "Zephyrus G14", role: "Portable, RTX 5070 Ti", status: "active" },
      { name: "Panasonic CF-SV1", role: "Arch Linux + Hyprland daily driver", status: "active" },
      { name: "Lenovo X220t", role: "NixOS learning machine", status: "active" },
    ],
  },
  {
    category: "Audio — Desktop",
    items: [
      { name: "WiiM Ultra", role: "Network streamer / DAC", status: "active" },
      { name: "Aiyima ZA3", role: "Desktop amplifier", status: "active" },
      { name: "KEF Q150", role: "Desktop speakers (pair)", status: "active" },
      { name: "SVS SB-1000 Pro", role: "Desktop subwoofer", status: "active" },
      { name: "FiiO K13 R2R", role: "Headphone DAC/amp", status: "active" },
    ],
  },
  {
    category: "Audio — Living Room",
    items: [
      { name: "Yamaha RX-V677", role: "AV receiver", status: "active" },
      { name: "KEF Q150", role: "Living room speakers (pair)", status: "active" },
      { name: "SVS Kube 12b", role: "Living room subwoofer", status: "active" },
    ],
  },
  {
    category: "Headphones & IEMs",
    items: [
      { name: "Moondrop Dusk", role: "IEM — reference tuning", status: "active" },
      { name: "Moondrop Daybreak", role: "IEM — comparison", status: "active" },
      { name: "Truthear Zero:RED", role: "IEM — budget reference", status: "active" },
    ],
  },
  {
    category: "Cameras",
    items: [
      { name: "Fujifilm X-T4", role: "Primary camera, 18-55mm kit", status: "active" },
      { name: "Fujifilm X100VI", role: "Compact carry camera", status: "active" },
    ],
  },
  {
    category: "Networking",
    items: [
      { name: "Tailscale", role: "Mesh VPN — all devices connected", status: "active" },
      { name: "Ubiquiti", role: "Router / AP", status: "active" },
    ],
  },
  {
    category: "Software",
    items: [
      { name: "Obsidian", role: "Git-backed knowledge vault", status: "active" },
      { name: "Proxmox VE", role: "Hypervisor on P520", status: "active" },
      { name: "Arch Linux", role: "Daily driver on CF-SV1", status: "active" },
      { name: "NixOS", role: "Learning on X220t", status: "active" },
      { name: "Hermes Agent", role: "AI agent — daily ops", status: "active" },
    ],
  },
];

export const aboutContent: AboutContent = {
  intro:
    "I break hardware and software until I understand it. I'm a Computer Engineering student at San José State and I run my own everything — homelab, AI agent, knowledge base — because letting someone else do it sounds boring.",
  story: [
    "I got into technology the way kids with my kind of curiosity did — jailbreaking devices and running emulators. There's something about a device doing what it wasn't supposed to do that never gets old. Every piece of hardware I own gets the same treatment eventually: push it until it breaks, figure out why, fix it, then break it again on purpose to make sure I actually understood it.",
    "That instinct is probably from moving from India to the US when I was young and having to figure out a whole new everything on my own. I learned by poking at things until they made sense, and computers were the best version of that — every device was a puzzle, and the answer was never 'that's just how it is.' There's always a reason the defaults are wrong. Finding it is the fun part.",
    "Most of my projects start with a practical question. Can an old ThinkStation be a real server? Can one Mac mini run an AI agent for my entire life? The answer to both has been yes, as long as I am willing to understand the boring parts too. Old stuff needs convincing, and I like being the one who convinces it.",
    "I study Computer Engineering at San José State, after Computer Science at Foothill, where I ran the Data Science & AI club and started Principia STEM Magazine. I've shipped a chatbot for Foothill students, an emotion-aware bot at CalHacks, and an audio-visualization project that became a magazine article. None of it went perfectly, and most of it is documented in a versioned Obsidian vault because I got tired of forgetting what I did and why.",
    "Outside class, technology is still the main hobby, and it's probably going to be forever — Linux, audio, cameras, old hardware, game streaming, and whatever I'm trying to configure that week. Right now that's a JIS keyboard and an Arch install that's almost exactly how I want it. Almost. TLDR: I build, break, and run my own systems, and I write down what happens.",
  ],
  education: [
    { school: "San José State", program: "Computer Engineering" },
    { school: "Foothill College", program: "Computer Science" },
  ],
  skills: [
    "Python", "C++", "TypeScript", "React", "Linux", "Proxmox", "ZFS", "Docker", "Tailscale", "Git", "SQL", "LLM + RAG tooling",
  ],
  interests: [
    "Local AI", "AI Agents", "Self-hosting", "Audio", "Linux", "Photography", "Astrophotography", "Retro Hardware", "Handhelds", "Keyboards",
  ],
};

export const socialLinks: SocialLink[] = [
  { label: "Email", href: "mailto:hello@ayumad.me", handle: "hello@ayumad.me" },
  { label: "GitHub", href: "https://github.com/ayumad", handle: "@ayumad", external: true },
];

export const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Ayumad.me — Ayush Madhukar",
    description: "Ayush Madhukar's projects and notes on local AI, Linux, audio, cameras, and self-hosted systems.",
  },
  "/projects": {
    title: "Projects — Ayumad.me",
    description: "Projects, systems, and current work by Ayush Madhukar.",
  },
  "/projects/hermes": {
    title: "Hermes — Ayumad.me",
    description: "Inside Hermes, the AI agent that runs Ayush's daily operations.",
  },
  "/gear": {
    title: "Gear — Ayumad.me",
    description: "The devices, speakers, cameras, and tools Ayush uses and tracks.",
  },
  "/journal": {
    title: "Journal — Ayumad.me",
    description: "Curated field notes on building, configuring, and understanding things.",
  },
  "/taste": {
    title: "Taste — Ayumad.me",
    description: "Listening history, artists, genres, and album rankings.",
  },
  "/about": {
    title: "About — Ayumad.me",
    description: "About Ayush Madhukar, a Computer Engineering student and lifelong technologist.",
  },
};
