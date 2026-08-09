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
  { label: "Journal", path: "/journal", index: "10" },
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
    slug: "vault-refactor",
    title: "Vault Refactor",
    summary: "Refactoring my Obsidian vault into a lean, git-backed, self-managing knowledge base.",
    story:
      "My vault was 1,281 notes and 72% of it was archives. The plugins were missing, there was no git, and the whole thing was held together by iCloud placeholders. I rewired it: plugins restored, everything committed to a private GitHub repo, recovery zips verified, and the structure defined by agent files so any future agent knows exactly how it works. The archives are next — git history becomes the backup, and the note tree only holds live knowledge. The interesting part is that the vault now runs itself — skills, cron jobs, and agent instructions all agree on the current layout.",
    stack: ["Obsidian", "Git", "GitHub", "Hermes"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "hermes-agent",
    title: "Hermes Agent",
    summary: "An AI agent that runs my daily operations — briefs, memory, cron jobs, multi-model routing.",
    story:
      "Hermes handles morning briefs, interview prep, session journals, and 15 scheduled cron jobs. It runs on a headless Mac mini with Mnemosyne for persistent memory, connects to Telegram and the WebUI, and routes between Mimo V2.5, Kimi K3, and DeepSeek depending on the task. The hard part was making it cheap — every token counts when you're running this many automations.",
    stack: ["Hermes", "Mnemosyne", "Tailscale", "OpenCode Go", "Telegram"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "rag-assistant",
    title: "RAG Assistant",
    summary: "A retrieval-augmented assistant that answers questions from my Obsidian vault.",
    story:
      "The RAG assistant indexes the Obsidian vault and answers questions grounded in actual notes — build logs, device configs, project decisions. The indexing pipeline is done; deployment is pending. The point is letting Hermes pull context from my notes without exposing the private parts of the vault to a model.",
    stack: ["Python", "RAG", "Obsidian", "Embeddings"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "daily-brief",
    title: "Daily Brief",
    summary: "Cron jobs that deliver a morning briefing — vault status, Google Tasks, email, calendar, and question prompts.",
    story:
      "Every morning at 9:30, Hermes compiles a brief from the vault, Google Tasks, email, and calendar. Question prompts run through the day, interview prep hits at 6pm, and at 10pm it logs the session journal. It's part of the 15-job cron set, no manual intervention. Set it up once and let it run.",
    stack: ["Hermes Cron", "Obsidian", "Google Tasks", "Google Workspace"],
    status: "completed",
    year: "Now",
  },
  {
    slug: "voice-assistant",
    title: "Voice Assistant",
    summary: "Research into a voice-first interface for Hermes — wake word, speech-to-text, local inference.",
    story:
      "The voice assistant is still in research. The idea is a wake-word interface that routes speech to local STT, runs through Hermes, and answers with TTS. The constraint is cost — no cloud APIs for the core loop, everything local or self-hosted.",
    stack: ["Python", "Whisper", "Piper TTS", "Wake word"],
    status: "planned",
    year: "Planned",
  },
  {
    slug: "homelab-build",
    title: "Homelab Build",
    summary: "A P520 running Proxmox for storage, local AI, media, and services.",
    story:
      "The ThinkStation P520 has a 4TB ZFS pool and a GPU-passthrough VM. I'm keeping core services separate from the Docker experiments so I can break one thing without taking everything else down. The RTX 3060 passes through for local inference.",
    stack: ["Proxmox VE", "ZFS", "GPU passthrough", "Docker"],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "owlbot",
    title: "Owlbot",
    summary: "An AI chatbot built to help Foothill College students find their way.",
    story:
      "Owlbot answers questions about admissions, financial aid, registration, and campus resources. The hard part wasn't matching questions — it was turning a sprawling institutional knowledge base into answers students could actually use. Built for the Data Science & AI club.",
    stack: ["Python", "NLP", "FAQ matching"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "delulubot",
    title: "DeluluBot",
    summary: "An emotion-aware chatbot built during CalHacks 10.0.",
    story:
      "Built DeluluBot at CalHacks 10.0 with the club. It detects sentiment and changes how it responds. Short hackathon build, and a decent first test of how much tone changes the way a chatbot feels to use.",
    stack: ["Python", "Sentiment analysis", "CalHacks"],
    status: "completed",
    year: "2023",
  },
  {
    slug: "audio-visualization",
    title: "Audio Visualization",
    summary: "Cymatics and machine learning turned into a visual study of sound.",
    story:
      "I combined Chladni-style pattern generation with machine learning to make audio visible. Signal processing, computer vision, and music in one project. This is also what got me started with the Principia STEM Magazine writing.",
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
      "CF-SV1 / Omarchy + X220t / NixOS",
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
      "A 1,281-note vault, git-backed and structured by agent files, with archives on the way out.",
    items: ["Obsidian vault (git + GitHub)", "Agent-defined structure", "Derived views (Bases)", "Public writeups"],
    signal: "question → test → note → reuse",
  },
];

export const hermesSections: HermesSection[] = [
  {
    title: "What Hermes Does",
    description:
      "Hermes is my personal AI agent. It runs the daily operations — morning briefs, interview prep, session journals, 15 cron automations — from a headless Mac mini, and connects from every device over Tailscale.",
    items: [
      "Morning brief at 9:30am — vault, Google Tasks, email, calendar",
      "Interview prep at 6pm — technical quizzes with follow-up pressure",
      "Session journal at 10pm — log the day to the vault",
      "Question prompts throughout the day",
      "Kanban board dispatch, weekly review, monthly consolidation",
    ],
  },
  {
    title: "Memory System",
    description:
      "Mnemosyne holds the persistent memory — facts, preferences, insights, and relationships that survive across sessions. Local embeddings keep recall fast, and a knowledge graph connects related memories.",
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
      "Hermes routes between models based on task complexity and cost. Mimo V2.5 handles the daily work, Kimi K3 tackles the hard problems, DeepSeek V4 Flash handles the cheap tool-heavy tasks.",
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
      "15 cron jobs run on schedule — briefs, reviews, consolidation, health checks. Test once, then let it run.",
    items: [
      "Cron scheduler with script-first, agent-second pattern",
      "Telegram + WebUI connected surfaces",
      "125-product loadout inventory with price tracking",
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
      { name: "Obsidian", role: "Vault — 1,281 notes, git-backed, self-managing", status: "active" },
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
          "5700X3D in the living room SFF. Best upgrade per dollar I can do, and it takes 15 minutes.",
          "Same for the budget SFF when it comes back, plus 32 GB of RAM. Fixes both weak points for about $250.",
          "Sell the 12900K prebuilt when it returns. The resale window is now, and Creekwood already covers that tier.",
          "Leave the P520 alone. It's fine.",
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
    slug: "retiring-the-jailbreak",
    title: "Retiring the Jailbreak",
    date: "2026",
    summary:
      "From 9.3.3 to Xina to Dopamine — seven years of jailbreaking, and why I finally reset my phone to stock iOS.",
    tags: ["iOS", "Jailbreaking", "Apple"],
    body: [
      {
        paragraphs: [
          "It was a tough decision, but I'm finally retiring the jailbreak. I joined the scene back with 9.3.3 and loved spending hours messing around with tweaks and making an original setup that I loved. Back then emulators were also huge, and especially having the option to download IPAs, it was amazing. I continued to be jailbroken through each phone I had for as long as possible.",
          "I got a 13 mini which was my first new phone ever, and I stayed on 15.1.1 for about a year before Xina came out and was so happy when it finally got jailbroken. I instantly got it once it released but found that the most I could do at that point was aesthetic changes, and technically I could access things with tools like Filza, but overall it was just not as magical as I thought it would be. Being able to sideload with AltStore and later TrollStore replaced a lot of what I thought I needed out of a jailbroken phone.",
        ],
      },
      {
        heading: "The journey",
        ascii: `  JAILBREAK TIMELINE
  ─────────────────────────────────────
  9.3.3        first jailbreak. tweaks & emulators
  15.1.1       13 mini, waiting out the year
  XinaA15      back in. mostly looks
  Dopamine     worse. the last attempt
  iOS 17       stock again. sideloading stays`,
      },
      {
        paragraphs: [
          "Recently though, a lot of factors made it harder and harder for me to justify jailbreaking. I loved how it looked but the functionality was just less useful than what Apple was releasing. Especially with the purchase of the AirPods Pro 2s, they feel so limited by the software which is extremely annoying. Xina also became more and more unstable, with almost daily restarts or crashes and even an entire day of my phone being a complete brick, screen on but not able to be interacted with or even force shutdown. I ended up having to wait around 5 hours for the battery to completely drain before being able to use my phone again.",
          "One of the main factors as well which annoyed me was just that bypass tweaks just tended to not work. I tried every one I could possibly think of but nothing other than Lintui on the Xina app itself would let me use Pokémon Go. As a last ditch effort I tried moving to Dopamine and seeing if there was any more value there but it was even worse in my experience.",
        ],
      },
      {
        paragraphs: [
          "I just completely reset my phone to delete all dependencies and am now updating to iOS 17. Considering the recent landscape of jailbreaking and how scarce they seem to be these days, this is almost certainly my last time jailbreaking my phone. I still have an iPad Air gen 4 I bought on marketplace which came with iOS 14.5.1 and is currently on unc0ver but I'm considering just updating that as well.",
        ],
      },
      {
        heading: "What I'll miss",
        paragraphs: [
          "The icon themes were one of my favorite things even at the end. I found the pack Thine Glitch v2 and it looked amazing with my setup. I loved how my old setups looked — it just got harder and harder to keep doing it as the years went on.",
        ],
      },
      {
        heading: "The community",
        paragraphs: [
          "The scarcity of jailbreaks nowadays makes it so hard to justify staying on software you're not satisfied with. Especially with all the drama during Xina's development — it seemed like the community was falling apart. We just don't have as many devs anymore who see the benefit of committing hundreds of hours for work they barely get recognition or appreciation for.",
        ],
      },
      {
        heading: "Why not Android",
        paragraphs: [
          "I considered switching, but not for a main phone. There's too much good in the Apple ecosystem, especially the social side of iMessage and FaceTime. I also picked up an M2 MacBook Air to replace my old laptop, so my entire mobile setup is Apple now. I don't necessarily agree with how the landscape has played out, but the products are good enough.",
          "I did get a Fire tablet for around $40 a few months back and a Nextbit Robin off marketplace — my first Android devices. Both old and underpowered, but it was still fun customizing them the way I liked. It really reminded me of earlier jailbreaking.",
          "For customization I'll grab a secondary phone. I've been considering a secondhand iPhone X just to mess around with — if I can find one under $100 I'll pull the trigger, but it'll only ever be a backup.",
        ],
      },
      {
        paragraphs: [
          "It was great messing around with stuff and seeing what was possible but I think it's time to leave the sinking ship for me.",
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
    body: [
      {
        paragraphs: [
          "The P520 is a ThinkStation workstation with a Xeon W-2135, 64 GB of ECC RAM, and a ZFS pool, running Proxmox VE 9.2.3. The RTX 3060 12 GB in it is the best value part I own — 12 GB of VRAM, CUDA, and cheap. The whole point of it is local AI, which means the GPU had to get through to a VM.",
          "That took longer than it should have. Most of the time went into things I didn't know to check upfront.",
        ],
      },
      {
        heading: "The hardware",
        paragraphs: [
          "The card sits at PCI 0000:65:00.0 with its audio function at 65:00.1 — the HDMI/DP audio device. Both have to go to the VM. Miss the audio function and you lose display audio, which you don't notice until you plug something into it.",
        ],
        table: {
          headers: ["Component", "Spec"],
          rows: [
            ["Machine", "Lenovo ThinkStation P520"],
            ["CPU", "Xeon W-2135, 6C/12T"],
            ["RAM", "64 GB DDR4 ECC"],
            ["GPU", "RTX 3060 12 GB @ 0000:65:00.0"],
            ["Boot", "512 GB NVMe"],
            ["VM storage", "4 TB SATA SSD thin pool"],
            ["NAS", "3× 4 TB HDD ZFS RAIDZ (~8 TB)"],
            ["Host", "Proxmox VE 9.2.3 (pve-p520)"],
          ],
        },
      },
      {
        heading: "Host setup",
        paragraphs: [
          "IOMMU first. On Intel that's intel_iommu=on in GRUB, update-grub, reboot. Then the VFIO modules: vfio, vfio_iommu_type1, vfio_pci, vfio_virqfd. Then bind the card to VFIO at boot with its vendor:device IDs — 10de:2503 for the GPU, 10de:228e for the audio. Then blacklist nouveau, because it grabs the card otherwise.",
          "The order matters. If you skip verifying IOMMU groups after reboot, you'll chase ghosts later.",
        ],
      },
      {
        heading: "The VM",
        paragraphs: [
          "The ai-vm is a Debian VM with 16 GB of RAM, 4 cores, 32 GB raw on the tank pool. Machine type q35 — that's required for PCIe passthrough, and it's the mistake that cost me the most time.",
        ],
        list: [
          "q35 is not optional. pcie=1 and x-vga=1 need q35. With the default machine type, QEMU exits with code 1 and the VM won't start. It's one setting, but it looks like the GPU is the problem when it's actually the machine type.",
          "LVM thin pools only take raw disks. I tried qcow2 first; Proxmox rejected it. format=raw or use ZFS/dir storage.",
          "Full PCI address. 0000:65:00.0, not 65:00.0. The API is picky.",
          "Guest agent on. agent: 1, so you can query the VM's IP after boot.",
        ],
      },
      {
        heading: "Driver install",
        paragraphs: [
          "Debian install via the Proxmox console, then build-essential, dkms, linux-headers, the non-free repos, and nvidia-driver. Reboot, and nvidia-smi shows the real card: 12288 MiB, driver 550.120, CUDA 12.4.",
          "A torch check confirms it's the actual hardware, not a software emulation: CUDA available, tensor lands on cuda:0, matmul runs. If nvidia-smi shows a serial number, the card really passed through.",
        ],
      },
      {
        heading: "What I'd do differently",
        paragraphs: [
          "Get the host on Tailscale first. The P520 isn't on the mesh — everything goes through Omarchy as a jump host: Mac mini → Tailscale → Omarchy → SSH → P520. It works, but direct access would've made the whole thing simpler.",
          "Also: the Proxmox API has no shell execution endpoint. I kept trying to run commands through it. There isn't a handler for that. Use the console or bootstrap through a VM.",
        ],
      },
    ],
  },
  {
    slug: "hermes-on-mac-mini",
    title: "Why I Moved Hermes to a Mac Mini",
    date: "2026",
    summary:
      "Running one AI agent server instead of rebuilding on every device. The tradeoffs of headless macOS, Tailscale mesh, and always-on automation.",
    tags: ["Hermes", "macOS", "Tailscale"],
    body: [
      {
        paragraphs: [
          "Hermes used to live wherever I was working. Then I moved it to a Mac mini that never turns off, and everything got simpler.",
          "The pitch was one always-on agent server instead of rebuilding context and skills on every machine. One home for the memory, the cron jobs, the tools.",
        ],
      },
      {
        heading: "The setup",
        paragraphs: [
          "A Mac mini on my desk at home, headless, joined to the Tailscale mesh at 100.113.252.86. The WebUI listens on 0.0.0.0:8787, launched by launchd so it survives reboots. I reach it from my phone through the Hermex app, same URL, same agent, same memory.",
          "It runs the daily loop: morning brief, interview prep, session journal, kanban dispatch, memory consolidation. All of that used to be split across whatever machine was on at the time.",
        ],
      },
      {
        heading: "Why headless macOS",
        paragraphs: [
          "macOS as the base means everything just works — no driver fights, sane power management, and it's a Unix under the hood so the tooling is familiar. Headless means I never think about a screen on it. SSH in, or use the WebUI.",
          "The tradeoff is that it's another always-on box. It draws power, it needs updates, and if it dies, the whole daily loop goes with it. That's the cost of centralizing.",
        ],
      },
      {
        heading: "What it runs",
        list: [
          "WebUI on port 8787 — the chat surface, launchd-managed.",
          "13 cron jobs — briefs, prompts, interview prep, journal, kanban.",
          "Mnemosyne — local memory store with its own SQLite database and embeddings.",
          "Task sync — Google Tasks and Apple Reminders stay in lockstep via a snapshot script.",
          "Hermex — my phone client, hitting the same WebUI over Tailscale.",
        ],
      },
      {
        heading: "The tradeoffs",
        paragraphs: [
          "Centralizing means one place to maintain instead of five. If I add a skill or change a cron job, it's one edit, and it's everywhere. The downside is single point of failure — no redundancy, and if the mesh is down, I'm down.",
          "For a one-person setup, that trade is worth it. The Mac mini is quiet, small, and draws less than the alternative of running agents on every device I own.",
        ],
      },
    ],
  },
  {
    slug: "building-a-2.1-system",
    title: "Building a 2.1 System on a Budget",
    date: "2025",
    summary:
      "Desktop and living-room speaker setups — crossover tuning, subwoofer placement, and why the WiiM Ultra changed my desktop chain.",
    tags: ["Audio", "KEF", "SVS", "WiiM"],
    body: [
      {
        paragraphs: [
          "My desk setup is 2.1: KEF Q150s, an SVS SB1000 Pro, a WiiM Ultra, and a Fosi ZA3. The whole thing, including the sub, came to about $1000 — mostly because of a marketplace deal on the sub and general deal hunting on Amazon.",
          "The goal was simple: proper stereo with real sub-bass that doesn't cost what a store-bought 2.1 system would.",
        ],
      },
      {
        heading: "The chain",
        paragraphs: [
          "WiiM Ultra → Fosi ZA3 → Q150s, with the SB1000 Pro handling everything below the crossover. The WiiM Ultra is the source and the brain — it streams, does the room EQ, and handles the sub crossover in one box.",
          "The room EQ especially has been extremely beneficial. The desk is in a corner, which normally means bass problems, and the auto-EQ fixed most of it without any manual fiddling.",
        ],
      },
      {
        heading: "Why the WiiM Ultra changed things",
        paragraphs: [
          "It replaced what would've been a stack of boxes: a streamer, a DAC, and a DSP unit. The app is actually usable, which is rare. And because the crossover and EQ live in the WiiM, upgrading the amp or speakers later doesn't mean redoing the setup.",
          "The flexibility is the point. It allows for future upgrades without ripping out the chain.",
        ],
      },
      {
        heading: "The amp",
        paragraphs: [
          "The Fosi ZA3 is a small class-D amp, and it is more than enough to drive the Q150s. People overbuy amps for bookshelf speakers — these are easy loads. If you want a bit more headroom or balanced inputs, a pair of Fosi V3 monos does the same job in stereo.",
        ],
      },
      {
        heading: "Crossover and placement",
        paragraphs: [
          "The SB1000 Pro crosses over around 80 Hz, which takes the bass load off the Q150s and lets them play cleaner in the mids. Sub placement matters more than people think — I tried a few spots before it sounded right, and the room EQ handled the rest.",
          "General rule: put the sub where it sounds best in the listening position, then run the EQ. Room EQ can fix a lot, but it can't fix a sub that's in the wrong place entirely.",
        ],
      },
      {
        heading: "What I'd change",
        paragraphs: [
          "Not much. If I had to do it again I'd still buy the same chain. The next upgrade is probably the amp — the ZA3 is fine, but a stereo amp with more inputs would clean up the desk.",
          "Total for the system: about $1000 after deals. The sub was the biggest single line item, and it's the one that makes everything else sound expensive.",
        ],
      },
    ],
  },
  {
    slug: "arch-daily-driver",
    title: "Running Arch as a Daily Driver",
    date: "2025",
    summary:
      "What it actually takes to use Arch Linux day-to-day — Hyprland, rolling releases, and the things that break vs. the things that just work.",
    tags: ["Arch Linux", "Hyprland", "Linux"],
    body: [
      {
        paragraphs: [
          "I run Arch-based systems on four machines now: a Framework 13, a Beelink SER8, a ThinkPad T480, and a Let's Note SV1. It started as a tinkering thing and turned into the default.",
          "The distro is Omarchy — DHH's opinionated Arch-based setup with Hyprland on top. It's Arch under the hood with a good default config, which means I spend less time ricing and more time using.",
        ],
      },
      {
        heading: "Why Arch, why Hyprland",
        paragraphs: [
          "Rolling releases mean I always have current packages, which matters when the hardware is new. The Framework 13 and the SER8 both have recent GPUs and kernel features that need a current kernel, and Arch has it the day it ships.",
          "Hyprland is the tiling compositor. It's fast, configurable, and the defaults in Omarchy are sensible — workspaces, keybinds, a bar — without needing to be a hobby itself.",
        ],
      },
      {
        heading: "What breaks",
        paragraphs: [
          "The honest answer: things break occasionally, and it's almost always a partial upgrade or a kernel update that needs a rebuild. The fix is usually pacman -Syu and a reboot.",
          "The known pain points: DKMS modules after a kernel bump, Hyprland config changes between versions, and the occasional AUR package that needs a manual intervention. None of it is fatal. It's just not zero-maintenance.",
        ],
      },
      {
        heading: "What just works",
        paragraphs: [
          "The daily stuff is boring in the good way. The compositor starts, windows tile, the bar works, suspend and resume work, and the battery life on the Framework is fine.",
          "The SER8 runs as an always-on box with Docker and a monitoring script on a 15-minute cron. It's been up for months. The T480 is the travel laptop, and the Let's Note is the small one — all the same config, which is the whole point of using the same distro everywhere.",
        ],
      },
      {
        heading: "The daily driver test",
        paragraphs: [
          "The real test is whether I reach for it when I don't have to. I do. Arch as a daily driver means accepting that occasionally you'll spend an evening fixing something — and deciding that's a fair trade for a system that's exactly how I want it.",
          "If you want the same without the opinions, Omarchy is a good starting point. If you want zero maintenance, stay on something else. Both are legitimate.",
        ],
      },
    ],
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
    "That instinct came from being the kid who moved from India to the US young and had to figure out the culture on his own. I found it through media and books, and eventually through computers. Every device was a puzzle, and the reward wasn't just making it work — it was understanding why the defaults were wrong in the first place.",
    "Most of my projects start with a practical question. Can this old workstation become a useful server? Can one Mac mini run an AI agent for every device? Can I make an Arch install feel exactly how I want? I learn by setting it up, breaking something, and fixing it.",
    "I study Computer Engineering at San José State and studied Computer Science at Foothill before that, where I also ran the Data Science & AI club and founded the Principia STEM Magazine. Outside class, technology is still the main hobby: Linux, audio, cameras, old hardware, game streaming, and whatever I'm trying to configure that week.",
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
    description: "Inside Hermes — the AI agent that runs Ayush's daily operations.",
  },
  "/gear": {
    title: "Gear — Ayumad.me",
    description: "The devices, speakers, cameras, and tools Ayush uses and tracks.",
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
  "/writeups/retiring-the-jailbreak": {
    title: "Retiring the Jailbreak — Ayumad.me",
    description:
      "From 9.3.3 to Xina to Dopamine — seven years of jailbreaking, and why Ayush finally reset his phone to stock iOS.",
  },
  "/writeups/gpu-passthrough-p520": {
    title: "GPU Passthrough on the P520 — Ayumad.me",
    description:
      "How Ayush got an RTX 3060 passed through to a Proxmox VM — IOMMU groups, kernel parameters, and the mistakes he made along the way.",
  },
  "/writeups/hermes-on-mac-mini": {
    title: "Why I Moved Hermes to a Mac Mini — Ayumad.me",
    description:
      "Running one AI agent server instead of rebuilding on every device — the tradeoffs of headless macOS, Tailscale mesh, and always-on automation.",
  },
  "/writeups/building-a-2.1-system": {
    title: "Building a 2.1 System on a Budget — Ayumad.me",
    description:
      "Ayush's KEF Q150 + SVS SB1000 Pro + WiiM Ultra desk setup — crossover tuning, subwoofer placement, and why the WiiM Ultra changed the chain.",
  },
  "/writeups/arch-daily-driver": {
    title: "Running Arch as a Daily Driver — Ayumad.me",
    description:
      "What it takes to use Arch Linux day-to-day — Hyprland, rolling releases, and the things that break vs. the things that just work.",
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
  "/journal": {
    title: "Journal — Ayumad.me",
    description: "A day-by-day log of what Ayush is building, generated nightly from Hermes session records.",
  },
};
