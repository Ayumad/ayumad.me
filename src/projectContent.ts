export type ProjectStage = "deployed" | "in-progress" | "planned";

export interface ProjectArticle {
  slug: string;
  title: string;
  summary: string;
  stage: ProjectStage;
  statusNote: string;
  year: string;
  stack: string[];
  order: number;
  featured?: boolean;
  liveUrl?: string;
  liveLabel?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  body: string;
}

const sources = import.meta.glob("./content/projects/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function cleanValue(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseFrontmatter(source: string, fileName: string): ProjectArticle {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) throw new Error(`Project file ${fileName} is missing frontmatter`);

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    fields[key] = cleanValue(line.slice(separator + 1));
  }

  const required = ["title", "slug", "summary", "stage", "status_note", "year", "stack", "order"];
  for (const key of required) {
    if (!fields[key]) throw new Error(`Project file ${fileName} is missing ${key}`);
  }
  if (!["deployed", "in-progress", "planned"].includes(fields.stage)) {
    throw new Error(`Project file ${fileName} has an invalid stage`);
  }
  const order = Number(fields.order);
  if (!Number.isInteger(order) || order < 1) throw new Error(`Project file ${fileName} has an invalid order`);

  return {
    title: fields.title,
    slug: fields.slug,
    summary: fields.summary,
    stage: fields.stage as ProjectStage,
    statusNote: fields.status_note,
    year: fields.year,
    stack: fields.stack.split(",").map((item) => item.trim()).filter(Boolean),
    order,
    featured: fields.featured === "true",
    liveUrl: fields.live_url,
    liveLabel: fields.live_label,
    sourceUrl: fields.source_url,
    sourceLabel: fields.source_label,
    body: match[2].trim(),
  };
}

const parsedArticles = Object.entries(sources).map(([fileName, source]) => parseFrontmatter(source, fileName));
const duplicateSlugs = parsedArticles.map((article) => article.slug).filter((slug, index, all) => all.indexOf(slug) !== index);
if (duplicateSlugs.length > 0) throw new Error(`Duplicate project slug: ${duplicateSlugs[0]}`);

export const projectArticles = parsedArticles.sort((a, b) => {
  const stageOrder: Record<ProjectStage, number> = { deployed: 0, "in-progress": 1, planned: 2 };
  return stageOrder[a.stage] - stageOrder[b.stage] || a.order - b.order;
});

export function findProjectArticle(slug: string) {
  return projectArticles.find((article) => article.slug === slug);
}

export function projectsByStage(stage: ProjectStage) {
  return projectArticles.filter((article) => article.stage === stage);
}
