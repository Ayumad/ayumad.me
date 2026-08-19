import {
  type AnchorHTMLAttributes,
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { marked } from "marked";
import AsciiOscilloscope from "./AsciiOscilloscope";
import AsciiScene, { type AsciiSceneName } from "./AsciiScene";
import ParticleField from "./ParticleField";
import TasteSection from "./TastePage";
import { nowEntries, nowUpdated } from "./nowData";
import {
  isRenderMode,
  RenderModeContext,
  renderModes,
  type RenderMode,
} from "./renderMode";
import { playbackProgress } from "./spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import { SpotifyPlaybackProvider } from "./SpotifyPlaybackProvider";
import { useSpotifyPlayback } from "./useSpotifyPlayback";
import { findJournalPost, journalPosts, type JournalPost } from "./journalContent";
import {
  aboutContent,
  gearCategories,
  hermesSections,
  homeContent,
  navItems,
  pageMeta,
  projects,
  showcaseTopics,
  socialLinks,
  systemLayers,
  type Project,
  type ProjectStatus,
} from "./siteContent";

const contactField = String.raw`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │    EMAIL  ────────────────┐                │
  │                           ├── AYUMAD.ME    │
  │    GITHUB ────────────────┘                │
  │                                             │
  └─────────────────────────────────────────────┘`;

type Theme = "light" | "dark";

interface ErrorBoundaryState {
  hasError: boolean;
}

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

function Link({ to, children, ...props }: SiteLinkProps) {
  return (
    <RouterLink to={to} {...props}>
      {children}
    </RouterLink>
  );
}

export class SiteErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Ayumad.me render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <p className="label">Error</p>
          <h1>Something went wrong.</h1>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ayumad-theme", theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}

function useRenderer() {
  const [renderMode, setRenderMode] = useState<RenderMode>(() => {
    const current = document.documentElement.dataset.renderer;
    return isRenderMode(current) ? current : "ascii";
  });

  useEffect(() => {
    document.documentElement.dataset.renderer = renderMode;
    localStorage.setItem("ayumad-renderer", renderMode);
  }, [renderMode]);

  return { renderMode, setRenderMode };
}

function migrateLegacyHash() {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return;

  const oldPath = hash.slice(1).split("#")[0];
  let nextPath = oldPath;
  if (["/showcase", "/systems", "/now"].includes(oldPath)) nextPath = "/projects";
  if (oldPath === "/hermes") nextPath = "/projects/hermes";
  if (oldPath === "/contact") nextPath = "/about#contact";
  if (oldPath === "/writeups" || oldPath === "/blog") nextPath = "/journal";
  if (oldPath.startsWith("/writeups/")) nextPath = oldPath.replace("/writeups/", "/journal/");

  window.history.replaceState({}, "", nextPath);
}

function RouteEffects() {
  const location = useLocation();
  const post = location.pathname.startsWith("/journal/")
    ? findJournalPost(location.pathname.slice("/journal/".length))
    : undefined;
  const meta = post
    ? { title: `${post.title} — Ayumad.me`, description: post.summary }
    : pageMeta[location.pathname] ?? {
        title: "Not found — Ayumad.me",
        description: "The requested page could not be found.",
      };
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", `https://ayumad.me${location.pathname}`);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://ayumad.me${location.pathname}`);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [location.pathname, meta.description, meta.title, reducedMotion]);

  return null;
}

function Header({
  path,
  renderMode,
  setRenderMode,
}: {
  path: string;
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleNav = navItems.filter((item) => item.path !== "/journal" || journalPosts.length > 0);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="Ayumad.me home" onClick={() => setMenuOpen(false)}>
          AYUMAD.ME
        </Link>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} id="site-navigation" aria-label="Main navigation">
          {visibleNav.map((item) => {
            const isActive = item.path === "/"
              ? path === "/"
              : path === item.path || path.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? "nav-link active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{item.index}</span>{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">
          <label className="render-control">
            <span className="sr-only">Renderer</span>
            <select
              className="render-select"
              aria-label="Renderer"
              value={renderMode}
              onChange={(event) => {
                if (isRenderMode(event.target.value)) setRenderMode(event.target.value);
              }}
            >
              {renderModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </label>
          <button
            type="button"
            className="plain-button icon-control"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
          </button>
          <button
            type="button"
            className="plain-button icon-control menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            title={menuOpen ? "Close navigation" : "Open navigation"}
          >
            <span aria-hidden="true">{menuOpen ? "×" : "≡"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function PageTransition({ children, path }: PropsWithChildren<{ path: string }>) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="route-frame"
        key={path}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeading({
  index,
  label,
  title,
  description,
  scene,
}: {
  index: string;
  label: string;
  title: string;
  description: string;
  scene: AsciiSceneName;
}) {
  return (
    <header className="page-heading">
      <div className="heading-copy">
        <p className="label"><span>{index}</span>{label}</p>
        <h1>{title}</h1>
        <p className="page-intro">{description}</p>
      </div>
      <AsciiScene className={`heading-field art-${scene}`} scene={scene} />
    </header>
  );
}

function AsciiDivider() {
  return <div className="ascii-divider" aria-hidden="true"><span> . : - = + * # % @ </span><i /><span> @ % # * + = - : . </span></div>;
}

function HomePage() {
  const descriptions = [
    "Current work, systems, and experiments.",
    "The devices and tools I use.",
    "Curated field notes and essays.",
    "Background, interests, taste, and contact.",
  ];
  const homeNav = navItems.slice(1).filter((item) => item.path !== "/journal" || journalPosts.length > 0);

  return (
    <>
      <section className="hero section-shell">
        <AsciiOscilloscope />
        <div className="hero-copy">
          <p className="label">Computer Engineering</p>
          <h1 aria-label="Ayush Madhukar"><span>Ayush</span><span>Madhukar</span></h1>
          <p className="hero-deck">{homeContent.intro}</p>
          <div className="hero-actions"><Link className="button primary" to="/projects">Projects</Link><Link className="button" to="/about">About</Link></div>
          <SpotifyHomeSignal />
        </div>
        <aside className="hero-index" aria-label="Primary interests">
          <p className="label">Topics</p>
          <ol>{homeContent.topics.map((topic, index) => <li key={topic}><span>0{index + 1}</span>{topic}</li>)}</ol>
          <p>Bay Area, California</p>
        </aside>
      </section>
      <section className="home-index section-shell" aria-labelledby="index-title">
        <AsciiDivider />
        <div className="section-title"><p className="label">Navigation</p><h2 id="index-title">Index</h2></div>
        <div className="index-list">
          {homeNav.map((item, index) => (
            <motion.div key={item.path} whileHover={{ x: 6 }} transition={{ duration: 0.14 }}>
              <Link to={item.path} className="index-row"><span>{item.index}</span><h3>{item.label}</h3><p>{descriptions[index]}</p><i aria-hidden="true">↗</i></Link>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="current section-shell">
        <div className="current-art" aria-hidden="true"><span>░░▒▒▓▓████</span><span>░▒▓█▓▒░</span><span>████▓▓▒▒░░</span></div>
        <div><p className="label">Current</p><h2>{homeContent.current.title}</h2></div>
        <p>{homeContent.current.description}</p>
        <Link className="text-link" to="/projects/hermes">Hermes <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}

function statusLabel(status: ProjectStatus) {
  if (status === "in-progress") return "In progress";
  if (status === "planned") return "Planned";
  return "Completed";
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.article className={`project-row ${project.featured ? "project-row-featured" : ""}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: index * 0.04 }}>
      <div className="project-index" aria-hidden="true"><span>0{index + 1}</span><i>░▒▓█</i></div>
      <div className="project-main">
        <div className="project-meta"><span className={`status status-${project.status}`}>{statusLabel(project.status)}</span><span>{project.year}</span></div>
        <h2>{project.title}</h2><p>{project.summary}</p>
      </div>
      <div className="project-detail">
        <ul className="tag-list">{project.stack.map((tool) => <li key={tool}>{tool}</li>)}</ul>
        {project.slug === "hermes-agent" ? <Link className="text-link project-case-link" to="/projects/hermes">Open Hermes case study ↗</Link> : null}
        {project.liveUrl ? <a className="text-link project-case-link" href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} live app`}>Open live app ↗</a> : null}
        <details><summary>Details <span aria-hidden="true">+</span></summary><p>{project.story}</p></details>
      </div>
    </motion.article>
  );
}

function ProjectsPage() {
  const active = projects.filter((project) => project.status !== "completed");
  const completed = projects.filter((project) => project.status === "completed");
  return (
    <section className="section-shell page-section">
      <SectionHeading index="01" label="Projects" title="Projects" description="Current work, systems, and experiments in one place." scene="projects" />
      <section className="project-current" aria-labelledby="current-focus-title">
        <div className="section-title"><p className="label">Current focus</p><h2 id="current-focus-title">What I am working on</h2><p>Updated {nowUpdated}.</p></div>
        <div className="now-list">{nowEntries.map((entry, index) => <motion.article className="now-row" key={entry.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }}><span>{entry.marker}</span><div><p className="label">{entry.label}</p><h3>{entry.title}</h3></div><p>{entry.description}</p><code>{entry.detail}</code></motion.article>)}</div>
      </section>
      <section className="projects-context" aria-labelledby="projects-context-title">
        <div className="section-title"><p className="label">Context</p><h2 id="projects-context-title">The areas underneath</h2><p>The old Work page belonged here all along: the projects make more sense when the surrounding systems stay visible.</p></div>
        <div className="showcase-list">
          {showcaseTopics.map((topic, index) => (
            <motion.article className={`showcase-row tone-${topic.tone}`} key={topic.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }}>
              <span className="row-number">0{index + 1}</span>
              <div className="showcase-copy">
                <p className="label">{topic.eyebrow}</p>
                <h2>{topic.title}</h2>
                <p>{topic.summary}</p>
                <ul className="tag-list" aria-label={`${topic.title} topics`}>{topic.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <pre className="topic-ascii" aria-hidden="true">{topic.ascii}</pre>
            </motion.article>
          ))}
        </div>
      </section>
      <div className="project-list">{active.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</div>
      <section className="systems-embedded" aria-labelledby="systems-title">
        <div className="section-title"><p className="label">Systems</p><h2 id="systems-title">The layers underneath</h2><p>Projects are easier to understand when the machines and systems around them are visible.</p></div>
        <div className="systems-list">{systemLayers.map((layer, index) => <motion.article className="system-row" key={layer.title} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }}><span className="row-number">{layer.index}</span><div><h3>{layer.title}</h3><p>{layer.description}</p><small>Flow</small><code>{layer.signal}</code></div><ul>{layer.items.map((item) => <li key={item}>{item}</li>)}</ul></motion.article>)}</div>
        <div className="system-band" aria-label="Four connected areas"><span>Knowledge</span><i>·</i><span>AI</span><i>·</i><span>Hardware</span><i>·</i><span>Audio</span></div>
      </section>
      <div className="future-panel"><div><p className="label">Archive</p><h2>Completed</h2><p>Past builds and experiments.</p></div><div className="project-list">{completed.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</div></div>
    </section>
  );
}

function HermesPage() {
  return (
    <section className="section-shell page-section">
      <Link className="article-back" to="/projects">← All projects</Link>
      <SectionHeading index="01 / 01" label="Featured project" title="Hermes" description="The AI agent that runs my daily operations — briefs, memory, scheduled work, and model routing." scene="systems" />
      <div className="hermes-intro"><p>Hermes started as a way to stop rebuilding AI tooling on every device. One server on a Mac mini, connected from everywhere over a private mesh network. It handles morning briefs, interview prep, session journals, and scheduled automations so I can spend more time on the things that need a person.</p></div>
      <div className="hermes-sections">{hermesSections.map((section, index) => <motion.article className="system-row" key={section.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.05 }}><span className="row-number">0{index + 1}</span><div><h2>{section.title}</h2><p>{section.description}</p></div><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></motion.article>)}</div>
      <div className="hermes-architecture"><pre className="topic-ascii" aria-hidden="true">{String.raw`
  ┌─────────────────────────────────────────┐
  │              HERMES AGENT               │
  ├─────────┬───────────┬───────────────────┤
  │ BRIEFS  │ ROUTINES  │ MEMORY            │
  │ PROMPTS │ REVIEWS   │ MNEMOSYNE         │
  │ TASKS   │ FALLBACK  │ LOCAL RECALL      │
  ├─────────┴───────────┴───────────────────┤
  │         MODEL ROUTING                   │
  │       routine → complex → fallback      │
  ├─────────────────────────────────────────┤
  │         SURFACES                        │
  │  Telegram · WebUI · Clients · Vault     │
  └─────────────────────────────────────────┘`}</pre></div>
    </section>
  );
}

function GearPage() {
  return <section className="section-shell page-section"><SectionHeading index="02" label="Gear" title="Gear" description="The devices, speakers, cameras, and tools I use." scene="about" /><div className="gear-categories">{gearCategories.map((category, categoryIndex) => <motion.section className="gear-category" key={category.category} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: categoryIndex * 0.04 }}><h2>{category.category}</h2><div className="gear-table">{category.items.map((item) => <div className="gear-row" key={item.name}><span className="gear-name">{item.name}</span><span className="gear-role">{item.role}</span><span className={`gear-status gear-status-${item.status}`}>{item.status}</span></div>)}</div></motion.section>)}</div></section>;
}

function JournalPage() {
  return <section className="section-shell page-section"><SectionHeading index="03" label="Journal" title="Journal" description="Curated field notes on building, configuring, and understanding things." scene="systems" /><div className="journal-intro"><p>These are the pieces that made it through the edit. Short notes and longer articles live together here; the automated private session log does not.</p></div><div className="journal-list">{journalPosts.map((post, index) => <motion.article className="writeup-row" key={post.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: index * 0.04 }}><Link className="writeup-link" to={`/journal/${post.slug}`} aria-label={`Read ${post.title}`}><div className="writeup-meta"><time dateTime={post.date}>{post.date}</time><ul className="tag-list">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div><div className="writeup-main"><h2>{post.title}</h2><p>{post.summary}</p></div><span className="writeup-arrow" aria-hidden="true">↗</span></Link></motion.article>)}</div></section>;
}

function JournalArticlePage({ post }: { post: JournalPost }) {
  const html = marked.parse(post.body, { gfm: true, breaks: false });
  return <section className="section-shell page-section article-page"><Link className="article-back" to="/journal">← All journal entries</Link><header className="article-header"><p className="label">{post.date}</p><h1>{post.title}</h1><p className="article-summary">{post.summary}</p><ul className="tag-list">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></header><article className="article-body article-markdown" dangerouslySetInnerHTML={{ __html: html }} /></section>;
}

function AboutPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading index="04" label="About" title="About" description={aboutContent.intro} scene="about" />
      <div className="about-layout">
        <article className="about-story">{aboutContent.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
        <aside className="about-profile">
          <div className="ascii-monogram" aria-hidden="true"><pre>{String.raw` █████╗ ███╗   ███╗
██╔══██╗████╗ ████║
███████║██╔████╔██║
██╔══██║██║╚██╔╝██║
██║  ██║██║ ╚═╝ ██║
╚═╝  ╚═╝╚═╝     ╚═╝`}</pre></div>
          <p>Ayush Madhukar</p><span>Bay Area, California</span>
        </aside>
      </div>
      <div className="about-data">
        <section><p className="label">Education</p><dl>{aboutContent.education.map((entry) => <div key={entry.school}><dt>{entry.school}</dt><dd>{entry.program}</dd></div>)}</dl></section>
        <section><p className="label">Skills</p><ul className="large-tags">{aboutContent.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></section>
        <section><p className="label">Interests</p><ul className="interest-list">{aboutContent.interests.map((interest) => <li key={interest}>{interest}</li>)}</ul></section>
      </div>
      <section className="about-contact" id="contact" aria-labelledby="about-contact-title">
        <div><p className="label">Contact</p><h2 id="about-contact-title">Want to talk?</h2><p>Email and GitHub are the best ways to reach me.</p></div>
        <pre className="contact-field" aria-hidden="true">{contactField}</pre>
        <div className="contact-links">{socialLinks.map((link) => <a key={link.label} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}><span>{link.label}</span><strong>{link.handle}</strong><i aria-hidden="true">↗</i></a>)}</div>
      </section>
      <TasteSection />
    </section>
  );
}

function SpotifyHomeSignal() {
  const { playback, requestFailed } = useSpotifyPlayback();
  const progress = playback ? playbackProgress(playback) : null;
  const hasTrack = Boolean(playback?.configured && playback.title);
  const status = requestFailed ? "offline" : playback?.state === "playing" ? "live" : playback?.state === "recent" ? "recent" : "standby";
  const fallback = requestFailed ? "Listening activity is temporarily unavailable." : playback === null ? "Checking Spotify…" : !playback.configured ? "Spotify is not connected." : playback.state === "idle" ? "Nothing has played recently." : "Listening activity is temporarily unavailable.";
  const content = <><span className="spotify-home-fallback" aria-hidden="true">{playback?.artwork ? <SpotifyArtwork artwork={playback.artwork} album={playback.album} compact /> : "♪"}</span><span className="spotify-home-copy"><span className="spotify-home-meta"><span>{playback?.isPlaying ? "Now listening" : playback?.state === "recent" ? "Last listened" : "Audio signal"}</span><i>{status}</i></span>{hasTrack ? <><strong>{playback?.title}</strong><small>{playback?.artists?.join(", ") || playback?.album || "Spotify"}</small></> : <><strong>Spotify</strong><small>{fallback}</small></>}</span>{progress !== null ? <span className="spotify-home-progress" role="progressbar" aria-label="Track progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{ width: `${progress}%` }} /></span> : null}<span className="spotify-home-arrow" aria-hidden="true">↗</span></>;
  return playback?.url ? <a className="spotify-home-signal is-linked" href={playback.url} target="_blank" rel="noreferrer" aria-label={`Open ${playback.title ?? "track"} on Spotify`} aria-live="polite">{content}</a> : <div className="spotify-home-signal" aria-live="polite">{content}</div>;
}

function NotFoundPage() {
  return <section className="section-shell not-found"><p className="label">404</p><h1>Not found</h1><p>The requested page does not exist.</p><Link className="button primary" to="/">Home</Link></section>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-texture" aria-hidden="true">░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░</div><div className="section-shell footer-inner"><p>AYUMAD.ME</p><p>2026</p><a href="mailto:hello@ayumad.me">Email ↗</a></div></footer>;
}

function LegacyWriteupRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/journal/${slug}` : "/journal"} replace />;
}

function RoutedSite() {
  const location = useLocation();
  const { renderMode, setRenderMode } = useRenderer();
  const path = location.pathname;
  return <SpotifyPlaybackProvider><RenderModeContext.Provider value={renderMode}><MotionConfig reducedMotion="user"><RouteEffects /><ParticleField /><div className="dither-wash" aria-hidden="true" /><div className="render-overlay" aria-hidden="true" /><a className="skip-link" href="#main-content">Skip to content</a><Header path={path} renderMode={renderMode} setRenderMode={setRenderMode} /><main id="main-content"><PageTransition path={path}><Routes><Route path="/" element={<HomePage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/hermes" element={<HermesPage />} /><Route path="/gear" element={<GearPage />} /><Route path="/journal" element={<JournalPage />} /><Route path="/journal/:slug" element={<JournalArticleRoute />} /><Route path="/taste" element={<Navigate to="/about#taste" replace />} /><Route path="/about" element={<AboutPage />} /><Route path="/showcase" element={<Navigate to="/projects" replace />} /><Route path="/systems" element={<Navigate to="/projects" replace />} /><Route path="/now" element={<Navigate to="/projects" replace />} /><Route path="/hermes" element={<Navigate to="/projects/hermes" replace />} /><Route path="/contact" element={<Navigate to="/about#contact" replace />} /><Route path="/writeups" element={<Navigate to="/journal" replace />} /><Route path="/writeups/:slug" element={<LegacyWriteupRedirect />} /><Route path="/blog" element={<Navigate to="/journal" replace />} /><Route path="*" element={<NotFoundPage />} /></Routes></PageTransition></main><Footer /></MotionConfig></RenderModeContext.Provider></SpotifyPlaybackProvider>;
}

function JournalArticleRoute() {
  const { slug } = useParams();
  const post = slug ? findJournalPost(slug) : undefined;
  return post ? <JournalArticlePage post={post} /> : <NotFoundPage />;
}

export default function App() {
  migrateLegacyHash();
  return <BrowserRouter><RoutedSite /></BrowserRouter>;
}
