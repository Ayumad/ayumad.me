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
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveValue("33");
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveAttribute(
      "min",
      "21",
    );
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveAttribute(
      "max",
      "57",
    );
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveAttribute(
      "aria-valuetext",
      "A1, 55 hertz",
    );
    expect(screen.getByText("A1 55")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.98");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.22");
    expect(screen.getByRole("slider", { name: "Multiplier" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Render units" })).toHaveValue(
      "72",
    );
    expect(screen.getByRole("slider", { name: "Render units" })).toHaveAttribute(
      "aria-valuetext",
      "72 horizontal character units",
    );
    expect(
      screen.getByRole("button", { name: "Show 3D geometry" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(renderedSignal).toHaveAttribute("data-dimension", "2d");
    expect(renderedSignal).toHaveAttribute("data-geometry", "knot");
    expect(renderedSignal).toHaveAttribute("data-units", "72");
    expect(screen.queryByRole("spinbutton", { name: "X ratio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Phase" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Form" })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Rotation" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable audio" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("button", { name: "Enable audio" }).querySelector(
        ".scope-icon-audio-off",
      ),
    ).toBeInTheDocument();
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

  it("spans three complete chromatic octaves from A0 through A3", () => {
    renderAt("/");
    const frequency = screen.getByRole("slider", { name: "Frequency" });

    fireEvent.change(frequency, { target: { value: "21" } });
    expect(frequency).toHaveAttribute(
      "aria-valuetext",
      "A0, 27.50 hertz",
    );
    expect(screen.getByText("A0 27.50")).toBeInTheDocument();

    fireEvent.change(frequency, { target: { value: "57" } });
    expect(frequency).toHaveAttribute(
      "aria-valuetext",
      "A3, 220 hertz",
    );
    expect(screen.getByText("A3 220")).toBeInTheDocument();
  });

  it("updates the oscilloscope from its accessible controls", () => {
    renderAt("/");

    fireEvent.click(screen.getByRole("button", { name: /Star shape/i }));
    fireEvent.change(screen.getByRole("slider", { name: "Frequency" }), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Scale" }), {
      target: { value: "0.84" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Motion" }), {
      target: { value: "0.24" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Multiplier" }), {
      target: { value: "2" },
    });

    expect(screen.getByRole("button", { name: /Star shape/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveValue("45");
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveAttribute(
      "aria-valuetext",
      "A2, 110 hertz",
    );
    expect(screen.getByText("A2 110")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.84");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.24");
    expect(screen.getByText("4×")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Star shape/i }));
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.96");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.12");

    fireEvent.click(screen.getByRole("button", { name: /Circle shape/i }));
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.98");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.08");
    expect(screen.getByRole("slider", { name: "Multiplier" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Frequency" })).toHaveValue("45");

    const pauseButton = screen.getByRole("button", { name: "Pause animation" });
    expect(pauseButton.querySelector(".scope-icon-pause")).toBeInTheDocument();
    fireEvent.click(pauseButton);
    expect(screen.getByRole("button", { name: "Run animation" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("button", { name: "Run animation" }).querySelector(
        ".scope-icon-play",
      ),
    ).toBeInTheDocument();

    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const randomizeButton = screen.getByRole("button", { name: "Randomize" });
    expect(
      randomizeButton.querySelector(".scope-icon-random"),
    ).toBeInTheDocument();
    fireEvent.click(randomizeButton);
    expect(screen.getByRole("button", { name: /Rose shape/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider", { name: "Scale" })).toHaveValue("0.84");
    expect(screen.getByRole("slider", { name: "Motion" })).toHaveValue("0.18");
    expect(screen.getByRole("slider", { name: "Multiplier" })).toHaveValue("1");
    expect(screen.getByRole("button", { name: "Pause animation" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    random.mockRestore();
  });

  it("keeps every randomized variant within its authored density limit", () => {
    renderAt("/");
    const randomizeButton = screen.getByRole("button", { name: "Randomize" });
    const multiplier = screen.getByRole("slider", {
      name: "Multiplier",
    }) as HTMLInputElement;
    const random = vi.spyOn(Math, "random");
    const complexShapes = ["Eight", "Knot", "Rose", "Star", "Orbit"];

    for (let index = 0; index < 18; index += 1) {
      random.mockReturnValue((index + 0.25) / 18);
      fireEvent.click(randomizeButton);

      expect(Number(multiplier.value)).toBeLessThan(3);

      for (const shape of complexShapes) {
        const button = screen.getByRole("button", {
          name: new RegExp(`${shape} shape`, "i"),
        });

        if (button.getAttribute("aria-pressed") === "true") {
          expect(Number(multiplier.value)).toBeLessThanOrEqual(1);
        }
      }
    }

    random.mockRestore();
  });

  it("maps every shape to an authored 3D wireframe", () => {
    renderAt("/");
    const grid = document.querySelector<HTMLPreElement>(".oscilloscope-grid");
    const geometries = [
      ["Line", "wave"],
      ["Circle", "torus"],
      ["Square", "cube"],
      ["Eight", "lemniscate"],
      ["Knot", "torus-knot"],
      ["Rose", "rose-cage"],
      ["Star", "star-prism"],
      ["Polygon", "hexagonal-prism"],
      ["Orbit", "orbital-cage"],
    ];

    fireEvent.click(screen.getByRole("button", { name: "Show 3D geometry" }));
    expect(
      screen.getByRole("button", { name: "Show 2D geometry" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(grid).toHaveAttribute("data-dimension", "3d");

    for (const [shape, geometry] of geometries) {
      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(`${shape} shape`, "i"),
        }),
      );
      expect(grid).toHaveAttribute("data-geometry", geometry);
      expect(grid?.textContent?.trim().length).toBeGreaterThan(80);
    }

    fireEvent.click(screen.getByRole("button", { name: "Show 2D geometry" }));
    expect(grid).toHaveAttribute("data-dimension", "2d");
  });

  it("increases grid detail for crowded multiplied geometry", () => {
    renderAt("/");
    const grid = document.querySelector<HTMLPreElement>(".oscilloscope-grid");
    const units = screen.getByRole("slider", { name: "Render units" });

    fireEvent.click(screen.getByRole("button", { name: /Circle shape/i }));
    fireEvent.click(screen.getByRole("button", { name: "Show 3D geometry" }));
    fireEvent.change(screen.getByRole("slider", { name: "Multiplier" }), {
      target: { value: "3" },
    });
    fireEvent.change(units, { target: { value: "48" } });

    const lowRows = Number(grid?.dataset.rows);
    const lowDetail =
      grid?.textContent?.replaceAll(/\s/g, "").length ?? 0;
    expect(grid).toHaveAttribute("data-units", "48");
    expect(grid?.textContent?.split("\n")[0]).toHaveLength(48);

    fireEvent.change(units, { target: { value: "120" } });

    const highRows = Number(grid?.dataset.rows);
    const highDetail =
      grid?.textContent?.replaceAll(/\s/g, "").length ?? 0;
    expect(units).toHaveAttribute(
      "aria-valuetext",
      "120 horizontal character units",
    );
    expect(grid).toHaveAttribute("data-units", "120");
    expect(grid?.textContent?.split("\n")[0]).toHaveLength(120);
    expect(highRows).toBeGreaterThan(lowRows);
    expect(highDetail).toBeGreaterThan(lowDetail);
  });

  it("corrects character-cell aspect ratio for standard shapes", () => {
    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: /Circle shape/i }));

    const lines =
      document.querySelector<HTMLPreElement>(".oscilloscope-grid")
        ?.textContent?.split("\n") ?? [];
    const points: Array<[number, number]> = [];

    lines.forEach((line, row) => {
      [...line].forEach((character, column) => {
        if (character !== " ") points.push([column, row]);
      });
    });

    const columns = points.map(([column]) => column);
    const rows = points.map(([, row]) => row);
    const characterWidth = Math.max(...columns) - Math.min(...columns) + 1;
    const characterHeight = Math.max(...rows) - Math.min(...rows) + 1;
    const physicalRatio = (characterWidth * 0.6) / (characterHeight * 0.91);

    expect(points.length).toBeGreaterThan(100);
    expect(physicalRatio).toBeGreaterThan(0.85);
    expect(physicalRatio).toBeLessThan(1.15);
  });

  it("keeps every 2D and 3D shape inside the plot at maximum scale", () => {
    renderAt("/");
    const scale = screen.getByRole("slider", { name: "Scale" });
    const multiplier = screen.getByRole("slider", { name: "Multiplier" });
    const grid = document.querySelector<HTMLPreElement>(".oscilloscope-grid");
    const shapes = [
      "Line",
      "Circle",
      "Square",
      "Eight",
      "Knot",
      "Rose",
      "Star",
      "Polygon",
      "Orbit",
    ];

    for (const dimension of ["2d", "3d"]) {
      if (dimension === "3d") {
        fireEvent.click(
          screen.getByRole("button", { name: "Show 3D geometry" }),
        );
      }

      for (const shape of shapes) {
        fireEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`${shape} shape`, "i"),
          }),
        );
        fireEvent.change(scale, { target: { value: "1" } });

        for (const octave of ["0", "1", "2", "3"]) {
          fireEvent.change(multiplier, { target: { value: octave } });
          expect(grid).toHaveAttribute("data-dimension", dimension);
          expect(grid).toHaveAttribute("data-clipped-samples", "0");
        }
      }
    }
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
