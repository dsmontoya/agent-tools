---
name: prd-propose
description: |
  Use when the user wants to author a new PRD or modify an existing one
  — anything that ends with a proposal on disk. Runs an interview-driven
  flow in the user's own product language, then writes intent.md +
  tasks.md (and research.md if external data was consulted) under
  <root>/changes/<slug>/. Triggers: "let's write a PRD for X", "I want
  to update the onboarding PRD", "add a capability to billing.md",
  "capture this proposal". Auto-triggers safely from natural language
  because writes are scoped to the proposal folder, never the PRD itself.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-propose — Interview-Driven Proposal Authoring

Runs the interview, writes the proposal. The proposal is an audit-and-redirect artifact — a visible trace of what the agent has decided to capture and where it intends to put it, so the user can intervene *before* anything touches the PRD itself. That part comes later via [`prd-apply`](../prd-apply/SKILL.md).

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3, §5, §9, §12, §13 for the underlying design.

## When to Use

| Signal | Skill |
|---|---|
| User describes a feature/change with audience + intent in mind | **prd-propose** |
| "Let's write a PRD for X" | **prd-propose** |
| "Update the onboarding PRD — change the timeout rule" | **prd-propose** |
| User is comparing options, weighing tradeoffs | `prd-explore` |
| Active proposal exists, user wants to refine it | `prd-clarify` |
| User wants to check an existing PRD's quality | `prd-verify` |
| User wants to migrate a legacy PRD into template form | `prd-convert` |

When the umbrella [`prd`](../prd/SKILL.md) skill can't tell, it asks: *"Want to think through this first, or jump straight to capturing it as a PRD proposal?"* — "capture" routes here.

## Triggers

Auto-triggers safely from natural language because writes are scoped to `<root>/changes/<slug>/`, never to the PRD itself. Explicit `/prd-propose` works too.

## What This Skill Does

1. **Resolves config and reads the corpus.** Run [`resolve-config.ts`](../prd/scripts/resolve-config.ts) to get the active root + template bundle; [`list-corpus.ts`](../prd/scripts/list-corpus.ts) to know what already exists; [`list-proposals.ts`](../prd/scripts/list-proposals.ts) to detect potentially-colliding active proposals.
2. **Runs the interview.** Conversational. Follows natural thinking order (problem → users → success → capability → boundaries → constraints → phases → risks → context), not document order. Reassembled into template-section order at write time. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §12.3.
3. **Pushes back on load-bearing answers.** Problem, target users, success metric, top capability — at most twice per question. Elsewhere, accept-as-given. Patterns in [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §7–§8.
4. **Translates implementation language to product language.** *"We'll use OAuth"* → reflected back as *"Users sign in with their existing identity provider."* Captured intent stays product-side. See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3.
5. **Writes once, at the end.** Everything is gathered in conversation memory; the agent drafts `intent.md` + `tasks.md` (+ `research.md` if external data was consulted), surfaces them for confirmation, then writes.

## What This Skill Does NOT Do

- **Does not touch the PRD itself.** All writes land under `<root>/changes/<slug>/`. The PRD is updated only when [`prd-apply`](../prd-apply/SKILL.md) runs.
- **Does not interview using template vocabulary.** Never asks *"Want to add a Risks section?"* Asks *"Anything that could go wrong with this — risks, things that worry you?"* The user describes their product; the agent's internal model maps to template sections. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §12.1.
- **Does not re-interview about content already in the PRD.** For modifications to a managed PRD, reads it first, summarizes, and runs a compressed delta interview. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §13.3.
- **Does not write to read-only PRDs.** Run [`check-readonly.ts`](../prd/scripts/check-readonly.ts) before adding a task that would touch a path. If a task would naturally affect a read-only PRD, capture it under a "Suggested manual updates" section in `intent.md`. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §13.6.
- **Does not run git commands.** The skill is git-agnostic. Filesystem operations only. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §8.6.

## The Interview Flow

There is no fixed script — the user drives the topic. The agent gathers the load-bearing four, then offers to draft. Typical shape:

1. **Setup.** New PRD or modifying existing? If existing, read it first; summarize in product language; confirm scope of change before the delta interview.
2. **Trigger.** *"What's prompting this?"* — light. Sets context, not load-bearing.
3. **Problem.** Concrete, specific. **Pushback** at most twice if the answer is vague (*"users find it confusing"* → ask for one real example). If still thin, mark `TODO: needs sharpening` and move on.
4. **Users.** Primary persona first. **Pushback.** *"Everyone"* gets *"even 'for everyone' has a primary persona; who feels this most acutely today?"*
5. **Success metric.** One number. **Pushback.** *"Improve adoption"* gets *"specific number — 50% of active users in the first month?"*
6. **Top capability.** Walk through the first one or two. **Pushback** on the first 1–2.
7. **Offer to draft.** Once the load-bearing four are solid, ask whether to draft now or keep going. Don't keep mining. *"I have enough to draft — problem, users, success, and one capability are solid. Want me to draft what we have, or keep going?"*
8. **Optional follow-up phases (light).** Boundaries, constraints, phases, risks. Accept-as-given.
9. **Context (last).** Background and market are asked **last** in the interview even though they appear **first** in the document. Most PRDs skip most of context entirely — propose only when the user signals it matters.

## Question Format

| Type | Use AskUserQuestion? | Open prose? |
|---|---|---|
| Mode (new vs modify existing) | Yes (2-option) | No |
| Priority (High/Medium/Low) | Yes (3-option) | No |
| Skip behavior (skip entirely / come back later) | Yes (2-option) | No |
| Phase count (single release vs phased) | Yes | No |
| Problem, users, success, capabilities | No | Yes |
| Risks, constraints, boundaries | No | Yes |

Open-ended for substantive content; bounded choice for routing decisions.

## Skip States

Three behaviors for sections without full content (rendered uniformly per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §6):

| State | When | How it renders |
|---|---|---|
| **Omit** | Section doesn't apply | Not rendered at all |
| **N/A** | Section was considered, ruled out | Header + `N/A — <one-line reason>` |
| **TODO** | Section can't be filled yet, should be later | Header + `TODO — <what would unblock>` |

The user never picks between "omit" and "N/A" explicitly. When ambiguous, ask: *"Should we skip this entirely, or leave a note to come back to it later?"* If clearly inapplicable from context (internal tool → no competitive landscape), propose the omit without asking.

## Collision Detection

At interview start, after `list-proposals.ts`, check for overlap with active proposals:

1. **Textual collision.** Read each active proposal's `tasks.md`. Do they target the same files/sections?
2. **Topical collision.** Read first paragraph(s) of each active `intent.md`. Same problem space?

If overlap:

> *"This overlaps with active proposal `auth-improvements` (modifies same sections). Continue that, or proceed separately?"*

- *"Continue"* → hand off to [`prd-clarify`](../prd-clarify/SKILL.md) on the existing proposal.
- *"Separate"* → proceed; add a cross-reference note to the new `intent.md` linking the related proposal.

Never auto-merge.

## External Sources

If the interview turns on data the user doesn't have on hand (current adoption, retention numbers, competitor offerings):

1. **Surface before fetching.** *"Want me to check Mixpanel for current adoption?"* — agent waits for the nod. No auto-fetch.
2. **Capture in `research.md`.** Per-source entries: topic, source, date, finding. `intent.md` cites; `research.md` holds evidence.
3. **Degrade gracefully.** No MCP, no access, broken URL → ask the user to paste, or mark the field TODO.

`research.md` is created only if external data was consulted. Its presence signals "this proposal is grounded in real evidence." See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §11.

## Output

At end of interview, write under `<root>/changes/<slug>/`:

```
intent.md     # captured facts + rationale (the why), with stable anchored headings
tasks.md      # atomic file-by-file, section-by-section edits (the what)
research.md   # conditional — external evidence, if any was consulted
```

### intent.md structure — stable anchors

`intent.md` is written so every atomic piece of captured content sits under its own markdown heading. The heading slug (GitHub-flavored) becomes a stable `intent.md#<slug>` anchor that tasks reference via transclusion (see Shape B below).

| Top-level section | Sub-headings |
|---|---|
| `## Target users` | `### <persona-name>` per persona |
| `## Product capabilities` | `### <capability-name>` per capability |
| `## Boundaries` | `### <boundary-name>` per item (or grouped prose if items are terse) |
| `## Risks` | `### <risk-name>` per risk |
| `## Constraints` | `### <constraint-name>` per item |
| `## Phases` | `### <phase-name>` per phase, if multi-phase |
| `## Problem`, `## Success metric`, `## Trigger`, `## Context` | No sub-headings required; the section heading anchors the content |

See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §9 and [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3.6 for the full anchor rules.

### tasks.md shape — atomic, in two shapes

Each task is atomic — one file, one section, one operation, one concrete change. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §7.1 for the granularity bar.

Tasks come in two shapes; propose picks the right one per content unit:

| Shape | Format | Used when |
|---|---|---|
| **A — Inline** | `- [ ] Section X.Y: write: <content>` | Content is net-new — Rules blocks, KRs, measurement specifics, Omit/N/A/TODO directives, multi-source synthesis |
| **B — Transclude** | `- [ ] Section X.Y: transclude intent.md#<anchor>` | One intent.md heading's body is a 1:1 fit for the target section (personas, risks, problem statement, single-source capability prose) |

**Why two shapes:** intent.md is the single source of truth for prose captured during the interview. Shape B lets `tasks.md` reference that prose by anchor instead of re-serializing it. Apply executes Shape B by reading the named heading's body verbatim — no paraphrasing.

**Picking the shape:**

- Default to Shape A when the template requires content the interview doesn't naturally produce (Rules under capabilities, KR phrasings, measurement details, explicit Omit/N/A/TODO directives).
- Default to Shape B when one intent.md heading's body cleanly fits the target section. Persona descriptions and risk descriptions almost always qualify.
- One task = one section change = one content unit. Three personas → three Shape B tasks (one per persona).
- Never mix shapes inside a single task. If a task would require both inline content and a transclude, split it into two tasks.

See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §10 and [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §7.3 for the full shape rules.

### Surfacing the next step

After writing, surface the next step:

> *"Proposal captured at `changes/<slug>/`. Review `tasks.md` to see what will change — when you're ready, run `prd-apply` to execute."*

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3 (artifacts, including §3.6 intent.md anchors), §5 (lifecycle), §7.3 (task shapes), §9 (collisions), §11 (external sources), §12 (interview), §13 (existing-PRD handling).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) — writing principles, load-bearing sections, pushback patterns, implementation-language patterns, skip states, intent.md anchors (§9), two task shapes (§10).
