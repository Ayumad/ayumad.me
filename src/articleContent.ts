import { use } from "react";
import type { ArticleHeading } from "./articleReading";

interface ArticleBody {
  html: string;
  headings: ArticleHeading[];
  minutes: number;
}

const files = import.meta.glob<ArticleBody>(["./content/journal/*.md", "./content/projects/*.md"], {
  import: "default",
  query: "?article",
});
const pending = new Map<string, Promise<ArticleBody>>();

export function useArticleBody(type: "journal" | "projects", slug: string) {
  const file = "./content/" + type + "/" + slug + ".md";
  let promise = pending.get(file);
  if (!promise) {
    const load = files[file];
    if (!load) throw new Error("Article body could not be found.");
    promise = load();
    pending.set(file, promise);
  }
  return use(promise);
}
