// Filesystem helpers shared across scripts.

import { existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

export function readTextFile(path: string): string {
  return readFileSync(path, "utf8");
}

export function fileExists(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

export function dirExists(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export function listDirs(path: string): string[] {
  if (!dirExists(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function listFiles(path: string): string[] {
  if (!dirExists(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

export function lastMtimeIso(path: string): string {
  // Returns the latest mtime across the directory tree (or single file)
  // as ISO YYYY-MM-DD. Used for the "last touched" field in proposal summaries.
  let latest = 0;
  const visit = (p: string) => {
    if (!existsSync(p)) return;
    const stat = statSync(p);
    if (stat.mtimeMs > latest) latest = stat.mtimeMs;
    if (stat.isDirectory()) {
      for (const entry of readdirSync(p)) visit(join(p, entry));
    }
  };
  visit(path);
  if (latest === 0) return "";
  return new Date(latest).toISOString().slice(0, 10);
}

export function nameOf(path: string): string {
  return basename(path);
}
