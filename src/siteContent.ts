export type ProjectStatus = "completed" | "in-progress" | "planned";

export interface NavItem {
  label: string;
  path: string;
  index: string;
}

export interface HomeTopic {
  label: string;
  path: string;
}

export interface ShowcaseTopic {
  title: string;
  eyebrow: string;
  summary: string;
  items: string[];
  ascii: string;
  tone: "lime" | "violet" | "cyan";
  path: string;
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Project {
  slug: string;
  path: string;
  title: string;
  summary: string;
  story: string;
  stack: string[];
  facts: { label: string; value: string }[];
  sections: ContentSection[];
  related: { label: string; path: string }[];
  status: ProjectStatus;
  year: string;
  archived?: boolean;
}

export interface SystemLayer {
  index: string;
  slug: string;
  path: string;
  title: string;
  description: string;
  items: string[];
  signal: string;
  sections: ContentSection[];
  related: { label: string; path: string }[];
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
  external?: boolean;
  download?: boolean;
}

export interface ActivityConnection {
  service: string;
  signal: string;
  description: string;
  status: "planned";
}

export interface NowEntry {
  label: string;
  marker: string;
  title: string;
  description: string;
  detail: string;
}

export interface GearItem {
  name: string;
  role: string;
}

export interface GearCategory {
  category: string;
  items: GearItem[];
}

export const navItems: NavItem[] = [
  { label: "Home", path: "/", index: "00" },
  { label: "Work", path: "/work", index: "01" },
  { label: "Projects", path: "/projects", index: "02" },
  { label: "Systems", path: "/systems", index: "03" },
  { label: "Gear", path: "/gear", index: "04" },
  { label: "Blog", path: "/blog", index: "05" },
  { label: "About", path: "/about", index: "06" },
  { label: "Contact", path: "/contact", index: "07" },
];

export const legacyRedirects: Record<string, string> = {
  "/showcase": "/work",
  "/hermes": "/projects/hermes",
  "/writeups": "/blog",
  "/now": "/projects",
};

export const homeContent = {
  intro:
    "I build personal systems where hardware, software, and creative tools reinforce each other. Right now that means local AI, Linux machines, a carefully structured knowledge base, and headphone audio.",
  topics: [
    { label: "AI + Notes", path: "/systems/knowledge" },
    { label: "Homelab", path: "/projects/homelab" },
    { label: "Headphones", path: "/systems/audio" },
    { label: "Linux PCs", path: "/systems/hardware" },
  ] satisfies HomeTopic[],
  current: {
    title: "Hermes",
    description:
      "One personal AI agent running from a Mac mini, connected across my devices and grounded in a deliberately curated knowledge system.",
  },
};

export const showcaseTopics: ShowcaseTopic[] = [
  {
    title: "AI + Knowledge",
    eyebrow: "Tools",
    summary:
      "Hermes gives my devices one shared agent backend while the vault supplies durable context. The interesting work is deciding what should be automated, remembered, or kept deliberately private.",
    items: ["Hermes", "Obsidian", "Local retrieval", "Tailscale"],
    ascii: "  NOTES ──> CONTEXT ──> HERMES\n                  ├── DESKTOP\n                  ├── LAPTOP\n                  └── MOBILE",
    tone: "lime",
    path: "/systems/knowledge",
  },
  {
    title: "Homelab",
    eyebrow: "Infrastructure",
    summary:
      "A ThinkStation P520 running Proxmox anchors storage, services, experiments, and local compute. Stable workloads stay separated from the things I am actively breaking.",
    items: ["ThinkStation P520", "Proxmox", "ZFS", "Virtualization"],
    ascii: "  [ P520 / PROXMOX ]\n       ├── STORAGE\n       ├── SERVICES\n       └── LAB VMS",
    tone: "violet",
    path: "/projects/homelab",
  },
  {
    title: "Headphone Audio",
    eyebrow: "Listening",
    summary:
      "My desktop chain centers on the FiiO K13 R2R and a small rotation of headphones. I listen for stage, low-end texture, comfort, and how the complete chain changes the experience.",
    items: ["FiiO K13 R2R", "Audeze LCD-X", "Edition XS", "HD 660S2"],
    ascii: "  SOURCE ──> K13 R2R\n               ├── LCD-X\n               ├── EDITION XS\n               └── HD 660S2",
    tone: "cyan",
    path: "/systems/audio",
  },
  {
    title: "PCs + Linux",
    eyebrow: "Hardware",
    summary:
      "Creekwood is the main desktop; two compact Radeon systems run Bazzite for a console-like Linux experience. Each machine has a clear role instead of being another generic PC.",
    items: ["RTX 5080", "RX 9070 XT", "RX 9060 XT", "Bazzite"],
    ascii: "  CREEKWOOD ──> MAIN DESK\n  SFF 5600  ──> 4K BAZZITE\n  SFF 3600  ──> SECONDARY",
    tone: "violet",
    path: "/systems/hardware",
  },
];

export const projects: Project[] = [
  {
    slug: "hermes",
    path: "/projects/hermes",
    title: "Hermes",
    summary: "A personal AI agent that turns scattered tools into one calm, connected operating layer.",
    story:
      "Hermes began as a way to stop rebuilding the same AI setup on every device. A Mac mini now provides one always-available home for the agent while clients connect through a private mesh.",
    stack: ["Agent workflows", "Mac mini", "Tailscale", "Obsidian"],
    facts: [
      { label: "Role", value: "Personal AI system" },
      { label: "Home", value: "Mac mini M4" },
      { label: "State", value: "Active" },
    ],
    sections: [
      {
        heading: "The idea",
        paragraphs: [
          "The useful part of an assistant is not a chat window. It is continuity: one place for recurring workflows, reusable context, and interfaces that can change without rebuilding the underlying system.",
          "Hermes is that continuity layer. It stays available while the device in front of me changes.",
        ],
      },
      {
        heading: "A private-by-design memory boundary",
        paragraphs: [
          "The vault remains the source of truth, but the agent does not receive an unrestricted copy. Retrieval is deliberately scoped so useful context can move without turning the entire notebook into an API payload.",
        ],
        bullets: ["Curated context instead of bulk ingestion", "Local-first retrieval experiments", "Clear separation between private notes and public output"],
      },
      {
        heading: "What I am refining",
        paragraphs: [
          "The current work is less about adding more prompts and more about reliability: predictable workflows, useful memory, legible failure states, and keeping the system inexpensive enough to run every day.",
        ],
      },
    ],
    related: [
      { label: "AI system", path: "/systems/ai" },
      { label: "Knowledge system", path: "/systems/knowledge" },
      { label: "Why Hermes lives on a Mac mini", path: "/blog/hermes-on-mac-mini" },
    ],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "personal-website",
    path: "/projects/personal-website",
    title: "Ayumad.me",
    summary: "A public map of projects, systems, gear, writing, and the ideas connecting them.",
    story:
      "The site is intentionally broader than a portfolio. It is a public layer for a much larger private notebook and a place to make the relationships between projects visible.",
    stack: ["React", "TypeScript", "Vite", "Vercel"],
    facts: [
      { label: "Format", value: "Living index" },
      { label: "Source", value: "Curated vault snapshot" },
      { label: "State", value: "Active" },
    ],
    sections: [
      {
        heading: "A map, not a résumé",
        paragraphs: [
          "A traditional portfolio hides the connective tissue. Ayumad.me keeps projects next to the systems and gear that produced them, so the site can explain how I work rather than only displaying finished outcomes.",
        ],
      },
      {
        heading: "Five visual languages",
        paragraphs: [
          "ASCII, dither, glitch, particles, and CRT modes reinterpret the same content. The modes are not skins pasted on top; motion, typography, texture, and page transitions respond to the selected visual system.",
        ],
      },
      {
        heading: "Publishing boundary",
        paragraphs: [
          "Content is copied into a public, reviewable layer. The deployed application never reads the local vault, which keeps private material and infrastructure details outside the build.",
        ],
      },
    ],
    related: [
      { label: "Public layer article", path: "/blog/public-layer-private-vault" },
      { label: "Knowledge system", path: "/systems/knowledge" },
    ],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "homelab",
    path: "/projects/homelab",
    title: "Homelab",
    summary: "A workstation-turned-server for durable services, storage, and experiments.",
    story:
      "The homelab turns older workstation hardware into infrastructure I can understand and change. The main design principle is separation: experiments should be easy to replace without destabilizing the services I rely on.",
    stack: ["Proxmox VE", "ZFS", "Virtual machines", "Containers"],
    facts: [
      { label: "Host", value: "ThinkStation P520" },
      { label: "Focus", value: "Isolation + reuse" },
      { label: "State", value: "Active" },
    ],
    sections: [
      {
        heading: "Why a workstation",
        paragraphs: [
          "The P520 offers the expansion, memory capacity, and serviceability of a real workstation without requiring purpose-built rack hardware. It is quiet enough to live nearby and flexible enough to keep changing roles.",
        ],
      },
      {
        heading: "Layered workloads",
        paragraphs: [
          "The host separates storage, long-running services, and short-lived experiments. That structure keeps recovery understandable and makes it easier to learn from a failed configuration.",
        ],
        bullets: ["ZFS-backed storage", "Virtualized compute", "Containerized services", "Private remote access"],
      },
      {
        heading: "Next",
        paragraphs: [
          "The next phase is documenting service ownership and recovery paths clearly enough that the lab behaves like a maintained system instead of a collection of clever one-offs.",
        ],
      },
    ],
    related: [
      { label: "Hardware system", path: "/systems/hardware" },
      { label: "Hermes", path: "/projects/hermes" },
    ],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "obsidian-rag",
    path: "/projects/obsidian-rag",
    title: "Obsidian RAG",
    summary: "A retrieval layer for asking useful questions without flattening a private vault into a public dataset.",
    story:
      "The project explores how an assistant can retrieve the right note fragments while respecting the vault's structure and visibility boundaries.",
    stack: ["Python", "Obsidian", "Embeddings", "Retrieval"],
    facts: [
      { label: "Source", value: "Obsidian vault" },
      { label: "Boundary", value: "Curated retrieval" },
      { label: "State", value: "Active" },
    ],
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "A notebook is useful because it contains unfinished thinking, personal context, and operational detail. Those same qualities make indiscriminate indexing a poor default.",
        ],
      },
      {
        heading: "Retrieval as an interface",
        paragraphs: [
          "The system treats retrieval as a controlled interface: choose eligible sources, preserve enough structure for context, and return grounded passages rather than pretending the model knows the notebook.",
        ],
        bullets: ["Visibility-aware source selection", "Metadata-preserving chunks", "Grounded answers with traceable note context"],
      },
      {
        heading: "Where it is going",
        paragraphs: [
          "The next step is a dependable bridge between the vault and Hermes that remains useful even when the model, embedding backend, or client changes.",
        ],
      },
    ],
    related: [
      { label: "Knowledge system", path: "/systems/knowledge" },
      { label: "Hermes", path: "/projects/hermes" },
    ],
    status: "in-progress",
    year: "Now",
  },
  {
    slug: "voice-assistant",
    path: "/projects/voice-assistant",
    title: "Voice Assistant",
    summary: "A local-first voice interface for the same Hermes backend used everywhere else.",
    story:
      "The goal is not a novelty speaker. It is a low-friction interface that reuses the agent, memory boundary, and tools already built for Hermes.",
    stack: ["Speech-to-text", "Text-to-speech", "Wake word", "Local inference"],
    facts: [
      { label: "Interface", value: "Voice" },
      { label: "Constraint", value: "Local-first core loop" },
      { label: "State", value: "Research" },
    ],
    sections: [
      {
        heading: "Reuse the system",
        paragraphs: [
          "Voice should be another client, not another assistant. Keeping intelligence and tools in Hermes prevents a microphone endpoint from becoming a disconnected second stack.",
        ],
      },
      {
        heading: "Design constraints",
        paragraphs: [
          "Latency, interruption, and privacy matter more than a theatrical voice. The current research focuses on a fast local core loop with clear feedback when the system is listening or thinking.",
        ],
        bullets: ["Local speech recognition where practical", "Replaceable voice synthesis", "Visible and audible state feedback"],
      },
      {
        heading: "Current state",
        paragraphs: [
          "This remains an exploration rather than a finished appliance. The architecture is being defined before hardware and wake-word choices are locked in.",
        ],
      },
    ],
    related: [
      { label: "Hermes", path: "/projects/hermes" },
      { label: "AI system", path: "/systems/ai" },
    ],
    status: "planned",
    year: "Research",
  },
  {
    slug: "owlbot",
    path: "/projects/owlbot",
    title: "Owlbot",
    summary: "A chatbot built to help Foothill College students navigate common campus questions.",
    story: "An early exercise in turning a sprawling institutional knowledge base into approachable answers.",
    stack: ["Python", "NLP", "Information retrieval"],
    facts: [],
    sections: [],
    related: [],
    status: "completed",
    year: "2023",
    archived: true,
  },
  {
    slug: "delulubot",
    path: "/projects/delulubot",
    title: "DeluluBot",
    summary: "An emotion-aware chatbot built during CalHacks 10.0.",
    story: "A compact hackathon experiment in how sentiment and response tone change an interaction.",
    stack: ["Python", "Sentiment analysis", "CalHacks"],
    facts: [],
    sections: [],
    related: [],
    status: "completed",
    year: "2023",
    archived: true,
  },
  {
    slug: "audio-visualization",
    path: "/projects/audio-visualization",
    title: "Audio Visualization",
    summary: "Cymatics and machine learning turned into a visual study of sound.",
    story: "A project combining signal processing, computer vision, and music to make audio structure visible.",
    stack: ["Python", "TensorFlow", "Audio processing"],
    facts: [],
    sections: [],
    related: [],
    status: "completed",
    year: "2024",
    archived: true,
  },
];

export const systemLayers: SystemLayer[] = [
  {
    index: "L1",
    slug: "ai",
    path: "/systems/ai",
    title: "AI",
    description: "One agent backend, replaceable models, and interfaces that share the same tools and context.",
    items: ["Hermes backend", "Client surfaces", "Model routing", "Scoped retrieval"],
    signal: "intent → tools → model → useful output",
    sections: [
      {
        heading: "One backend",
        paragraphs: ["Hermes centralizes workflows so each device can be a client instead of a separate assistant installation."],
      },
      {
        heading: "Replaceable intelligence",
        paragraphs: ["Models are components, not the product. Routing can change without discarding the workflows, interfaces, or knowledge boundary around them."],
      },
      {
        heading: "Reliability over spectacle",
        paragraphs: ["The useful measure is whether a recurring workflow completes predictably, exposes failures clearly, and remains inexpensive enough to keep running."],
      },
    ],
    related: [
      { label: "Hermes project", path: "/projects/hermes" },
      { label: "Obsidian RAG", path: "/projects/obsidian-rag" },
    ],
  },
  {
    index: "L2",
    slug: "hardware",
    path: "/systems/hardware",
    title: "Hardware",
    description: "A collection of computers with deliberate roles, from a primary workstation to compact Linux consoles.",
    items: ["Creekwood / RTX 5080", "Bazzite / RX 9070 XT", "Bazzite / RX 9060 XT", "P520 / Proxmox", "Mac mini / Hermes"],
    signal: "machine → operating system → role",
    sections: [
      {
        heading: "Creekwood",
        paragraphs: ["The primary desktop pairs a Ryzen 7 5800X3D, RTX 5080, and 64 GB of memory with a mix of fast local storage and larger archive drives."],
      },
      {
        heading: "Two Bazzite machines",
        paragraphs: ["A Ryzen 5 5600 with RX 9070 XT handles the higher-end compact role; a Ryzen 5 3600 with RX 9060 XT 16 GB is the secondary system. Bazzite gives both a focused, controller-friendly Linux surface."],
      },
      {
        heading: "Infrastructure machines",
        paragraphs: ["The ThinkStation P520 handles virtualization and storage while the M4 Mac mini provides a quiet, efficient home for Hermes."],
      },
    ],
    related: [
      { label: "Homelab", path: "/projects/homelab" },
      { label: "Bazzite article", path: "/blog/two-bazzite-sff-pcs" },
    ],
  },
  {
    index: "L3",
    slug: "audio",
    path: "/systems/audio",
    title: "Audio",
    description: "A desktop headphone system tuned by changing the transducer, not by collecting disconnected boxes.",
    items: ["FiiO K13 R2R", "Audeze LCD-X", "HIFIMAN Edition XS", "Sennheiser HD 660S2", "Sennheiser HD 490 Pro"],
    signal: "source → DAC/amp → headphone → session",
    sections: [
      {
        heading: "The stack",
        paragraphs: ["The FiiO K13 R2R is the primary wired station. It keeps the desk simple while supporting headphones with very different loads and presentations."],
      },
      {
        heading: "The rotation",
        paragraphs: ["LCD-X brings physical low end and density, Edition XS opens the stage, and HD 660S2 offers a more intimate presentation. HD 490 Pro and Focal Azurys fill practical monitoring and closed-back roles."],
      },
      {
        heading: "What I listen for",
        paragraphs: ["I tend toward warmth and deep sub-bass, but stage, detail, comfort, and chain synergy determine what stays in rotation."],
      },
    ],
    related: [
      { label: "Headphone stack article", path: "/blog/desktop-headphone-stack" },
      { label: "Gear index", path: "/gear" },
    ],
  },
  {
    index: "L4",
    slug: "knowledge",
    path: "/systems/knowledge",
    title: "Knowledge",
    description: "A layered Obsidian vault that separates capture, active work, durable knowledge, and publishable material.",
    items: ["Inbox + daily capture", "Projects + areas", "Resources + maps", "System governance", "Curated public layer"],
    signal: "capture → connect → maintain → publish",
    sections: [
      {
        heading: "The vault is canonical",
        paragraphs: ["Obsidian is the durable source for project context, device records, decisions, and writing. Other tools can present or act on that information without silently becoming a second source of truth."],
      },
      {
        heading: "Structure with intent",
        paragraphs: ["The hierarchy separates active projects, ongoing areas, reusable resources, archive material, and system governance. Maps and metadata make relationships visible without forcing every note into one rigid taxonomy."],
      },
      {
        heading: "A deliberate public layer",
        paragraphs: ["Publishing is an editorial act. Approved facts are paraphrased into the repository; private notes, credentials, and operational runbooks never enter the browser bundle or deployment pipeline."],
      },
    ],
    related: [
      { label: "Obsidian RAG", path: "/projects/obsidian-rag" },
      { label: "Public layer article", path: "/blog/public-layer-private-vault" },
    ],
  },
];

export const gearCategories: GearCategory[] = [
  {
    category: "Computers",
    items: [
      { name: "Creekwood", role: "Ryzen 7 5800X3D, RTX 5080, 64 GB — primary desktop" },
      { name: "SFF / RX 9070 XT", role: "Ryzen 5 5600, 32 GB, Bazzite — compact high-end system" },
      { name: "SFF / RX 9060 XT", role: "Ryzen 5 3600, 16 GB, Bazzite — secondary console-like PC" },
      { name: "Mac mini M4", role: "Quiet always-on home for Hermes" },
      { name: "ThinkStation P520", role: "Proxmox host, storage, and lab workloads" },
      { name: "MacBook Pro M4 Pro", role: "Primary mobile macOS workstation" },
      { name: "MacBook Air M2", role: "Lightweight mobile computer" },
      { name: "Framework Laptop 13", role: "Repairable modular laptop" },
      { name: "ROG Flow Z13 (2025)", role: "Portable high-performance Windows system" },
      { name: "Beelink SER8", role: "Compact Linux experimentation machine" },
    ],
  },
  {
    category: "Headphones + Audio",
    items: [
      { name: "FiiO K13 R2R", role: "Primary desktop DAC and headphone amplifier" },
      { name: "Audeze LCD-X", role: "Planar headphone — weight, impact, and detail" },
      { name: "HIFIMAN Edition XS", role: "Planar headphone — open stage and scale" },
      { name: "Sennheiser HD 660S2", role: "Dynamic headphone — intimate daily rotation" },
      { name: "Sennheiser HD 490 Pro", role: "Open-back monitoring and long sessions" },
      { name: "Focal Azurys", role: "Closed-back listening" },
      { name: "AirPods Max", role: "Wireless Apple listening" },
      { name: "Sennheiser Momentum 4", role: "Long-battery wireless listening" },
      { name: "Astro A50 Gen 5", role: "Wireless gaming headset" },
      { name: "Moondrop Dusk", role: "Reference-oriented IEM" },
    ],
  },
  {
    category: "Photography",
    items: [
      { name: "Fujifilm X-T4", role: "Interchangeable-lens photo and video body" },
      { name: "Fujinon XF 18–55mm", role: "Compact everyday zoom" },
      { name: "Fujifilm X100VI", role: "Fixed-lens carry camera" },
      { name: "Fujifilm X20", role: "Small older digital camera" },
      { name: "Manfrotto carbon tripod", role: "Travel and long-exposure support" },
    ],
  },
  {
    category: "Gaming + Spatial",
    items: [
      { name: "Steam Deck", role: "Portable PC library" },
      { name: "ROG Ally", role: "Windows handheld experiments" },
      { name: "Meta Quest", role: "Standalone VR" },
      { name: "PlayStation 5", role: "Living-room console" },
      { name: "Nintendo Switch", role: "Nintendo and portable play" },
    ],
  },
  {
    category: "Mobile + Peripherals",
    items: [
      { name: "iPhone", role: "Primary mobile device" },
      { name: "iPad", role: "Reading, notes, and remote interfaces" },
      { name: "Razer Viper V3 Pro", role: "Primary desktop mouse" },
      { name: "8BitDo Wireless Keyboard", role: "Compact mechanical keyboard" },
      { name: "Logitech MX Travel 3", role: "Portable productivity mouse" },
    ],
  },
];

export const aboutContent = {
  intro: "Computer Engineering student in Fremont building personal systems across AI, hardware, and creative technology.",
  story: [
    "I got into technology by jailbreaking devices and running emulators. I liked seeing hardware do something outside its intended path, then tracing backward until I understood why it worked.",
    "That instinct grew into Linux installations, self-hosted services, workstation builds, audio chains, and cameras. I am most interested in technology when it becomes a medium: something that can be arranged, tuned, and made personal rather than simply consumed.",
    "Most of my projects start with a practical friction point. Hermes came from wanting one agent across every device. The homelab came from wanting infrastructure I could actually inspect. This site came from wanting a public map rather than another compressed résumé.",
    "I study Computer Engineering at San José State University and participate in the ACM @ SJSU community after completing Computer Science coursework at Foothill College. Outside class, I keep learning through the systems I use every day.",
  ],
  education: [
    { school: "San José State University", program: "B.S. Computer Engineering — in progress" },
    { school: "Foothill College", program: "Computer Science studies" },
  ],
  skills: ["Python", "C++", "TypeScript", "React", "Linux", "Proxmox", "ZFS", "Docker", "Tailscale", "AI systems"],
  interests: ["Local AI", "Knowledge systems", "Self-hosting", "Headphone audio", "Film", "Anime", "Photography", "Gaming + VR"],
};

export const socialLinks: SocialLink[] = [
  {
    label: "Email",
    href: "mailto:Ayumadbro123@gmail.com",
    handle: "Ayumadbro123@gmail.com",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ayush-madhukar-6021a0249/",
    handle: "Ayush Madhukar",
    external: true,
  },
  { label: "GitHub", href: "https://github.com/ayumad", handle: "@ayumad", external: true },
  {
    label: "Résumé",
    href: "/ayush-madhukar-resume.pdf",
    handle: "View / download PDF",
    external: true,
    download: true,
  },
];

export const activityConnections: ActivityConnection[] = [
  {
    service: "Spotify",
    signal: "Now listening",
    description: "Current track, artist, album, and recent listening.",
    status: "planned",
  },
  {
    service: "IMDb",
    signal: "Now watching",
    description: "Current films, series, ratings, and watchlist activity.",
    status: "planned",
  },
  {
    service: "MyAnimeList",
    signal: "Anime progress",
    description: "Currently watching, episode progress, and completed series.",
    status: "planned",
  },
  {
    service: "Steam",
    signal: "Now playing",
    description: "Current game, recent sessions, and playtime.",
    status: "planned",
  },
  {
    service: "Goodreads",
    signal: "Now reading",
    description: "Current book, reading progress, and recently finished titles.",
    status: "planned",
  },
];

export const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Ayumad.me — Ayush Madhukar",
    description: "Projects, systems, gear, and notes from Ayush Madhukar.",
  },
  "/work": {
    title: "Work — Ayumad.me",
    description: "Current work across AI, infrastructure, audio, and Linux hardware.",
  },
  "/projects": {
    title: "Projects — Ayumad.me",
    description: "Current projects and selected experiments by Ayush Madhukar.",
  },
  "/systems": {
    title: "Systems — Ayumad.me",
    description: "The AI, hardware, audio, and knowledge systems Ayush uses.",
  },
  "/gear": {
    title: "Gear — Ayumad.me",
    description: "A curated snapshot of the computers, audio, cameras, and tools Ayush uses.",
  },
  "/blog": {
    title: "Blog — Ayumad.me",
    description: "Long-form notes on personal AI, knowledge systems, audio, and Linux hardware.",
  },
  "/about": {
    title: "About — Ayumad.me",
    description: "About Ayush Madhukar, a Computer Engineering student and systems builder.",
  },
  "/contact": {
    title: "Contact — Ayumad.me",
    description: "Email Ayush Madhukar, connect on LinkedIn or GitHub, and explore planned activity feeds.",
  },
};
