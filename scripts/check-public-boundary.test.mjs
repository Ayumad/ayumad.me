import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { findForbiddenPublicArtifacts } from "./check-public-boundary.mjs";

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("public boundary check", () => {
  it("accepts a build with no private session log artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "ayumad-public-boundary-"));
    temporaryRoots.push(root);

    expect(findForbiddenPublicArtifacts(root)).toEqual([]);
  });

  it("reports session logs in source or build output", () => {
    const root = mkdtempSync(join(tmpdir(), "ayumad-public-boundary-"));
    temporaryRoots.push(root);
    mkdirSync(join(root, "public"), { recursive: true });
    mkdirSync(join(root, "dist"), { recursive: true });
    writeFileSync(join(root, "public", "journal.json"), "[]");
    writeFileSync(join(root, "dist", "journal.json"), "[]");

    expect(findForbiddenPublicArtifacts(root)).toEqual(["public/journal.json", "dist/journal.json"]);
  });
});
