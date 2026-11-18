import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { migrateLegacyHash } from "./legacyNavigation";
import App, { SiteErrorBoundary } from "./App";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import "./styles.css";

migrateLegacyHash();
const root = document.getElementById("root")!;
const project = <StrictMode><SiteErrorBoundary><App /></SiteErrorBoundary></StrictMode>;
const renderedPath = root.dataset.prerendered;
const path = window.location.pathname.replace(/\/+$/, "") || "/";
if (renderedPath && (renderedPath === path || renderedPath === "/404")) {
  hydrateRoot(root, project);
} else {
  createRoot(root).render(project);
}
