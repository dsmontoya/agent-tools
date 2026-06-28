# REFERENCE — Shared Rules for the PRD Skill Family

Shared content consumed by every action skill (`prd-explore`, `prd-propose`, `prd-clarify`, `prd-apply`, `prd-verify`, `prd-audit`, `prd-archive`, `prd-convert`). Each skill points here rather than redefining these rules locally — single source of truth, no drift.

For the _why_ behind every rule, see [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md). Sections below cite the design doc for jump-back.

---

## 1. Writing Principles

When an action skill writes PRD content (most relevant to `prd-apply` and `prd-convert`), it follows these principles:

- **Be specific and measurable.** Avoid vague terms like "fast," "easy," "good," "intuitive."
- **Include rationale.** Explain _why_ a decision was made, not just _what_ it is.
- **Prioritize ruthlessly.** Not everything is high priority.
- **Use declarative language.** State requirements clearly without ambiguity. Do not use Given-When-Then.
- **Consider all stakeholders.** Write for product, design, engineering, and ops.

### Content guidance is qualitative, not numeric

The template uses qualitative guidance for content ("brief," "concise," "specific") rather than imposing length caps or item counts. The agent judges what's appropriate based on context.

Numeric limits are reserved for genuine quality constraints — e.g., "exactly one number" for a success metric forces specificity. Arbitrary length caps ("2–3 paragraphs max," "3–5 items") are not used.

This applies to both interview prompts and PRD content.

---

## 2. PRDs Do Not Reference Proposals

Proposals (`intent.md`, `tasks.md`, `research.md`) are internal scaffolding. PRDs are the long-lived public artifact. The dependency only flows one way:

| Direction                                                                        | Allowed? |
| -------------------------------------------------------------------------------- | -------- |
| Proposals consume corpus artifacts (read as context, plan changes against them)  | Yes      |
| Corpus artifacts reference each other (PRD↔PRD, PRD↔glossary, PRD↔personas, ...) | Yes      |
| Corpus artifacts reference external docs (README, wiki, design specs)            | Yes      |
| Corpus artifacts reference archived proposals                                    | **No**   |

**Practical consequence:** when `prd-apply` writes corpus content, it must NOT include citations or links back to the proposal it came from. Tempting for traceability — but pollutes the corpus with internal lifecycle noise.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §3.5.

---

## 3. Implementation-Language Patterns

The skill is for _product_ definition. Implementation details (specific tech, code, schemas, internal data structures) don't belong in PRDs. Each action skill enforces this at its own fire-point; the patterns below are the shared definition.

### 3.1 Default policy

> **Allowed:** what the system does — black-box behavior, user-visible language, system-level descriptions.
> **Not allowed:** how the system does it — code, schemas, specific tech names, internal data structures.

Examples:

- "The system validates the email format and rejects invalid addresses" → allowed.
- "Use a regex `/^[^@]+@[^@]+$/` to validate" → not allowed.

> "PRDs may reference Salesforce, Stripe, and AWS — these are real integration constraints, not implementation choices.

### 3.2 Tiered patterns

| Pattern                                               | Tier     | Examples                                                          |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| Code blocks, function signatures, SQL, REST endpoints | CRITICAL | `function foo() {}`, `SELECT * FROM ...`, `POST /api/users`       |
| Internal data structures                              | CRITICAL | column names, class names, file paths, table schemas              |
| Specific tech names                                   | WARNING  | "PostgreSQL", "React", "Kafka", "Redis", "Lambda"                 |
| Implementation-flavored verbs                         | WARNING  | "refactor", "deploy", "ship a feature flag", "migrate the schema" |

### 3.3 Where each fires

| Skill                         | Fire-point                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `prd-propose` / `prd-clarify` | **Interview-time translation** — reflect implementation-flavored input back in product language before capturing intent |
| `prd-apply`                   | **Apply-time self-check** — before writing PRD content, strip/rephrase implementation specifics                         |
| `prd-verify`                  | **Verify-time detection** — flag implementation language in completed PRDs at the tier above                            |
| `prd-convert`                 | Same as `prd-verify`, but downgrades findings one tier for legacy content (CRITICAL → WARNING, WARNING → SUGGESTION)    |

### 3.4 Interview-time translation examples

| Implementation-flavored answer | Product-language reflection                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| "We'll use OAuth"              | "Users sign in with their existing identity provider — anything else?" |
| "Kafka topic for events"       | "External systems get notified when X happens. Which ones?"            |
| "Websockets for live updates"  | "Users see updates without refreshing."                                |

The implementation detail never enters captured intent.

### 3.5 Suppression via CLAUDE.md

Some PRDs legitimately reference specific tech — developer-facing APIs, real integration constraints, regulated environments. User documents the exception in `CLAUDE.md` (prose, no schema):

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §18 for the full design.

---

## 4. Resume Prompt (Shared Phrasing)

When an action skill (`prd-propose`, `prd-clarify`, `prd-apply`, `prd-archive`) is invoked while active proposals exist, and the user's intent is ambiguous, the agent surfaces a one-line summary per proposal.

### 4.1 When to show the resume list

| User intent                                           | Show resume list?     |
| ----------------------------------------------------- | --------------------- |
| Generic ("let's keep going", "what was I working on") | Yes                   |
| Names a specific slug ("continue `user-onboarding`")  | No — proceed directly |
| No active proposals exist                             | No                    |

### 4.2 Format

```
<slug> — <N> task(s), <M> done, last touched <YYYY-MM-DD>
```

Example:

```
user-onboarding   — 5 tasks, 2 done, last touched 2026-06-04
billing-revamp    — 3 tasks, 0 done, last touched 2026-06-01
```

Followed by:

> "Continue one of these, or start something new?"

### 4.3 Data source

Powered by [`../scripts/list-proposals.ts`](../scripts/list-proposals.ts) + [`../scripts/proposal-status.ts`](../scripts/proposal-status.ts). Both return structured JSON; the action skill formats the list.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §8.7.

---

## 5. Common Pitfalls

Quick checklist for action skills before writing or finalizing content:

- **Solution bias in requirements** — describe the problem, not the proposed solution.
- **Priority inflation** — marking everything "high priority."
- **Vague success criteria** — "improve adoption" without a number.
- **Missing edge cases** that are actually important design decisions.
- **Citing proposal artifacts from the PRD** — see §2 above.
- **Using template terminology in user-facing prompts** — see [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §12.1. Template language is fine inside `prd-verify` reports (offline technical doc); never inside interview prompts or clarify questions.
- **Implementation language leaking into intent** — see §3 above.

---

## 6. Skip States (Universal Rendering Rules)

Three skip states for sections without full content. The skill renders these uniformly regardless of which template is active.

| State    | How it renders                                                                |
| -------- | ----------------------------------------------------------------------------- |
| **Omit** | Section is not rendered at all. No header, no placeholder.                    |
| **N/A**  | Section header rendered, followed by one line: `N/A — <one-line reason>`.     |
| **TODO** | Section header rendered, followed by one line: `TODO — <what would unblock>`. |

- **`prd-verify`** flags `N/A —` or `TODO —` with empty/placeholder reasons as WARNING.
- **`prd-apply`** preserves existing formatting verbatim when modifying. Template defaults apply only when apply _creates_ a new section.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §12.12.

---

## 7. Load-Bearing Sections

Four concepts where shallow answers produce bad PRDs. The interview pushes back at most twice on these; everywhere else, accept-as-given.

1. **Problem statement** — what's broken or missing.
2. **Target users** — who experiences the problem.
3. **Success metric** — what specifically changes if this works (exactly one number).
4. **Top 1–2 capabilities** — what the product _does_ to solve the problem.

A useful PRD can be written with just these four. The other template sections are scaffolding.

Each template bundle maps these concepts to its template sections via `config.yaml`'s `roles:` map (see [`templates/builtin/prd/v1/config.yaml`](./templates/builtin/prd/v1/config.yaml)).

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §12.2.

---

## 8. Pushback Patterns

For load-bearing sections only. Max two pushbacks per question; if still thin, mark `TODO: needs sharpening` and move on.

| Thin answer                                         | Pushback                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Users find it confusing." (Problem)                | "Can you give one concrete example — something a specific user has actually said or done?"    |
| "Target users are everyone." (Users)                | "Even 'for everyone' has a primary persona. Who feels this problem most acutely today?"       |
| "Success is when adoption is high." (Success)       | "Specific number — 50% of active users in the first month?"                                   |
| "It lets users manage their settings." (Capability) | "Walk me through the experience — first thing they see, what they do, what changes for them?" |

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §12.5.

---

## 9. intent.md Anchor Structure

`intent.md` is structured so every atomic piece of captured content sits under its own markdown heading. The heading slug (GitHub-flavored) becomes a stable `intent.md#<slug>` anchor that `tasks.md` can reference via transclusion (§10 below).

| Top-level section          | Sub-headings                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| `## Target users`          | `### <persona-name>` per persona                                      |
| `## Product capabilities`  | `### <capability-name>` per capability                                |
| `## Boundaries`            | `### <boundary-name>` per item, or grouped prose if items are terse   |
| `## Risks`                 | `### <risk-name>` per risk                                            |
| `## Constraints`           | `### <constraint-name>` per item                                      |
| `## Phases`                | `### <phase-name>` per phase, if multi-phase                          |
| `## Problem`, `## Success metric`, `## Trigger`, `## Context` | No sub-headings required; the section heading anchors the content |

**Stability rule.** Clarify can refine the body under a heading freely. Renaming a heading invalidates any tasks pointing to it — rename-with-task-update follows the strikethrough rule (`SKILL_DESIGN.md` §6), with a why-note explaining the rename.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §3.6.

---

## 10. Two Task Shapes

Tasks come in two shapes. Both are atomic; neither asks apply to invent content.

| Shape           | Format                                                            | Used when                                                                                  |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **A — Inline** | `- [ ] Section X.Y: write: <content>` (multi-line allowed)        | Content is net-new (Rules, KRs, measurement specifics, Omit/N/A/TODO directives, multi-source synthesis) |
| **B — Transclude** | `- [ ] Section X.Y: transclude intent.md#<anchor>`             | A single intent.md heading's body is a 1:1 fit for the target section (personas, risks, problem statement, single-source capability prose) |

**Shape selection at propose / clarify time:**

- Default to Shape A when the template requires content the interview doesn't naturally produce (Rules, KR phrasings, measurement specs, skip-state directives).
- Default to Shape B when one intent.md heading's body slots cleanly into the target section.
- One task = one section change = one content unit. Three personas → three Shape B tasks.
- Never mix shapes in a single task. If a task would require both, split it.

**Apply behavior:**

- Shape A: write the inline content into the target section.
- Shape B: read the body under `intent.md#<anchor>` (heading line through the next heading at same or higher level), write it into the target section. The heading title becomes the entry label; the surrounding section's prevailing format guides rendering, consistent with §6 "match surrounding style."

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §7.3.

---

## 11. Transclusion Lock-In

Shape B tasks snapshot intent.md content into the corpus **at apply time**. Subsequent edits to intent.md do NOT silently propagate to the corpus.

To propagate an intent.md edit into the corpus, clarify follows the strikethrough rule and adds an explicit re-transclude task:

```markdown
- [x] ~~Section 5.2: transclude intent.md#short-sitting-list-keeper~~
- [ ] Section 5.2: re-transclude intent.md#short-sitting-list-keeper
      — added mobile-only users to persona scope
```

Why: corpus changes must always be tracked by a task. Allowing silent propagation would let intent.md edits change the corpus without a corresponding `[x]` task, breaking the "applied tasks are facts" semantic and the audit trail.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §6.7.

---

## 12. Why-Note Convention on Clarify-Generated Tasks

Tasks created by clarify carry a short why-note when the prompt for the change isn't visible from the task content alone. Format: an em dash and a short phrase appended to the task line (or, if the task is multi-line, on its own indented line under the body).

| Task origin                                         | Why-note required?                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Propose-generated (initial capture)                 | No — no prior state to motivate against                                       |
| Clarify-generated re-transclude (Shape B)           | **Required** — Shape B doesn't show prose, so the diff is invisible           |
| Clarify-generated supersession (Shape A inline)     | **Recommended** — diff often implies why, but a note makes it explicit        |
| Clarify-generated brand-new task                    | **Recommended** — explains what prompted the addition                         |
| Pure-typographical cleanup (Shape A)                | Optional — diff explains itself                                               |

The note is for human audit, not for apply. Apply ignores why-notes when executing.

See [`../SKILL_DESIGN.md`](../SKILL_DESIGN.md) §6.8.
