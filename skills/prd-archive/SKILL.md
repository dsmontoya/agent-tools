---
name: prd-archive
description: |
  Use to close a fully-applied proposal by moving its folder to
  changes/archive/<YYYY-MM-DD>-<slug>/. Auto-runs prd-verify as a
  pre-flight check; CRITICAL findings (unchecked tasks, broken
  cross-refs, missing required sections) block archive by default.
  Override with --abandon to archive a proposal as-is (e.g.,
  intentional abandonment). Triggers: /prd-archive, "archive the
  proposal", "close user-onboarding". NEVER auto-triggers from natural
  language alone — closing a proposal is a deliberate user action.
license: Apache-2.0
metadata:
  author: daniel
  version: "0.1.0"
---

# prd-archive — Close an Applied Proposal

Moves a proposal folder from `<root>/changes/<slug>/` to `<root>/changes/archive/<YYYY-MM-DD>-<slug>/`. The archive entry is read-only history — corrections after archive go through a new proposal.

Pre-flight verify is automatic: archive runs [`prd-verify`](../prd-verify/SKILL.md) against the proposal + its affected PRDs before moving anything. CRITICAL findings block by default; the `--abandon` flag overrides for intentional abandonment.

See [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5.3 for archive rules and §10.3 for the pre-flight design.

## When to Use

| Signal | Skill |
|---|---|
| All tasks checked or struck; user wants to close | **prd-archive** |
| User wants to intentionally abandon an unfinished proposal | **prd-archive** `--abandon` |
| Tasks remain unchecked, user wants to finish them | `prd-apply` |
| Tasks need refinement, not finishing | `prd-clarify` |
| Already archived | (no-op — archived proposals are read-only) |

## Triggers

**Never auto-triggers from natural language alone.** Closing a proposal is a deliberate action — always explicit `/prd-archive` or confirmed user response.

## What This Skill Does

1. **Locates the proposal.** If many active, use resume-list phrasing (per [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §4). If the user names a slug, jump straight to it.
2. **Runs pre-flight verify.** Invokes [`prd-verify`](../prd-verify/SKILL.md) against the proposal + the PRDs it touched. CRITICAL findings block (override with `--abandon`); WARNING and SUGGESTION findings are surfaced but do not block.
3. **Surfaces multi-PRD audit hint** when the proposal touched ≥2 PRDs — a SUGGESTION-tier note in the verify output: *"Consider running prd-audit before closing."* User opts in or out.
4. **Confirms with the user.** *"Pre-flight clean. Archive `user-onboarding` to `changes/archive/<today>-user-onboarding/`?"*
5. **Moves the folder.** `<root>/changes/<slug>/` → `<root>/changes/archive/<YYYY-MM-DD>-<slug>/`. Date is today, in absolute YYYY-MM-DD form. Filesystem move; no content changes.

## What This Skill Does NOT Do

- **Does not modify content.** Archive is a folder move. `intent.md`, `tasks.md`, `research.md` are preserved verbatim.
- **Does not silently override CRITICAL findings.** The agent surfaces findings and asks; only an explicit `--abandon` (or explicit confirmation after the agent reads the findings out loud) bypasses the block.
- **Does not modify the PRD.** Apply did that already. Archive only touches the proposal folder.
- **Does not invoke audit automatically.** When multiple PRDs were touched, audit appears as a SUGGESTION; the user invokes [`prd-audit`](../prd-audit/SKILL.md) explicitly.
- **Does not run git commands.** Filesystem move only; commits are the user's call.

## Pre-Flight Verify

Same checks as [`prd-verify`](../prd-verify/SKILL.md), with one consequence:

| Tier | Effect on archive |
|---|---|
| CRITICAL | **Blocks** archive unless `--abandon` |
| WARNING | Surfaced; doesn't block |
| SUGGESTION | Surfaced; doesn't block |

CRITICAL examples (from [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §10.2): unchecked tasks, broken cross-references, missing required sections, CRITICAL implementation language in PRD content.

## The `--abandon` Flag

Intentional abandonment is allowed — for proposals that turned out to be a bad idea, work that got superseded by a different proposal, or any case where the user wants the proposal preserved in the archive as a historical record without finishing it.

```
/prd-archive user-onboarding --abandon
```

The proposal is archived as-is. Unfinished tasks remain unchecked in the archived `tasks.md` — that's the record of what didn't ship. Verify's pre-flight still runs and the findings are still surfaced, but CRITICAL no longer blocks.

## Archive Path Format

```
<root>/changes/<slug>/                            (before)
<root>/changes/archive/<YYYY-MM-DD>-<slug>/       (after)
```

Date is the date of archive (when the change closed), not the proposal-creation date. Example: `archive/2026-06-04-user-onboarding/`.

## Archive Is One-Way

Once archived, the proposal is read-only history:

- **Clarify on an archived proposal: not allowed.** Corrections go through a new proposal.
- **Apply on an archived proposal: not allowed.**

If the user wants to "un-archive," that's a manual filesystem move outside the skill. The skill doesn't provide an `unarchive` operation by design.

## Shared References

- [`../prd/SKILL.md`](../prd/SKILL.md) — umbrella routing.
- [`../prd/SKILL_DESIGN.md`](../prd/SKILL_DESIGN.md) §5.3 (archive rules), §10.3 (pre-flight verify), §10.2 (report tiers).
- [`../prd/references/REFERENCE.md`](../prd/references/REFERENCE.md) §4 (resume-prompt phrasing).
