// search:test — sanity-check the /ai semantic search end-to-end in Node
// (simulates the browser: same search-index.json, same model, same cosine math)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, env } from "@huggingface/transformers";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
env.cacheDir = path.join(root, ".hf-cache");

function decodeVec(b64) {
  const bin = Buffer.from(b64, "base64");
  return new Float32Array(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength));
}
const cosine = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; };

const index = JSON.parse(fs.readFileSync(path.join(root, "public/ai/search-index.json"), "utf8"));
const extractor = await pipeline("feature-extraction", index.model, { quantized: true, dtype: "q8" });
const embed = async (text) => {
  const o = await extractor(text.slice(0, 800), { pooling: "mean", normalize: true });
  return new Float32Array(o.data);
};

const queries = [
  "how do I keep context when working on a big project",
  "memory and skills for agents",
  "making agents follow instructions safely",
  "tool use protocols and MCP",
  "what is retrieval augmented generation",
  "eval my agent's reliability before shipping",
];
for (const q of queries) {
  const qv = await embed(q);
  const ranked = index.notes
    .map((n) => ({ title: n.title, s: cosine(qv, decodeVec(n.vec)) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  console.log(`\nQ: ${q}`);
  ranked.forEach((r) => console.log(`   ${r.s.toFixed(3)}  ${r.title}`));
  const ft = index.folders
    .map((f) => ({ name: f.name, s: cosine(qv, decodeVec(f.vec)) }))
    .sort((a, b) => b.s - a.s)[0];
  if (ft && ft.s > 0.3) console.log(`   topic→ ${ft.s.toFixed(3)}  folder: ${ft.name}`);
}