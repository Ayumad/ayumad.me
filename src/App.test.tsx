import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function renderAt(path: string) {
  window.location.hash = `#${path}`;
  return render(<App />);
}

describe("Ayumad.me", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.renderer = "ascii";
    localStorage.removeItem("ayumad-renderer");
  });

  it("renders the home page and all primary navigation destinations", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { name: /Ayush Madhukar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("figure", {
        name: /An interactive real-time ASCII XY oscilloscope/,
      }),
    ).toBeInTheDocument();
    const renderedSignal = document.querySelector<HTMLPreElement>(".oscilloscope-grid");
    const signalText = renderedSignal?.textContent ?? "";
    expect(signalText.length).toBeGreaterThan(1_000);
    expect(["|", "/", "\\", "+", "-"].some((glyph) => signalText.includes(glyph))).toBe(true);
    expect(screen.getByRole("button", { name: /Knot shape/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveValue("55");
    expect(screen.getByRole("spinbutton", { name: "X ratio" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "Y ratio" })).toHaveValue(2);
    expect(screen.getByRole("slider", { name: "Phase" })).toHaveValue("90");
    expect(screen.getByRole("slider", { name: "Form" })).toHaveValue("0.12");
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.98");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.22");
    expect(screen.getByRole("slider", { name: "Copies" })).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Enable audio" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("combobox", { name: "Renderer" })).toHaveValue(
      "ascii",
    );
    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(navigation).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: /Work/i })).toHaveAttribute(
      "href",
      "#/showcase",
    );
    expect(within(navigation).getByRole("link", { name: /Contact/i })).toHaveAttribute(
      "href",
      "#/contact",
    );
  });

  it("updates the oscilloscope from its accessible controls", () => {
    renderAt("/");

    fireEvent.click(screen.getByRole("button", { name: /Star shape/i }));
    fireEvent.change(screen.getByRole("slider", { name: "Frequency" }), {
      target: { value: "110" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "X ratio" }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Phase" }), {
      target: { value: "180" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Form" }), {
      target: { value: "0.3" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Copies" }), {
      target: { value: "2" },
    });

    expect(screen.getByRole("button", { name: /Star shape/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveValue("110");
    expect(screen.getByRole("spinbutton", { name: "X ratio" })).toHaveValue(7);
    expect(screen.getByText("180°")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("4×")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
    expect(screen.getByRole("button", { name: "Run animation" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    fireEvent.click(screen.getByRole("button", { name: "Random" }));
    expect(screen.getByRole("button", { name: /Rose shape/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider", { name: "Copies" })).toHaveValue("2");
    expect(screen.getByRole("button", { name: "Pause animation" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    random.mockRestore();
  });

  it("renders project stories on the projects route", () => {
    renderAt("/projects");

    expect(screen.getByRole("heading", { name: "Owlbot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Homelab Build" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hermes Remote" })).toBeInTheDocument();
    expect(screen.getAllByText("Completed")).toHaveLength(3);
  });

  it("shows concrete systems from the editable content layer", () => {
    renderAt("/systems");

    expect(screen.getByText("Mac mini / Hermes")).toBeInTheDocument();
    expect(screen.getByText("RTX 5080 desktop / 4K OLED")).toBeInTheDocument();
    expect(screen.getByText("X-T4 / 18–55 + X100VI")).toBeInTheDocument();
    expect(screen.getByText("Dusk / Daybreak / Zero:RED")).toBeInTheDocument();
  });

  it.each([
    ["/showcase", "Work", "work"],
    ["/projects", "Projects", "projects"],
    ["/systems", "Systems", "systems"],
    ["/now", "Now", "now"],
    ["/about", "About", "about"],
    ["/contact", "Contact", "contact"],
  ])("renders %s with its primary heading and ASCII scene", (path, heading, scene) => {
    renderAt(path);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    const renderedScene = document.querySelector<HTMLPreElement>(
      `[data-ascii-scene="${scene}"]`,
    );
    expect(renderedScene).toBeInTheDocument();
    expect(renderedScene?.textContent?.length).toBeGreaterThan(1_000);
  });

  it("renders a useful not-found route", () => {
    renderAt("/missing-signal");

    expect(screen.getByRole("heading", { name: "Not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "#/");
  });

  it("persists theme changes", () => {
    localStorage.setItem("ayumad-theme", "dark");
    renderAt("/");

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("ayumad-theme")).toBe("light");
  });

  it("applies and persists renderer modes across the complete shell", () => {
    renderAt("/systems");
    const selector = screen.getByRole("combobox", { name: "Renderer" });
    const scene = document.querySelector<HTMLPreElement>(
      '[data-ascii-scene="systems"]',
    );

    expect(selector).toHaveValue("ascii");
    fireEvent.change(selector, { target: { value: "dither" } });

    expect(document.documentElement.dataset.renderer).toBe("dither");
    expect(localStorage.getItem("ayumad-renderer")).toBe("dither");
    expect(scene).toHaveAttribute("data-render-mode", "dither");
    expect(scene?.textContent).toMatch(/[░▒▓█]/);

    fireEvent.change(selector, { target: { value: "particles" } });
    expect(document.documentElement.dataset.renderer).toBe("particles");
    expect(scene).toHaveAttribute("data-render-mode", "particles");
    expect(scene?.textContent).toMatch(/[·•●]/);

    for (const mode of ["glitch", "crt", "ascii"]) {
      fireEvent.change(selector, { target: { value: mode } });
      expect(document.documentElement.dataset.renderer).toBe(mode);
      expect(localStorage.getItem("ayumad-renderer")).toBe(mode);
    }
  });

  it("opens and closes the mobile navigation accessibly", () => {
    renderAt("/");
    const menuButton = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
