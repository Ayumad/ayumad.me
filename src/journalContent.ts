export type JournalKind = "article" | "note";

export interface JournalPost {
  title: string;
  slug: string;
  date: string;
  summary: string;
  tags: string[];
  kind: JournalKind;
  status: "published";
  body: string;
}

const sources = import.meta.glob("./content/journal/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function parseFrontmatter(source: string, fileName: string): JournalPost {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(`Journal file ${fileName} is missing frontmatter`);

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields[key] = value;
  }

  const required = ["title", "slug", "date", "summary", "tags", "kind", "status"];
  for (const key of required) {
    if (!fields[key]) throw new Error(`Journal file ${fileName} is missing ${key}`);
  }
  if (fields.kind !== "article" && fields.kind !== "note") {
    throw new Error(`Journal file ${fileName} has an invalid kind`);
  }
  if (fields.status !== "published") {
    throw new Error(`Unpublished journal file ${fileName} must stay out of the public repo`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
    throw new Error(`Journal file ${fileName} has an invalid date`);
  }

  return {
    title: fields.title,
    slug: fields.slug,
    date: fields.date,
    summary: fields.summary,
    tags: fields.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    kind: fields.kind,
    status: "published",
    body: match[2].trim(),
  };
}

const parsedPosts = Object.entries(sources).map(([fileName, source]) =>
  parseFrontmatter(source, fileName),
);

const duplicateSlugs = parsedPosts
  .map((post) => post.slug)
  .filter((slug, index, all) => all.indexOf(slug) !== index);
if (duplicateSlugs.length > 0) {
  throw new Error(`Duplicate journal slug: ${duplicateSlugs[0]}`);
}

export const journalPosts = parsedPosts.sort((a, b) => b.date.localeCompare(a.date));

export function findJournalPost(slug: string) {
  return journalPosts.find((post) => post.slug === slug);
}
