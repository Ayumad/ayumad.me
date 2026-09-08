#!/usr/bin/env node

import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const forbiddenPublicArtifacts = ["public/journal.json", "dist/journal.json"];

export function findForbiddenPublicArtifacts(root = process.cwd()) {
  return forbiddenPublicArtifacts.filter((relativePath) => existsSync(join(root, relativePath)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = findForbiddenPublicArtifacts();
  if (violations.length > 0) {
    console.error(`Private session log artifacts found in the public boundary: ${violations.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Public boundary check passed: no private session log artifacts found.");
  }
}
