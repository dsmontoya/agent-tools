---
name: prd-audit
description: |
  Use to inspect the PRD corpus for cross-document consistency
  — terminology drift, persona alignment, capability overlap, broken
  cross-references, contradictions between PRDs. Read-only; outputs a
  tiered report in conversation. Triggers: /prd-audit, "audit the
  PRDs", "check the corpus for inconsistencies", or proactively
  suggested after a multi-PRD apply. NEVER auto-triggers from natural
  language alone — corpus-wide scan; user should know it's running.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-audit — Cross-PRD Consistency

Read-only inspection *across* the PRD corpus. Sibling to [`prd-verify`](../prd-verify/SKILL.md) (which checks one PRD at a time); audit checks how the PRDs hold together as a set.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §14 for design rationale.

## When to Use

| Signal | Skill |
|---|---|
| User wants cross-PRD consistency check | **prd-audit** |
| Glossary or personas may have drifted across PRDs | **prd-audit** |
| Apply touched multiple PRDs; check fallout | **prd-audit** (proactively suggested) |
| New PRD just landed; check for overlap | **prd-audit** (proactively suggested) |
| User wants to check one PRD's quality | `prd-verify` |

## Triggers

**Never auto-triggers from natural language alone.** Corpus-wide scan; the user should know it's running. Explicit `/prd-audit` only, or confirmed agent-proactive prompt.

The agent **proactively suggests audit** at four moments (per [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §14.6):

1. **After multi-PRD apply.** When [`prd-apply`](../prd-apply/SKILL.md) touches ≥2 PRDs.
2. **After a new PRD lands.** When apply creates a brand-new PRD file.
3. **After convert's apply.** Treated like any multi-PRD apply.
4. **Surfaced by archive's pre-flight verify** when the proposal touched multiple PRDs (as a SUGGESTION-tier note).

Each suggestion is a question, not an action. The user confirms before audit runs.

## What This Skill Checks

| Check | Mechanical or semantic? |
|---|---|
| Cross-references between PRDs resolve to real PRD + section | Mechanical |
| Glossary terms used in PRDs are defined in `glossary.md` | Mechanical |
| Glossary entries defined but unused (orphans) | Mechanical |
| `personas.md` entries referenced by PRDs exist; orphan personas flagged | Mechanical |
| PRD-specific persona drift (e.g., "Reviewer" in A vs "Approver" in B for the same role) | Semantic |
| Two PRDs describe overlapping capabilities without cross-referencing each other | Semantic |
| Two PRDs make contradictory claims (user roles, data models, business rules) | Semantic |
| Stale cross-references (target section was renamed or removed) | Mechanical |

Mechanical checks come from deterministic scripts. Semantic checks are LLM judgment over corpus content.

## How to Run

```bash
# One command: resolves xrefs across every corpus file in the bundle
# and emits an aggregate + broken-only summary.
npx tsx ../prd/scripts/report-xrefs.ts <root> <bundle-dir> > /tmp/xrefs.json
```

Then Read `/tmp/xrefs.json` and format the broken refs into the CRITICAL tier. Do **not** pipe the JSON into `python3 -c` / `node -e` one-liners — Read the file instead; that's what the file-based emit shape is for.

For the semantic checks (persona drift, capability overlap, contradictions), read the PRDs, `glossary.md`, and `personas.md` directly and reason across them. Format findings as a tiered report.

## Report Tiers

| Tier | Examples |
|---|---|
| **CRITICAL** | Stale cross-reference (target section removed or renamed); broken glossary or persona reference |
| **WARNING** | Persona drift (same role, different name); capability overlap without cross-reference; glossary term used but not defined; contradictory claims between PRDs |
| **SUGGESTION** | Glossary orphans; personas with no inbound references |

## Report Shape

Conversational only; no file written:

```
prd-audit findings — 5 items

CRITICAL (1)
  - Stale cross-reference: onboarding.md → auth.md section 6.2 (section was renamed to 6.3)

WARNING (3)
  - PRD-specific persona drift
    auth.md (Section 5.2): "Reviewer"
    billing.md (Section 5.2): "Approver"
    Appears to refer to the same role; consider promoting to personas.md
  - Capability overlap without cross-reference
    auth.md (Section 6.1) and onboarding.md (Section 6.3) both describe signup flow
  - Glossary term used but not defined: "tenant"

SUGGESTION (1)
  - Glossary entry "deprecated_role" appears unused across PRDs (orphan)
```

## Suppressions via CLAUDE.md

For findings that are intentional non-issues, the user documents the decision in `CLAUDE.md` (already loaded automatically):

> *"auth.md's 'admin' and billing.md's 'staff' are distinct roles, not terminology drift."*

Suppressed findings appear as `(suppressed per CLAUDE.md)` or are omitted entirely. **No new artifact, no YAML, no `.audit-ignore` file.**

## Audit → Propose Flow

When findings warrant action, suggest a follow-up [`prd-propose`](../prd-propose/SKILL.md) flow. Surface the bundling decision, don't assume it:

> *"5 findings — bundle them into one proposal (a 'consistency cleanup' pass), or split by domain (terminology, cross-references, persona drift) into separate proposals?"*

Default: one proposal for related findings; separate proposals when domains genuinely diverge. The agent proposes a grouping; the user adjusts.

Audit itself writes nothing. The follow-up propose flows produce the artifacts.

## What This Skill Does NOT Do

- **Does not auto-trigger from natural language.** Always explicit invocation or confirmed prompt.
- **Does not gate apply or archive.** Findings inform; never block.
- **Does not reconcile** — surfaces; user decides.
- **Does not persist findings.** No `<root>/audit-reports/` folder, no log of past audits. Re-running on an unchanged corpus produces the same report.
- **Does not modify any PRD, glossary, or personas file.** Read-only.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §14 (audit design).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) — writing principles.
