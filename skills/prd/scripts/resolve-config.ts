#!/usr/bin/env tsx
// resolve-config.ts
//
// Reads `.prd.yaml` from the given repo root and returns the resolved config:
// corpus root, template ref, and read-only patterns.
//
// Usage:
//   npx tsx resolve-config.ts [repo-root]
//
// repo-root defaults to the current working directory.
//
// Behavior:
//   - If .prd.yaml exists and parses → ok, with the parsed values
//     filled in for any missing fields by the defaults below.
//   - If .prd.yaml is absent → ok, with all defaults; `defaulted: true`.
//   - If .prd.yaml exists but is malformed YAML → err code `config_malformed`.
//   - If .prd.yaml exists but the template ref is invalid → err code
//     `template_ref_invalid`.
//
// Output: see ScriptResult<ResolvedConfig> in lib/types.ts.

import { join, resolve } from "node:path";
import yaml from "js-yaml";
import { emit, failWith } from "./lib/cli.ts";
import { fileExists, readTextFile } from "./lib/fs.ts";
import { parseTemplateRef, DEFAULT_TEMPLATE } from "./lib/template-ref.ts";
import type { PrdConfigRaw, ResolvedConfig } from "./lib/types.ts";

export const DEFAULT_ROOT = "docs/prds";

export interface ResolveOptions {
  repoRoot: string;
}

export function resolveConfig(opts: ResolveOptions): ResolvedConfig {
  const configPath = join(opts.repoRoot, ".prd.yaml");
  const present = fileExists(configPath);

  if (!present) {
    return {
      root: DEFAULT_ROOT,
      template: parseTemplateRef(DEFAULT_TEMPLATE),
      read_only: [],
      defaulted: true,
      config_path: configPath,
      config_present: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(readTextFile(configPath));
  } catch (e) {
    throw Object.assign(new Error(`Failed to parse ${configPath}: ${(e as Error).message}`), {
      code: "config_malformed",
    });
  }

  if (parsed === null || parsed === undefined) {
    return {
      root: DEFAULT_ROOT,
      template: parseTemplateRef(DEFAULT_TEMPLATE),
      read_only: [],
      defaulted: true,
      config_path: configPath,
      config_present: true,
    };
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw Object.assign(new Error(`${configPath} must be a YAML mapping at the top level.`), {
      code: "config_malformed",
    });
  }

  const raw = parsed as PrdConfigRaw;
  validateShape(raw, configPath);

  const root = raw.root?.trim() || DEFAULT_ROOT;
  const templateInput = raw.template?.trim() || DEFAULT_TEMPLATE;
  let template;
  try {
    template = parseTemplateRef(templateInput);
  } catch (e) {
    throw Object.assign(new Error((e as Error).message), { code: "template_ref_invalid" });
  }

  return {
    root,
    template,
    read_only: (raw.read_only ?? []).map((p) => p.trim()).filter(Boolean),
    defaulted: false,
    config_path: configPath,
    config_present: true,
  };
}

function validateShape(raw: PrdConfigRaw, path: string): void {
  if (raw.root !== undefined && typeof raw.root !== "string") {
    throw Object.assign(new Error(`${path}: "root" must be a string.`), {
      code: "config_malformed",
    });
  }
  if (raw.template !== undefined && typeof raw.template !== "string") {
    throw Object.assign(new Error(`${path}: "template" must be a string.`), {
      code: "config_malformed",
    });
  }
  if (raw.read_only !== undefined) {
    if (!Array.isArray(raw.read_only)) {
      throw Object.assign(new Error(`${path}: "read_only" must be a list of strings.`), {
        code: "config_malformed",
      });
    }
    for (const entry of raw.read_only) {
      if (typeof entry !== "string") {
        throw Object.assign(
          new Error(`${path}: every "read_only" entry must be a string.`),
          { code: "config_malformed" },
        );
      }
    }
  }
}

function main(argv: string[]): void {
  const repoRoot = resolve(argv[2] ?? process.cwd());
  try {
    emit(resolveConfig({ repoRoot }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

// Only execute when invoked directly (not when imported by tests).
const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
