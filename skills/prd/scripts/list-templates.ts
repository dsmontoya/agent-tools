#!/usr/bin/env tsx
// list-templates.ts
//
// Lists available template bundles by scanning one or more `templates/`
// roots. Each root is expected to have two sibling folders:
//   builtin/<name>/v<major>/config.yaml
//   custom/<name>/config.yaml
//
// Usage:
//   npx tsx list-templates.ts <templates-root> [<templates-root> ...]
//
// Multiple roots are scanned in order; later roots win on collision
// (project-local overrides user-global). The collision key is the tuple
// (scope, name, version).
//
// Output: ok with { sources: string[], templates: TemplateEntry[] }.
// A template that fails to load is still listed, with `loaded: false`
// and `parse_error: <reason>`.

import { resolve, join } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, listDirs } from "./lib/fs.ts";
import { loadBundleConfig } from "./lib/bundle.ts";

export interface TemplateEntry {
  scope: "builtin" | "custom";
  name: string;
  version: string | null;
  ref: string;
  bundle_dir: string;
  source: string;
  loaded: boolean;
  parse_error: string | null;
  artifacts: string[];
}

export interface ListTemplatesOptions {
  sources: string[];
}

export interface ListTemplatesResult {
  sources: string[];
  templates: TemplateEntry[];
}

export function listTemplates(opts: ListTemplatesOptions): ListTemplatesResult {
  if (opts.sources.length === 0) {
    throw Object.assign(new Error("At least one templates root must be supplied."), {
      code: "usage",
    });
  }

  const collected = new Map<string, TemplateEntry>();
  for (const sourceRoot of opts.sources) {
    if (!dirExists(sourceRoot)) continue;
    for (const entry of scanBuiltin(sourceRoot)) {
      collected.set(keyOf(entry), entry);
    }
    for (const entry of scanCustom(sourceRoot)) {
      collected.set(keyOf(entry), entry);
    }
  }

  const templates = [...collected.values()].sort((a, b) => {
    if (a.scope !== b.scope) return a.scope === "builtin" ? -1 : 1;
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (b.version ?? "").localeCompare(a.version ?? "");
  });

  return { sources: opts.sources, templates };
}

function scanBuiltin(sourceRoot: string): TemplateEntry[] {
  const out: TemplateEntry[] = [];
  const builtinRoot = join(sourceRoot, "builtin");
  if (!dirExists(builtinRoot)) return out;
  for (const name of listDirs(builtinRoot)) {
    const nameDir = join(builtinRoot, name);
    for (const versionDir of listDirs(nameDir)) {
      const version = parseVersionFolder(versionDir);
      if (version === null) continue;
      const bundleDir = join(nameDir, versionDir);
      out.push(buildEntry("builtin", name, version, bundleDir, sourceRoot));
    }
  }
  return out;
}

function scanCustom(sourceRoot: string): TemplateEntry[] {
  const out: TemplateEntry[] = [];
  const customRoot = join(sourceRoot, "custom");
  if (!dirExists(customRoot)) return out;
  for (const name of listDirs(customRoot)) {
    const bundleDir = join(customRoot, name);
    out.push(buildEntry("custom", name, null, bundleDir, sourceRoot));
  }
  return out;
}

function buildEntry(
  scope: "builtin" | "custom",
  name: string,
  version: string | null,
  bundleDir: string,
  source: string,
): TemplateEntry {
  const load = loadBundleConfig(bundleDir);
  const artifacts = load.config ? Object.keys(load.config.artifacts ?? {}) : [];
  return {
    scope,
    name,
    version,
    ref: scope === "builtin" && version ? `${scope}/${name}@${version}` : `${scope}/${name}`,
    bundle_dir: bundleDir,
    source,
    loaded: load.config !== null,
    parse_error: load.parse_error,
    artifacts,
  };
}

function parseVersionFolder(name: string): string | null {
  const m = /^v(\d+(?:\.\d+){0,2})$/.exec(name);
  return m ? m[1]! : null;
}

function keyOf(e: TemplateEntry): string {
  return `${e.scope}/${e.name}@${e.version ?? "none"}`;
}

function main(argv: string[]): void {
  const sources = argv.slice(2).map((s) => resolve(s));
  try {
    emit(listTemplates({ sources }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
