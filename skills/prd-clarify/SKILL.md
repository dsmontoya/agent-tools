---
name: prd-clarify
description: |
  Use to refine an existing proposal — resolve TBDs in intent.md, add
  or supersede tasks in tasks.md, append new external findings to
  research.md. Triggers: "let's update the proposal", "add a task to
  do X", "actually the user is different", or when verify surfaces gaps
  before archive. Auto-triggers safely from natural language because
  writes stay inside the proposal folder. Never touches the PRD itself
  — that's prd-apply's job.
license: Apache-2.0
metadata:
  author: daniel
---

# prd-clarify — Refine an Active Proposal

A second pass at the proposal folder. Used when the initial interview didn't capture everything, when subsequent thought or user feedback shifts the picture, or when [`prd-verify`](../prd-verify/SKILL.md) surfaces gaps to address before archive.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6 for the strikethrough rule that governs how tasks are modified, and §12 for shared interview principles.

## When to Use

| Signal | Skill |
|---|---|
| Active proposal exists; user wants to refine intent or tasks | **prd-clarify** |
| Verify surfaced gaps to address before archive | **prd-clarify** |
| "I forgot to mention X" | **prd-clarify** |
| "Actually the success metric should be Y instead" | **prd-clarify** |
| No active proposal in the folder | `prd-propose` |
| Proposal is ready; user wants to write to the PRD | `prd-apply` |
| User wants to close a finished proposal | `prd-archive` |

If multiple active proposals exist, use the resume-list phrasing from [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §4 to ask which.

## Triggers

Auto-triggers safely from natural language. Writes are scoped to `<root>/changes/<slug>/`; never to the PRD itself. Explicit `/prd-clarify` works too.

## What This Skill Does

1. **Locates the proposal.** Active proposal in `<root>/changes/`. If many, show the resume list. If the user names a slug, jump straight to it.
2. **Modifies `intent.md` freely.** Prose; rewrite as understanding improves. No strikethrough — the audit trail lives in git history, not in the file. Heading structure follows the anchor rules in [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3.6.
3. **Applies the strikethrough rule to `tasks.md`** when modifying tasks that have already been applied. Unchecked tasks can be edited or deleted freely; checked tasks must be struck through, with a replacement task added beneath. Re-transclude tasks (Shape B) carry a required why-note.
4. **Picks the right task shape.** Same rule as propose — Shape A inline for net-new content, Shape B transclude for content already living under an intent.md anchor. See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §10.
5. **Appends to `research.md`** when new external data is consulted. Re-fetched values strike through the old entry and add a new dated one. Preserves the audit trail.

## What This Skill Does NOT Do

- **Does not touch the PRD itself.** That's [`prd-apply`](../prd-apply/SKILL.md)'s job. Clarify only writes to the proposal folder.
- **Does not run on archived proposals.** Archived proposals are read-only history (see [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5.3). Corrections go through a new proposal.
- **Does not auto-revert applied work.** Removing a task does not undo a PRD change apply already made. If the user wants applied content reverted, add an explicit reverse task. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6.6.
- **Does not refresh external data automatically.** A clarify session is a clarify session, not a refresh. If data has gone stale enough to matter, that's a new proposal.

## The Strikethrough Rule

| Task state | Clarify behavior |
|---|---|
| `- [ ] foo` (unchecked) | Edit or delete freely. Nothing shipped yet; no audit trail to preserve. |
| `- [x] foo` (checked) | Strike through the original; add a new task with the correction. |
| `- [x] ~~foo~~` (already superseded) | Leave as-is — historical record. |
| `- [ ] ~~foo~~` (pre-apply supersession) | Rare; leave as-is. |

Example:

```markdown
- [x] ~~Add rule "session timeout = 30min" to section 7.2~~
- [ ] Update section 7.2: change session timeout rule from 30min to 60min — user feedback indicated 30min was too aggressive
```

Ergonomic detail: keep struck-through tasks grouped (probably at the bottom of their section, or under a small "Superseded" subhead) so unchecked items stay visually prominent. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6.5.

`intent.md` does NOT use strikethrough — prose should reflect current understanding; the audit trail lives in git.

## Transclusion Lock-In

Shape B transclusion tasks (`- [x] Section X.Y: transclude intent.md#<anchor>`) **snapshot intent.md content into the corpus at apply time**. Subsequent edits to intent.md do NOT silently propagate to the corpus.

To propagate an intent.md edit into the corpus, clarify follows the strikethrough rule and adds an explicit re-transclude task:

```markdown
- [x] ~~Section 5.2: transclude intent.md#short-sitting-list-keeper~~
- [ ] Section 5.2: re-transclude intent.md#short-sitting-list-keeper
      — added mobile-only users to persona scope
```

Why this matters: without lock-in, intent.md becomes a live edit surface — any tweak silently rewrites the corpus on next apply, leaving the audit trail with a hole (no corresponding `[x]` task). Lock-in preserves both intent.md's freedom to evolve (§6.3) and tasks.md's "applied tasks are facts" semantic (§6.3).

Heading renames in intent.md follow the same pattern: if you rename `### Short-sitting list-keeper` to something else, every transclusion task pointing at the old anchor must be struck through, and replacements added under the new anchor. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3.6 and §6.7.

## Why-Note Convention

Clarify-generated tasks carry a short why-note when the prompt for the change isn't visible from the task content alone. Format: an em dash and a short phrase appended to the task line (or, if the task body is multi-line, on its own indented line under the body).

| Task origin | Why-note required? |
|---|---|
| Propose-generated (initial capture) | No — no prior state to motivate against |
| Re-transclude (Shape B) | **Required** — Shape B doesn't show prose, so the diff is invisible |
| Supersession of an inline (Shape A) task | **Recommended** — diff often implies why, but a note makes it explicit |
| Brand-new task added during clarify | **Recommended** — explains what prompted the addition |
| Pure-typographical cleanup (Shape A) | Optional — diff explains itself |

Keep it short — one phrase, not a paragraph. The note is for human audit, not for apply; apply ignores why-notes when executing.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6.8 and [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §12.

## The Clarify Flow

1. **Locate.** Run [`list-proposals.ts`](../prd/scripts/list-proposals.ts) (and [`proposal-status.ts`](../prd/scripts/proposal-status.ts) for task counts). Pick the proposal; use resume-list phrasing if ambiguous.
2. **Read current state.** `intent.md`, `tasks.md`, `research.md` if present. The agent works from current content, not assumptions.
3. **Interview, lightly.** Open-ended; no fixed phases. Load-bearing pushback still applies if a clarification touches problem/users/success/capability (per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §7).
4. **Reflect in product language.** Same translation rule as propose — implementation-flavored input gets reflected as user-visible behavior before being captured (see [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3).
5. **Update files.** `intent.md` gets rewritten as needed; `tasks.md` respects the strikethrough rule; `research.md` gets new entries appended.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §3.6 (intent.md anchors), §5 (lifecycle), §6 (strikethrough, lock-in, why-notes), §7.3 (task shapes), §11 (external sources), §12 (interview).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) — writing principles, load-bearing sections, resume-prompt phrasing, implementation-language patterns, intent.md anchors (§9), two task shapes (§10), transclusion lock-in (§11), why-note convention (§12).
