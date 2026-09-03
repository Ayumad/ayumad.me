import { gearCategories as loadoutCategories } from "./gearContent";

export interface NavItem {
  label: string;
  path: string;
  index: string;
}

export interface GearItem {
  name: string;
  note: string;
  role?: string;
  status: "active" | "available" | "lent" | "sale-planned" | "stored";
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
  { label: "About", path: "/about", index: "04" },
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

export const gearCategories = loadoutCategories;

export function gearSlug(category: string, name: string) {
  return `${category}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function findGearItem(slug: string) {
  for (const category of gearCategories) {
    const item = category.items.find((candidate) => gearSlug(category.category, candidate.name) === slug);
    if (item) return { category: category.category, item };
  }
  return undefined;
}

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
  { label: "Email", href: "mailto:Ayumadbro123@gmail.com", handle: "Ayumadbro123@gmail.com" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ayush-madhukar-6021a0249/", handle: "in/ayush-madhukar", external: true },
  { label: "GitHub", href: "https://github.com/ayumad", handle: "@ayumad", external: true },
  { label: "X", href: "https://x.com/Ayumadbro", handle: "@Ayumadbro", external: true },
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
  "/gear": {
    title: "Gear — Ayumad.me",
    description: "The devices, speakers, cameras, and tools Ayush uses and tracks.",
  },
  "/journal": {
    title: "Journal — Ayumad.me",
    description: "Curated field notes on building, configuring, and understanding things.",
  },
  "/renderer": {
    title: "Renderer — Ayumad.me",
    description: "A dedicated XY oscilloscope renderer: one signal, one clock, five display adapters.",
  },
  "/about": {
    title: "About — Ayumad.me",
    description: "About Ayush Madhukar, his interests, listening habits, and contact details.",
  },
};
