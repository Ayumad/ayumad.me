import { gearCategories, findGearItem, gearSlug, pageMeta } from "./siteContent";
import { findJournalPost, journalPosts } from "./journalContent";
import { findProjectArticle, projectArticles } from "./projectContent";

export const siteOrigin = "https://ayumad.me";
export const socialImage = siteOrigin + "/og.png?v=2";

export const indexableRoutes = [
  ...Object.keys(pageMeta),
  ...projectArticles.map(({ slug }) => "/projects/" + slug),
  ...journalPosts.map(({ slug }) => "/journal/" + slug),
];

export const renderableRoutes = [
  ...indexableRoutes,
  ...gearCategories.flatMap(({ category, items }) => items.map(({ name }) => "/gear/" + gearSlug(category, name))),
];

export function routeMeta(rawPath: string) {
  const path = rawPath.replace(/\/+$/, "") || "/";
  const project = path.startsWith("/projects/") ? findProjectArticle(path.slice(10)) : undefined;
  const post = path.startsWith("/journal/") ? findJournalPost(path.slice(9)) : undefined;
  const gear = path.startsWith("/gear/") ? findGearItem(path.slice(6)) : undefined;
  const article = project ?? post;
  if (article) return { title: article.title + " — Ayumad.me", description: article.summary, path, found: true };
  if (gear) return { title: gear.item.name + " — Gear — Ayumad.me", description: gear.item.role ?? gear.item.note, path, found: true };
  if (Object.hasOwn(pageMeta, path)) return { ...pageMeta[path], path, found: true };
  return { title: "Page not found — Ayumad.me", description: "The requested page could not be found.", path, found: false };
}
