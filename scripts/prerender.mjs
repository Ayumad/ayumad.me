import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createServer } from "vite";
import { curriculumAccessibilityCss, formatCurriculumPage } from "./curriculum-html.mjs";

if (await access("public/dashboard.json").then(() => true, () => false)) {
  throw new Error("The raw dashboard snapshot must stay outside public/.");
}

const vite = await createServer({ appType: "custom", server: { middlewareMode: true, watch: null, hmr: false } });
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

try {
  const { renderPage, renderableRoutes, indexableRoutes, routeMeta, siteOrigin, socialImage } = await vite.ssrLoadModule("/src/prerender.tsx");
  const template = await readFile("dist/index.html", "utf8");

  async function writePage(path, file) {
    const { title, description, found } = routeMeta(path);
    const canonical = siteOrigin + path;
    const head = [
      "<title>" + escape(title) + "</title>",
      '<meta name="description" content="' + escape(description) + '">',
      found ? '<link rel="canonical" href="' + escape(canonical) + '">' : '<meta name="robots" content="noindex">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="Ayumad.me">',
      '<meta property="og:title" content="' + escape(title) + '">',
      '<meta property="og:description" content="' + escape(description) + '">',
      '<meta property="og:url" content="' + escape(canonical) + '">',
      '<meta property="og:image" content="' + escape(socialImage) + '">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:alt" content="Ayumad.me ASCII oscilloscope and site introduction">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + escape(title) + '">',
      '<meta name="twitter:description" content="' + escape(description) + '">',
      '<meta name="twitter:image" content="' + escape(socialImage) + '">',
    ].join("\n    ");
    const markup = await renderPage(path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, template
      .replace(/<!-- route-meta:start -->[\s\S]*?<!-- route-meta:end -->/, () => head)
      .replace('<div id="root"></div>', () => '<div id="root" data-prerendered="' + escape(path) + '">' + markup + "</div>"));
  }

  for (const path of new Set(renderableRoutes)) {
    await writePage(path, path === "/" ? "dist/index.html" : "dist" + path + ".html");
  }
  await writePage("/404", "dist/404.html");

  const aiFiles = (await readdir("dist/ai")).filter((file) => file.endsWith(".html") && file !== "index.html");
  for (const file of ["index.html", ...aiFiles]) {
    const path = file === "index.html" ? "/ai" : "/ai/" + file.slice(0, -5);
    const html = await readFile("dist/ai/" + file, "utf8");
    if (!html.includes('class="table-scroll"')) {
      await writeFile("dist/ai/" + file, formatCurriculumPage(html, siteOrigin + path));
    }
  }
  const css = await readFile("dist/ai/ai.css", "utf8");
  if (!css.includes(".table-scroll {")) await writeFile("dist/ai/ai.css", css + curriculumAccessibilityCss);

  const publicPaths = [
    ...indexableRoutes, "/privacy", "/terms", "/ai",
    ...aiFiles.map((file) => "/ai/" + file.slice(0, -5)),
  ];
  await writeFile("dist/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [...new Set(publicPaths)].map((path) => "  <url><loc>" + escape(siteOrigin + path) + "</loc></url>").join("\n")
    + "\n</urlset>\n");
  console.log("Prerendered " + new Set(renderableRoutes).size + " site routes and generated the sitemap.");
} finally {
  await vite.close();
}
