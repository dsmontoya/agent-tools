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
