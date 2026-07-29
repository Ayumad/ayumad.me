import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { SiteErrorBoundary } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteErrorBoundary>
      <App />
    </SiteErrorBoundary>
  </StrictMode>,
);
