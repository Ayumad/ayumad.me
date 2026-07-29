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

export interface HomeContent {
  intro: string;
  topics: string[];
  current: {
    title: string;
    description: string;
  };
}

export interface AboutContent {
  intro: string;
  story: string[];
  education: {
    school: string;
    program: string;
  }[];
  skills: string[];
  interests: string[];
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

export const homeContent: HomeContent = {
  intro:
    "I like finding out what hardware and software can do once the defaults get out of the way. Lately that means local AI, Proxmox, Linux, audio systems, and cameras.",
  topics: ["AI + Notes", "Servers", "Audio", "Linux"],
  current: {
    title: "Hermes",
    description:
      "Moving Hermes onto a Mac mini so my other devices can use the same tools and memory over Tailscale.",
  },
};

export const showcaseTopics: ShowcaseTopic[] = [
  {
    title: "AI + Notes",
    eyebrow: "Tools",
    summary:
      "I am setting up Hermes to run from one Mac mini and connect from my other devices over Tailscale. The next step is tying it into my notes without exposing the private parts of the vault.",
    items: ["Hermes", "Tailscale", "Obsidian", "Local models"],
    ascii:
      "  DESKTOP ───────┐\n  LAPTOP  ── VPN ├──> MAC MINI\n  IPAD    ───────┘       └── HERMES",
    tone: "lime",
  },
  {
    title: "Homelab",
    eyebrow: "Server",
    summary:
      "My ThinkStation P520 runs Proxmox. I use it for storage, local AI, media, and services, with the important parts separated from whatever I am testing that week.",
    items: ["ThinkStation P520", "Proxmox + ZFS", "GPU passthrough", "Docker / LXC"],
    ascii:
      "  [ THINKSTATION P520 ]\n       ├── ZFS ────── 4 TB\n       ├── VM ─────── GPU\n       └── LXC ────── SERVICES",
    tone: "coral",
  },
  {
    title: "Audio",
    eyebrow: "Listening",
    summary:
      "I keep separate desktop and living-room 2.1 systems, compare headphones and IEMs, and spend a lot of time getting placement, crossover, and EQ right.",
    items: ["WiiM Ultra + ZA3", "KEF Q150", "Kube 12b / SB-1000 Pro", "Dusk / Daybreak / Zero:RED"],
    ascii:
      "  DESK   : Q150 ── ZA3 ── WIIM\n                    └───── SB-1000 PRO\n  ROOM   : Q150 ── RX-V677 ── KUBE 12b",
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
      "We built DeluluBot at CalHacks 10.0. It detects sentiment and changes its response style. It was a short hackathon build and an early test of how much tone changes the way a chatbot feels to use.",
    stack: ["Python", "Sentiment analysis", "CalHacks"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "audio-visualization",
    title: "Audio Visualization",
    summary: "Cymatics and machine learning turned into a visual study of sound.",
    story:
      "I combined Chladni-style pattern generation with machine learning to make audio visible. The project let me work on signal processing, computer vision, and music in the same place.",
    stack: ["Python", "TensorFlow", "Audio processing"],
    status: "completed",
    year: "2024",
  },
  {
    slug: "homelab-build",
    title: "Homelab Build",
    summary: "A P520 running Proxmox for storage, local AI, media, and services.",
    story:
      "The ThinkStation P520 has a 4TB ZFS pool and a GPU-passthrough VM. I am separating core services from the Docker experiments so I can change one part without taking everything else down.",
    stack: ["Proxmox VE", "ZFS", "GPU passthrough", "Docker"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "hermes-remote",
    title: "Hermes Remote",
    summary: "One Hermes server on a Mac mini, available from the rest of my devices.",
    story:
      "I am moving Hermes off each client and onto a headless Mac mini. Desktop and mobile clients connect through Tailscale, so the tools and memory live in one place instead of being rebuilt on every machine.",
    stack: ["Hermes", "Tailscale", "macOS", "Remote clients"],
    status: "in-progress",
    year: "Now",
  },
];

export const systemLayers: SystemLayer[] = [
  {
    index: "L1",
    title: "AI",
    description:
      "One agent backend, several clients, and my own notes when they are useful.",
    items: ["Hermes server", "Tailscale clients", "OpenRouter + local models", "Obsidian retrieval"],
    signal: "notes → tools → model → client",
  },
  {
    index: "L2",
    title: "Hardware",
    description:
      "New and old machines, each set up for a specific job.",
    items: [
      "P520 / Proxmox",
      "Mac mini / Hermes",
      "RTX 5080 desktop / 4K OLED",
      "Zephyrus G14 / RTX 5070 Ti",
      "CF-SV1 / Arch + X220t / NixOS",
      "X-T4 / 18–55 + X100VI",
    ],
    signal: "machine → operating system → job",
  },
  {
    index: "L3",
    title: "Audio",
    description:
      "Two speaker systems plus the headphones and IEMs I compare between them.",
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
    description:
      "Notes that turn one-off troubleshooting into something I can reuse.",
    items: ["Obsidian vault", "Build plans", "Astro field notes", "Public writeups"],
    signal: "question → test → note → reuse",
  },
];

export const futureIdeas = [
  "Listening history",
  "Film log",
  "Game activity",
  "Reading log",
  "Gear notes",
  "Project archive",
];

export const aboutContent: AboutContent = {
  intro: "Computer Engineering student based in the Bay Area.",
  story: [
    "I got into technology through jailbreaking devices and running emulators. I liked seeing a device do something it was not supposed to do, and I still approach new hardware the same way.",
    "Most of my projects start with a practical question. Can this old workstation become a useful server? Can one Mac mini run an AI agent for every device? Can I make an Arch install feel exactly how I want? I learn by setting it up, breaking something, and fixing it.",
    "I study Computer Engineering at San José State and previously studied Computer Science at Foothill. Outside class, technology is still my main hobby: Linux, audio, cameras, old hardware, game streaming, and whatever I am trying to configure that week.",
  ],
  education: [
    { school: "San José State", program: "Computer Engineering" },
    { school: "Foothill College", program: "Computer Science" },
  ],
  skills: [
    "Python",
    "C++",
    "TypeScript",
    "React",
    "Linux",
    "Proxmox",
    "ZFS",
    "Docker",
    "Tailscale",
  ],
  interests: [
    "Local AI",
    "Self-hosting",
    "Audio",
    "Linux",
    "Photography",
    "Astrophotography",
    "Retro Hardware",
    "Handhelds",
  ],
};

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
      "Ayush Madhukar's projects and notes on local AI, Linux, audio, cameras, and self-hosted systems.",
  },
  "/showcase": {
    title: "Work — Ayumad.me",
    description: "Current work across Hermes, homelab infrastructure, and audio.",
  },
  "/projects": {
    title: "Projects — Ayumad.me",
    description: "Selected projects by Ayush Madhukar, from useful chatbots to local infrastructure.",
  },
  "/systems": {
    title: "Systems — Ayumad.me",
    description: "The actual AI, hardware, audio, and note systems Ayush uses.",
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
