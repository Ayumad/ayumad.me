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
import RendererPage from "./RendererPage";
import AsciiScene, { type AsciiSceneName } from "./AsciiScene";
import ParticleField from "./ParticleField";
import TasteSection from "./TastePage";
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
  findGearItem,
  gearSlug,
  homeContent,
  navItems,
  pageMeta,
  socialLinks,
} from "./siteContent";
import { findProjectArticle, projectsByStage, type ProjectArticle, type ProjectStage } from "./projectContent";

const contactField = String.raw`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │    EMAIL  ────────────────┐                │
  │                           ├── AYUMAD       │
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
  if (oldPath === "/hermes") nextPath = "/projects/hermes-agent";
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
  const gear = location.pathname.startsWith("/gear/")
    ? findGearItem(location.pathname.slice("/gear/".length))
    : undefined;
  const project = location.pathname.startsWith("/projects/")
    ? findProjectArticle(location.pathname.slice("/projects/".length))
    : undefined;
  const hasProject = Boolean(project);
  const meta = project
    ? { title: `${project.title} — Ayumad.me`, description: project.summary }
    : post
    ? { title: `${post.title} — Ayumad.me`, description: post.summary }
    : gear
      ? { title: `${gear.item.name} — Gear — Ayumad.me`, description: `${gear.item.name}: ${gear.item.role ?? gear.item.note}` }
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
    const image = hasProject ? "" : "https://ayumad.me/og.png?v=2";
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", image);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", image);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", `https://ayumad.me${location.pathname}`);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://ayumad.me${location.pathname}`);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [hasProject, location.pathname, meta.description, meta.title, reducedMotion]);

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

function SocialIcon({ label }: { label: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (label === "Email") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></svg>;
  if (label === "LinkedIn") return <svg {...common}><path d="M6.5 9.5v8M6.5 6.5v.01M10.5 17.5v-8M10.5 13c0-2.2 1.3-3.5 3.3-3.5 2.1 0 3.2 1.4 3.2 4v4" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
  if (label === "GitHub") return <svg {...common}><path d="M9 19c-4.4 1.4-4.4-2.2-6.2-2.7M15 22v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.8 11.8 0 0 0-6.2 0C6.3 3.3 5.3 3.6 5.3 3.6a4.4 4.4 0 0 0-.1 3.3 4.7 4.7 0 0 0-1.3 3.3c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 8.6 18.5V22" /></svg>;
  return <svg {...common}><path d="M5 4 19 20M19 4 5 20M7.5 4H5l11.5 16H19" /></svg>;
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
          <div className="hero-socials" aria-label="Contact links">
            {socialLinks.map((link) => <a className="hero-social-link" key={link.label} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined} aria-label={link.label} title={link.label}><SocialIcon label={link.label} /></a>)}
          </div>
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
        <Link className="text-link" to="/projects/hermes-agent">Hermes <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}

function statusLabel(stage: ProjectStage) {
  if (stage === "in-progress") return "In progress";
  if (stage === "planned") return "Planned";
  return "Deployed / shipped";
}

function ProjectCard({ project, index }: { project: ProjectArticle; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: index * 0.04 }}>
      <Link className={`project-row project-row-${project.stage} ${project.featured ? "project-row-featured" : ""}`} to={`/projects/${project.slug}`} aria-label={`Read ${project.title} project article`}>
        <div className="project-index" aria-hidden="true"><span>0{index + 1}</span><i>░▒▓█</i></div>
        <div className="project-main">
          <div className="project-meta"><span className={`status status-${project.stage}`}>{statusLabel(project.stage)}</span><span>{project.year}</span></div>
          <h2>{project.title}</h2><p>{project.summary}</p>
        </div>
        <div className="project-detail">
          <ul className="tag-list" aria-label={`${project.title} technologies`}>{project.stack.map((tool) => <li key={tool}>{tool}</li>)}</ul>
          <div className="project-card-links"><span className="project-availability">{project.statusNote}</span><span className="project-link-label">Read article <span aria-hidden="true">↗</span></span></div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectPage({ project }: { project: ProjectArticle }) {
  const html = marked.parse(project.body, { gfm: true, breaks: false });
  const links = [
    project.liveUrl ? { label: project.liveLabel ?? "Open live project", href: project.liveUrl, external: project.liveUrl.startsWith("http") || project.liveUrl.startsWith("/ai") } : null,
    project.sourceUrl ? { label: project.sourceLabel ?? "View source", href: project.sourceUrl, external: true } : null,
  ].filter(Boolean) as { label: string; href: string; external: boolean }[];
  return (
    <section className="section-shell page-section project-page project-page-article">
      <Link className="back-link" to="/projects">← All projects</Link>
      <div className="project-page-header">
        <p className="label">Project / {project.year}</p>
        <div className="project-meta"><span className={`status status-${project.stage}`}>{statusLabel(project.stage)}</span><span>{project.statusNote}</span></div>
        <h1>{project.title}</h1>
        <p className="article-summary">{project.summary}</p>
      </div>
      <div className="project-page-content">
        <aside className="project-facts" aria-label={`${project.title} facts`}>
          <div><p className="label">Stage</p><p>{statusLabel(project.stage)}</p></div>
          <div><p className="label">Status</p><p>{project.statusNote}</p></div>
          <div><p className="label">Year</p><p>{project.year}</p></div>
          <div><p className="label">Stack</p><ul className="tag-list" aria-label={`${project.title} technologies`}>{project.stack.map((tool) => <li key={tool}>{tool}</li>)}</ul></div>
          {links.length ? <div><p className="label">Links</p><ul className="project-fact-links">{links.map((link) => link.external ? <li key={link.href}><a className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a></li> : <li key={link.href}><Link className="text-link" to={link.href}>{link.label} ↗</Link></li>)}</ul></div> : null}
        </aside>
        <article className="article-body article-markdown" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function ProjectDetailRoute() {
  const { slug } = useParams();
  const project = slug ? findProjectArticle(slug) : undefined;
  return project ? <ProjectPage project={project} /> : <NotFoundPage />;
}

function ProjectsPage() {
  const groups: { stage: ProjectStage; label: string; description: string; count: string }[] = [
    { stage: "deployed", label: "Deployed / Shipped", description: "Public work with a live surface or released source.", count: "05" },
    { stage: "in-progress", label: "In Progress", description: "Active systems and prototypes being built now.", count: "05" },
    { stage: "planned", label: "Planned", description: "Forward-looking concepts that are not released.", count: "02" },
  ];
  return (
    <section className="section-shell page-section">
      <SectionHeading index="01" label="Projects" title="Projects" description="A status-driven index of the systems, tools, and experiments worth following." scene="projects" />
      <div className="project-status-overview" aria-label="Project status counts">{groups.map((group) => <div key={group.stage}><span>{group.count}</span><p>{group.label}</p></div>)}</div>
      <div className="project-status-groups">{groups.map((group) => {
        const entries = projectsByStage(group.stage);
        return <section className={`project-status-group project-status-group-${group.stage}`} key={group.stage} aria-labelledby={`project-${group.stage}-title`}><header className="project-status-header"><div><p className="label">{group.count} projects</p><h2 id={`project-${group.stage}-title`}>{group.label}</h2><p>{group.description}</p></div><span className="project-status-count">{entries.length.toString().padStart(2, "0")}</span></header><div className="project-list">{entries.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</div></section>;
      })}</div>
    </section>
  );
}

function GearPage() {
  const productCount = gearCategories.reduce((count, category) => count + category.items.length, 0);
  return <section className="section-shell page-section"><SectionHeading index="02" label="Gear" title="Gear" description={`A working index of the ${productCount} core devices and tools in my loadout. I leave smaller accessories and network hardware out; open a field note for the role, configuration, or reason each system stays.`} scene="gear" /><div className="gear-categories">{gearCategories.map((category, categoryIndex) => <motion.section className="gear-category" key={category.category} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: categoryIndex * 0.04 }}><div className="gear-category-heading"><h2>{category.category}</h2><span>{category.items.length} products</span></div><div className="gear-table">{category.items.map((item) => <div className="gear-row" key={`${category.category}-${item.name}`}><Link className="gear-name" to={`/gear/${gearSlug(category.category, item.name)}`} aria-label={`Open ${item.name} gear page`}>{item.name}</Link><span className="gear-role">{item.role ?? "Open field note"}</span><span className={`gear-status gear-status-${item.status}`}>{item.status.replace("-", " ")}</span></div>)}</div></motion.section>)}</div></section>;
}

const relatedGearPages: Record<string, { label: string; to: string }[]> = {
  [gearSlug("Computers", "Apple Mac mini (M4, 2024)")]: [{ label: "Read the Hermes case study", to: "/projects/hermes-agent" }],
  [gearSlug("Computers", "Lenovo ThinkStation P520")]: [{ label: "Read the P520 GPU passthrough journal", to: "/journal/gpu-passthrough-p520" }],
  [gearSlug("Computers", "Panasonic Let's Note SV1")]: [{ label: "Read the Arch daily-driver journal", to: "/journal/arch-daily-driver" }],
};

function GearDetailPage() {
  const { slug } = useParams();
  const gear = slug ? findGearItem(slug) : undefined;
  if (!gear) return <NotFoundPage />;
  const related = relatedGearPages[gearSlug(gear.category, gear.item.name)] ?? [];
  return <section className="section-shell page-section gear-detail-page"><Link className="article-back" to="/gear">← All gear</Link><SectionHeading index="02 / GEAR" label={gear.category} title={gear.item.name} description={gear.item.role ?? gear.item.note} scene="gear" /><div className="gear-detail-grid"><div><p className="label">Status</p><p className={`gear-detail-status gear-status-${gear.item.status}`}>{gear.item.status.replace("-", " ")}</p></div><div><p className="label">Category</p><p>{gear.category}</p></div><div><p className="label">Related pages</p>{related.length ? <ul className="gear-related-links">{related.map((link) => <li key={link.to}><Link className="text-link" to={link.to}>{link.label} ↗</Link></li>)}</ul> : <p className="gear-detail-muted">No dedicated notes yet.</p>}</div></div><article className="gear-detail-note"><p className="label">Field note</p><p>{gear.item.note}</p></article><Link className="button" to="/gear">Back to Gear</Link></section>;
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
        <div className="contact-intro"><p className="label">Contact</p><h2 id="about-contact-title">Want to talk?</h2><p>For project questions, collaborations, or a good hardware rabbit hole.</p></div>
        <div className="contact-stack">
          <pre className="contact-field" aria-hidden="true">{contactField}</pre>
          <div className="contact-links">{socialLinks.map((link) => <a key={link.label} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}><span>{link.label}</span><strong>{link.handle}</strong><i aria-hidden="true">↗</i></a>)}</div>
        </div>
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
  return <footer className="site-footer"><div className="footer-texture" aria-hidden="true">░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░</div><div className="section-shell footer-inner"><p>AYUMAD.ME</p><p>2026</p><a href="mailto:Ayumadbro123@gmail.com">Email ↗</a></div></footer>;
}

function LegacyWriteupRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/journal/${slug}` : "/journal"} replace />;
}

function RoutedSite() {
  const location = useLocation();
  const { renderMode, setRenderMode } = useRenderer();
  const path = location.pathname;
  return <SpotifyPlaybackProvider><RenderModeContext.Provider value={renderMode}><MotionConfig reducedMotion="user"><RouteEffects /><ParticleField /><div className="dither-wash" aria-hidden="true" /><div className="render-overlay" aria-hidden="true" /><a className="skip-link" href="#main-content">Skip to content</a><Header path={path} renderMode={renderMode} setRenderMode={setRenderMode} /><main id="main-content"><PageTransition path={path}><Routes><Route path="/" element={<HomePage />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/hermes" element={<Navigate to="/projects/hermes-agent" replace />} /><Route path="/projects/daily-brief" element={<Navigate to="/projects/hermes-agent" replace />} /><Route path="/projects/owlbot" element={<Navigate to="/projects" replace />} /><Route path="/projects/delulubot" element={<Navigate to="/projects" replace />} /><Route path="/projects/audio-visualization" element={<Navigate to="/projects" replace />} /><Route path="/projects/:slug" element={<ProjectDetailRoute />} /><Route path="/gear" element={<GearPage />} /><Route path="/gear/:slug" element={<GearDetailPage />} /><Route path="/journal" element={<JournalPage />} /><Route path="/journal/:slug" element={<JournalArticleRoute />} /><Route path="/taste" element={<Navigate to="/about#taste" replace />} /><Route path="/about" element={<AboutPage />} /><Route path="/renderer" element={<RendererPage />} /><Route path="/showcase" element={<Navigate to="/projects" replace />} /><Route path="/systems" element={<Navigate to="/projects" replace />} /><Route path="/now" element={<Navigate to="/projects" replace />} /><Route path="/hermes" element={<Navigate to="/projects/hermes-agent" replace />} /><Route path="/contact" element={<Navigate to="/about#contact" replace />} /><Route path="/writeups" element={<Navigate to="/journal" replace />} /><Route path="/writeups/:slug" element={<LegacyWriteupRedirect />} /><Route path="/blog" element={<Navigate to="/journal" replace />} /><Route path="*" element={<NotFoundPage />} /></Routes></PageTransition></main><Footer /></MotionConfig></RenderModeContext.Provider></SpotifyPlaybackProvider>;
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
