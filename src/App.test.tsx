import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

function renderAt(path: string) {
  window.location.hash = `#${path}`;
  return render(<App />);
}

describe("Ayumad.me", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "dark";
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
    expect(screen.getByRole("combobox", { name: "Ratio" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Phase" })).toHaveValue("90");
    expect(screen.getByRole("slider", { name: "Shape" })).toHaveValue("0.12");
    expect(screen.getByRole("button", { name: "Enable audio" })).toHaveAttribute(
      "aria-pressed",
      "false",
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

    fireEvent.change(screen.getByRole("combobox", { name: "Ratio" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Phase" }), {
      target: { value: "180" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Shape" }), {
      target: { value: "0.25" },
    });

    expect(screen.getByRole("combobox", { name: "Ratio" })).toHaveValue("2");
    expect(screen.getByText("180°")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
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
    ["/showcase", "Work"],
    ["/systems", "Systems"],
    ["/now", "Now"],
    ["/about", "About"],
    ["/contact", "Contact"],
  ])("renders %s with its primary heading", (path, heading) => {
    renderAt(path);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
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
