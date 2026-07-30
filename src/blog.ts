export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingTime: string;
  content: string;
}

const rawPosts = import.meta.glob("./content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const requiredFields = ["slug", "title", "date", "summary", "tags", "readingTime"] as const;

function parsePost(source: string, filename: string): BlogPost {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Blog post ${filename} is missing frontmatter.`);

  const metadata = Object.fromEntries(
    match[1]
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator < 1) throw new Error(`Invalid frontmatter line in ${filename}: ${line}`);
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  for (const field of requiredFields) {
    if (!metadata[field]) throw new Error(`Blog post ${filename} is missing ${field}.`);
  }

  return {
    slug: metadata.slug,
    title: metadata.title,
    date: metadata.date,
    summary: metadata.summary,
    tags: metadata.tags.split("|").map((tag) => tag.trim()),
    readingTime: metadata.readingTime,
    content: match[2].trim(),
  };
}

export const blogPosts = Object.entries(rawPosts)
  .map(([filename, source]) => parsePost(source, filename))
  .sort((a, b) => b.date.localeCompare(a.date));

const slugs = new Set(blogPosts.map((post) => post.slug));
if (slugs.size !== blogPosts.length) throw new Error("Blog post slugs must be unique.");

export function findBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
