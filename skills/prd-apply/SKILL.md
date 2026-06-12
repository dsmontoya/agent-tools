---
name: prd-apply
description: |
  Use to execute the unchecked tasks in an active proposal's tasks.md
  against the PRD corpus. Idempotent — only processes `- [ ]` tasks
  (not `- [x]` or struck-through). Writes to PRD files. Surfaces
  discrepancies if the corpus has changed unexpectedly since the
  proposal was written. Triggers: /prd-apply, "apply the proposal",
  "run apply on user-onboarding". NEVER auto-triggers from natural
  language alone — too consequential to infer; always explicit
  invocation or confirmed user response.
license: Apache-2.0
metadata:
  author: daniel
  version: "0.1.0"
---

# prd-apply — Execute Proposal Tasks Against the Corpus

Takes a proposal's `tasks.md`, executes each unchecked task against the corpus, marks tasks `[x]` as it goes. Idempotent: re-running on an unchanged proposal is a no-op.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §7 for the apply loop and §6 for the strikethrough rule that determines which tasks apply touches.

## When to Use

| Signal | Skill |
|---|---|
| Proposal exists, tasks are ready, user wants to write to the PRD | **prd-apply** |
| User says "apply the proposal" | **prd-apply** |
| Tasks still need refinement | `prd-clarify` |
| Want to preview before applying | `prd-verify` (read-only) |
| Proposal is fully applied, ready to close | `prd-archive` |

## Triggers

**Never auto-triggers from natural language alone.** Writes to the PRD are consequential — always explicit `/prd-apply` or confirmed user response after the agent surfaces what would happen. See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §2.2.

## What This Skill Does

1. **Locates the proposal.** Active proposal in `<root>/changes/`. If many, show the resume list (per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §4). If one, use it. If none, tell the user.
2. **Reads `tasks.md`.** Identifies unchecked, non-struck tasks via [`proposal-status.ts`](../prd/scripts/proposal-status.ts). Each task names one file, one section, one operation, one concrete change — that granularity is required (see [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §7.1).
3. **Re-reads the PRD before writing.** For each task, reads the current content of the affected file/section. If the world has changed unexpectedly (another proposal applied in the interim, manual user edit), surfaces the discrepancy rather than blindly executing.
4. **Checks read-only paths.** Runs [`check-readonly.ts`](../prd/scripts/check-readonly.ts) for each target. If a task would write to a read-only path, skip it and surface — propose should not have generated such a task, but enforce defensively.
5. **Executes the change.** Edits the PRD file. Preserves existing formatting verbatim — heading depth, list style, paragraph spacing, fence style — to match surrounding content. Template defaults apply only when apply *creates* a new section.
6. **Self-checks for implementation language before writing.** Strip or rephrase any implementation specifics that slipped through interview translation (CRITICAL tier — code, SQL, endpoints, internal structures). See [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3.
7. **Marks the task `[x]`.** After successful execution.

## What This Skill Does NOT Do

- **Does not modify `intent.md` or `tasks.md` beyond marking tasks done.** Refinement belongs to [`prd-clarify`](../prd-clarify/SKILL.md). Apply only touches the checkbox.
- **Does not archive.** Archive is a separate explicit step ([`prd-archive`](../prd-archive/SKILL.md)). Apply leaves the proposal active even when every task is checked.
- **Does not run verify or audit.** Quality gates live at archive (pre-flight verify per [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5.3), or are invoked explicitly. Apply's role is pure: tasks in, edits out, checkboxes flipped.
- **Does not blindly execute when the corpus has drifted.** If a task says *"change rule X to Y"* but X is no longer present, surface the discrepancy and ask before proceeding.
- **Does not run git commands.** Filesystem only.

## What Apply Processes

| Task state | Action |
|---|---|
| `- [ ] foo` | Execute → mark `- [x] foo` |
| `- [x] foo` | Skip — already applied |
| `- [x] ~~foo~~` | Skip — applied then superseded |
| `- [ ] ~~foo~~` | Skip — pre-apply supersession |

This is what makes apply idempotent. Re-running on an unchanged proposal does nothing.

## Discrepancy Handling

When the agent re-reads a PRD section and finds it doesn't match what `tasks.md` assumes:

> *"Task 3 says change session timeout from 30min to 60min in section 7.2, but section 7.2 currently says 45min. The corpus has drifted from what this proposal expected. Apply anyway as written, edit the task to reflect current state, or pause for clarify?"*

Three resolutions:

- **Apply as written** → write 60min (overrides current 45min).
- **Edit the task** → rewrite the task in `tasks.md` to reflect current state, then apply.
- **Pause for clarify** → leave the task unchecked; hand off to [`prd-clarify`](../prd-clarify/SKILL.md).

Never overwrite silently. The audit trail depends on the proposal accurately reflecting what apply did.

## The Apply Loop

The lifecycle `propose → apply → clarify → apply → clarify → apply → archive` is supported with no special handling. Each apply pass processes only unchecked tasks; clarify can add new tasks or strike through old ones; the next apply picks up only the newly-unchecked entries.

## Output

For each applied task, surface a short line:

```
[x] Section 7.2: change session timeout from 30min to 60min
    → onboarding.md
```

At end, if every task is done:

> *"All tasks applied. Run `prd-archive` to close the proposal — it'll pre-flight verify first."*

If tasks remain (e.g., skipped due to discrepancies or read-only paths):

> *"3 of 5 tasks applied. 1 skipped (read-only target); 1 paused (discrepancy in section 7.2). Run `prd-clarify` to refine."*

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §6 (strikethrough rule), §7 (apply loop), §9.3 (apply-time safety net), §13.6 (read-only).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §3 (implementation-language patterns), §4 (resume-prompt phrasing).
