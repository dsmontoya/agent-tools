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
  version: "0.1.0"
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
2. **Modifies `intent.md` freely.** Prose; rewrite as understanding improves. No strikethrough — the audit trail lives in git history, not in the file.
3. **Applies the strikethrough rule to `tasks.md`** when modifying tasks that have already been applied. Unchecked tasks can be edited or deleted freely; checked tasks must be struck through, with a replacement task added beneath.
4. **Appends to `research.md`** when new external data is consulted. Re-fetched values strike through the old entry and add a new dated one. Preserves the audit trail.

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
- [ ] Update section 7.2: change session timeout rule from 30min to 60min
```

Ergonomic detail: keep struck-through tasks grouped (probably at the bottom of their section, or under a small "Superseded" subhead) so unchecked items stay visually prominent. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6.5.

`intent.md` does NOT use strikethrough — prose should reflect current understanding; the audit trail lives in git.

## The Clarify Flow

1. **Locate.** Run [`list-proposals.ts`](../prd/scripts/list-proposals.ts) (and [`proposal-status.ts`](../prd/scripts/proposal-status.ts) for task counts). Pick the proposal; use resume-list phrasing if ambiguous.
2. **Read current state.** `intent.md`, `tasks.md`, `research.md` if present. The agent works from current content, not assumptions.
3. **Interview, lightly.** Open-ended; no fixed phases. Load-bearing pushback still applies if a clarification touches problem/users/success/capability (per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §7).
4. **Reflect in product language.** Same translation rule as propose — implementation-flavored input gets reflected as user-visible behavior before being captured (see [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3).
5. **Update files.** `intent.md` gets rewritten as needed; `tasks.md` respects the strikethrough rule; `research.md` gets new entries appended.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5 (lifecycle), §6 (strikethrough), §11 (external sources), §12 (interview).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) — writing principles, load-bearing sections, resume-prompt phrasing, implementation-language patterns.
