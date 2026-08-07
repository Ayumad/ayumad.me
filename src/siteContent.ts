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

export interface GearItem {
  name: string;
  role: string;
  status: "active" | "archived" | "sold";
}

export interface GearCategory {
  category: string;
  items: GearItem[];
}

export interface Writeup {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body?: WriteupBlock[];
}

export interface WriteupBlock {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  table?: { headers: string[]; rows: string[][] };
  ascii?: string;
  callout?: string;
}

export interface HermesSection {
  title: string;
  description: string;
  items: string[];
}

export const navItems: NavItem[] = [
  { label: "Home", path: "/", index: "00" },
  { label: "Work", path: "/showcase", index: "01" },
  { label: "Projects", path: "/projects", index: "02" },
  { label: "Systems", path: "/systems", index: "03" },
  { label: "Hermes", path: "/hermes", index: "04" },
  { label: "Gear", path: "/gear", index: "05" },
  { label: "Writeups", path: "/writeups", index: "06" },
  { label: "Now", path: "/now", index: "07" },
  { label: "About", path: "/about", index: "08" },
  { label: "Contact", path: "/contact", index: "09" },
];

export const homeContent: HomeContent = {
  intro:
    "I like finding out what hardware and software can do once the defaults get out of the way. Lately that means local AI, Proxmox, Linux, audio systems, and cameras.",
  topics: ["AI + Notes", "Servers", "Audio", "Linux"],
  current: {
    title: "Hermes",
    description:
      "Running an AI agent on a Mac mini — daily briefs, memory, cron automations, multi-model routing — all connected over Tailscale.",
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
      "My ThinkStation P520 runs Proxmox. I use it for storage, local AI, media, and services, with the important parts separated from whatever I am testing that week.",
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
    slug: "hermes-agent",
    title: "Hermes Agent",
    summary: "An autonomous AI agent that runs my daily operations — briefs, memory, cron jobs, multi-model routing.",
    story:
      "Hermes handles morning briefs, interview prep, session journals, and cron automations across 13 scheduled jobs. It runs on a headless Mac mini with Mnemosyne for persistent memory, connects to Telegram and the WebUI, and routes between Mimo V2.5, Kimi K3, and DeepSeek depending on the task. The interesting problem was making it cheap — every token counts when you're running this many automations.",
    stack: ["Hermes", "Mnemosyne", "Tailscale", "OpenCode Go", "Telegram"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "rag-assistant",
    title: "RAG Assistant",
    summary: "A retrieval-augmented assistant built on top of the Obsidian vault for question-answering over personal notes.",
    story:
      "The RAG assistant indexes the Obsidian vault and answers questions grounded in actual notes — build logs, device configs, project decisions. Deployment is pending, but the indexing pipeline is done. The goal is to let Hermes pull context from the vault without exposing private notes to the model.",
    stack: ["Python", "RAG", "Obsidian", "Embeddings"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "daily-brief",
    title: "Daily Brief",
    summary: "7 cron jobs that deliver a morning briefing — vault status, Notion tasks, email, calendar, and question prompts.",
    story:
      "Every morning at 9:30, Hermes compiles a brief from the vault, Notion, email, and calendar. Throughout the day it sends question prompts and interview prep. At 10pm it logs the session journal. The whole system runs on cron with no manual intervention — fire and forget.",
    stack: ["Hermes Cron", "Obsidian", "Notion", "Google Workspace"],
    status: "completed",
    year: "Now",
  },
  {
    slug: "voice-assistant",
    title: "Voice Assistant",
    summary: "Research into building a voice-first interface for Hermes — wake word, speech-to-text, local inference.",
    story:
      "The voice assistant is in research phase. The goal is a wake-word triggered interface that routes speech to a local STT model, runs through Hermes, and responds with TTS. The constraint is doing it cheaply — no cloud APIs for the core loop, everything local or self-hosted.",
    stack: ["Python", "Whisper", "Piper TTS", "Wake word"],
    status: "planned",
    year: "Planned",
  },
  {
    slug: "homelab-build",
    title: "Homelab Build",
    summary: "A P520 running Proxmox for storage, local AI, media, and services.",
    story:
      "The ThinkStation P520 has a 4TB ZFS pool and a GPU-passthrough VM. I am separating core services from the Docker experiments so I can change one part without taking everything else down. RTX 3060 is passthrough for local inference.",
    stack: ["Proxmox VE", "ZFS", "GPU passthrough", "Docker"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "owlbot",
    title: "Owlbot",
    summary: "An AI chatbot built to help Foothill College students find their way.",
    story:
      "Owlbot handles common questions about admissions, financial aid, course registration, and campus resources. The interesting problem was not only matching questions — it was translating a sprawling institutional knowledge base into answers students could actually use.",
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
];

export const systemLayers: SystemLayer[] = [
  {
    index: "L1",
    title: "AI",
    description:
      "One agent backend, several clients, and my own notes when they are useful.",
    items: ["Hermes server", "Tailscale clients", "OpenCode Go + local models", "Obsidian retrieval"],
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

export const hermesSections: HermesSection[] = [
  {
    title: "What Hermes Does",
    description:
      "Hermes is a personal AI agent that handles daily operations — morning briefs, interview prep, session journals, and 13 cron automations. It runs on a headless Mac mini and connects from every device over Tailscale.",
    items: [
      "Morning brief at 9:30am — vault, Notion, email, calendar",
      "Interview prep at 6pm — technical quizzes with follow-up pressure",
      "Session journal at 10pm — log the day to the vault",
      "Question prompts throughout the day",
      "Kanban board dispatch, weekly review, monthly consolidation",
    ],
  },
  {
    title: "Memory System",
    description:
      "Mnemosyne handles persistent memory — facts, preferences, insights, and relationships that survive across sessions. It uses local embeddings for fast recall and a knowledge graph for connecting related memories.",
    items: [
      "Mnemosyne v3.14 with local embeddings (fastembed)",
      "23 provider tools for recall, triples, graph queries",
      "Persona facts injected into every system prompt",
      "Session search over SQLite message store",
      "Nightly consolidation of old working memories",
    ],
  },
  {
    title: "Multi-Model Routing",
    description:
      "Hermes routes between models based on task complexity and cost. Mimo V2.5 handles daily work, Kimi K3 tackles hard problems, DeepSeek V4 Flash handles cheap tool-heavy tasks.",
    items: [
      "Mimo V2.5 — daily driver, cost-effective",
      "Kimi K3 — complex reasoning and code review",
      "DeepSeek V4 Flash — cheap, tool-heavy tasks",
      "OpenCode Go provider — $10/month vs OpenRouter",
      "Automatic fallback chains for reliability",
    ],
  },
  {
    title: "Infrastructure",
    description:
      "13 cron jobs run on schedule — briefs, reviews, consolidation, health checks. Everything is fire-and-forget: test once, then let it run.",
    items: [
      "Cron scheduler with script-first, agent-second pattern",
      "Telegram + WebUI + Discord connected surfaces",
      "122-device loadout inventory with price tracking",
      "LaunchAgent auto-start on Mac mini",
      "Tailscale mesh for cross-device access",
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
      { name: "Obsidian", role: "Vault — 100% PARA compliant", status: "active" },
      { name: "Proxmox VE", role: "Hypervisor on P520", status: "active" },
      { name: "Arch Linux", role: "Daily driver on CF-SV1", status: "active" },
      { name: "NixOS", role: "Learning on X220t", status: "active" },
      { name: "Hermes Agent", role: "AI agent — daily ops", status: "active" },
    ],
  },
];

export const writeups: Writeup[] = [
  {
    slug: "desktop-fleet-review",
    title: "Rating My Desktop Fleet",
    date: "2026",
    summary:
      "I have five desktop PCs. Here's what each one is for, how good it actually is, and what I'd change.",
    tags: ["Hardware", "Desktops", "Gaming"],
    body: [
      {
        paragraphs: [
          "I own five desktop PCs. That sounds like a lot, but they all do different things, and honestly I've stopped trying to justify it.",
          "One is the machine I actually use every day. One lives under the TV as a Steam machine. One is a server that never turns off. Two are at a friend's house right now. Here's what each one is for, how good it actually is, and what I'd change.",
        ],
      },
      {
        heading: "The main one",
        paragraphs: [
          "Creekwood is the machine I'd keep if I could only keep one. Ryzen 7 5800X3D, RTX 5080 Founders Edition, 64 GB of DDR4. Storage is good: two 2 TB NVMe drives, a 4 TB SATA SSD, and 8 TB of HDD for stuff that doesn't need to be fast.",
          "It's hooked up to a Samsung Odyssey OLED G8 — 4K, 240 Hz. That pushes the 5080 pretty hard. Most games run well with DLSS on. Path tracing in Cyberpunk is where it starts hiccuping, but that's just what 4K path tracing costs on any GPU right now. DLSS Quality plus lowering the path trace samples fixes most of it.",
          "The CPU is the only real ceiling. The 5800X3D is the best AM4 has, but AM4 is old — no DDR5, no PCIe 5.0. At 4K it barely matters, so I'm not rushing to AM5.",
        ],
      },
      {
        heading: "Where everything lives",
        ascii: `  [ MAIN DESK ]        Creekwood          RTX 5080 / 4K OLED
  [ LIVING ROOM ]      SFF 9070 XT        Steam machine under the TV
  [ CLOSET ]           P520               Proxmox server, always on
  [ LENT OUT ]         12900K prebuilt    DDR5 spare
  [ LENT OUT ]         SFF 9060 XT        the budget SFF`,
      },
      {
        heading: "The one under the TV",
        paragraphs: [
          "The SFF under the TV is a Ryzen 5 5600 with a PowerColor RX 9070 XT Reaper in a KXRORS S300 case, running Bazzite. It's basically a console. Steam on boot, controller, done.",
          "I picked the 9070 XT because it was the most powerful card that fit the case without costing FE 5080/5090 money. That was the whole point — max GPU within the size limit. The 5600 is the weak link though. It holds the 9070 XT back in CPU-heavy games, which is why my first upgrade is a drop-in 5700X3D. Cheap and easy.",
        ],
      },
      {
        heading: "The one that never turns off",
        paragraphs: [
          "The P520 is a ThinkStation workstation: Xeon W-2135, 64 GB of ECC RAM, about 16.5 TB of raw storage in a ZFS pool. It runs Proxmox and everything self-hosted — NAS, media, VMs.",
          "The RTX 3060 in it is the best value part I own. 12 GB of VRAM, CUDA, and cheap. It's the always-on AI card and it'll run the RAG assistant over my notes. As a gaming machine it'd be terrible. As a server it's exactly right, and it's the only always-on infrastructure I have, so it matters more than any of the gaming rigs.",
        ],
      },
      {
        heading: "The two I don't see",
        paragraphs: [
          "The Gigabyte prebuilt — i9-12900K, RTX 4080, 32 GB DDR5 — is my only DDR5 system and the most powerful CPU I own, and it's lent out. When it comes back it's either a second high-end rig or I sell it while it still holds value. Creekwood already does that job.",
          "The other loaner is the budget SFF: Ryzen 5 3600 with a Gigabyte RX 9060 XT 16 GB that I got for $282.91 during an Amazon resale event. That GPU is a steal — RDNA 4 with 16 GB of VRAM for less than most 8 GB cards go for used. The rest of the build is the weak half, but as a 1080p Bazzite box it's perfect. It's the right machine to lend out.",
        ],
      },
      {
        heading: "How they rate",
        ascii: `  BUILD RATINGS, OUT OF 10
  ─────────────────────────────
  Creekwood         ██████████░░  8/10
  12900K prebuilt   ██████████░░  8/10
  SFF 9070 XT       █████████░░░  7/10
  SFF 9060 XT       ██████░░░░░░  6/10
  P520 (as server)  ██████████░░  8/10

  IMPORTANCE TO ME
  ─────────────────────────────
  P520              9/10   always-on infrastructure
  Creekwood         9/10   the main machine
  SFF 9070 XT       8/10   daily living-room gaming
  12900K prebuilt   6/10   great, but redundant
  SFF 9060 XT       5/10   the loaner`,
      },
      {
        heading: "What I'd actually change",
        paragraphs: [
          "Honestly? I have three high-end gaming machines and two of them are just sitting at a friend's house. That's redundant. If I was smarter with my money:",
        ],
        list: [
          "**5700X3D in the living room SFF.** Best upgrade per dollar I can do, and it takes 15 minutes.",
          "**Same for the budget SFF when it comes back**, plus 32 GB of RAM. Fixes both weak points for about $250.",
          "**Sell the 12900K prebuilt when it returns.** The resale window is now, and Creekwood already covers that tier.",
          "**Leave the P520 alone.** It's fine.",
        ],
      },
      {
        heading: "Bottom line",
        paragraphs: [
          "Every machine has a job and none of them overlap. The main rig games at 4K. The SFF is the console under the TV. The P520 keeps everything running. The two loaners are backups and goodwill.",
          "I'd own fewer if I could do it over, but the ones I'd keep are the ones doing the most important work.",
        ],
      },
    ],
  },
  {
    slug: "gpu-passthrough-p520",
    title: "GPU Passthrough on the P520",
    date: "2026",
    summary:
      "How I got an RTX 3060 passed through to a Proxmox VM — IOMMU groups, kernel parameters, and the mistakes I made along the way.",
    tags: ["Proxmox", "GPU passthrough", "Linux"],
  },
  {
    slug: "hermes-on-mac-mini",
    title: "Why I Moved Hermes to a Mac Mini",
    date: "2026",
    summary:
      "Running one AI agent server instead of rebuilding on every device. The tradeoffs of headless macOS, Tailscale mesh, and always-on automation.",
    tags: ["Hermes", "macOS", "Tailscale"],
  },
  {
    slug: "building-a-2.1-system",
    title: "Building a 2.1 System on a Budget",
    date: "2025",
    summary:
      "Desktop and living-room speaker setups — crossover tuning, subwoofer placement, and why the WiiM Ultra changed my desktop chain.",
    tags: ["Audio", "KEF", "SVS", "WiiM"],
  },
  {
    slug: "arch-daily-driver",
    title: "Running Arch as a Daily Driver",
    date: "2025",
    summary:
      "What it actually takes to use Arch Linux day-to-day — Hyprland, rolling releases, and the things that break vs. the things that just work.",
    tags: ["Arch Linux", "Hyprland", "Linux"],
  },
];

export const futureIdeas = [
  "Listening history from Jellyfin / Spotify",
  "Film log with ratings and notes",
  "Game activity from Steam",
  "Reading log from Goodreads",
  "Gear notes with maintenance history",
];

export const aboutContent: AboutContent = {
  intro: "Computer Engineering student based in the Bay Area.",
  story: [
    "I got into technology through jailbreaking devices and running emulators. I liked seeing a device do something it was not supposed to do, and I still approach new hardware the same way — push it until it breaks, then figure out why.",
    "That instinct led me from jailbroken iPhones to custom ROMs on Android, from emulators on a PSP to Arch Linux on a Panasonic Let's Note. Every device is a puzzle. The reward is not just making it work — it's understanding why the defaults were wrong in the first place.",
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
    description: "Selected projects by Ayush Madhukar — from AI agents to local infrastructure.",
  },
  "/systems": {
    title: "Systems — Ayumad.me",
    description: "The actual AI, hardware, audio, and note systems Ayush uses.",
  },
  "/hermes": {
    title: "Hermes — Ayumad.me",
    description: "Inside Hermes — an autonomous AI agent for daily operations.",
  },
  "/gear": {
    title: "Gear — Ayumad.me",
    description: "The 100+ devices, speakers, cameras, and tools Ayush uses.",
  },
  "/writeups": {
    title: "Writeups — Ayumad.me",
    description: "Field notes on building, configuring, and breaking things.",
  },
  "/writeups/desktop-fleet-review": {
    title: "Rating My Desktop Fleet — Ayumad.me",
    description:
      "Five machines, five jobs — the honest breakdown of every desktop Ayush owns, what it's good at, and what he'd change.",
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
