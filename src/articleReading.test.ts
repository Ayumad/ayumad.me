import { describe, expect, it } from "vitest";
import { enhanceArticle, readingMinutes, slugifyHeading } from "./articleReading";

describe("articleReading", () => {
  it("slugifies headings into stable ids", () => {
    expect(slugifyHeading("Audeze LCD-X — My Favorite Headphones, Easily")).toBe(
      "audeze-lcd-x-my-favorite-headphones-easily",
    );
    expect(slugifyHeading("What I'd change")).toBe("what-id-change");
    expect(slugifyHeading("50–100 Hz region")).toBe("50-100-hz-region");
  });

  it("adds ids to h2 and h3 headings and reports them in order", () => {
    const html = "<h2>First thing</h2><p>body</p><h3>Nested thing</h3><h2>Second thing</h2>";
    const { html: enhanced, headings } = enhanceArticle(html);

    expect(enhanced).toContain('<h2 id="first-thing">First thing</h2>');
    expect(enhanced).toContain('<h3 id="nested-thing">Nested thing</h3>');
    expect(headings).toEqual([
      { id: "first-thing", text: "First thing", level: 2 },
      { id: "nested-thing", text: "Nested thing", level: 3 },
      { id: "second-thing", text: "Second thing", level: 2 },
    ]);
  });

  it("keeps ids unique when two headings share a title", () => {
    const { headings } = enhanceArticle("<h2>Repeat</h2><h2>Repeat</h2>");
    expect(headings.map((heading) => heading.id)).toEqual(["repeat", "repeat-2"]);
  });

  it("estimates reading time from prose only", () => {
    const prose = `<p>${"word ".repeat(440)}</p>`;
    expect(readingMinutes(prose)).toBe(2);

    const withCode = `<p>${"word ".repeat(220)}</p><pre>${"noise ".repeat(2000)}</pre>`;
    expect(readingMinutes(withCode)).toBe(1);
  });
});
