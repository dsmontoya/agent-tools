---
name: prd
description: |
  Umbrella entry point for the PRD (Product Requirements Document) skill
  family. Use this skill when the user mentions PRDs, product requirements,
  or the PRD workflow without specifying a concrete action (e.g., "tell me
  about your PRD workflow", "how do PRDs work here?", "I want to work on a
  PRD"). Routes the user to the right action skill — prd-explore,
  prd-propose, prd-clarify, prd-apply, prd-verify, prd-audit, prd-archive,
  or prd-convert — based on what they actually want to do. Also hosts
  shared references (template bundles, writing principles, validation rules)
  used by every action skill. Does NOT itself write any artifacts.
license: Apache-2.0
metadata:
  author: daniel
  version: "0.1.0"
---

# PRD Skill — Umbrella

This is the routing and reference-hosting skill for the PRD skill family. It does no work itself. Every concrete action lives in a sibling skill (`prd-explore`, `prd-propose`, etc.); this skill exists to:

1. Handle vague intent from the user and route them to the right action skill.
2. Host shared content (`TEMPLATE.md`, `REFERENCE.md`, template bundles) that every action skill consumes via `../prd/references/`.

The full design rationale lives in [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) — read it for the *why* behind every decision below.

## The Action Skills

| Skill | When to use it |
|---|---|
| `prd-explore` | The user wants to think out loud about a product problem before committing to a proposal. Read-only across the corpus; no artifacts. |
| `prd-propose` | The user wants to author a new PRD or modify an existing one — full interview, writes `intent.md` + `tasks.md` (+ optional `research.md`). |
| `prd-clarify` | An active proposal exists and needs refinement — resolve TBDs, add tasks, respond to redirects. |
| `prd-apply` | An active proposal exists with unchecked tasks. Idempotent: processes only `- [ ]` tasks; never `- [x]` or `~~...~~`. |
| `prd-verify` | Read-only inspection of a single PRD or single proposal — completeness, correctness, coherence. |
| `prd-audit` | Read-only inspection *across* PRDs — terminology drift, persona alignment, capability overlap, broken cross-references. |
| `prd-archive` | Close a fully-applied proposal. Auto-runs `prd-verify` as a pre-flight; CRITICAL findings block by default (`--abandon` to override). |
| `prd-convert` | Bring an existing legacy PRD into template-shaped form. Produces a normal proposal — standard lifecycle applies. |

## Routing on Vague Intent

When the user's request is generic ("let's work on a PRD", "I need to update something in the onboarding docs", "tell me about your PRDs"), follow this routing logic in order:

1. **Explicit slash command** wins immediately — no routing needed.
2. **Specific artifact reference** (a slug like `user-onboarding`, or a PRD path like `docs/prds/billing.md`) — narrow scope to that artifact, then check filesystem state.
3. **Active proposals exist** in `<root>/changes/` — surface a one-line summary per proposal (using `scripts/list-proposals.ts` + `scripts/proposal-status.ts`) and ask whether to continue one or start something new. Phrasing is shared in [`references/REFERENCE.md`](./references/REFERENCE.md) so every action skill uses the same wording.
4. **No active proposals** — ask the user what they want to do, framed in product language:
   > "Want to think through a product problem first, capture a new PRD proposal, or check an existing PRD?"
   - "Think through" → `prd-explore`
   - "Capture / new / update" → `prd-propose`
   - "Check" → `prd-verify` (single) or `prd-audit` (corpus)

Never silently pick an action that writes. Confirm intent before any artifact is touched.

## Shared References

Every action skill consumes content from `references/` via the relative path `../prd/references/`. Update these in one place; every skill sees the change.

```
references/
  REFERENCE.md                      # writing principles, implementation-language patterns,
                                    # resume-prompt phrasing, validation rules
  templates/
    builtin/
      prd/
        v1/
          config.yaml               # bundle manifest (artifacts, roles, storage shapes)
          prd.md                    # PRD template
          glossary.md               # glossary template
          personas.md               # personas template
    custom/                         # user-managed bundles; never touched by skill updates
```

See [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §17 for the full template-bundle architecture and §18 for the implementation-language guard.

## Deterministic Scripts

Mechanical operations (filesystem listing, YAML parsing, structural validation, cross-reference resolution) live in TypeScript under [`scripts/`](./scripts/). Invoked by action skills as primitives:

```bash
npx tsx scripts/list-proposals.ts <root>
npx tsx scripts/proposal-status.ts <root>/changes/<slug>
npx tsx scripts/list-templates.ts
npx tsx scripts/validate-template.ts <bundle-path>
```

All scripts emit JSON and have unit tests under `scripts/__tests__/`. See [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §19.

## What This Skill Does NOT Do

- **Does not write artifacts.** All writes go through `prd-propose`, `prd-clarify`, `prd-apply`, or `prd-archive`.
- **Does not interview.** Interview lives in `prd-propose` and `prd-clarify`.
- **Does not verify or audit.** Those are sibling skills.
- **Does not run git commands or suggest commits.** The skill is git-agnostic — see §8.6.

## Reading Order for New Contributors

1. [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §1–§5 — purpose, architecture, artifacts, directory layout, lifecycle.
2. [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §12 — interview design principles (the heart of the skill).
3. [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §17 — template bundles and customization.
4. [`references/REFERENCE.md`](./references/REFERENCE.md) — the shared rules every action skill enforces.
