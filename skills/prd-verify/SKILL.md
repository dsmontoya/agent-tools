---
name: prd-verify
description: |
  Use to inspect a single PRD or single proposal — completeness,
  correctness, coherence. Read-only; produces a tiered report in
  conversation (CRITICAL / WARNING / SUGGESTION). Triggers:
  /prd-verify <path>, "verify the onboarding PRD", "check if this
  proposal is ready", "does the PRD have any issues?". Auto-triggers
  safely from natural language because it's read-only and scoped to a
  single artifact. Also auto-runs as prd-archive's pre-flight check.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-verify — Single-Artifact Inspection

Read-only inspection of one PRD or one proposal. Outputs a tiered report in conversation. Does not write findings to disk; re-running on unchanged content produces the same report.

For cross-PRD consistency checks (terminology drift, persona alignment across multiple PRDs), use [`prd-audit`](../prd-audit/SKILL.md). For template-version drift (whether a PRD still conforms to the current template bundle), use [`prd-template-drift`](../prd-template-drift/SKILL.md). Verify is intra-doc; audit is inter-doc; drift is doc-vs-template.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §10 for design rationale.

## When to Use

| Signal | Skill |
|---|---|
| User wants to check one PRD's quality | **prd-verify** |
| User wants to check whether a proposal is ready for apply | **prd-verify** |
| User runs `prd-archive` (pre-flight verify auto-runs) | **prd-verify** (auto-invoked) |
| User wants consistency across the corpus | `prd-audit` |
| User wants to write changes | `prd-propose` or `prd-clarify` |

## Triggers

Auto-triggers safely from natural language. Read-only, scoped to a single artifact. Explicit `/prd-verify <path>` works too.

Also auto-runs as **archive's pre-flight check** — see [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5.3 and [`prd-archive`](../prd-archive/SKILL.md). That invocation is not user-facing; the agent surfaces findings as part of the archive flow.

## What This Skill Checks

Three dimensions of inspection, plus a fourth for proposal-driven changes:

| Dimension | What it checks |
|---|---|
| **Completeness** | All tasks checked or struck; no leftover `[TBD]` markers; cross-references resolve; glossary refs valid; citations in `intent.md` resolve to entries in `research.md`. |
| **Correctness** | Template structure followed (per the active bundle); rules declarative (not Given-When-Then); priorities from the valid set; goals have key results with baseline/target/frequency; vague language detected ("fast," "easy," "good," "intuitive"); N/A sections have explicit reasons. |
| **Coherence** | Capabilities trace to goals; functional requirements support capabilities; personas referenced exist in Target Users (or in `personas.md`); phases reference real features. |
| **Proposal alignment** (proposal-driven only) | Does the PRD reflect what `tasks.md` said it would? |

## How to Run

Powered by deterministic scripts under [`../prd/scripts/`](../prd/scripts/):

```bash
# Confirm the template bundle is well-formed (catches bundle bugs early)
npx tsx ../prd/scripts/validate-template.ts <bundle-dir>

# Resolve and check every inline cross-reference in the artifact
npx tsx ../prd/scripts/resolve-xref.ts <prd-or-intent>

# For proposal-driven verifies: get unchecked-task counts
npx tsx ../prd/scripts/proposal-status.ts <proposal-dir>

# To know what personas / glossary / sibling PRDs exist
npx tsx ../prd/scripts/list-corpus.ts <root> <bundle-dir>
```

Findings from the scripts feed into the report. Semantic checks (vague language, coherence, proposal alignment) are LLM judgment, layered on top of the deterministic structural pass.

## Report Tiers

| Tier | Blocks archive? | Examples |
|---|---|---|
| **CRITICAL** | Yes (override with `--abandon`) | Unchecked tasks; broken cross-refs; missing required sections; CRITICAL implementation language (code, SQL, endpoints) |
| **WARNING** | No | Vague success criteria; orphan capabilities; missing rationale; WARNING implementation language (tech names, impl verbs) |
| **SUGGESTION** | No | Style polish; missing optional sections that would add value; stale `research.md` entries (>90 days) |

Implementation-language tiers come from [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3.

## Report Shape

Output is a single conversational message — no file, no log. Findings grouped by tier, with file + section + a one-line explanation:

```
prd-verify findings — 4 items

CRITICAL (2)
  - Unchecked task in tasks.md (line 12):
    `- [ ] Section 6.2: add capability "Bulk export"`
  - Broken cross-reference in onboarding.md (line 47):
    [billing](../prds/billing.md#feature-flags) — target file exists, anchor "feature-flags" missing

WARNING (1)
  - Vague success metric (Section 3.2):
    "increase engagement" — no number

SUGGESTION (1)
  - research.md entry for "current adoption" is 120 days old; consider refreshing
```

When invoked as archive's pre-flight, the report carries the same shape; archive interprets CRITICAL as a block.

## What This Skill Does NOT Do

- **Does not write findings to disk.** Conversation only.
- **Does not modify the PRD or proposal.** Read-only.
- **Does not check code.** We have no code. Coherence is intra-document (and inter-PRD for cross-references), not cross-artifact-to-implementation.
- **Does not check across PRDs.** That's [`prd-audit`](../prd-audit/SKILL.md). Verify's scope is one artifact.
- **Does not check template-version drift.** Verify validates the PRD against its own declared skip state; whether the current template bundle has moved on is [`prd-template-drift`](../prd-template-drift/SKILL.md)'s job.
- **Does not reconcile findings.** Surfaces; user decides.
- **Does not block apply.** Quality gates kick in at archive, not before. Pre-apply verify is user-initiated only.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §10 (verify design), §5.3 (archive pre-flight), §14.1 (verify vs audit).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3 (implementation-language patterns), §6 (skip states), §7 (load-bearing sections).
