// Shared test helpers — temp-dir fixtures, file writers.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

export function makeTempRoot(prefix = "prd-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanupTempRoot(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

export function writeFixtureFile(root: string, relPath: string, content: string): string {
  const fullPath = join(root, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
  return fullPath;
}

export function writeFixtureDir(root: string, relPath: string): string {
  const fullPath = join(root, relPath);
  mkdirSync(fullPath, { recursive: true });
  return fullPath;
}
