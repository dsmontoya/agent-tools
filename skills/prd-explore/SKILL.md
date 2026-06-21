---
name: prd-explore
description: |
  Use when the user wants to think through a product problem before
  committing to a PRD proposal — comparing approaches, weighing
  tradeoffs, scoping the space. Triggers on phrases like "what should
  we do about X?", "let me think out loud", "I'm not sure which way to
  go". Read-only across the corpus: no artifacts, no interview
  machinery, no implementation-language guards. Hands off to
  prd-propose when the idea crystallizes.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-explore — Pre-Proposal Exploration

Open conversation about a product problem, grounded in the existing PRD corpus. The user drives the topic; this skill reflects, compares options, asks clarifying questions, and reads what's already documented. No artifacts. The discipline of [`prd-propose`](../prd-propose/SKILL.md) kicks in once the exploration crystallizes — explore is the unstructured phase before that.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §15 for design rationale.

## When to Use

| Signal | Skill |
|---|---|
| User is comparing options, weighing tradeoffs | **prd-explore** |
| "Let me think out loud about X" | **prd-explore** |
| "What should we do about X?" | **prd-explore** |
| User describes a clear feature/change | `prd-propose` |
| User has audience + problem in mind | `prd-propose` |
| "I want a PRD for X" | `prd-propose` |
| User asks to check an existing PRD | `prd-verify` |
| User asks to audit across the corpus | `prd-audit` |

When the umbrella [`prd`](../prd/SKILL.md) skill can't tell, it asks: *"Want to think through this first, or jump straight to capturing it as a PRD proposal?"* — "Think through" routes here.

## Triggers

Auto-triggers safely from natural language because it's read-only — entering it accidentally has no consequence. Explicit `/prd-explore` works too.

## What This Skill Does

1. **Grounds in the corpus first.** Before the first substantive reflection, enumerate what's already documented so the conversation has anchors. Powered by [`list-corpus.ts`](../prd/scripts/list-corpus.ts) — don't dump the whole list; surface what's relevant to the user's prompt.
2. **Opens an unstructured conversation.** No fixed agenda. Reflect what the user says, compare alternatives, name tensions, ask clarifying questions in product language.
3. **Connects to what already exists.** When the user describes a problem that overlaps with a documented persona, glossary term, or PRD, name the overlap. Example: *"This sounds like it touches the `power-user` persona — defined in `personas.md`. Worth grounding against?"*
4. **Watches for crystallization.** When the user signals convergence ("OK I think we should…", "let's go with X", "this is the direction"), suggest the handoff to `prd-propose`.

## What This Skill Does NOT Do

- **No artifacts.** Nothing gets written to disk. Walking away mid-explore leaves nothing behind — anything worth preserving lives in the user's own notes, or gets captured by `prd-propose` at the transition.
- **No interview structure.** No load-bearing pushback, no required role coverage, no template alignment. See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §7–§8 for what *does* fire — at propose, not here.
- **No implementation-language guards.** Users often explore in implementation terms ("we'd use OAuth", "Kafka topic"). That's fine here. See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3 — translation is a propose-time concern.
- **No corpus modifications.** Read-only, same shape as `prd-verify` and `prd-audit`.

## The Explore Flow

There's no fixed sequence — this is the loose-conversation skill on purpose. Typical shape:

1. **Read the corpus.** Resolve config, list templates, list corpus — once, at the start. Skim what's there before reflecting.
2. **Reflect, don't transcribe.** Mirror what the user says back in slightly compressed form. The goal is to help the user hear their own thinking.
3. **Compare alternatives.** When the user names a direction, name plausible alternatives ("vs. doing nothing, vs. solving it via X") and ask which constraint actually rules them out.
4. **Surface tensions.** If two things the user said pull in opposite directions, name it — that's usually where the real decision lives.
5. **Reflect in product language without correcting.** If the user reaches for implementation language, don't correct them — but reflect the user-visible behavior underneath. *"So external systems get notified when X happens"* instead of *"don't say Kafka."* The reflection is enough; explicit correction is `prd-propose`'s job.
6. **Watch for the off-ramp.** When the user converges, suggest the transition.

## Handoff to prd-propose

When the user is ready:

> *"Want me to start a propose flow with what we've discussed?"*

If yes, route to [`prd-propose`](../prd-propose/SKILL.md). The conversation memory carries the explore context forward — propose's interview can skip questions that explore already answered and go straight to load-bearing gaps that haven't surfaced.

If no, keep exploring. No time pressure.

## Reading the Corpus

The active PRD root and template bundle are resolved by deterministic scripts in [`../prd/scripts/`](../prd/scripts/). Typical opening sequence:

```bash
# What does the project consider "the PRD root" and which template is active?
npx tsx ../prd/scripts/resolve-config.ts <project-root>

# What corpus artifacts exist under that root?
npx tsx ../prd/scripts/list-corpus.ts <root> <bundle-dir>
```

Each script emits JSON. `list-corpus.ts` returns one entry per artifact (storage shape, slug, path, presence, last-touched). Use it to know *what* exists; use `Read` for content.

If active proposals exist under `<root>/changes/` and the exploration overlaps with one, surface it — *"There's an active proposal in `changes/billing-revamp/` that touches this. Fold this into that, or keep them separate?"* — but don't open or modify the proposal here. That's `prd-clarify`'s scope.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing and the broader skill family.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §15 — full design rationale.
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) — shared writing principles, load-bearing sections, pushback patterns (none fire here, but useful as context for the handoff).
