import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { socialLinks } from "./siteContent";
import { projectArticles } from "./projectContent";

function renderAt(path: string) {
  window.history.replaceState({}, "", path);
  return render(<App />);
}

async function renderReady(path: string) {
  await act(async () => { renderAt(path); });
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

    const homeContacts = document.querySelector<HTMLElement>(".hero-socials");
    expect(homeContacts).toBeInTheDocument();
    socialLinks.forEach((link) => {
      expect(within(homeContacts as HTMLElement).getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    });
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
    expect(screen.getByRole("button", { name: "Randomize" }).querySelector(".scope-icon-shuffle")).toBeInTheDocument();
  });

  it("groups the curated projects by lifecycle and makes every card a link", () => {
    renderAt("/projects");

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deployed / Shipped" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Planned" })).toBeInTheDocument();
    expect(projectArticles).toHaveLength(12);
    expect(projectArticles.filter((project) => project.stage === "deployed")).toHaveLength(5);
    expect(projectArticles.filter((project) => project.stage === "in-progress")).toHaveLength(5);
    expect(projectArticles.filter((project) => project.stage === "planned")).toHaveLength(2);
    const lifecycleNav = screen.getByRole("navigation", { name: "Project lifecycle sections" });
    expect(within(lifecycleNav).getByRole("link", { name: /Completed/i })).toHaveAttribute("href", "#project-deployed");
    expect(within(lifecycleNav).getByRole("link", { name: /In progress/i })).toHaveAttribute("href", "#project-in-progress");
    expect(within(lifecycleNav).getByRole("link", { name: /Planned/i })).toHaveAttribute("href", "#project-planned");
    expect(document.getElementById("project-deployed")).toBeInTheDocument();
    expect(document.getElementById("project-in-progress")).toBeInTheDocument();
    expect(document.getElementById("project-planned")).toBeInTheDocument();
    projectArticles.forEach((project) => {
      expect(screen.getByRole("heading", { name: project.title, level: 2 }).closest("a")).toHaveAttribute(
        "href",
        `/projects/${project.slug}`,
      );
    });
    expect(screen.queryByText("Owlbot")).not.toBeInTheDocument();
    expect(screen.queryByText("DeluluBot")).not.toBeInTheDocument();
    expect(screen.queryByText("Audio Visualization")).not.toBeInTheDocument();
  });

  it("renders a project detail page", async () => {
    await renderReady("/projects/crt-lab");

    expect(await screen.findByRole("heading", { name: "CRT Lab" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Problem" })).toBeInTheDocument();
    expect(screen.getByText(/CRT Lab treats every input as a source bay/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Live V1 ↗" })).toHaveAttribute(
      "href",
      "https://crt-lab-xi.vercel.app/",
    );
    expect(screen.getByRole("link", { name: "← All projects" })).toHaveAttribute("href", "/projects");
  });

  it("renders deployed, active, and planned project articles", async () => {
    await renderReady("/projects/hermes");

    expect(window.location.pathname).toBe("/projects/hermes-agent");
    expect(await screen.findByRole("heading", { name: "Hermes Agent" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Architecture and workflow" })).toBeInTheDocument();

    await renderReady("/projects/album-ranking-app");
    expect(await screen.findByRole("heading", { name: "Album Ranking App" })).toBeInTheDocument();
    expect(screen.getByText(/there is no standalone app/i)).toBeInTheDocument();
  });

  it("renders Gear and the merged About contact section", async () => {
    renderAt("/gear");
    expect(screen.getByRole("heading", { name: "Gear" })).toBeInTheDocument();
    expect(screen.getByText("29 products")).toBeInTheDocument();
    expect(screen.queryByText("Accessories & Network")).not.toBeInTheDocument();
    expect(screen.queryByText("AMD Radeon RX 6600 8 GB")).not.toBeInTheDocument();
    expect(screen.queryByText("NVIDIA GeForce RTX 2060 6 GB")).not.toBeInTheDocument();
    expect(screen.getByText("Engineering Desktop (Radeon RX 6600)")).toBeInTheDocument();
    expect(screen.getByText("Apple Mac mini (M4, 2024)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Apple Mac mini (M4, 2024) gear page" })).toHaveAttribute("href", "/gear/computers-apple-mac-mini-m4-2024");
    expect(document.querySelector('[data-ascii-scene="gear"]')).toBeInTheDocument();

    renderAt("/gear/computers-apple-mac-mini-m4-2024");
    expect(screen.getByRole("heading", { name: "Apple Mac mini (M4, 2024)" })).toBeInTheDocument();
    expect(document.querySelector(".gear-detail-page")?.textContent).toContain("Hermes client / daily workstation");
    expect(document.querySelector(".gear-detail-page")?.textContent).toContain("machine Hermes runs from today");
    expect(screen.getByRole("link", { name: /Read the Hermes case study/ })).toHaveAttribute("href", "/projects/hermes-agent");

    await renderReady("/about");
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Want to talk?" })).toBeInTheDocument();
    expect(screen.getByText(/moving from India to the US/i)).toBeInTheDocument();
    expect(document.querySelector(".contact-stack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /EmailAyumadbro123@gmail\.com/ })).toHaveAttribute("href", "mailto:Ayumadbro123@gmail.com");
    expect(screen.getByRole("link", { name: /LinkedInin\/ayumad/ })).toHaveAttribute("href", "https://www.linkedin.com/in/ayumad");
    expect(screen.getByRole("link", { name: /X@Ayumadbro/ })).toHaveAttribute("href", "https://x.com/Ayumadbro");
    expect(await screen.findByRole("heading", { name: "Listening, ranked." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Genre mix" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Album Elo board" })).toBeInTheDocument();
  });

  it("redirects the old Taste page into the About section", async () => {
    await renderReady("/taste");

    await waitFor(() => expect(window.location.pathname).toBe("/about"));
    expect(window.location.hash).toBe("#taste");
    expect(await screen.findByRole("heading", { name: "Listening, ranked." })).toBeInTheDocument();
  });

  it("renders the journal page with the daily log calendar and curated articles", async () => {
    await renderReady("/journal");
    expect(screen.getByRole("heading", { name: "Journal" })).toBeInTheDocument();
    expect(await screen.findByText("Daily journal")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hermes on a Mac Mini: Headless macOS and Always-On Automation", level: 2 }).closest("a")).toHaveAttribute("href", "/journal/hermes-on-mac-mini");
    expect(screen.queryByText(/Session journal for 2026/)).not.toBeInTheDocument();

    await renderReady("/journal/gpu-passthrough-p520");
    expect(await screen.findByRole("heading", { name: "GPU Passthrough on the P520: Passing an RTX 3060 to a Proxmox VM", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Host setup" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/Lenovo ThinkStation P520/)).toBeInTheDocument();
    expect(screen.getByText(/nvidia-smi/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All journal entries/i })).toHaveAttribute("href", "/journal");
  });

  it("renders the school VM article with its chart and table", async () => {
    await renderReady("/journal/school-vm-p520");
    expect(await screen.findByRole("heading", { name: "A School VM on the P520: Headless Ubuntu for Two Linux Classes", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Things that bit me" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/no GUI anywhere in that list/)).toBeInTheDocument();
    expect(document.querySelector(".fleet-chart")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All journal entries/i })).toHaveAttribute("href", "/journal");

    await renderReady("/journal");
    expect(screen.getByRole("heading", { name: "A School VM on the P520: Headless Ubuntu for Two Linux Classes", level: 2 }).closest("a")).toHaveAttribute("href", "/journal/school-vm-p520");
  });

  it("renders the gaming fleet benchmark article with gear links", async () => {
    await renderReady("/journal/gaming-fleet-roundup");
    expect(await screen.findByRole("heading", { name: "Gaming Across My Fleet: How Thirteen Machines Compare", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("table").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Alienware m16" })[0]).toHaveAttribute("href", "/gear/computers-dell-alienware-m16-ryzen-9-geforce-rtx-4080");
    expect(screen.getAllByRole("link", { name: "Steam Deck OLED" })[0]).toHaveAttribute("href", "/gear/gaming-valve-steam-deck-oled");
    expect(screen.getByText(/384 fps/)).toBeInTheDocument();

    await renderReady("/journal");
    expect(screen.getByRole("heading", { name: "Gaming Across My Fleet: How Thirteen Machines Compare", level: 2 }).closest("a")).toHaveAttribute("href", "/journal/gaming-fleet-roundup");

    renderAt("/gear/computers-dell-alienware-m16-ryzen-9-geforce-rtx-4080");
    expect(screen.getByRole("heading", { name: "Dell Alienware m16 (Ryzen 9, GeForce RTX 4080)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gaming fleet benchmark/i })).toHaveAttribute("href", "/journal/gaming-fleet-roundup");
  });

  it("renders the headphone collection article with its sections and playlist links", async () => {
    await renderReady("/journal/my-headphone-collection");
    expect(
      await screen.findByRole("heading", {
        name: "My Audio Journey: How I Got Here and What I've Learned Along the Way",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Audeze LCD-X/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Where I Go From Here/ })).toBeInTheDocument();
    expect(screen.getByText(/Ananda Unveiled stays fairly bright/)).toBeInTheDocument();
    expect(screen.getByText(/Q500 floorstanders/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "HIFI" })).toHaveAttribute(
      "href",
      "https://tidal.com/playlist/becded3a-e9ed-43f2-a403-550bda3c2ef6",
    );
    expect(screen.getByRole("link", { name: "Recommendations" })).toHaveAttribute(
      "href",
      "https://tidal.com/playlist/94358376-b160-4523-ac8f-e780041f7409",
    );
    expect(screen.getByRole("link", { name: /All journal entries/i })).toHaveAttribute("href", "/journal");

    // reading aids: read time, section ids, section index, pager, back to top
    expect(screen.getByText(/\d+ min read/)).toBeInTheDocument();
    expect(document.querySelector("#audeze-lcd-x-my-favorite-headphones-easily")).toBeInTheDocument();
    const sections = screen.getByRole("navigation", { name: "Sections in this article" });
    expect(within(sections).getByRole("link", { name: /The Listening Session/ })).toHaveAttribute(
      "href",
      "#the-listening-session-that-made-me-fall-in-love-with-audio",
    );
    // next-newest journal entry by date
    expect(screen.getByRole("link", { name: /← Previous/ })).toHaveAttribute("href", "/journal/school-vm-p520");
    expect(screen.getByRole("link", { name: /Back to top/ })).toHaveAttribute("href", "#main-content");

    await renderReady("/journal");
    expect(
      screen.getByRole("heading", {
        name: "My Audio Journey: How I Got Here and What I've Learned Along the Way",
        level: 2,
      }).closest("a"),
    ).toHaveAttribute(
      "href",
      "/journal/my-headphone-collection",
    );
  });

  it("redirects legacy clean routes and hash routes", async () => {
    renderAt("/systems");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/projects");

    window.history.replaceState({}, "", "/");
    window.location.hash = "#/hermes";
    render(<App />);
    expect(window.location.pathname).toBe("/projects/hermes-agent");
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
