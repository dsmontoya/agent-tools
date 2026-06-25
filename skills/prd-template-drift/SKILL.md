---
name: prd-template-drift
description: |
  Use to check whether a single PRD has drifted from the current
  template bundle — both structural (sections newly required, renamed,
  or removed) and instructional (per-section rules that changed).
  Read-only; produces a tiered report in conversation (CRITICAL /
  WARNING / SUGGESTION). Triggers: /prd-template-drift <path>,
  "has the onboarding PRD drifted from the template", "is this PRD
  up to date with the latest template". Explicit invocation only —
  not auto-triggered (pass 2 is LLM-heavy) and not part of
  prd-archive's pre-flight.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-template-drift — Single-PRD Template-Conformance Check

Read-only inspection of one PRD against the current template bundle. Two passes: a deterministic structural diff, then an LLM-judged per-section instruction-compliance check. Compares the PRD as-it-stands against the bundle as-it-stands today.

Distinct from siblings:
- [`prd-verify`](../prd-verify/SKILL.md) — intra-doc quality (completeness against the PRD's own declared skip state, internal coherence). Does not check template drift.
- [`prd-audit`](../prd-audit/SKILL.md) — inter-doc consistency across the corpus.
- **prd-template-drift** — doc-vs-current-template. This skill.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §10 for the scope-axis rationale and §17.8 for the bundle contract that defines required sections.

## When to Use

| Signal | Skill |
|---|---|
| Just updated the template bundle and want to know which PRDs need refreshing | **prd-template-drift** |
| Suspect a PRD is missing newly-required sections or violates newly-added rules | **prd-template-drift** |
| Intra-doc quality check on one PRD | `prd-verify` |
| Cross-PRD consistency | `prd-audit` |

## Triggers

Explicit only. `/prd-template-drift <path>` or natural-language phrasing that names template-version drift. **Not auto-triggered** — pass 2 calls the model per section. **Not part of archive pre-flight** — archive runs verify, whose job is "is this PRD complete as authored," not "does the contract still hold."

## What This Skill Checks

| Pass | Mechanism | What it catches |
|---|---|---|
| **Pass 1: Structural** | Deterministic diff of the PRD's section headings + skip-state against the current bundle's required/optional section set | Required sections missing entirely; required sections present but marked N/A (rationale needs re-evaluation under current contract); sections renamed in the template; sections the template removed |
| **Pass 2: Instructional** | LLM judgment per matching section, fed (current template-section body, PRD-section body) | New required bullets the section lacks; rules the section violates (declarative-vs-Given-When-Then, baseline/target/frequency, banned vague terms); examples no longer matching the prescribed pattern |

Pass 2 only runs on sections that pass 1 matched structurally — broken structure is reported and skipped to save tokens and avoid grading incoherent input.

Drift does not distinguish "section was required at authoring time and skipped" from "section is newly required" — both surface as "re-evaluate this section under the current template." The user decides whether the existing N/A reason still applies. Skip-state semantics follow [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §6.

## How to Run

Pass 1 — deterministic script:

```bash
npx tsx ../prd/scripts/compare-prd-structure.ts <prd-path> <bundle-dir>
```

Bundle resolution reuses `../prd/scripts/resolve-config.ts` so the "current bundle" is whatever `.prd.yaml` resolves to at run time.

Pass 2 — LLM section-by-section compliance, gated on pass 1 matches. No script; orchestrated in-skill. Prompts incorporate the implementation-language patterns from [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3.

## Report Tiers

| Tier | Examples |
|---|---|
| **CRITICAL** | Required section missing entirely (pass 1); required bullet absent (pass 2) |
| **WARNING** | Required section present but N/A under old contract (pass 1); section renamed in template (pass 1); rule violation in section content (pass 2) |
| **SUGGESTION** | Section the template removed (pass 1); optional section added in current template (pass 1); prescribed example pattern not followed (pass 2) |

Does not block archive. Drift is informational; verify is the archive gate.

## Report Shape

Single conversational message, findings grouped by tier and pass:

```
prd-template-drift findings — 5 items (bundle v1.4.0)

CRITICAL (1)
  - Pass 1: required section "Boundaries" is missing

WARNING (3)
  - Pass 1: "Constraints" is marked N/A with reason "no known constraints" — current template requires it; re-evaluate
  - Pass 1: section "Goals" appears renamed to "Goals & Key Results" in the current template
  - Pass 2: §3.2 KR-2 missing baseline/target/frequency

SUGGESTION (1)
  - Pass 1: optional section "Open Questions" exists in current template; PRD has no equivalent
```

## What This Skill Does NOT Do

- **Does not auto-trigger.** Pass 2 is LLM-heavy; explicit invocation only.
- **Does not run at archive pre-flight.** Archive's verify covers PRD completeness against the PRD's own skip state.
- **Does not write findings to disk.** Conversation only.
- **Does not modify the PRD or template.** Read-only.
- **Does not reconcile drift.** Surfaces; user decides whether to update the PRD.
- **Does not block apply or archive.** Drift is informational.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §10 (verify/drift/audit scope axis), §17.8 (template-bundle contract).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3 (implementation-language patterns), §6 (skip states), §7 (load-bearing sections).
- [`../prd-verify/SKILL.md`](../prd-verify/SKILL.md) — sibling skill for intra-doc quality.
