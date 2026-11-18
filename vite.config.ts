import { readFile } from "node:fs/promises";
import { marked } from "marked";
import { enhanceArticle } from "./src/articleReading.ts";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "site-articles",
      enforce: "pre",
      async load(id) {
        const [file, query] = id.split("?");
        if (!file.endsWith(".md") || (query !== "metadata" && query !== "article")) return;
        this.addWatchFile(file);
        const source = await readFile(file, "utf8");
        const frontmatter = /^---\s*\n[\s\S]*?\n---[ \t]*\r?\n/.exec(source);
        if (!frontmatter) this.error("Missing article frontmatter in " + file);
        const payload = query === "metadata" ? frontmatter[0] : enhanceArticle(
          marked.parse(source.slice(frontmatter[0].length).trim(), { gfm: true, breaks: false, async: false }),
        );
        return "export default " + JSON.stringify(payload);
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    testTimeout: 15_000,
  },
});
