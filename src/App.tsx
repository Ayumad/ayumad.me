import {
  type AnchorHTMLAttributes,
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import ParticleField from "./ParticleField";
import { nowEntries, nowUpdated } from "./nowData";
import {
  futureIdeas,
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

function currentPath() {
  const hashPath = window.location.hash.slice(1);
  return hashPath.startsWith("/") ? hashPath : "/";
}

function useHashPath() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const handleHashChange = () => setPath(currentPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

function Link({ to, children, ...props }: SiteLinkProps) {
  return (
    <a href={`#${to}`} {...props}>
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
          <p className="eyebrow">[ unexpected signal ]</p>
          <h1>Something slipped out of the stack.</h1>
          <p>Refresh the page and the system should find its way back.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload site
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
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}

function RouteEffects({ path }: { path: string }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const meta = pageMeta[path] ?? {
      title: "Signal lost — Ayumad.me",
      description: "This part of Ayumad.me could not be found.",
    };
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `https://ayumad.me/#${path}`);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [path, reducedMotion]);

  return null;
}

function Header({ path }: { path: string }) {
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
      <div className="system-bar" aria-hidden="true">
        <span>AYUMAD_OS :: TTY1</span>
        <span className="system-bar-track">
          <i />
        </span>
        <span>NET: ONLINE</span>
        <span>CA/BAY_AREA</span>
      </div>
      <div className="header-inner">
        <Link
          className="wordmark"
          to="/"
          aria-label="Ayumad.me home"
          onClick={() => setMenuOpen(false)}
        >
          <span aria-hidden="true">╭─</span>
          <strong>ayush@ayumad</strong>
          <span aria-hidden="true">:~$</span>
        </Link>

        <nav
          className={`site-nav ${menuOpen ? "is-open" : ""}`}
          id="site-navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = path === item.path;
            return (
            <Link
              key={item.path}
              to={item.path}
              className={isActive ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive ? "page" : undefined}
            >
              <span>[{item.index}]</span>
              <strong>{item.label}</strong>
            </Link>
          )})}
        </nav>

        <div className="header-actions">
          <span className="header-mode" aria-hidden="true">
            {path === "/" ? "HOME" : path.slice(1).toUpperCase()}
          </span>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <span aria-hidden="true">{theme === "dark" ? "LT" : "DK"}</span>
          </button>
          <button
            type="button"
            className="icon-button menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            <span aria-hidden="true">{menuOpen ? "[X]" : "[::]"}</span>
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
        initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <div className="page-heading-top">
        <p className="eyebrow">
          <span>NODE_{index}</span> :: /{eyebrow}
        </p>
        <span className="page-coordinates" aria-hidden="true">
          X:{Number(index) * 19 + 7}.00 / Y:{Number(index) * 11 + 4}.00
        </span>
      </div>
      <div className="page-heading-grid">
        <div>
          <h1>{title}</h1>
          <p className="page-intro">{description}</p>
        </div>
        <pre className="page-sigil" aria-hidden="true">{String.raw`┌─[ ROUTE ${index} ]──────────────┐
│ ${eyebrow.toUpperCase().padEnd(29, " ")}│
│ ▓▓▓▓▒▒▒░░  SIGNAL LOCKED     │
│ ├─────╼ ● ╾─────┤            │
└───────────────────────────────┘`}</pre>
      </div>
    </header>
  );
}

function SignalLine() {
  return (
    <div className="signal-line" aria-hidden="true">
      <span>╾●</span>
      <span />
      <span>●╼</span>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero section-shell">
        <pre className="ascii-mark" aria-hidden="true">{` █████╗ ██╗   ██╗██╗   ██╗███╗   ███╗ █████╗ ██████╗
██╔══██╗╚██╗ ██╔╝██║   ██║████╗ ████║██╔══██╗██╔══██╗
███████║ ╚████╔╝ ██║   ██║██╔████╔██║███████║██║  ██║
██╔══██║  ╚██╔╝  ██║   ██║██║╚██╔╝██║██╔══██║██║  ██║
██║  ██║   ██║   ╚██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝
╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝`}</pre>

        <div className="hero-grid">
          <div className="hero-copy terminal-tile">
            <div className="tile-bar">
              <span>01</span>
              <span>~/identity/readme.md</span>
              <span>[RO]</span>
            </div>
            <div className="hero-copy-body">
              <p className="eyebrow live-label">
                <span className="status-dot" aria-hidden="true" />
                Bay Area / online / signal acquired
              </p>
              <h1>
                Systems, signals,
                <span>and useful detours.</span>
              </h1>
              <p className="hero-deck">
                I&apos;m Ayush—a Computer Engineering student who likes going beneath the
                interface. This is a living map of the systems, sounds, machines, and ideas
                I&apos;m taking apart and putting back together.
              </p>
              <div className="hero-actions">
                <Link className="button primary" to="/projects">
                  ./open projects <span aria-hidden="true">↗</span>
                </Link>
                <Link className="button text-button" to="/now">
                  tail -f now.log <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <motion.div
            className="ascii-console signal-tile dither-panel"
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="console-bar tile-bar">
              <span>02</span>
              <span>/dev/curiosity_graph</span>
              <span className="console-lights" aria-hidden="true">● REC</span>
            </div>
            <div className="signal-viewport">
              <span className="viewport-axis axis-x" aria-hidden="true">X 00 ───────────── 99</span>
              <span className="viewport-axis axis-y" aria-hidden="true">Y<br />0<br />│<br />│<br />9</span>
              <pre aria-label="ASCII node graph of Ayush's technology interests">{String.raw`
                 .       +                .
        [ NOTES ]──────┐       .────────[ AUDIO ]
             │         │       │             │
       .─────┴────.    ▼       ▼       .────┴────.
      /  INDEX +   \  ╔═══════════╗   / WAVEFORM  \
     :  RETRIEVAL   :─║ AYUMAD.IO ║──:  + SIGNAL  :
      \_____  _____/  ╚═════╤═════╝   \____  ____/
            \/             │               \/
        [ AI / ML ]◀────────┼────────▶[ HARDWARE ]
             │              │               │
         tokens()       curiosity_       proxmox()
          models()        loop           zfs.pool()
             │              │               │
             └──────────────┴───────────────┘

        >>> system.status = "experimenting" _
`}</pre>
              <div className="scan-beam" aria-hidden="true" />
            </div>
            <div className="console-readout">
              <span>fps 60.00</span>
              <span>nodes 04</span>
              <span>signal warm</span>
              <span>drift +0.02</span>
            </div>
          </motion.div>
        </div>

        <div className="hero-ticker" aria-hidden="true">
          <span>AI_&_NOTES</span><i>////</i><span>HOMELAB</span><i>////</i>
          <span>AUDIO_SIGNAL</span><i>////</i><span>LINUX</span><i>////</i>
          <span>CREATIVE_CODE</span><i>////</i><span>OWN_YOUR_STACK</span>
        </div>
      </section>

      <section className="home-map section-shell" aria-labelledby="map-title">
        <SignalLine />
        <div className="section-lead">
          <div>
            <p className="eyebrow">[ quick map ]</p>
            <h2 id="map-title">Pick a thread.</h2>
          </div>
          <p>
            The site is organized by the things I keep returning to—not by job titles
            or a timeline.
          </p>
        </div>

        <div className="map-grid">
          {navItems.slice(1, 7).map((item, index) => {
            const descriptions = [
              "Three deep interests and how they overlap.",
              "Selected work, experiments, and build stories.",
              "The layers behind the tools I use every day.",
              "A small snapshot of what has my attention.",
              "The longer story behind the curiosity.",
              "A direct line if you want to talk.",
            ];
            return (
              <motion.div
                key={item.path}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <Link className="map-card" to={item.path}>
                  <span className="map-index">{item.index}</span>
                  <div>
                    <h3>{item.label}</h3>
                    <p>{descriptions[index]}</p>
                  </div>
                  <span className="map-arrow" aria-hidden="true">↗</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="current-strip section-shell">
        <div className="strip-label" aria-hidden="true">[ ACTIVE_PROCESS // PID 042 ]</div>
        <div>
          <p className="eyebrow">[ currently ]</p>
          <h2>Building a cloud with a power button.</h2>
        </div>
        <p>
          A Proxmox homelab for local AI, owned storage, media, and small services—built
          to stay useful without becoming mysterious.
        </p>
        <Link className="circle-link" to="/now" aria-label="Read the Now page">
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}

function ShowcasePage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="01"
        eyebrow="showcase"
        title="Three threads, one practice."
        description="The projects change, but these are the interests underneath them: making knowledge useful, infrastructure personal, and signals expressive."
      />

      <div className="showcase-list">
        {showcaseTopics.map((topic, index) => (
          <motion.article
            className={`showcase-card tone-${topic.tone}`}
            key={topic.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.06 }}
          >
            <div className="showcase-number">0{index + 1}</div>
            <div className="showcase-copy">
              <p className="eyebrow">{topic.eyebrow}</p>
              <h2>{topic.title}</h2>
              <p>{topic.summary}</p>
              <ul className="tag-list" aria-label={`${topic.title} topics`}>
                {topic.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <pre className="topic-ascii" aria-hidden="true">{topic.ascii}</pre>
          </motion.article>
        ))}
      </div>

      <aside className="phase-note">
        <p className="eyebrow">[ next signal ]</p>
        <p>
          Deeper writeups will turn these into living field notes. For now, this is the
          map—the practical work lives in Projects and Systems.
        </p>
      </aside>
    </section>
  );
}

function statusLabel(status: ProjectStatus) {
  if (status === "in-progress") return "In progress";
  if (status === "planned") return "Planned";
  return "Completed";
}

function ProjectsPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="02"
        eyebrow="projects"
        title="Things built to answer a question."
        description="The useful part is rarely just the final demo. Each project is a way to understand a system by giving it something real to do."
      />

      <div className="project-list">
        {projects.map((project, index) => (
          <motion.article
            className="project-card"
            key={project.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="project-topline">
              <span className={`status status-${project.status}`}>
                <span aria-hidden="true" />
                {statusLabel(project.status)}
              </span>
              <span>{project.year}</span>
            </div>
            <h2>{project.title}</h2>
            <p className="project-summary">{project.summary}</p>
            <ul className="tag-list">
              {project.stack.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            <details>
              <summary>
                Read the build story <span aria-hidden="true">+</span>
              </summary>
              <p>{project.story}</p>
            </details>
          </motion.article>
        ))}
      </div>

      <div className="future-panel dither-panel">
        <div>
          <p className="eyebrow">[ queued / phase 2+ ]</p>
          <h2>More rooms in the archive.</h2>
          <p>
            These will come alive when the underlying data and stories are ready—not
            before.
          </p>
        </div>
        <ul>
          {futureIdeas.map((idea) => (
            <li key={idea}>
              <span>{idea}</span>
              <span className="planned-badge">planned</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SystemsPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="03"
        eyebrow="systems"
        title="The stack behind the stack."
        description="I think in layers: what holds the data, what moves the signal, what makes it understandable, and what keeps the whole thing personal."
      />

      <div className="systems-stack">
        {systemLayers.map((layer, index) => (
          <motion.article
            className="system-layer"
            key={layer.title}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.06 }}
          >
            <div className="layer-index">{layer.index}</div>
            <div className="layer-copy">
              <h2>{layer.title}</h2>
              <p>{layer.description}</p>
              <code>{layer.signal}</code>
            </div>
            <ul>
              {layer.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>

      <div className="systems-diagram" aria-label="Diagram connecting the four system layers">
        <span>knowledge</span>
        <i aria-hidden="true">↕</i>
        <span>AI</span>
        <i aria-hidden="true">↕</i>
        <span>hardware</span>
        <i aria-hidden="true">↕</i>
        <span>audio</span>
      </div>
    </section>
  );
}

function NowPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="04"
        eyebrow="now"
        title="A snapshot, not a promise."
        description="A small record of what has my attention right now. The categories stay steady; the contents are meant to change."
      />

      <div className="now-meta">
        <span>Last updated</span>
        <time dateTime="2026-07-29">{nowUpdated}</time>
        <span className="blink" aria-hidden="true">_</span>
      </div>

      <div className="now-grid">
        {nowEntries.map((entry, index) => (
          <motion.article
            className="now-card"
            key={entry.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.06 }}
          >
            <div className="now-card-head">
              <span>{entry.marker}</span>
              <p>{entry.label}</p>
            </div>
            <h2>{entry.title}</h2>
            <p>{entry.description}</p>
            <code>{entry.detail}</code>
          </motion.article>
        ))}
      </div>

      <p className="now-footnote">
        Inspired by <a href="https://nownownow.com/about" target="_blank" rel="noreferrer">nownownow.com</a>.
        Updated by hand because the point is to notice what changed.
      </p>
    </section>
  );
}

function AboutPage() {
  const skills = ["Python", "C++", "React", "Linux", "TensorFlow", "PyTorch", "Proxmox", "ZFS"];
  const interests = [
    "Artificial intelligence",
    "Audio systems",
    "Homelabs",
    "Retro gaming",
    "Photography",
    "Creative coding",
  ];

  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="05"
        eyebrow="about"
        title="Technology is the hobby."
        description="Not only a field of study or a career path—the thing I would still be pulling apart, tuning, collecting, and talking about either way."
      />

      <div className="about-layout">
        <article className="about-story">
          <p className="dropcap">
            Ayush Madhukar is a Computer Engineering student in the Bay Area who treats
            technology as both an engineering discipline and a personal creative
            medium. He is drawn to systems that are personal, modular, understandable,
            and expressive.
          </p>
          <p>
            I have always been interested in finding the capabilities and limits of
            things. When I was younger, that meant jailbreaking devices and running
            emulators—making hardware do something it was not supposed to do. That
            feeling never really went away.
          </p>
          <p>
            Now the objects are servers, models, audio chains, and knowledge systems.
            I learn by comparing, troubleshooting, and building the missing piece. The
            goal is not complexity for its own sake. It is the moment a complicated
            system becomes understandable enough to feel personal.
          </p>
        </article>

        <aside className="about-sidebar">
          <div className="profile-block dither-panel">
            <div className="monogram" aria-hidden="true">AM</div>
            <div>
              <p>Ayush Madhukar</p>
              <span>Bay Area, California</span>
            </div>
          </div>

          <div className="fact-block">
            <p className="eyebrow">[ education ]</p>
            <h2>San José State University</h2>
            <p>Computer Engineering</p>
            <h2>Foothill College</h2>
            <p>Associate degree, Computer Science</p>
          </div>
        </aside>
      </div>

      <div className="about-lists">
        <div>
          <p className="eyebrow">[ working vocabulary ]</p>
          <ul className="large-tags">
            {skills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow">[ recurring interests ]</p>
          <ul className="interest-list">
            {interests.map((interest, index) => (
              <li key={interest}><span>0{index + 1}</span>{interest}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="section-shell page-section contact-page">
      <div className="contact-copy">
        <p className="eyebrow">06 / contact</p>
        <h1>Send a signal.</h1>
        <p>
          Questions, project ideas, strange hardware finds, audio recommendations, or
          just a note from another person who likes going too deep on technology.
        </p>
      </div>

      <div className="contact-links">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
          >
            <span>{link.label}</span>
            <strong>{link.handle}</strong>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </div>

      <div className="contact-terminal dither-panel" aria-label="ASCII sign-off">
        <pre>{`$ ping ayush
64 bytes from the bay area
curiosity=alive  latency=human

$ say hello_`}</pre>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="section-shell not-found">
      <p className="eyebrow">[ 404 / no signal ]</p>
      <h1>This path wandered off the map.</h1>
      <p>The experiment you are looking for may have moved, changed shape, or not exist yet.</p>
      <Link className="button primary" to="/">Return home</Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-marquee" aria-hidden="true">
        <span>AYUMAD.ME :: END OF TRANSMISSION :: KEEP THE SYSTEM CURIOUS :: </span>
        <span>AYUMAD.ME :: END OF TRANSMISSION :: KEEP THE SYSTEM CURIOUS :: </span>
      </div>
      <div className="section-shell footer-inner">
        <p>ayush@bay-area:~$ built_with --curiosity</p>
        <p className="footer-ascii" aria-hidden="true">[ 2026 // EOF ]</p>
        <a href="mailto:hello@ayumad.me">mailto://hello@ayumad.me ↗</a>
      </div>
    </footer>
  );
}

export default function App() {
  const path = useHashPath();
  const page =
    path === "/" ? <HomePage /> :
    path === "/showcase" ? <ShowcasePage /> :
    path === "/projects" ? <ProjectsPage /> :
    path === "/systems" ? <SystemsPage /> :
    path === "/now" ? <NowPage /> :
    path === "/about" ? <AboutPage /> :
    path === "/contact" ? <ContactPage /> :
    <NotFoundPage />;

  return (
    <MotionConfig reducedMotion="user">
      <RouteEffects path={path} />
      <ParticleField />
      <div className="crt-overlay" aria-hidden="true" />
      <div className="edge-coordinates" aria-hidden="true">
        <span>000</span><span>AYUMAD_SIGNAL</span><span>999</span>
      </div>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header path={path} />
      <main id="main-content">
        <PageTransition path={path}>
          {page}
        </PageTransition>
      </main>
      <Footer />
    </MotionConfig>
  );
}
