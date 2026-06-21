---
name: prd-convert
description: |
  Use to bring an existing legacy PRD into template-shaped form. Two
  flavors — reformat (default; map content into template sections,
  preserve prose) and rewrite (opt-in; archive original as legacy, run
  full propose interview). Produces a normal proposal — standard
  prd-apply / prd-archive lifecycle applies. Triggers: /prd-convert
  <path>, "convert this old PRD into template form", "migrate the
  legacy auth doc". NEVER auto-triggers from natural language alone —
  heavy rewrite; always explicit invocation.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-convert — Migrate a Legacy PRD into Template Form

A one-shot skill for bringing existing PRDs that weren't created with this skill family into template-shaped form. The output is a standard proposal: `intent.md` + `tasks.md` (+ optional `research.md`) — the same artifacts [`prd-propose`](../prd-propose/SKILL.md) produces. From there, the standard lifecycle applies: review, [`prd-apply`](../prd-apply/SKILL.md), [`prd-archive`](../prd-archive/SKILL.md).

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §13.7 for design rationale.

## When to Use

| Signal | Skill |
|---|---|
| Existing PRD doesn't match the template; user wants to migrate it | **prd-convert** |
| PRD is well-shaped; user wants to update content | `prd-propose` |
| User wants to check a legacy PRD without modifying it | `prd-verify` |
| PRD is in the `read_only:` list | (convert refuses — see below) |

## Triggers

**Never auto-triggers from natural language alone.** Heavy rewrite of an existing document — always explicit `/prd-convert <path>` or confirmed user response.

## Two Flavors

| Flavor | What it does | When to use |
|---|---|---|
| **Reformat** (default) | Map existing content into template sections; preserve prose | Most cases — light cleanup |
| **Rewrite** (opt-in) | Archive existing as legacy; run full propose interview; generate a new PRD | Rare — when the existing PRD is so off that rebuilding is easier |

Default to reformat. Offer rewrite when the gap is large.

## What This Skill Does

1. **Reads the target PRD.** Full content, including non-standard sections.
2. **Identifies gaps against the active template.** Internally. The user never sees template section numbers in conversation.
3. **Surfaces gaps in product language.** Per [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §12.1. Bad: *"Want to add a Risks section?"* Good: *"Anything that could go wrong with this — risks, things that worry you?"*
4. **Generates a proposal.** Standard `intent.md` + `tasks.md` (+ optional `research.md`) under `<root>/changes/<slug>/`. The shape of the tasks depends on flavor (see below).

## What This Skill Does NOT Do

- **Does not modify the target PRD directly.** Goes through the standard proposal lifecycle. Apply makes the change; archive closes it out.
- **Does not invoke verify or audit itself.** Quality gates kick in where they always do — verify at archive pre-flight, audit when proactively suggested. Convert is one entry point into the lifecycle, not an orchestrator.
- **Does not write to read-only PRDs.** If the target is in `.prd.yaml`'s `read_only:` list, convert refuses:

  > *"`legacy/old-auth.md` is in the `read_only` list. Convert would rewrite it. Remove from `read_only` first, then re-run."*

  Use [`check-readonly.ts`](../prd/scripts/check-readonly.ts) before generating any task. Never sneaks around config.
- **Does not interview using template vocabulary.** Same product-language rule as `prd-propose`.

## Reformat Task Shape

Granular, section-by-section. Each task is one structural decision the user can confirm or override:

```markdown
- [ ] Map existing "Goals" → split into 3.1 Business Goals and 3.2 Objectives & Key Results
- [ ] Map existing "Audience" → template section 5 Target Users
- [ ] Map existing "Features" → template section 6 Product Capabilities
- [ ] Insert empty section 7 Functional Requirements — marked TODO: needs engineering input
- [ ] Omit section 9 Implementation Phases — N/A, no planned phasing
- [ ] Reorder sections to template numbering
- [ ] Add document metadata footer
```

The user can edit `tasks.md` before apply — that's exactly what the proposal lifecycle is for.

## Rewrite Task Shape

Two tasks; nothing meaningful to decompose:

```markdown
- [ ] Archive existing docs/prds/onboarding.md → docs/prds/changes/archive/<date>-onboarding-legacy/legacy-onboarding.md
- [ ] Write new docs/prds/onboarding.md from intent.md following template structure
```

The full propose-style interview drives the new content. See [`prd-propose`](../prd-propose/SKILL.md).

## Implementation-Language Tier Downgrade

Convert handles legacy content that may carry tech names, internal terminology, or implementation-flavored language the original author wasn't policing against. Per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3.3, convert downgrades verify findings by one tier:

- CRITICAL → WARNING
- WARNING → SUGGESTION

This avoids drowning the conversion in old-content complaints. The user can still address them, but the convert proposal doesn't block on legacy noise.

## The Convert Flow

1. **Read the target.** Full content; section inventory; cross-references; glossary references.
2. **Resolve the active template.** Via [`resolve-config.ts`](../prd/scripts/resolve-config.ts) and [`list-templates.ts`](../prd/scripts/list-templates.ts).
3. **Check read-only.** If target is read-only, refuse with the message above.
4. **Identify gaps.** Internally — template-shaped sections that don't exist, sections that don't fit the template, content that's misnamed.
5. **Pick flavor.** Default reformat. Offer rewrite if the gap is large.
6. **Surface gaps in product language.** Ask only what the existing content doesn't already answer.
7. **Generate the proposal.** `intent.md` + `tasks.md`; standard scaffolding.
8. **Hand off.** *"Convert proposal captured at `changes/<slug>/`. Review `tasks.md`, then run `prd-apply` to execute."*

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §13 (existing PRDs), §13.7 (convert mode).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3 (implementation-language patterns, with convert's tier downgrade).
