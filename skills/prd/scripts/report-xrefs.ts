#!/usr/bin/env tsx
// report-xrefs.ts
//
// Corpus-level cross-reference report. Composes list-corpus + resolve-xref
// so callers don't have to loop and re-parse JSON.
//
// For each present corpus file, resolves inline links and aggregates the
// broken ones (skipping external links, which resolve-xref intentionally
// does not check). Absent singleton artifacts are surfaced in
// `files_missing` — they are declared by the bundle but not on disk.
//
// Usage:
//   npx tsx report-xrefs.ts <corpus-root> <bundle-dir>
//
// Errors:
//   missing_root   — corpus-root does not exist  (propagated from list-corpus)
//   bundle_invalid — bundle config could not be loaded  (propagated from list-corpus)

import { resolve, relative } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { listCorpus } from "./list-corpus.ts";
import { resolveXref, type XrefEntry } from "./resolve-xref.ts";

export interface ReportXrefsOptions {
  corpusRoot: string;
  bundleDir: string;
}

export interface BrokenRef {
  source: string;
  line: number;
  column: number;
  text: string;
  url: string;
  reason: "file_missing" | "anchor_missing";
}

export interface PerFileCount {
  path: string;
  refs: number;
  broken: number;
}

export interface ReportXrefsResult {
  root: string;
  bundle: string;
  files_scanned: number;
  files_missing: string[];
  total_refs: number;
  total_broken: number;
  per_file: PerFileCount[];
  broken: BrokenRef[];
}

export function reportXrefs(opts: ReportXrefsOptions): ReportXrefsResult {
  const corpus = listCorpus({
    corpusRoot: opts.corpusRoot,
    bundleDir: opts.bundleDir,
  });

  const filesMissing: string[] = [];
  const perFile: PerFileCount[] = [];
  const broken: BrokenRef[] = [];
  let filesScanned = 0;
  let totalRefs = 0;

  for (const entry of corpus.entries) {
    const rel = relative(corpus.root, entry.path);
    if (!entry.present) {
      filesMissing.push(rel);
      continue;
    }
    filesScanned++;
    const { references } = resolveXref({ source: entry.path });
    const checkable = references.filter((r) => !r.external);
    totalRefs += checkable.length;
    const brokenHere = checkable.filter((r) => !r.ok);
    perFile.push({ path: rel, refs: checkable.length, broken: brokenHere.length });
    for (const ref of brokenHere) {
      broken.push({
        source: rel,
        line: ref.line,
        column: ref.column,
        text: ref.text,
        url: ref.url,
        reason: reasonOf(ref),
      });
    }
  }

  perFile.sort((a, b) => a.path.localeCompare(b.path));
  broken.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.line - b.line;
  });
  filesMissing.sort();

  return {
    root: corpus.root,
    bundle: corpus.bundle,
    files_scanned: filesScanned,
    files_missing: filesMissing,
    total_refs: totalRefs,
    total_broken: broken.length,
    per_file: perFile,
    broken,
  };
}

function reasonOf(ref: XrefEntry): "file_missing" | "anchor_missing" {
  return ref.file_exists ? "anchor_missing" : "file_missing";
}

function main(argv: string[]): void {
  const corpusRoot = argv[2];
  const bundleDir = argv[3];
  if (!corpusRoot || !bundleDir) {
    failWith("usage", "Usage: report-xrefs.ts <corpus-root> <bundle-dir>");
  }
  try {
    emit(
      reportXrefs({
        corpusRoot: resolve(corpusRoot),
        bundleDir: resolve(bundleDir),
      }),
    );
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
