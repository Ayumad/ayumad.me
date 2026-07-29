import {
  type AnchorHTMLAttributes,
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import AsciiOscilloscope from "./AsciiOscilloscope";
import AsciiScene, { type AsciiSceneName } from "./AsciiScene";
import ParticleField from "./ParticleField";
import { nowEntries, nowUpdated } from "./nowData";
import {
  aboutContent,
  futureIdeas,
  homeContent,
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
**++==--::..  GITHUB · MAIL  ..::--==++**##%
++==--::..                    ..::--==++**###
`;

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
      title: "Not found — Ayumad.me",
      description: "The requested page could not be found.",
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
            const isActive = path === item.path;
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
    "Hermes, servers, notes, and audio.",
    "Selected builds and experiments.",
    "The tools and systems I use.",
    "What I am working on now.",
    "Background, education, and interests.",
    "Email and GitHub.",
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
        </div>

        <aside className="hero-index" aria-label="Primary interests">
          <p className="label">Topics</p>
          <ol>
            {homeContent.topics.map((topic, index) => (
              <li key={topic}><span>0{index + 1}</span>{topic}</li>
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
              <Link to={item.path} className="index-row">
                <span>{item.index}</span>
                <h3>{item.label}</h3>
                <p>{descriptions[index]}</p>
                <i aria-hidden="true">↗</i>
              </Link>
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
        <Link className="text-link" to="/now">Now <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}

function ShowcasePage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="01"
        label="Work"
        title="Work"
        description="The three areas I keep coming back to."
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
            transition={{ delay: index * 0.05 }}
          >
            <span className="row-number">0{index + 1}</span>
            <div className="showcase-copy">
              <p className="label">{topic.eyebrow}</p>
              <h2>{topic.title}</h2>
              <p>{topic.summary}</p>
              <ul className="tag-list" aria-label={`${topic.title} topics`}>
                {topic.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <pre className="topic-ascii" aria-hidden="true">{topic.ascii}</pre>
          </motion.article>
        ))}
      </div>

      <aside className="plain-note">
        <p className="label">Next</p>
        <p>Detailed notes and project pages will be added as the work develops.</p>
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
        label="Projects"
        title="Projects"
        description="Selected software, hardware, and research projects."
        scene="projects"
      />

      <div className="project-list">
        {projects.map((project, index) => (
          <motion.article
            className="project-row"
            key={project.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: index * 0.04 }}
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
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
            </div>
            <div className="project-detail">
              <ul className="tag-list">
                {project.stack.map((tool) => <li key={tool}>{tool}</li>)}
              </ul>
              <details>
                <summary>Details <span aria-hidden="true">+</span></summary>
                <p>{project.story}</p>
              </details>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="future-panel">
        <div>
          <p className="label">Later</p>
          <h2>Archive</h2>
          <p>Planned sections for personal data, media, and longer project notes.</p>
        </div>
        <ul>
          {futureIdeas.map((idea) => (
            <li key={idea}>
              <span>{idea}</span>
              <span>Planned</span>
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
        label="Systems"
        title="Systems"
        description="The machines, software, and audio systems I actually use."
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
            transition={{ delay: index * 0.05 }}
          >
            <span className="row-number">{layer.index}</span>
            <div>
              <h2>{layer.title}</h2>
              <p>{layer.description}</p>
              <small>Flow</small>
              <code>{layer.signal}</code>
            </div>
            <ul>
              {layer.items.map((item) => <li key={item}>{item}</li>)}
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

function NowPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="04"
        label="Now"
        title="Now"
        description="What I am working on and learning."
        scene="now"
      />

      <div className="now-meta">
        <span>Updated</span>
        <time dateTime="2026-07-29">{nowUpdated}</time>
      </div>

      <div className="now-list">
        {nowEntries.map((entry, index) => (
          <motion.article
            className="now-row"
            key={entry.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.05 }}
          >
            <span>{entry.marker}</span>
            <div>
              <p className="label">{entry.label}</p>
              <h2>{entry.title}</h2>
            </div>
            <p>{entry.description}</p>
            <code>{entry.detail}</code>
          </motion.article>
        ))}
      </div>

      <p className="now-footnote">
        Based on <a href="https://nownownow.com/about" target="_blank" rel="noreferrer">Now pages</a>.
        Updated manually.
      </p>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="section-shell page-section">
      <SectionHeading
        index="05"
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
          <span>Bay Area, California</span>
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

function ContactPage() {
  return (
    <section className="section-shell page-section contact-page">
      <SectionHeading
        index="06"
        label="Contact"
        title="Contact"
        description="Email and GitHub are the best ways to reach me."
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
          >
            <span>{link.label}</span>
            <strong>{link.handle}</strong>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </div>
    </section>
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
      <div className="footer-texture" aria-hidden="true">
        ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░ · ░▒▓█▓▒░
      </div>
      <div className="section-shell footer-inner">
        <p>AYUMAD.ME</p>
        <p>2026</p>
        <a href="mailto:hello@ayumad.me">Email ↗</a>
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
      <div className="dither-wash" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header path={path} />
      <main id="main-content">
        <PageTransition path={path}>{page}</PageTransition>
      </main>
      <Footer />
    </MotionConfig>
  );
}
