#!/usr/bin/env tsx
// list-corpus.ts
//
// Lists corpus artifacts under <root> per the active bundle's config.yaml.
//
//   Singleton artifacts → one entry; `present` reflects whether the file
//     exists at the declared path.
//   Per-instance artifacts → one entry per file matching `path_pattern`
//     under <root>, with slug extracted from the pattern.
//
// `<root>/changes/` is skipped — that's proposal scaffolding, not corpus.
//
// Usage:
//   npx tsx list-corpus.ts <corpus-root> <bundle-dir>
//
// Errors:
//   missing_root     — corpus-root does not exist
//   bundle_invalid   — bundle config could not be loaded

import { resolve, join, relative, sep, posix } from "node:path";
import { readdirSync, statSync } from "node:fs";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, fileExists, lastMtimeIso } from "./lib/fs.ts";
import { loadBundleConfig } from "./lib/bundle.ts";
import type {
  BundleConfig,
  CorpusEntry,
  PerInstanceArtifact,
  SingletonArtifact,
} from "./lib/types.ts";

export interface ListCorpusOptions {
  corpusRoot: string;
  bundleDir: string;
}

export interface ListCorpusResult {
  root: string;
  bundle: string;
  entries: CorpusEntry[];
}

export function listCorpus(opts: ListCorpusOptions): ListCorpusResult {
  if (!dirExists(opts.corpusRoot)) {
    throw Object.assign(new Error(`Corpus root does not exist: ${opts.corpusRoot}`), {
      code: "missing_root",
    });
  }
  const load = loadBundleConfig(opts.bundleDir);
  if (!load.config) {
    throw Object.assign(new Error(load.parse_error ?? "Bundle config could not be loaded."), {
      code: "bundle_invalid",
    });
  }

  const cfg: BundleConfig = load.config;
  const singletonEntries: CorpusEntry[] = [];
  const perInstanceArtifacts: Array<[string, PerInstanceArtifact]> = [];
  for (const [artifactId, decl] of Object.entries(cfg.artifacts ?? {})) {
    if (decl.storage === "singleton") {
      singletonEntries.push(singletonEntry(artifactId, decl, opts.corpusRoot));
    } else if (decl.storage === "per_instance") {
      perInstanceArtifacts.push([artifactId, decl]);
    }
  }

  const reservedPaths = new Set(singletonEntries.map((e) => e.path));
  const entries: CorpusEntry[] = [...singletonEntries];
  for (const [artifactId, decl] of perInstanceArtifacts) {
    for (const entry of perInstanceEntries(artifactId, decl, opts.corpusRoot)) {
      if (reservedPaths.has(entry.path)) continue;
      entries.push(entry);
    }
  }

  entries.sort((a, b) => {
    if (a.artifact_id !== b.artifact_id) return a.artifact_id.localeCompare(b.artifact_id);
    return (a.slug ?? "").localeCompare(b.slug ?? "");
  });

  return { root: opts.corpusRoot, bundle: opts.bundleDir, entries };
}

function singletonEntry(
  artifactId: string,
  decl: SingletonArtifact,
  corpusRoot: string,
): CorpusEntry {
  const fullPath = join(corpusRoot, decl.path);
  const present = fileExists(fullPath);
  return {
    artifact_id: artifactId,
    storage: "singleton",
    slug: null,
    path: fullPath,
    present,
    last_touched: present ? lastMtimeIso(fullPath) : "",
  };
}

function perInstanceEntries(
  artifactId: string,
  decl: PerInstanceArtifact,
  corpusRoot: string,
): CorpusEntry[] {
  const pattern = decl.path_pattern;
  if (!pattern.includes("{slug}")) return [];
  const matcher = buildSlugMatcher(pattern);
  const out: CorpusEntry[] = [];
  for (const relPath of walkMarkdown(corpusRoot)) {
    const slug = matcher(relPath);
    if (!slug) continue;
    const fullPath = join(corpusRoot, relPath);
    out.push({
      artifact_id: artifactId,
      storage: "per_instance",
      slug,
      path: fullPath,
      present: true,
      last_touched: lastMtimeIso(fullPath),
    });
  }
  return out;
}

function buildSlugMatcher(pattern: string): (relPath: string) => string | null {
  const escaped = pattern
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace("{slug}", "(?<slug>[^/]+)");
  const re = new RegExp(`^${escaped}$`);
  return (relPath) => {
    const m = re.exec(relPath);
    return m?.groups?.slug ?? null;
  };
}

function walkMarkdown(root: string, prefix = ""): string[] {
  const out: string[] = [];
  const dirPath = join(root, prefix);
  if (!dirExists(dirPath)) return out;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === "changes") continue; // proposal scaffolding lives here
    const rel = posix.join(prefix.split(sep).join("/"), entry.name);
    const abs = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(root, relative(root, abs)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(rel);
    }
  }
  return out;
}

// Re-export statSync so the dynamic-import flow above stays self-contained.
export { statSync };

function main(argv: string[]): void {
  const corpusRoot = argv[2];
  const bundleDir = argv[3];
  if (!corpusRoot || !bundleDir) {
    failWith("usage", "Usage: list-corpus.ts <corpus-root> <bundle-dir>");
  }
  try {
    emit(listCorpus({ corpusRoot: resolve(corpusRoot), bundleDir: resolve(bundleDir) }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
