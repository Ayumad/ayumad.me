import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

function renderAt(path: string) {
  window.history.replaceState({}, "", path);
  return render(<App />);
}

describe("Ayumad.me", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.renderer = "ascii";
    localStorage.removeItem("ayumad-renderer");
    window.history.replaceState({}, "", "/");
  });

  it("renders the homepage instrument and the five-section navigation", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { name: /Ayush Madhukar/i })).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: /interactive real-time ASCII XY oscilloscope/i })).toBeInTheDocument();
    expect(document.querySelector(".oscilloscope-grid")?.textContent?.length).toBeGreaterThan(1_000);

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    expect(within(navigation).getByRole("link", { name: /Projects/i })).toHaveAttribute("href", "/projects");
    expect(within(navigation).getByRole("link", { name: /About/i })).toHaveAttribute("href", "/about");
    expect(within(navigation).queryByRole("link", { name: /Taste/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /Work/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /Contact/i })).not.toBeInTheDocument();
  });

  it("keeps the oscilloscope controls functional", () => {
    renderAt("/");
    const frequency = screen.getByRole("slider", { name: "Frequency" });
    fireEvent.change(frequency, { target: { value: "45" } });
    expect(frequency).toHaveValue("45");
    expect(frequency).toHaveAttribute("aria-valuetext", "A2, 110 hertz");

    fireEvent.click(screen.getByRole("button", { name: "Show 3D geometry" }));
    expect(screen.getByRole("button", { name: "Show 2D geometry" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".oscilloscope-grid")).toHaveAttribute("data-dimension", "3d");
  });

  it("combines current work, projects, and systems on Projects", () => {
    renderAt("/projects");

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What I am working on" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Hermes Agent" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "The layers underneath" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CRT Lab", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open CRT Lab live site ↗" })).toHaveAttribute("href", "https://crt-lab-xi.vercel.app/");
    expect(screen.getByText("Mac mini / Hermes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI + Notes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Homelab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Audio", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Voice Assistant", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ayumad.me" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Hermes case study/i })).toHaveAttribute("href", "/projects/hermes");
    expect(screen.getByRole("heading", { name: "CRT Lab", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open CRT Lab live app" })).toHaveAttribute("href", "https://crt-lab-xi.vercel.app/");
  });

  it("renders Hermes as a nested project case study", () => {
    renderAt("/projects/hermes");

    expect(screen.getByRole("heading", { name: "Hermes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What Hermes Does" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Memory System" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All projects/i })).toHaveAttribute("href", "/projects");
  });

  it("renders Gear and the merged About contact section", () => {
    renderAt("/gear");
    expect(screen.getByRole("heading", { name: "Gear" })).toBeInTheDocument();
    expect(screen.getByText("Mac mini")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Mac mini gear page" })).toHaveAttribute("href", "/gear/computers-mac-mini");

    renderAt("/gear/computers-mac-mini");
    expect(screen.getByRole("heading", { name: "Mac mini" })).toBeInTheDocument();
    expect(document.querySelector(".gear-detail-page")?.textContent).toContain("Always-on Hermes server, Tailscale node");
    expect(screen.getByRole("link", { name: /Read the Hermes case study/ })).toHaveAttribute("href", "/projects/hermes");

    renderAt("/about");
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Want to talk?" })).toBeInTheDocument();
    expect(screen.getByText(/moving from India to the US/i)).toBeInTheDocument();
    expect(document.querySelector(".contact-stack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Emailhello@ayumad\.me/ })).toHaveAttribute("href", "mailto:hello@ayumad.me");
    expect(screen.getByRole("link", { name: /LinkedInin\/ayush-madhukar/ })).toHaveAttribute("href", "https://www.linkedin.com/in/ayush-madhukar-6021a0249/");
    expect(screen.getByRole("heading", { name: "Listening, ranked." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Genre mix" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Album Elo board" })).toBeInTheDocument();
  });

  it("redirects the old Taste page into the About section", async () => {
    renderAt("/taste");

    await waitFor(() => expect(window.location.pathname).toBe("/about"));
    expect(window.location.hash).toBe("#taste");
    expect(screen.getByRole("heading", { name: "Listening, ranked." })).toBeInTheDocument();
  });

  it("renders only curated Journal articles and full article content", () => {
    renderAt("/journal");
    expect(screen.getByRole("heading", { name: "Journal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read Why I Moved Hermes to a Mac Mini" })).toHaveAttribute("href", "/journal/hermes-on-mac-mini");
    expect(screen.queryByText(/Session journal for 2026/)).not.toBeInTheDocument();

    renderAt("/journal/gpu-passthrough-p520");
    expect(screen.getByRole("heading", { name: "GPU Passthrough on the P520", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Host setup" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/Lenovo ThinkStation P520/)).toBeInTheDocument();
    expect(screen.getByText(/nvidia-smi/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All journal entries/i })).toHaveAttribute("href", "/journal");
  });

  it("redirects legacy clean routes and hash routes", async () => {
    renderAt("/systems");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/projects");

    window.history.replaceState({}, "", "/");
    window.location.hash = "#/hermes";
    render(<App />);
    expect(window.location.pathname).toBe("/projects/hermes");
  });

  it("renders a useful not-found route with a clean home link", () => {
    renderAt("/missing-signal");
    expect(screen.getByRole("heading", { name: "Not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("persists theme, renderer, and mobile navigation state", () => {
    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("ayumad-theme")).toBe("light");

    fireEvent.change(screen.getByRole("combobox", { name: "Renderer" }), { target: { value: "dither" } });
    expect(document.documentElement.dataset.renderer).toBe("dither");
    expect(document.querySelector('[data-ascii-scene="home"]')).not.toBeInTheDocument();

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  });
});
