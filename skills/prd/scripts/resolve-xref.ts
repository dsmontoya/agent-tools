#!/usr/bin/env tsx
// resolve-xref.ts
//
// Resolves inline markdown links in a source file. For each link with a
// relative target (not http(s):// or mailto:), reports:
//   - whether the target file exists,
//   - whether the anchor (the part after `#`) matches a heading in the
//     target file,
//   - overall ok status.
//
// External links (http, https, mailto) are reported with `external: true`
// and not checked — that's a network concern, not a corpus concern.
//
// Same-file anchors (`#some-section`) are resolved against the source file.
//
// Usage:
//   npx tsx resolve-xref.ts <source-file>
//
// Errors:
//   missing_source — source file does not exist

import { resolve, dirname, isAbsolute, join } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { fileExists, readTextFile } from "./lib/fs.ts";
import { extractInlineLinks, extractHeadings } from "./lib/markdown.ts";

export interface XrefEntry {
  text: string;
  url: string;
  line: number;
  column: number;
  external: boolean;
  target_path: string | null;
  anchor: string | null;
  file_exists: boolean;
  anchor_exists: boolean;
  ok: boolean;
}

export interface ResolveXrefOptions {
  source: string;
}

export interface ResolveXrefResult {
  source: string;
  references: XrefEntry[];
}

export function resolveXref(opts: ResolveXrefOptions): ResolveXrefResult {
  const sourcePath = resolve(opts.source);
  if (!fileExists(sourcePath)) {
    throw Object.assign(new Error(`Source file does not exist: ${sourcePath}`), {
      code: "missing_source",
    });
  }
  const sourceContent = readTextFile(sourcePath);
  const sourceHeadings = extractHeadings(sourceContent);
  const sourceDir = dirname(sourcePath);
  const headingCache = new Map<string, Set<string>>();
  headingCache.set(sourcePath, new Set(sourceHeadings.map((h) => h.slug)));

  const references: XrefEntry[] = [];
  for (const link of extractInlineLinks(sourceContent)) {
    references.push(resolveOne(link, sourcePath, sourceDir, headingCache));
  }
  return { source: sourcePath, references };
}

function resolveOne(
  link: ReturnType<typeof extractInlineLinks>[number],
  sourcePath: string,
  sourceDir: string,
  headingCache: Map<string, Set<string>>,
): XrefEntry {
  const url = link.url;

  if (/^([a-z][a-z0-9+.-]*):/i.test(url) || url.startsWith("//")) {
    return baseEntry(link, { external: true, ok: true });
  }

  const [pathPart, anchorPart] = splitAnchor(url);
  const anchor = anchorPart ? anchorPart : null;

  if (!pathPart) {
    // Same-file anchor: #section
    if (!anchor) {
      return baseEntry(link, { file_exists: true, ok: false });
    }
    const ok = headingCache.get(sourcePath)!.has(anchor);
    return baseEntry(link, {
      target_path: sourcePath,
      anchor,
      file_exists: true,
      anchor_exists: ok,
      ok,
    });
  }

  const targetPath = isAbsolute(pathPart) ? pathPart : join(sourceDir, pathPart);
  const fileExistsFlag = fileExists(targetPath);

  if (!fileExistsFlag) {
    return baseEntry(link, {
      target_path: targetPath,
      anchor,
      file_exists: false,
      ok: false,
    });
  }

  if (!anchor) {
    return baseEntry(link, {
      target_path: targetPath,
      anchor: null,
      file_exists: true,
      anchor_exists: false,
      ok: true,
    });
  }

  if (!headingCache.has(targetPath)) {
    const headings = extractHeadings(readTextFile(targetPath));
    headingCache.set(targetPath, new Set(headings.map((h) => h.slug)));
  }
  const anchorOk = headingCache.get(targetPath)!.has(anchor);
  return baseEntry(link, {
    target_path: targetPath,
    anchor,
    file_exists: true,
    anchor_exists: anchorOk,
    ok: anchorOk,
  });
}

function splitAnchor(url: string): [string, string | null] {
  const hashIdx = url.indexOf("#");
  if (hashIdx < 0) return [url, null];
  return [url.slice(0, hashIdx), decodeURIComponent(url.slice(hashIdx + 1)) || null];
}

function baseEntry(
  link: ReturnType<typeof extractInlineLinks>[number],
  overrides: Partial<XrefEntry>,
): XrefEntry {
  return {
    text: link.text,
    url: link.url,
    line: link.line,
    column: link.column,
    external: false,
    target_path: null,
    anchor: null,
    file_exists: false,
    anchor_exists: false,
    ok: false,
    ...overrides,
  };
}

function main(argv: string[]): void {
  const input = argv[2];
  if (!input) failWith("usage", "Usage: resolve-xref.ts <source-file>");
  try {
    emit(resolveXref({ source: input }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
