import hermesSource from "./content/blog/hermes-on-mac-mini.md?raw";
import vaultSource from "./content/blog/public-layer-private-vault.md?raw";
import audioSource from "./content/blog/desktop-headphone-stack.md?raw";
import bazziteSource from "./content/blog/two-bazzite-sff-pcs.md?raw";

export type BlogBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

export interface BlogArticle {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: string;
  blocks: BlogBlock[];
}

function unquote(value: string) {
  return value.replace(/^"|"$/g, "").trim();
}

function parseSource(source: string): BlogArticle {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Blog source is missing front matter");

  const metadata = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(":");
      return [line.slice(0, separator), unquote(line.slice(separator + 1))];
    }),
  );
  const blocks: BlogBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = undefined;
    }
  };

  for (const line of match[2].split("\n")) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }
    const unordered = line.match(/^- (.+)$/);
    const ordered = line.match(/^\d+\. (.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((unordered ?? ordered)?.[1] ?? "");
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();

  return {
    slug: metadata.slug,
    title: metadata.title,
    date: metadata.date,
    summary: metadata.summary,
    tags: metadata.tags.split("|").map((tag) => tag.trim()),
    readingTime: metadata.readingTime,
    blocks,
  };
}

export const blogArticles = [
  parseSource(hermesSource),
  parseSource(vaultSource),
  parseSource(audioSource),
  parseSource(bazziteSource),
] satisfies BlogArticle[];

export const blogArticleBySlug = new Map(blogArticles.map((article) => [article.slug, article]));
