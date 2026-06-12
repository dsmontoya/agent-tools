#!/usr/bin/env tsx
// validate-template.ts
//
// Validates a template bundle against the minimum contract (SKILL_DESIGN.md
// §17.8). Hard requirements produce errors (template is rejected at load);
// soft recommendations produce warnings (template is usable but flagged).
//
// Hard requirements:
//   - bundle config.yaml exists and parses
//   - name + version present
//   - exactly one artifact with kind `prd` (storage: per_instance with roles)
//   - that artifact's roles map covers all four load-bearing concepts:
//     problem, users, success, capability
//   - every section referenced in roles exists in the template file
//   - every artifact's template file exists
//   - singleton artifacts have `path`; per_instance have `path_pattern`
//
// Soft recommendations (warnings only):
//   - soft_roles or matching sections for boundaries, constraints, risks
//
// Usage:
//   npx tsx validate-template.ts <bundle-dir>
//
// Output: TemplateValidation (see lib/types.ts).

import { resolve, join, basename } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, fileExists, readTextFile } from "./lib/fs.ts";
import { loadBundleConfig } from "./lib/bundle.ts";
import type {
  ArtifactDecl,
  PerInstanceArtifact,
  RoleMap,
  TemplateValidation,
  ValidationFinding,
} from "./lib/types.ts";

const REQUIRED_ROLES: Array<keyof RoleMap> = ["problem", "users", "success", "capability"];

const SOFT_ROLES = ["constraints", "risks", "boundaries"];

const HEADING_LINE = /^#{1,6}\s+(.+?)\s*$/;

export interface ValidateOptions {
  bundleDir: string;
}

export function validateTemplate(opts: ValidateOptions): TemplateValidation {
  const bundleDir = opts.bundleDir;
  const scope = inferScope(bundleDir);
  const errors: ValidationFinding[] = [];
  const warnings: ValidationFinding[] = [];

  if (!dirExists(bundleDir)) {
    return {
      bundle: bundleDir,
      scope,
      version: "",
      valid: false,
      errors: [{ code: "missing_bundle_dir", message: `Bundle directory does not exist: ${bundleDir}` }],
      warnings: [],
    };
  }

  const load = loadBundleConfig(bundleDir);
  if (!load.config) {
    return {
      bundle: bundleDir,
      scope,
      version: "",
      valid: false,
      errors: [
        {
          code: load.parse_error?.includes("not found") ? "missing_config" : "malformed_config",
          message: load.parse_error ?? "config.yaml could not be loaded",
        },
      ],
      warnings: [],
    };
  }

  const cfg = load.config;

  if (!cfg.name || typeof cfg.name !== "string") {
    errors.push({ code: "missing_name", message: "config.yaml must declare a string `name`." });
  }
  if (!cfg.version || typeof cfg.version !== "string") {
    errors.push({ code: "missing_version", message: "config.yaml must declare a string `version`." });
  }
  if (!cfg.artifacts || typeof cfg.artifacts !== "object") {
    errors.push({
      code: "missing_artifacts",
      message: "config.yaml must declare an `artifacts` mapping.",
    });
    return finalize(bundleDir, scope, cfg.version ?? "", errors, warnings);
  }

  const prdArtifacts = Object.entries(cfg.artifacts).filter(
    ([, decl]) => isPerInstance(decl) && Boolean(decl.roles),
  );

  if (prdArtifacts.length === 0) {
    errors.push({
      code: "no_prd_artifact",
      message:
        "Bundle must declare exactly one per_instance artifact with a `roles:` map (the PRD artifact).",
    });
  } else if (prdArtifacts.length > 1) {
    errors.push({
      code: "multiple_prd_artifacts",
      message: `Bundle declares ${prdArtifacts.length} per_instance artifacts with roles: ${prdArtifacts
        .map(([k]) => k)
        .join(", ")}. Exactly one is allowed.`,
    });
  }

  for (const [artifactId, decl] of Object.entries(cfg.artifacts)) {
    validateArtifact(artifactId, decl, bundleDir, errors);
  }

  if (prdArtifacts.length === 1) {
    const [artifactId, decl] = prdArtifacts[0]!;
    const perInstance = decl as PerInstanceArtifact;
    validateRoles(artifactId, perInstance, bundleDir, errors, warnings);
  }

  return finalize(bundleDir, scope, cfg.version ?? "", errors, warnings);
}

function validateArtifact(
  artifactId: string,
  decl: ArtifactDecl,
  bundleDir: string,
  errors: ValidationFinding[],
): void {
  if (!decl.template) {
    errors.push({
      code: "artifact_missing_template",
      message: `Artifact "${artifactId}" has no template field.`,
      artifact: artifactId,
    });
    return;
  }
  const templatePath = join(bundleDir, decl.template);
  if (!fileExists(templatePath)) {
    errors.push({
      code: "artifact_template_missing",
      message: `Artifact "${artifactId}" references template "${decl.template}" which does not exist in the bundle.`,
      artifact: artifactId,
    });
  }

  if (decl.storage === "singleton") {
    if (!("path" in decl) || !decl.path) {
      errors.push({
        code: "singleton_missing_path",
        message: `Singleton artifact "${artifactId}" must declare a "path".`,
        artifact: artifactId,
      });
    }
  } else if (decl.storage === "per_instance") {
    if (!("path_pattern" in decl) || !decl.path_pattern) {
      errors.push({
        code: "per_instance_missing_path_pattern",
        message: `Per-instance artifact "${artifactId}" must declare a "path_pattern".`,
        artifact: artifactId,
      });
    } else if (!decl.path_pattern.includes("{slug}")) {
      errors.push({
        code: "per_instance_path_pattern_no_slug",
        message: `Per-instance artifact "${artifactId}" path_pattern must contain "{slug}".`,
        artifact: artifactId,
      });
    }
  } else {
    errors.push({
      code: "unknown_storage_shape",
      message: `Artifact "${artifactId}" has unknown storage shape "${
        (decl as { storage?: string }).storage ?? "<none>"
      }". Expected "singleton" or "per_instance".`,
      artifact: artifactId,
    });
  }
}

function validateRoles(
  artifactId: string,
  decl: PerInstanceArtifact,
  bundleDir: string,
  errors: ValidationFinding[],
  warnings: ValidationFinding[],
): void {
  const roles: Partial<Record<keyof RoleMap, string>> = decl.roles ?? {};
  const headings = decl.template ? extractHeadings(join(bundleDir, decl.template)) : new Set<string>();

  for (const role of REQUIRED_ROLES) {
    const section = roles[role];
    if (!section) {
      errors.push({
        code: "missing_role",
        message: `Required role "${role}" is missing from artifact "${artifactId}".roles.`,
        artifact: artifactId,
        role,
      });
      continue;
    }
    if (headings.size > 0 && !sectionPresent(section, headings)) {
      errors.push({
        code: "role_section_missing",
        message: `Role "${role}" points to section "${section}", which is not a heading in the template.`,
        artifact: artifactId,
        role,
        section,
      });
    }
  }

  const softRoles = decl.soft_roles ?? {};
  for (const role of SOFT_ROLES) {
    const section = softRoles[role];
    if (!section) {
      warnings.push({
        code: "missing_soft_role",
        message: `Soft role "${role}" is not declared in artifact "${artifactId}".soft_roles. Templates without ${role} produce thinner PRDs in practice.`,
        artifact: artifactId,
        role,
      });
      continue;
    }
    if (headings.size > 0 && !sectionPresent(section, headings)) {
      warnings.push({
        code: "soft_role_section_missing",
        message: `Soft role "${role}" points to section "${section}", which is not a heading in the template.`,
        artifact: artifactId,
        role,
        section,
      });
    }
  }
}

function extractHeadings(templatePath: string): Set<string> {
  if (!fileExists(templatePath)) return new Set();
  const headings = new Set<string>();
  for (const line of readTextFile(templatePath).split(/\r?\n/)) {
    const m = HEADING_LINE.exec(line);
    if (m) headings.add(m[1]!.trim());
  }
  return headings;
}

function sectionPresent(section: string, headings: Set<string>): boolean {
  if (headings.has(section)) return true;
  // Permit case-insensitive trailing-punctuation differences.
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const target = norm(section);
  for (const h of headings) {
    if (norm(h) === target) return true;
  }
  return false;
}

function isPerInstance(decl: ArtifactDecl): decl is PerInstanceArtifact {
  return decl.storage === "per_instance";
}

function inferScope(bundleDir: string): "builtin" | "custom" {
  return bundleDir.includes(`${"/"}custom${"/"}`) ? "custom" : "builtin";
}

function finalize(
  bundleDir: string,
  scope: "builtin" | "custom",
  version: string,
  errors: ValidationFinding[],
  warnings: ValidationFinding[],
): TemplateValidation {
  return {
    bundle: basename(bundleDir),
    scope,
    version,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function main(argv: string[]): void {
  const input = argv[2];
  if (!input) failWith("usage", "Usage: validate-template.ts <bundle-dir>");
  try {
    emit(validateTemplate({ bundleDir: resolve(input) }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
