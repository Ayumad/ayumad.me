import {
  type AnchorHTMLAttributes,
  Component,
  type ErrorInfo,
  type MouseEvent as ReactMouseEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import AsciiOscilloscope from "./AsciiOscilloscope";
import AsciiScene, { type AsciiSceneName } from "./AsciiScene";
import ParticleField from "./ParticleField";
import { RendererMenu } from "./RendererMenu";
import { nowEntries, nowUpdated } from "./nowData";
import {
  isRenderMode,
  RenderModeContext,
  renderModes,
  type RenderMode,
} from "./renderMode";
import {
  formatPlaybackTime,
  playbackProgress,
} from "./spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import { SpotifyPlaybackProvider } from "./SpotifyPlaybackProvider";
import { useSpotifyPlayback } from "./useSpotifyPlayback";
import { blogArticleBySlug, type BlogBlock } from "./blogContent";
import {
  activityConnections,
  aboutContent,
  blogPosts,
  gearCategories,
  homeContent,
  legacyRedirects,
  navItems,
  pageMeta,
  projects,
  showcaseTopics,
  socialLinks,
  systemLayers,
  type ProjectStatus,
} from "./siteContent";

type Theme = "light" | "dark";

interface ErrorBoundaryState {
  hasError: boolean;
}

const contactField = String.raw`
@@%%##**++==--::..        ..::--==++**##%%@@
%%##**++==--::..   EMAIL   ..::--==++**##%%@
##**++==--::..              ..::--==++**##%%
**++==--::.. GITHUB · LINKEDIN ..::--==++**#%
++==--::..                    ..::--==++**###
`;

function normalizePath(value: string) {
  const withoutQuery = value.split("?", 1)[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailingSlash = withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/$/, "")
    : withLeadingSlash;
  return legacyRedirects[withoutTrailingSlash] ?? withoutTrailingSlash;
}

function currentPath() {
  const hashPath = window.location.hash.slice(1);
  const rawPath = hashPath.startsWith("/") ? hashPath : window.location.pathname || "/";
  const path = normalizePath(rawPath);

  if (hashPath || path !== rawPath) {
    window.history.replaceState({}, "", `${path}${window.location.search}`);
  }

  return path;
}

function useSitePath() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const handleNavigation = () => {
      setPath(currentPath());
    };
    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("hashchange", handleNavigation);
    handleNavigation();
    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("hashchange", handleNavigation);
    };
  }, []);

  return path;
}

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

function Link({ to, children, onClick, ...props }: SiteLinkProps) {
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;
    event.preventDefault();
    window.history.pushState({}, "", normalizePath(to));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a href={normalizePath(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

function withVisualContext(href: string) {
  const url = new URL(href);
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const renderer = document.documentElement.dataset.renderer;
  url.searchParams.set("theme", theme);
  url.searchParams.set("renderer", isRenderMode(renderer) ? renderer : "ascii");
  return url.toString();
}

function syncVisualContextLinks() {
  document.querySelectorAll<HTMLAnchorElement>("[data-visual-context-href]").forEach((link) => {
    const href = link.dataset.visualContextHref;
    if (href) link.href = withVisualContext(href);
  });
}

function ExternalLink({ href, children, onClick, ...props }: ExternalLinkProps) {
  return (
    <a
      href={withVisualContext(href)}
      data-visual-context-href={href}
      onClick={(event) => {
        event.currentTarget.href = withVisualContext(href);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
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
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme;
    return current === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ayumad-theme", theme);
    syncVisualContextLinks();
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
    syncVisualContextLinks();
  }, [renderMode]);

  return { renderMode, setRenderMode };
}

function RouteEffects({ path }: { path: string }) {
  useEffect(() => {
    const project = path.startsWith("/projects/") ? projects.find((item) => item.path === path) : undefined;
    const system = path.startsWith("/systems/") ? systemLayers.find((item) => item.path === path) : undefined;
    const post = path.startsWith("/blog/") ? blogPosts.find((item) => item.slug === path.slice("/blog/".length)) : undefined;
    const meta = pageMeta[path] ??
      (project ? { title: `${project.title} — Ayumad.me`, description: project.summary } : undefined) ??
      (system ? { title: `${system.title} System — Ayumad.me`, description: system.description } : undefined) ??
      (post ? { title: `${post.title} — Ayumad.me`, description: post.summary } : undefined) ?? {
      title: "Not found — Ayumad.me",
      description: "The requested page could not be found.",
    };
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    const canonical = post?.url ?? `https://ayumad.me${path === "/" ? "/" : path}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", meta.description);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

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
        <Link
          className="wordmark"
          to="/"
          aria-label="Ayumad.me home"
          onClick={() => setMenuOpen(false)}
        >
          AYUMAD.ME
        </Link>

        <nav
          className={`site-nav ${menuOpen ? "is-open" : ""}`}
          id="site-navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            if (item.external) {
              return (
                <ExternalLink
                  key={item.path}
                  href={item.path}
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.index}</span>
                  {item.label}
                  <i aria-hidden="true">↗</i>
                </ExternalLink>
              );
            }
            const isActive = item.path === "/" ? path === "/" : path === item.path || path.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? "nav-link active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{item.index}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <RendererMenu
            key={path}
            renderMode={renderMode}
            setRenderMode={setRenderMode}
          />
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

function PageTransition({
  children,
  path,
  renderMode,
}: PropsWithChildren<{ path: string; renderMode: RenderMode }>) {
  return (
    <div
      className={`route-frame route-${renderMode}`}
      data-route-path={path}
      key={path}
    >
      <span className="route-transition-pattern" aria-hidden="true" />
      <div className="route-content">{children}</div>
    </div>
  );
}

const transitionGlyphs: Record<RenderMode, string> = {
  ascii: "@ % # * + = - : .",
  dither: "░ ▒ ▓ █ ▓ ▒ ░",
  glitch: "ERR 0x7F // SYNC LOST",
  particles: "· ｡ ° ✦ ° ｡ ·",
  crt: "CH 03 // SIGNAL LOCK",
};

function TransitionPortal({
  mode,
  label,
}: {
  mode: RenderMode;
  label: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`transition-portal transition-mode transition-${mode}`}
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.12 }}
    >
      <span className="transition-plane" />
      <span className="transition-pattern" />
      <span className="transition-aperture" />
      <span className="transition-readout">
        <i>RENDER</i>
        <strong>{label}</strong>
        <em>{transitionGlyphs[mode]}</em>
      </span>
    </motion.div>
  );
}

function RendererTransition({ renderMode }: { renderMode: RenderMode }) {
  const reducedMotion = useReducedMotion();
  const previousMode = useRef(renderMode);
  const [activeMode, setActiveMode] = useState<RenderMode | null>(null);

  useEffect(() => {
    if (previousMode.current === renderMode) return;

    previousMode.current = renderMode;
    setActiveMode(renderMode);
    const timeout = window.setTimeout(
      () => setActiveMode(null),
      reducedMotion ? 80 : 940,
    );

    return () => window.clearTimeout(timeout);
  }, [reducedMotion, renderMode]);

  return (
    <AnimatePresence>
      {activeMode && (
        <TransitionPortal
          key={activeMode}
          mode={activeMode}
          label={renderModes.find((mode) => mode.value === activeMode)?.label ?? activeMode}
        />
      )}
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
        <p className="label">
          <span>{index}</span>
          {label}
        </p>
        <h1>{title}</h1>
        <p className="page-intro">{description}</p>
      </div>
      <AsciiScene
        className={`heading-field art-${scene}`}
        scene={scene}
      />
    </header>
  );
}

function AsciiDivider() {
  return (
    <div className="ascii-divider" aria-hidden="true">
      <span> . : - = + * # % @ </span>
      <i />
      <span> @ % # * + = - : . </span>
    </div>
  );
}

function HomePage() {
  const descriptions = [
    "AI, infrastructure, audio, and Linux hardware.",
    "Current builds, experiments, and what is happening now.",
    "The connected systems behind the projects.",
    "A curated snapshot of the tools I use.",
    "Long-form notes from the public knowledge layer.",
    "Background, education, and interests.",
    "Email, GitHub, and résumé.",
    "The navigable public layer of my Obsidian knowledge base.",
  ];

  return (
    <>
      <section className="hero section-shell">
        <AsciiOscilloscope />

        <div className="hero-copy">
          <p className="label">Computer Engineering</p>
          <h1 aria-label="Ayush Madhukar">
            <span>Ayush</span>
            <span>Madhukar</span>
          </h1>
          <p className="hero-deck">{homeContent.intro}</p>
          <div className="hero-actions">
            <Link className="button primary" to="/projects">Projects</Link>
            <Link className="button" to="/about">About</Link>
          </div>
          <SpotifyHomeSignal />
        </div>

        <aside className="hero-index" aria-label="Primary interests">
          <p className="label">Topics</p>
          <ol>
            {homeContent.topics.map((topic, index) => (
              <li key={topic.path}>
                <Link to={topic.path}>
                  <span>0{index + 1}</span>
                  <strong>{topic.label}</strong>
                  <i aria-hidden="true">↗</i>
                </Link>
              </li>
            ))}
          </ol>
          <p>Bay Area, California</p>
        </aside>
      </section>

      <section className="home-index section-shell" aria-labelledby="index-title">
        <AsciiDivider />
        <div className="section-title">
          <p className="label">Navigation</p>
          <h2 id="index-title">Index</h2>
        </div>
        <div className="index-list">
          {navItems.slice(1).map((item, index) => (
            <motion.div key={item.path} whileHover={{ x: 6 }} transition={{ duration: 0.14 }}>
              {item.external ? (
                <ExternalLink href={item.path} className="index-row">
                  <span>{item.index}</span>
                  <h3>{item.label}</h3>
                  <p>{descriptions[index]}</p>
                  <i aria-hidden="true">↗</i>
                </ExternalLink>
              ) : (
                <Link to={item.path} className="index-row">
                  <span>{item.index}</span>
                  <h3>{item.label}</h3>
                  <p>{descriptions[index]}</p>
                  <i aria-hidden="true">↗</i>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="current section-shell">
        <div className="current-art" aria-hidden="true">
          <span>░░▒▒▓▓████</span>
          <span>░▒▓█▓▒░</span>
          <span>████▓▓▒▒░░</span>
        </div>
        <div>
          <p className="label">Current</p>
          <h2>{homeContent.current.title}</h2>
        </div>
        <p>{homeContent.current.description}</p>
        <Link className="text-link" to="/projects/hermes">Hermes <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}

function SpotifyHomeSignal() {
  const { playback, requestFailed } = useSpotifyPlayback();
  const hasTrack = Boolean(playback?.configured && playback.title);
  const progress = playback ? playbackProgress(playback) : null;
  const signal = playback?.isPlaying
    ? "Now listening"
    : playback?.state === "recent"
      ? "Last listened"
      : "Audio signal";
  const status = requestFailed
    ? "offline"
    : playback?.state === "playing"
      ? "live"
      : playback?.state === "recent"
        ? "recent"
        : "standby";
  const fallback = requestFailed
    ? "Listening activity is temporarily unavailable."
    : playback === null
      ? "Checking Spotify…"
      : !playback.configured
        ? "Spotify is not connected."
        : playback.state === "idle"
          ? "Nothing has played recently."
          : "Listening activity is temporarily unavailable.";

  const content = (
    <>
      {hasTrack && playback?.artwork ? (
        <SpotifyArtwork
          artwork={playback.artwork}
          album={playback.album}
          compact
        />
      ) : (
        <span className="spotify-home-fallback" aria-hidden="true">♪</span>
      )}
      <span className="spotify-home-copy">
        <span className="spotify-home-meta">
          <span>{signal}</span>
          <i>{status}</i>
        </span>
        {hasTrack ? (
          <>
            <strong>{playback?.title}</strong>
            <small>
              {playback?.artists?.join(", ") || playback?.album || "Spotify"}
            </small>
          </>
        ) : (
          <>
            <strong>Spotify</strong>
            <small>{fallback}</small>
          </>
        )}
      </span>
      {progress !== null ? (
        <span
          className="spotify-home-progress"
          role="progressbar"
          aria-label="Track progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <i style={{ width: `${progress}%` }} />
        </span>
      ) : null}
      <span className="spotify-home-arrow" aria-hidden="true">↗</span>
    </>
  );

  return playback?.url ? (
    <a
      className="spotify-home-signal is-linked"
      href={playback.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${playback.title ?? "track"} on Spotify`}
      aria-live="polite"
    >
      {content}
    </a>
  ) : (
    <div className="spotify-home-signal" aria-live="polite">
      {content}
    </div>
  );
}

function WorkPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="01"
        label="Work"
        title="Work"
        description="The four systems I keep returning to — and the work that connects them."
        scene="work"
      />

      <div className="showcase-list">
        {showcaseTopics.map((topic, index) => (
          <motion.article
            className={`showcase-row tone-${topic.tone}`}
            key={topic.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.16, delay: Math.min(index * 0.02, 0.06) }}
          >
            <span className="row-number">0{index + 1}</span>
            <div className="showcase-copy">
              <p className="label">{topic.eyebrow}</p>
              <h2>{topic.title}</h2>
              <p>{topic.summary}</p>
              <ul className="tag-list" aria-label={`${topic.title} topics`}>
                {topic.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link className="text-link" to={topic.path}>
                Explore {topic.title} <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <pre className="topic-ascii" aria-hidden="true">{topic.ascii}</pre>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function statusLabel(status: ProjectStatus) {
  if (status === "in-progress") return "In progress";
  if (status === "planned") return "Planned";
  return "Completed";
}

function ProjectsPage() {
  const current = projects.filter((project) => !project.archived);
  const archived = projects.filter((project) => project.archived);

  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="02"
        label="Projects"
        title="Projects"
        description="Current systems in motion, with the older experiments kept as a compact archive."
        scene="projects"
      />

      <section className="now-inline" aria-labelledby="current-work-title">
        <div className="now-inline-heading">
          <p className="label">Currently building</p>
          <h2 id="current-work-title">Now</h2>
          <time dateTime="2026-07-30">Updated {nowUpdated}</time>
        </div>
        <div className="now-inline-grid">
          {nowEntries.slice(0, 4).map((entry) => (
            <article key={entry.label}>
              <span aria-hidden="true">{entry.marker}</span>
              <p className="label">{entry.label}</p>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="project-list">
        {current.map((project, index) => (
          <motion.article
            className="project-row"
            key={project.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.16, delay: Math.min(index * 0.015, 0.05) }}
          >
            <div className="project-index" aria-hidden="true">
              <span>0{index + 1}</span>
              <i>░▒▓█</i>
            </div>
            <div className="project-main">
              <div className="project-meta">
                <span className={`status status-${project.status}`}>
                  {statusLabel(project.status)}
                </span>
                <span>{project.year}</span>
              </div>
              <h2><Link to={project.path}>{project.title}</Link></h2>
              <p>{project.summary}</p>
            </div>
            <div className="project-detail">
              <ul className="tag-list">
                {project.stack.map((tool) => <li key={tool}>{tool}</li>)}
              </ul>
              <details open>
                <summary>Details <span aria-hidden="true">+</span></summary>
                <p>{project.story}</p>
              </details>
              <Link className="text-link" to={project.path}>
                Full project <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </motion.article>
        ))}
      </div>

      <section className="archive-panel" aria-labelledby="archive-title">
        <div className="archive-intro">
          <p className="label">Archive</p>
          <h2 id="archive-title">Earlier experiments</h2>
          <p>Small projects that still belong in the map without competing with current work.</p>
        </div>
        <div className="archive-grid">
          {archived.map((project) => (
            <article key={project.slug}>
              <div><span>{project.year}</span><span>{statusLabel(project.status)}</span></div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <ul className="tag-list">
                {project.stack.map((tool) => <li key={tool}>{tool}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function SystemsPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="03"
        label="Systems"
        title="Systems"
        description="Four connected systems, each with its own page and a clear relationship to the work."
        scene="systems"
      />

      <div className="systems-list">
        {systemLayers.map((layer, index) => (
          <motion.article
            className="system-row"
            key={layer.title}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.16, delay: Math.min(index * 0.02, 0.06) }}
          >
            <span className="row-number">{layer.index}</span>
            <div>
              <h2><Link to={layer.path}>{layer.title}</Link></h2>
              <p>{layer.description}</p>
              <small>Flow</small>
              <code>{layer.signal}</code>
            </div>
            <ul>
              {layer.items.map((item) => <li key={item}>{item}</li>)}
              <li><Link className="text-link" to={layer.path}>Open system <span aria-hidden="true">↗</span></Link></li>
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="system-band" aria-label="Four connected areas">
        <span>Knowledge</span><i>·</i><span>AI</span><i>·</i>
        <span>Hardware</span><i>·</i><span>Audio</span>
      </div>
    </section>
  );
}

function DetailSections({ sections }: { sections: { heading: string; paragraphs: string[]; bullets?: string[] }[] }) {
  return (
    <div className="detail-sections">
      {sections.map((section, index) => (
        <motion.section
          key={section.heading}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.16, delay: Math.min(index * 0.015, 0.05) }}
        >
          <span className="row-number">0{index + 1}</span>
          <div>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            )}
          </div>
        </motion.section>
      ))}
    </div>
  );
}

function RelatedLinks({ links }: { links: { label: string; path: string }[] }) {
  if (!links.length) return null;
  return (
    <aside className="related-links" aria-label="Related pages">
      <p className="label">Continue through the map</p>
      <div>
        {links.map((link) => (
          link.path.startsWith("http") ? (
            <ExternalLink key={link.path} href={link.path}>{link.label}<span aria-hidden="true">↗</span></ExternalLink>
          ) : (
            <Link key={link.path} to={link.path}>{link.label}<span aria-hidden="true">↗</span></Link>
          )
        ))}
      </div>
    </aside>
  );
}

function ProjectDetailPage({ slug }: { slug: string }) {
  const project = projects.find((item) => item.slug === slug && !item.archived);
  if (!project) return <NotFoundPage />;

  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="02"
        label="Project"
        title={project.title}
        description={project.summary}
        scene={project.slug === "hermes" ? "hermes" : "projects"}
      />
      <div className="detail-lead">
        <div className="detail-facts">
          {project.facts.map((fact) => (
            <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>
          ))}
        </div>
        <p>{project.story}</p>
        <ul className="tag-list">{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <DetailSections sections={project.sections} />
      <RelatedLinks links={project.related} />
    </section>
  );
}

function SystemDetailPage({ slug }: { slug: string }) {
  const system = systemLayers.find((item) => item.slug === slug);
  if (!system) return <NotFoundPage />;

  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="03"
        label={`${system.index} System`}
        title={system.title}
        description={system.description}
        scene="systems"
      />
      <div className="detail-lead">
        <div className="signal-card">
          <span>System flow</span>
          <code>{system.signal}</code>
        </div>
        <ul className="detail-index">
          {system.items.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}
        </ul>
      </div>
      <DetailSections sections={system.sections} />
      <RelatedLinks links={system.related} />
    </section>
  );
}

function GearPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="05"
        label="Gear"
        title="Gear"
        description="A deliberately edited set of the devices that currently matter to how I work and listen."
        scene="gear"
      />

      <div className="snapshot-note">
        <span>Vault snapshot</span>
        <strong>July 2026</strong>
        <p>Current primary gear only. Prices, locations, sold items, and uncertain records are intentionally omitted.</p>
      </div>

      <div className="gear-categories">
        {gearCategories.map((cat, catIndex) => (
          <motion.section
            className="gear-category"
            key={cat.category}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.16, delay: Math.min(catIndex * 0.015, 0.05) }}
          >
            <h2>{cat.category}</h2>
            <div className="gear-table">
              {cat.items.map((item) => (
                <div className="gear-row" key={item.name}>
                  <span className="gear-name">{item.name}</span>
                  <span className="gear-role">{item.role}</span>
                  <span className="gear-status">active</span>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </section>
  );
}

function BlogPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="05"
        label="Blog"
        title="Blog"
        description="Finished essays about local AI, knowledge systems, audio, and Linux hardware."
        scene="writeups"
      />

      <div className="writeup-list">
        {blogPosts.map((post, index) => (
          <motion.article
            className="writeup-row"
            key={post.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.16, delay: Math.min(index * 0.015, 0.05) }}
          >
            <div className="writeup-meta">
              <time dateTime={post.date}>{post.date}</time>
              <span>{post.readingTime}</span>
              <ul className="tag-list">
                {post.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <div className="writeup-main">
              <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p>{post.summary}</p>
              <Link className="text-link" to={`/blog/${post.slug}`}>Read essay <span aria-hidden="true">↗</span></Link>
            </div>
          </motion.article>
        ))}
      </div>

      <aside className="plain-note">
        <p className="label">One public writing layer</p>
        <p>Essays and public notes share one navigable home. Private context and operational material remain outside the deployed site.</p>
        <Link className="text-link" to="/knowledge">Explore the knowledge index <span aria-hidden="true">↗</span></Link>
      </aside>
    </section>
  );
}

function BlogBlockView({ block, index }: { block: BlogBlock; index: number }) {
  if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
  if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return <List key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</List>;
  }
  return <p key={index}>{block.text}</p>;
}

function BlogPostPage({ slug }: { slug: string }) {
  const post = blogPosts.find((item) => item.slug === slug);
  const article = blogArticleBySlug.get(slug);
  if (!post || !article) return <NotFoundPage />;

  return (
    <article className="section-shell article-page">
      <header className="article-header">
        <Link className="text-link" to="/blog">← Blog index</Link>
        <p className="label">Essay / {post.readingTime}</p>
        <h1>{post.title}</h1>
        <p>{post.summary}</p>
        <div>
          <time dateTime={post.date}>{post.date}</time>
          <ul className="tag-list">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        </div>
      </header>
      <div className="article-body">
        {article.blocks.map((block, index) => <BlogBlockView block={block} index={index} key={`${block.type}-${index}`} />)}
      </div>
      <aside className="related-links" aria-label="Continue exploring">
        <p className="label">Continue through the map</p>
        <div>
          <Link to="/blog">All essays<span aria-hidden="true">↗</span></Link>
          <Link to="/knowledge">Knowledge index<span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
    </article>
  );
}

function KnowledgePage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="08"
        label="Knowledge"
        title="Public knowledge"
        description="A deliberate public layer connecting essays, projects, systems, and the edited snapshots behind them."
        scene="writeups"
      />
      <div className="knowledge-grid">
        <article className="knowledge-card">
          <p className="label">Writing</p>
          <h2>Blog essays</h2>
          <p>Long-form notes on the systems, hardware, and ideas behind the site.</p>
          <Link className="text-link" to="/blog">Open the blog <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="knowledge-card">
          <p className="label">Systems</p>
          <h2>Connected systems</h2>
          <p>AI, infrastructure, audio, and Linux hardware with a clear role in the larger map.</p>
          <Link className="text-link" to="/systems">Open systems <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="knowledge-card">
          <p className="label">Projects</p>
          <h2>Current work</h2>
          <p>Projects and experiments that turn the ideas into working tools.</p>
          <Link className="text-link" to="/projects">Open projects <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="knowledge-card">
          <p className="label">Snapshot</p>
          <h2>Edited, not exported</h2>
          <p>The public site is reviewed material. Private notes and operational details stay outside the deployment.</p>
          <Link className="text-link" to="/about">Read the boundary <span aria-hidden="true">↗</span></Link>
        </article>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="06"
        label="About"
        title="About"
        description={aboutContent.intro}
        scene="about"
      />

      <div className="about-layout">
        <article className="about-story">
          {aboutContent.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>

        <aside className="about-profile">
          <div className="ascii-monogram" aria-hidden="true">
            <pre>{String.raw` █████╗ ███╗   ███╗
██╔══██╗████╗ ████║
███████║██╔████╔██║
██╔══██║██║╚██╔╝██║
██║  ██║██║ ╚═╝ ██║
╚═╝  ╚═╝╚═╝     ╚═╝`}</pre>
          </div>
          <p>Ayush Madhukar</p>
          <span>Fremont, California · ACM @ SJSU</span>
        </aside>
      </div>

      <div className="about-data">
        <section>
          <p className="label">Education</p>
          <dl>
            {aboutContent.education.map((entry) => (
              <div key={entry.school}>
                <dt>{entry.school}</dt>
                <dd>{entry.program}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <p className="label">Skills</p>
          <ul className="large-tags">
            {aboutContent.skills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </section>
        <section>
          <p className="label">Interests</p>
          <ul className="interest-list">
            {aboutContent.interests.map((interest) => <li key={interest}>{interest}</li>)}
          </ul>
        </section>
      </div>
    </section>
  );
}

const WEBUI_URL = "http://100.113.252.86:8787";

function useTailscaleProbe() {
  const [status, setStatus] = useState<"checking" | "reachable" | "unreachable">("checking");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setStatus("unreachable");
      controller.abort();
    }, 4000);

    fetch(WEBUI_URL, { mode: "no-cors", signal: controller.signal })
      .then(() => {
        clearTimeout(timeout);
        setStatus("reachable");
      })
      .catch(() => {
        clearTimeout(timeout);
        setStatus("unreachable");
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return status;
}

function ChatPage() {
  const tailscale = useTailscaleProbe();

  return (
    <section className="section-shell page-section chat-page">
      <SectionHeading
        index="09"
        label="Chat"
        title="Chat with Hermes"
        description="A personal AI agent running from a Mac mini, connected across devices and grounded in a curated knowledge system."
        scene="contact"
      />

      <div className="chat-status-card">
        <div className="chat-status-header">
          <span className="chat-signal" aria-hidden="true">◈</span>
          <div>
            <h2>Hermes WebUI</h2>
            <p>Full-featured chat interface with session history, workspace browsing, and tool access.</p>
          </div>
        </div>

        {tailscale === "checking" ? (
          <div className="chat-probe">
            <span className="chat-probe-dot" aria-hidden="true" />
            <p>Detecting network…</p>
          </div>
        ) : tailscale === "reachable" ? (
          <div className="chat-probe chat-probe-ok">
            <span className="chat-probe-dot" aria-hidden="true" />
            <p>Tailscale connection detected.</p>
            <a
              className="button primary"
              href={WEBUI_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open Hermes WebUI ↗
            </a>
          </div>
        ) : (
          <div className="chat-probe chat-probe-fail">
            <span className="chat-probe-dot" aria-hidden="true" />
            <p>Hermes WebUI is on a private Tailscale network and is not reachable from this connection.</p>
            <div className="chat-instructions">
              <h3>How to connect</h3>
              <ol>
                <li>Install <a href="https://tailscale.com/" target="_blank" rel="noreferrer">Tailscale</a> on your device.</li>
                <li>Join the <code>ayumad</code> tailnet.</li>
                <li>Open <a href={WEBUI_URL} target="_blank" rel="noreferrer">{WEBUI_URL}</a>.</li>
              </ol>
              <p className="chat-note">The Hermex iOS app also connects to the same endpoint.</p>
            </div>
          </div>
        )}
      </div>

      <div className="chat-about">
        <h3>About Hermes</h3>
        <p>
          Hermes is a personal AI agent that retains context across sessions, runs
          scheduled workflows, and shares one backend across every device. It uses
          curated retrieval from an Obsidian knowledge base instead of unrestricted
          ingestion, keeping the boundary between private notes and public output
          explicit.
        </p>
        <div className="chat-about-links">
          <Link className="button" to="/projects/hermes">Hermes project ↗</Link>
          <Link className="button" to="/systems/knowledge">Knowledge system ↗</Link>
        </div>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="section-shell page-section contact-page">
      <SectionHeading
        index="07"
        label="Contact"
        title="Contact"
        description="Email is the fastest way to reach me. You can also find my work and professional profile below."
        scene="contact"
      />

      <pre className="contact-field" aria-hidden="true">{contactField}</pre>

      <div className="contact-links">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            download={link.download ? "Ayush-Madhukar-Resume.pdf" : undefined}
          >
            <span>{link.label}</span>
            <strong>{link.handle}</strong>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </div>

      <section className="activity-connections" aria-labelledby="activity-connections-title">
        <header>
          <p className="label">Live + planned connections</p>
          <h2 id="activity-connections-title">A live view of what I am into.</h2>
          <p>
            Spotify brings listening activity into the site directly. Watching,
            playing, and reading connections will follow without mixing those feeds
            into the primary contact links.
          </p>
        </header>
        <div className="activity-grid">
          {activityConnections.map((connection) =>
            connection.service === "Spotify" ? (
              <SpotifyActivityCard key={connection.service} />
            ) : (
              <article key={connection.service}>
                <div>
                  <span>{connection.signal}</span>
                  <i>{connection.status}</i>
                </div>
                <h3>{connection.service}</h3>
                <p>{connection.description}</p>
              </article>
            ),
          )}
        </div>
      </section>
    </section>
  );
}

function SpotifyActivityCard() {
  const { playback, requestFailed } = useSpotifyPlayback();

  const progress = playback ? playbackProgress(playback) : null;
  const hasTrack = Boolean(playback?.configured && playback.title);
  const status = requestFailed
    ? "offline"
    : playback?.state === "playing"
    ? "live"
    : playback?.state === "recent"
      ? "recent"
      : "standby";
  const detail = requestFailed
    ? "Listening activity is temporarily unavailable."
    : playback === null
      ? "Checking the current signal…"
      : !playback.configured
        ? "The secure Spotify connection is ready for account authorization."
        : playback.state === "idle"
          ? "Nothing has played recently."
          : playback.state === "unavailable"
            ? "Listening activity is temporarily unavailable."
            : null;

  const content = (
    <>
      <div className="activity-card-header">
        <span>
          {playback?.isPlaying
            ? "Now listening"
            : playback?.state === "recent"
              ? "Last listened"
              : "Listening signal"}
        </span>
        <i>{status}</i>
      </div>
      {hasTrack ? (
        <div className="spotify-playback">
          {playback?.artwork ? (
            <SpotifyArtwork
              artwork={playback.artwork}
              album={playback.album}
            />
          ) : (
            <div className="spotify-artwork spotify-artwork-fallback" aria-hidden="true">
              ♪
            </div>
          )}
          <div className="spotify-copy">
            <h3>Spotify</h3>
            <strong>{playback?.title}</strong>
            <p>{playback?.artists?.join(", ") || playback?.album}</p>
            {!playback?.isPlaying && playback?.playedAt ? (
              <small>{formatPlaybackTime(playback.playedAt)}</small>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <h3>Spotify</h3>
          <p>{detail}</p>
        </>
      )}
      {progress !== null ? (
        <div
          className="spotify-progress"
          role="progressbar"
          aria-label="Track progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </>
  );

  return playback?.url ? (
    <article className="spotify-card is-linked">
      <a href={playback.url} target="_blank" rel="noreferrer" aria-label={`Open ${playback.title ?? "track"} on Spotify`}>
        {content}
      </a>
    </article>
  ) : (
    <article className="spotify-card">{content}</article>
  );
}

function NotFoundPage() {
  return (
    <section className="section-shell not-found">
      <p className="label">404</p>
      <h1>Not found</h1>
      <p>The requested page does not exist.</p>
      <Link className="button primary" to="/">Home</Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-inner">
        <p>AYUMAD.ME <span>/ PUBLIC INDEX</span></p>
        <p>2026</p>
        <div>
          <Link to="/blog">Blog ↗</Link>
          <Link to="/knowledge">Knowledge ↗</Link>
          <a href="/ayush-madhukar-resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a>
          <a href="mailto:Ayumadbro123@gmail.com">Email ↗</a>
        </div>
      </div>
    </footer>
  );
}

function resolvePage(path: string) {
  if (path === "/") return <HomePage />;
  if (path === "/work") return <WorkPage />;
  if (path === "/projects") return <ProjectsPage />;
  if (path.startsWith("/projects/")) return <ProjectDetailPage slug={path.slice("/projects/".length)} />;
  if (path === "/systems") return <SystemsPage />;
  if (path.startsWith("/systems/")) return <SystemDetailPage slug={path.slice("/systems/".length)} />;
  if (path === "/gear") return <GearPage />;
  if (path === "/blog") return <BlogPage />;
  if (path.startsWith("/blog/")) return <BlogPostPage slug={path.slice("/blog/".length)} />;
  if (path === "/knowledge") return <KnowledgePage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/chat") return <ChatPage />;
  if (path === "/contact") return <ContactPage />;
  return <NotFoundPage />;
}

export default function App() {
  const path = useSitePath();
  const { renderMode, setRenderMode } = useRenderer();
  const page = resolvePage(path);

  return (
    <SpotifyPlaybackProvider>
      <RenderModeContext.Provider value={renderMode}>
        <MotionConfig reducedMotion="user">
          <RouteEffects path={path} />
          <ParticleField />
          <div className="dither-wash" aria-hidden="true" />
          <div className="render-overlay" aria-hidden="true" />
          <RendererTransition renderMode={renderMode} />
          <a className="skip-link" href="#main-content">Skip to content</a>
          <Header
            path={path}
            renderMode={renderMode}
            setRenderMode={setRenderMode}
          />
          <main id="main-content">
            <PageTransition path={path} renderMode={renderMode}>
              {page}
            </PageTransition>
          </main>
          <Footer />
        </MotionConfig>
      </RenderModeContext.Provider>
    </SpotifyPlaybackProvider>
  );
}
