import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import "@fontsource/vt323";
import App, { SiteErrorBoundary } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteErrorBoundary>
      <App />
    </SiteErrorBoundary>
  </StrictMode>,
);
