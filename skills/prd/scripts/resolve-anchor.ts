#!/usr/bin/env tsx
// resolve-anchor.ts
//
// Given a markdown file (typically intent.md) and an anchor slug, returns
// the body text under that heading. Used by:
//   - prd-apply  — to resolve Shape B transclude tasks deterministically
//   - prd-verify — to confirm Shape B anchors resolve (a missing anchor
//                  on an unchecked transclude task is a CRITICAL finding)
//
// Usage:
//   npx tsx resolve-anchor.ts <markdown-file> <anchor-slug>
//
// Output (success):
//   { ok: true, data: { source, slug, exists: true, heading_text, heading_level,
//                       body, start_line, end_line } }
//
// Output (anchor not found):
//   { ok: true, data: { source, slug, exists: false } }
//
// Errors:
//   missing_file — the markdown file does not exist

import { resolve } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { fileExists, readTextFile } from "./lib/fs.ts";
import { extractSectionBody } from "./lib/markdown.ts";

export interface ResolveAnchorOptions {
  source: string;
  slug: string;
}

export type ResolveAnchorResult =
  | {
      source: string;
      slug: string;
      exists: true;
      heading_text: string;
      heading_level: number;
      body: string;
      start_line: number;
      end_line: number;
    }
  | { source: string; slug: string; exists: false };

export function resolveAnchor(opts: ResolveAnchorOptions): ResolveAnchorResult {
  const { source, slug } = opts;
  if (!fileExists(source)) {
    throw Object.assign(new Error(`File does not exist: ${source}`), {
      code: "missing_file",
    });
  }
  const content = readTextFile(source);
  const section = extractSectionBody(content, slug);
  if (!section) {
    return { source, slug, exists: false };
  }
  return {
    source,
    slug,
    exists: true,
    heading_text: section.heading.text,
    heading_level: section.heading.level,
    body: section.body,
    start_line: section.startLine,
    end_line: section.endLine,
  };
}

function main(argv: string[]): void {
  const [, , sourceArg, slugArg] = argv;
  if (!sourceArg || !slugArg) {
    failWith("usage", "Usage: resolve-anchor.ts <markdown-file> <anchor-slug>");
  }
  try {
    emit(resolveAnchor({ source: resolve(sourceArg), slug: slugArg }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
