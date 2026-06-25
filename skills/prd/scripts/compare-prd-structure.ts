#!/usr/bin/env tsx
// compare-prd-structure.ts
//
// Pass-1 structural drift detection for prd-template-drift. Compares a
// PRD's section headings + skip-state declarations against the current
// template bundle's required/optional section set and emits structured
// findings.
//
// Required sections come from the PRD artifact's `roles:` map (load-bearing
// concepts: problem, users, success, capability). Soft-recommended sections
// come from `soft_roles:`. All other template headings (H2+) are treated as
// optional. The script does not interpret section content — that is pass 2
// (LLM-judged) in the prd-template-drift skill.
//
// Skip states (REFERENCE.md §6):
//   - section present with content       → OK
//   - section present but starts "N/A —" → na
//   - section present but starts "TODO —"→ todo
//   - section absent                     → missing
//
// Finding tiers:
//   CRITICAL    — required section missing
//   WARNING     — required section is N/A or TODO; soft section missing
//   SUGGESTION  — soft section is N/A or TODO; optional template section
//                 missing from PRD; PRD heading no longer in template
//
// Usage:
//   npx tsx compare-prd-structure.ts <prd-path> <bundle-dir>
//
// Output: CompareResult (see types below) wrapped in the standard
// ScriptResult envelope (lib/cli.ts).

import { resolve, join } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, fileExists, readTextFile } from "./lib/fs.ts";
import { loadBundleConfig } from "./lib/bundle.ts";
import type { PerInstanceArtifact } from "./lib/types.ts";

const HEADING_LINE = /^(#{2,6})\s+(.+?)\s*$/;
const SKIP_LINE = /^\s*(N\/A|TODO)\b\s*[—-]?/i;
const REQUIRED_ROLES = ["problem", "users", "success", "capability"] as const;

export type FindingTier = "critical" | "warning" | "suggestion";

export interface StructuralFinding {
  tier: FindingTier;
  code: string;
  message: string;
  section?: string;
  role?: string;
}

export interface CompareResult {
  prd: string;
  bundle: string;
  bundle_version: string;
  findings: StructuralFinding[];
}

export interface CompareOptions {
  prdPath: string;
  bundleDir: string;
}

interface SectionHeading {
  text: string;
  level: number;
  line: number;
  skip_state: "none" | "na" | "todo";
}

export function comparePrdStructure(opts: CompareOptions): CompareResult {
  const prdPath = opts.prdPath;
  const bundleDir = opts.bundleDir;

  if (!fileExists(prdPath)) {
    throw codedError("prd_not_found", `PRD file does not exist: ${prdPath}`);
  }
  if (!dirExists(bundleDir)) {
    throw codedError("bundle_not_found", `Bundle directory does not exist: ${bundleDir}`);
  }

  const load = loadBundleConfig(bundleDir);
  if (!load.config) {
    throw codedError("bundle_unloadable", load.parse_error ?? "Could not load bundle config.yaml");
  }
  const cfg = load.config;

  const prdArtifactEntry = Object.entries(cfg.artifacts).find(
    ([, decl]) => decl.storage === "per_instance" && Boolean((decl as PerInstanceArtifact).roles),
  );
  if (!prdArtifactEntry) {
    throw codedError(
      "no_prd_artifact",
      `Bundle ${cfg.name}@${cfg.version} has no per_instance artifact with a roles map.`,
    );
  }
  const [, decl] = prdArtifactEntry;
  const prdArtifact = decl as PerInstanceArtifact;

  const templatePath = join(bundleDir, prdArtifact.template);
  if (!fileExists(templatePath)) {
    throw codedError(
      "template_missing",
      `PRD artifact references template "${prdArtifact.template}" which does not exist in the bundle.`,
    );
  }

  const templateHeadings = extractHeadings(readTextFile(templatePath));
  const prdHeadings = extractHeadings(readTextFile(prdPath));

  const findings = diffStructure(prdArtifact, templateHeadings, prdHeadings);

  return {
    prd: prdPath,
    bundle: cfg.name,
    bundle_version: cfg.version,
    findings,
  };
}

function diffStructure(
  prdArtifact: PerInstanceArtifact,
  templateHeadings: SectionHeading[],
  prdHeadings: SectionHeading[],
): StructuralFinding[] {
  const findings: StructuralFinding[] = [];
  const prdBySection = indexByNormalizedText(prdHeadings);
  const templateBySection = indexByNormalizedText(templateHeadings);

  const roleSections = new Set<string>();
  const softRoleSections = new Set<string>();

  const roles = prdArtifact.roles ?? {};
  for (const role of REQUIRED_ROLES) {
    const section = roles[role];
    if (!section) continue;
    roleSections.add(normalize(section));
    const prdHit = prdBySection.get(normalize(section));
    if (!prdHit) {
      findings.push({
        tier: "critical",
        code: "required_section_missing",
        role,
        section,
        message: `Required section "${section}" (role: ${role}) is missing from the PRD.`,
      });
    } else if (prdHit.skip_state === "na" || prdHit.skip_state === "todo") {
      findings.push({
        tier: "warning",
        code: prdHit.skip_state === "na" ? "required_section_na" : "required_section_todo",
        role,
        section,
        message:
          `Required section "${section}" (role: ${role}) is marked ${prdHit.skip_state.toUpperCase()}; ` +
          `re-evaluate under the current template contract.`,
      });
    }
  }

  for (const [role, section] of Object.entries(prdArtifact.soft_roles ?? {})) {
    if (!section) continue;
    softRoleSections.add(normalize(section));
    const prdHit = prdBySection.get(normalize(section));
    if (!prdHit) {
      findings.push({
        tier: "warning",
        code: "soft_section_missing",
        role,
        section,
        message: `Soft-recommended section "${section}" (role: ${role}) is missing from the PRD.`,
      });
    } else if (prdHit.skip_state === "na" || prdHit.skip_state === "todo") {
      findings.push({
        tier: "suggestion",
        code: prdHit.skip_state === "na" ? "soft_section_na" : "soft_section_todo",
        role,
        section,
        message:
          `Soft-recommended section "${section}" (role: ${role}) is marked ${prdHit.skip_state.toUpperCase()}; ` +
          `consider re-evaluating under the current template.`,
      });
    }
  }

  for (const heading of templateHeadings) {
    const key = normalize(heading.text);
    if (roleSections.has(key) || softRoleSections.has(key)) continue;
    if (!prdBySection.has(key)) {
      findings.push({
        tier: "suggestion",
        code: "optional_section_missing",
        section: heading.text,
        message: `Optional template section "${heading.text}" is not present in the PRD.`,
      });
    }
  }

  for (const heading of prdHeadings) {
    const key = normalize(heading.text);
    if (!templateBySection.has(key)) {
      findings.push({
        tier: "suggestion",
        code: "prd_section_unknown_to_template",
        section: heading.text,
        message: `PRD section "${heading.text}" has no counterpart in the current template (template may have removed or renamed it).`,
      });
    }
  }

  return findings;
}

function extractHeadings(content: string): SectionHeading[] {
  const lines = content.split(/\r?\n/);
  const headings: SectionHeading[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_LINE.exec(lines[i]!);
    if (!m) continue;
    const level = m[1]!.length;
    const text = m[2]!.trim();
    const skip_state = detectSkipState(lines, i);
    headings.push({ text, level, line: i + 1, skip_state });
  }
  return headings;
}

function detectSkipState(lines: string[], headingIdx: number): "none" | "na" | "todo" {
  for (let j = headingIdx + 1; j < lines.length; j++) {
    const line = lines[j]!;
    if (line.trim() === "") continue;
    if (HEADING_LINE.test(line)) return "none";
    const m = SKIP_LINE.exec(line);
    if (!m) return "none";
    return m[1]!.toUpperCase() === "N/A" ? "na" : "todo";
  }
  return "none";
}

function indexByNormalizedText(headings: SectionHeading[]): Map<string, SectionHeading> {
  const map = new Map<string, SectionHeading>();
  for (const h of headings) {
    const key = normalize(h.text);
    if (!map.has(key)) map.set(key, h);
  }
  return map;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function codedError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

function main(argv: string[]): void {
  const prdInput = argv[2];
  const bundleInput = argv[3];
  if (!prdInput || !bundleInput) {
    failWith("usage", "Usage: compare-prd-structure.ts <prd-path> <bundle-dir>");
  }
  try {
    emit(
      comparePrdStructure({
        prdPath: resolve(prdInput),
        bundleDir: resolve(bundleInput),
      }),
    );
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
