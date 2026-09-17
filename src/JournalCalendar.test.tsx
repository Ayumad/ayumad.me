import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JournalCalendar from "./JournalCalendar";
import { addDays, buildMonthGrid, parseISO, startOfWeek, toISO } from "./journalCalendarMath";

const sampleEntries = [
  { date: "2026-09-16", summary: "P520 rebuilt and the AI stack came back.", highlights: ["**P520** — clean reinstall.", "All cron green."] },
  { date: "2026-09-14", summary: "Infrastructure day — vault sync restored.", highlights: ["Vault auto-sync fixed."] },
  { date: "2026-08-19", summary: "Site refactor day.", highlights: [] },
];

function mockFetchOk(data: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
}

function mockFetchFail() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network")));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journal calendar helpers", () => {
  it("builds a Sunday-first month grid with padding", () => {
    const grid = buildMonthGrid(2026, 8); // September 2026 starts on a Tuesday
    expect(grid).toHaveLength(35);
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBeNull();
    expect(grid[2]).toBe("2026-09-01");
    expect(grid[31]).toBe("2026-09-30");
    expect(grid[32]).toBeNull();
    expect(grid[34]).toBeNull();
  });

  it("moves dates across month boundaries and snaps to weeks", () => {
    expect(toISO(addDays(parseISO("2026-09-16"), 3))).toBe("2026-09-19");
    expect(toISO(addDays(parseISO("2026-09-30"), 1))).toBe("2026-10-01");
    expect(toISO(startOfWeek(parseISO("2026-09-17")))).toBe("2026-09-13");
  });
});

describe("JournalCalendar", () => {
  it("loads entries and shows the latest day by default", async () => {
    mockFetchOk(sampleEntries);
    render(<JournalCalendar />);

    await waitFor(() => expect(document.querySelector(".jcal-period")?.textContent).toBe("September 2026"));
    expect(screen.getByText("P520 rebuilt and the AI stack came back.")).toBeInTheDocument();
    expect(screen.getByText("Wednesday, September 16, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wednesday, September 16, 2026/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("P520")).toBeInTheDocument();
  });

  it("previews a day on hover and keeps it after a click", async () => {
    mockFetchOk(sampleEntries);
    render(<JournalCalendar />);
    await waitFor(() => expect(document.querySelector(".jcal-period")?.textContent).toBe("September 2026"));

    const day14 = screen.getByRole("button", { name: /Monday, September 14, 2026/ });
    fireEvent.mouseEnter(day14);
    expect(screen.getByText("Infrastructure day — vault sync restored.")).toBeInTheDocument();

    fireEvent.click(day14);
    fireEvent.mouseLeave(day14);
    expect(screen.getByText("Infrastructure day — vault sync restored.")).toBeInTheDocument();
    expect(screen.getByText("Vault auto-sync fixed.")).toBeInTheDocument();
  });

  it("switches between weekly, monthly, and yearly views", async () => {
    mockFetchOk(sampleEntries);
    render(<JournalCalendar />);
    await waitFor(() => expect(document.querySelector(".jcal-period")?.textContent).toBe("September 2026"));

    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
    expect(screen.getByRole("button", { name: "Weekly" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".jcal-period")?.textContent).toBe("Sep 13 – 19, 2026");
    expect(screen.getAllByText("P520 rebuilt and the AI stack came back.").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(document.querySelector(".jcal-period")?.textContent).toBe("2026");
    expect(document.querySelectorAll(".jcal-mini")).toHaveLength(12);

    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(document.querySelectorAll(".jcal-weekdays span")).toHaveLength(7);
  });

  it("degrades gracefully when the feed is unavailable", async () => {
    mockFetchFail();
    render(<JournalCalendar />);

    await waitFor(() => expect(screen.getByText("The daily log isn't available right now.")).toBeInTheDocument());
    expect(screen.getByText("Daily journal")).toBeInTheDocument();
  });
});
