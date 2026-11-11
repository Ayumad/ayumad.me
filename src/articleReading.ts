export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
  "&quot;": '"',
  "&nbsp;": " ",
};

const WORDS_PER_MINUTE = 220;

export function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|#39|quot|nbsp);/g, (match) => ENTITIES[match] ?? match);
}

/** Visible text of an HTML fragment, with tags dropped and whitespace collapsed. */
export function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text: string): string {
  return decodeEntities(text)
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Words in the rendered article, ignoring code blocks so diagrams don't pad the estimate. */
export function countWords(html: string): number {
  const prose = html.replace(/<pre[\s\S]*?<\/pre>/g, " ");
  return plainText(prose).split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE));
}

/**
 * Gives every h2/h3 a stable id so sections can be linked and a table of contents
 * can be built, and reports the heading list plus a reading-time estimate.
 */
export function enhanceArticle(html: string): {
  html: string;
  headings: ArticleHeading[];
  minutes: number;
} {
  const used = new Map<string, number>();
  const headings: ArticleHeading[] = [];

  const enhanced = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (match, level: string, inner: string) => {
    const text = plainText(inner);
    if (!text) return match;

    const base = slugifyHeading(text) || `section-${headings.length + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen + 1}`;

    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  return { html: enhanced, headings, minutes: readingMinutes(html) };
}
