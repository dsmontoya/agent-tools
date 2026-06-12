#!/usr/bin/env tsx
// check-readonly.ts
//
// Matches a PRD path against `.prd.yaml`'s `read_only:` patterns
// (SKILL_DESIGN.md §13.2).
//
// Matching rules:
//   - Patterns are resolved relative to the corpus root.
//   - A pattern ending in "/" matches any path under that directory.
//   - A pattern without "/" matches that file or directory exactly.
//   - Patterns are normalized: leading "./" is stripped, multiple slashes
//     collapsed, trailing whitespace trimmed.
//
// Usage:
//   npx tsx check-readonly.ts <corpus-root> <prd-path> [pattern ...]
//
// <prd-path> may be absolute or relative to the corpus root. Patterns are
// the entries from `.prd.yaml`'s `read_only` list (call resolve-config.ts
// first to get them).
//
// Output:
//   {
//     prd_path: <absolute path>,
//     corpus_root: <absolute path>,
//     relative_path: <corpus-relative POSIX path>,
//     read_only: boolean,
//     matched_pattern: string | null,
//   }
//
// Errors:
//   path_outside_root  — prd-path resolves outside the corpus root

import { resolve, relative, sep, isAbsolute, posix } from "node:path";
import { emit, failWith } from "./lib/cli.ts";

export interface CheckReadonlyOptions {
  corpusRoot: string;
  prdPath: string;
  patterns: string[];
}

export interface CheckReadonlyResult {
  prd_path: string;
  corpus_root: string;
  relative_path: string;
  read_only: boolean;
  matched_pattern: string | null;
}

export function checkReadonly(opts: CheckReadonlyOptions): CheckReadonlyResult {
  const absRoot = resolve(opts.corpusRoot);
  const absPath = isAbsolute(opts.prdPath) ? opts.prdPath : resolve(absRoot, opts.prdPath);
  const rel = toPosix(relative(absRoot, absPath));
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw Object.assign(
      new Error(`Path resolves outside corpus root: ${opts.prdPath}`),
      { code: "path_outside_root" },
    );
  }

  for (const raw of opts.patterns) {
    const pattern = normalizePattern(raw);
    if (!pattern) continue;
    if (matches(pattern, rel)) {
      return {
        prd_path: absPath,
        corpus_root: absRoot,
        relative_path: rel,
        read_only: true,
        matched_pattern: raw,
      };
    }
  }

  return {
    prd_path: absPath,
    corpus_root: absRoot,
    relative_path: rel,
    read_only: false,
    matched_pattern: null,
  };
}

function normalizePattern(raw: string): string {
  return raw
    .trim()
    .replace(/^\.\//, "")
    .replace(/\/+/g, "/");
}

function matches(pattern: string, relPath: string): boolean {
  if (pattern.endsWith("/")) {
    return relPath === pattern.slice(0, -1) || relPath.startsWith(pattern);
  }
  if (relPath === pattern) return true;
  // A pattern naming a directory without a trailing slash should still match
  // descendants — common user shorthand. We only treat it as a directory
  // if the relative path has a deeper segment.
  return relPath.startsWith(`${pattern}/`);
}

function toPosix(p: string): string {
  return p.split(sep).join(posix.sep);
}

function main(argv: string[]): void {
  const [corpusRoot, prdPath, ...patterns] = argv.slice(2);
  if (!corpusRoot || !prdPath) {
    failWith("usage", "Usage: check-readonly.ts <corpus-root> <prd-path> [pattern ...]");
  }
  try {
    emit(checkReadonly({ corpusRoot, prdPath, patterns }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
