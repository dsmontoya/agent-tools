# PRD Skill — Design Notes

Working notes for the product-requirements-document skill. Captures decisions made during the design conversation. Living document — update as we go.

---

## 1. Purpose

Help users author and maintain Product Requirements Documents through an **interview-driven, iterative, multi-skill workflow**. Inspired by OpenSpec's spec-driven development model, adapted for PRDs (which are more iterative than engineering specs because they capture evolving product intent, not just code changes).

The canonical PRD structure lives in [`TEMPLATE.md`](./TEMPLATE.md). The template is **comprehensive but selectively applied** — most PRDs won't use all 12 sections. The skill teaches the agent to omit sections that don't apply rather than mechanically filling every bracket.

---

## 2. The Multi-Skill Architecture

The workflow is split across eight discrete action skills plus one umbrella skill. Each has a single, clear purpose. Skills don't blur into each other.

| Skill | Optional? | Writes to | Mental mode |
|---|---|---|---|
| **prd** (umbrella) | Yes | Nothing | Entry point for vague queries about the PRD workflow; hosts shared references; routes users to the right action skill |
| **explore** | Yes | Nothing (conversation only) | Open-ended problem exploration; mirrors OpenSpec's `/opsx:explore`; no artifacts; transitions to propose when ready |
| **propose** | No | `intent.md` + `tasks.md` + `research.md` (creates; research conditional) | Interview from scratch — gather initial intent |
| **clarify** | Yes | `intent.md` + `tasks.md` + `research.md` (modifies; may create research) | Refine an existing proposal — resolve TBDs, add tasks, respond to redirects |
| **apply** | No | PRD file(s) | Idempotent execution — process unchecked tasks, check them off |
| **verify** | Optional but recommended | Nothing (reports only) | Single-PRD or single-proposal inspection — completeness, correctness, coherence |
| **audit** | Optional but recommended | Nothing (transient report) | Cross-PRD inspection — terminology drift, persona alignment, capability overlap, cross-reference integrity. See section 14. |
| **archive** | No | Moves folder | Mark proposal closed; preserve audit trail |
| **convert** | Specialized (one-shot, legacy PRDs only) | Produces a proposal (then standard apply) | Bring an existing PRD into template-shaped form. See section 13.7. |

**Linearity by default.** Most proposals flow `propose → apply → archive` without clarify or verify. The extra skills exist for the genuine cases that need them.

**Key separations:**
- `apply` never touches `intent.md` / `tasks.md`.
- `clarify` never touches the PRD.
- `verify` never writes anything.
- `archive` never modifies content — just moves folders.

### 2.1 Naming and file structure

All skills use the **`prd-` prefix** and live as flat top-level skills. Claude Code does not currently support nested skill hierarchies — only `.claude/skills/<name>/SKILL.md` is discovered.

```
.claude/skills/
  prd/                          # umbrella skill — vague-intent routing + shared references
    SKILL.md
    references/
      TEMPLATE.md
      REFERENCE.md              # writing principles, validation rules, pitfalls, format spec
      glossary-template.md
      personas-template.md
  prd-explore/SKILL.md
  prd-propose/SKILL.md          # references ../prd/references/
  prd-clarify/SKILL.md
  prd-apply/SKILL.md
  prd-verify/SKILL.md
  prd-audit/SKILL.md
  prd-archive/SKILL.md
  prd-convert/SKILL.md
```

Why `prd`:
- Universally-known initialism in product/eng; no jargon barrier for the target audience.
- Short enough that explicit slash invocation reads cleanly (`/prd-propose`).
- Doesn't overpromise like `product` would (PRDs are documents, not product management broadly).

**Shared references live in the umbrella `prd/` skill folder.** All action skills point to `../prd/references/` for the template, validation rules, writing principles, glossary template, and personas template. Single source of truth — change `TEMPLATE.md` once and every skill sees it. The umbrella skill itself does no work — it exists to host references and serve as a vague-intent entry point (when the user says "tell me about your PRD workflow" without specifying an action).

### 2.2 Triggers and invocation

Skills are invokable two ways, using **the same skill name** for both:

| Invocation | Example | When |
|---|---|---|
| Natural language | "let's update the onboarding PRD" → `prd-propose` triggers | User describes intent without slash |
| Explicit slash | `/prd-propose` | User wants to be unambiguous |

No separate `.claude/commands/` files. OpenSpec generates parallel slash commands (`opsx:archive`) because its skill names are unwieldy (`openspec-archive-change`); ours aren't. One artifact per skill, two ways to invoke it.

**Trigger priority** when signals conflict:

1. **Explicit slash command** — always wins; never overridden by other signals.
2. **User reference to a specific artifact** (proposal slug or PRD path) — wins over generic language.
3. **Filesystem state** (active proposals, PRDs in `<dir>/`) — used to disambiguate, never decides alone.
4. **Natural language match against skill descriptions** — last; always confirmed before any artifact is created.

**What never auto-triggers from natural language alone** (always explicit slash or confirmed user response):

- `prd-apply` — writes to the PRD; too consequential to infer.
- `prd-audit` — corpus-wide scan; user should know it's running.
- `prd-archive` — closes the proposal; user must explicitly request.
- `prd-convert` — heavy rewrite; always explicit.

`prd-propose` and `prd-clarify` can auto-trigger because they only write to the proposal folder (not the PRD). `prd-verify` can auto-trigger because it's read-only and scoped to a single artifact.

**Ambiguity handling.** When user input could mean multiple things (e.g., "update the onboarding PRD" — propose new vs clarify existing vs bypass skill), the agent:

1. Checks filesystem for active proposals affecting the named PRD.
2. If an active proposal exists: asks "continue the existing proposal `<slug>`, or start a separate one?"
3. If none exists: confirms "start propose for `<path>`?" before any artifact is created.
4. Never directly edits PRD files outside the skill flow — that defeats the audit trail.

**Cross-skill switching mid-flow.** If the user is in `prd-propose` and asks for a verify ("can you check the existing PRD first?"), the agent stays in propose and offers verify as a parallel option:

> "I can run verify on `onboarding.md` once we're done capturing this. Or pause and verify now — your call."

Default: stay in the current skill. Cross-skill jumps are user-initiated, not agent-initiated.

---

## 3. Artifacts

Two layers of files:

- **Proposal scaffolding** — `intent.md`, `tasks.md`, `research.md`. Fixed by the skill; covered in this section.
- **Corpus artifacts** — PRDs, glossary, personas, OKRs, ... Declared by the active template bundle; covered in section 17.

This section covers proposal scaffolding only.

### 3.1 Per-proposal artifacts

Every proposal produces these files in `<dir>/changes/<slug>/`:

- **`intent.md`** — Captured facts and rationale from the interview. Evolves freely during clarify (rewrite as understanding improves). Source of *why*.
- **`tasks.md`** — Concrete file-by-file, section-by-section edits to be applied. Source of *what*. The executable artifact.
- **`research.md`** (conditional) — Raw evidence from external sources. Created only when external data was consulted. See section 3.4.

### 3.2 Naming

We picked `intent.md` (not `proposal.md`) to avoid the `proposals/<slug>/proposal.md` stutter. The folder name carries the "proposal" semantic; the inner file states what it contains.

### 3.3 Proposal as audit-and-redirect artifact

The proposal's primary purpose is **transparency**: a visible trace of what the agent has decided to capture and where it intends to put it, so the user can intervene *before* anything touches the PRD. It is NOT a planning doc, NOT a team-alignment doc, NOT an engineering spec.

The PRD itself remains the long-lived artifact for team alignment, decision record, and source of truth — produced post-apply.

### 3.4 research.md (conditional)

Lives at `<dir>/changes/<slug>/research.md`. Created on-demand when external data sources are consulted. Holds the *evidence* underlying `intent.md`'s claims.

- **Purpose**: separate raw findings (what sources said) from synthesis (what we concluded). Keeps `intent.md` clean of pasted text and citations.
- **Conditional creation**: no external data → no file. The presence of `research.md` itself signals "this proposal grounded its claims in external sources."
- **Can emerge mid-flow**: a proposal can start without it; if clarify pulls real numbers later, the file is created then.
- **Structure**: per-source entries — topic, source identifier, fetched date, finding. Free-form prose allowed; structure is a guide not a schema.

**Citation chain**: PRD → `intent.md` → `research.md` → real-world source.

**Maintenance during clarify**: same strikethrough pattern as `tasks.md`. New findings append; re-fetched values strike through the old entry and add a new dated one. Preserves the audit trail.

**Boundary rule**: `research.md` is what the source said. `intent.md` is what we concluded from it. If the agent is tempted to write "this means we should…" in `research.md`, that belongs in `intent.md` instead.

Example:

```markdown
# Research

## Analytics: trial-to-paid conversion
Source: Mixpanel "trial-funnel" dashboard
Fetched: 2026-06-04
Finding: 32% conversion; drop-off concentrated days 4-7.

## ~~OKRs: 2026 Q3 plan (2026-06-04)~~
~~Source: Notion "2026 Q3 plan" doc~~
~~Finding: Retention OKR is "improve trial-to-paid by 10pp by EOQ".~~

## OKRs: 2026 Q3 plan (2026-06-08, re-checked)
Source: Notion "2026 Q3 plan" doc
Fetched: 2026-06-08
Finding: OKR updated to "improve trial-to-paid by 8pp by EOQ" (target softened).
```

### 3.5 One-way dependency

Proposals consume corpus artifacts as context. **Corpus artifacts do NOT reference proposals.**

| Direction | Allowed? |
|---|---|
| Proposals consume corpus artifacts (read as context, plan changes against them) | Yes |
| Corpus artifacts reference each other (PRD↔PRD, PRD↔glossary, PRD↔personas, ...) | Yes |
| Corpus artifacts reference external docs (README, wiki, design specs) | Yes |
| Corpus artifacts reference archived proposals | **No** |

Proposals are internal scaffolding for the agent + user during a change. Once archived, they're audit history, not public documentation. Corpus artifacts must stand on their own — readers shouldn't need to learn the proposal lifecycle to understand the product.

**Practical consequence**: when apply writes corpus content, it must NOT include citations or links back to the proposal it came from. Tempting for traceability — but pollutes the corpus with internal lifecycle noise.

Content writing principles (specificity, declarative language, no vague terms, etc.) live in `SKILL.md`, not here. `SKILL_DESIGN.md` is for design decisions; writing principles are skill instructions.

---

## 4. Directory Structure

```
<repo-root>/
  .prd.yaml                          # routing config (4.2)
  <dir>/                              # configurable; default `docs/prds/`
    feature-one.md                    # corpus artifacts — declared by the
    feature-two.md                    # active template bundle's config.yaml
    glossary.md                       # (section 17.3). Layout shown is the
    personas.md                       # built-in bundle's default.
    changes/
      <slug>/                         # proposal scaffolding — skill-fixed
        intent.md
        tasks.md
      archive/
        <YYYY-MM-DD>-<slug>/          # post-archive
          intent.md
          tasks.md
```

### 4.1 Resolving `<dir>`

Three-layer resolution:

1. User explicitly tells the agent (one-shot or session-scope).
2. Agent reads `.prd.yaml` at repo root.
3. If no config: agent searches conventional locations (`docs/prds/`, `docs/product-requirement-documents/`, `prds/`); if found, uses that and offers to write the config. If none: agent proposes a default (`docs/prds/`) and asks.

The config gets created on first use, not as a precondition.

### 4.2 Config format

`.prd.yaml` at repo root. Routing only — picks the template + version, sets the corpus root, optionally lists read-only paths. Minimal form:

```yaml
root: docs/prds
template: builtin/prd@1            # omittable; defaults to the latest built-in
```

Optional `read_only:` for legacy PRD paths (section 13.2). See section 17.9 for the full scope of what `.prd.yaml` owns vs what belongs in the template bundle.

### 4.3 Slug derivation

Agent proposes from feature name, user confirms. E.g., "User Onboarding Flow" → `user-onboarding-flow`. On conflict with an existing in-flight slug: agent suggests an alternative or asks if this is a continuation.

---

## 5. Lifecycle

### 5.1 States

There is no `status:` field. State is **inferred from filesystem and `tasks.md` content**:

- **Active** — folder is in `<dir>/changes/<slug>/`.
  - **Draft** — all tasks unchecked, no apply has run.
  - **Partially applied** — some tasks checked.
  - **Fully applied, awaiting archive** — all tasks checked (or struck through).
- **Archived** — folder lives in `<dir>/changes/archive/<YYYY-MM-DD>-<slug>/`. Read-only.

### 5.2 Transitions

- `propose` → creates `changes/<slug>/`.
- `apply` → processes unchecked tasks; updates PRD; checks tasks.
- `clarify` → modifies `intent.md` and/or `tasks.md` (see Section 6).
- `archive` → moves `changes/<slug>/` to `changes/archive/<YYYY-MM-DD>-<slug>/`.

### 5.3 Archive rules

- **Auto-archive disabled.** Apply does NOT archive. User triggers archive explicitly (or agent proposes — user confirms — never archives unprompted).
- **Archive auto-runs verify as a pre-flight check.** Read-only, fast, scoped to the proposal + its affected PRD(s). CRITICAL findings (unchecked tasks, broken cross-references, missing required sections) **block archive by default**. User can override with `--abandon` to archive a proposal as-is — unfinished work is preserved in the archive folder as a record. Verify's completeness check subsumes the previous standalone "unchecked tasks" warning (unchecked tasks now appear as a CRITICAL finding).
- **Archive is one-way.** Once archived, the proposal is read-only history. Corrections go through a new proposal. (Same rule as for clarify-on-archived: not allowed.)
- **Apply after archive: not allowed.**

### 5.4 Archive date

Uses the date of archive (when the change closed), not the proposal-creation date. Format: `YYYY-MM-DD`. Example: `archive/2026-06-04-user-onboarding/`.

---

## 6. Task Modification (the Strikethrough Rule)

### 6.1 The rule

| Task state | Clarify behavior | Reason |
|---|---|---|
| Unchecked (`- [ ] foo`) | Edit or delete freely | Hasn't shipped yet; no audit trail to preserve |
| Checked (`- [x] foo`) | Strikethrough the original + add a new task | The original *did* ship; the file should reflect that history |

### 6.2 Apply's rule

Apply processes **only `- [ ] foo`** — unchecked AND not strikethrough. It skips:
- `- [x] foo` (already applied)
- `- [x] ~~foo~~` (applied then superseded — audit marker)
- `- [ ] ~~foo~~` (pre-apply supersession — rare but possible)

### 6.3 Why this matters

- Applied tasks are facts. Clarify never rewrites facts; it adds new tasks that supersede them.
- The audit trail lives in `tasks.md` itself — a future reader can reconstruct what shipped, what was superseded, and what's pending without git blame.
- `intent.md` does NOT use strikethrough. Prose should reflect current understanding; its audit trail lives in git history.

### 6.4 Example

```markdown
- [x] ~~Add rule "session timeout = 30min" to section 7.2~~
- [ ] Update section 7.2: change session timeout rule from 30min to 60min
```

### 6.5 Ergonomic detail

Clarify keeps struck-through tasks grouped together (probably at the bottom of their section or under a small "Superseded" subhead) so unchecked items stay visually prominent.

### 6.6 Undo isn't free

Removing a task in clarify does NOT auto-revert applied work. If apply has written something and the user wants it undone, clarify must add an explicit reverse task.

---

## 7. Idempotent Apply

### 7.1 Task granularity

Every task in `tasks.md` is **atomic** — specific enough that apply can execute it without asking the user anything. Concretely, each task names:

1. **One file** (e.g., `onboarding.md`)
2. **One section** (e.g., `7.2 Session Rules`)
3. **One operation** (add / modify / remove)
4. **One concrete change** (e.g., "from 30min to 60min")

If any of those is missing or vague, the task is too coarse.

| Too coarse | Better |
|---|---|
| `- [ ] Update section 7.2` | `- [ ] Section 7.2: change session timeout rule from 30min to 60min` |
| `- [ ] Rewrite capabilities` | `- [ ] Section 6.1: add capability "Bulk export to CSV" after "Single record export"` |
| `- [ ] Add risks` | `- [ ] Section 10: add risk "Auth provider rate limits during peak signup"` |

Granularity matters for three reasons:

1. **Preview before apply.** The user reads `tasks.md` to see what's about to change. Coarse tasks tell them nothing.
2. **Apply doesn't invent details.** Apply re-reads the PRD section and executes the change. A vague task forces apply to guess — exactly what we're trying to avoid in PRD content.
3. **Audit trail stays meaningful.** When clarify strikes through a checked task, the original needs to record what actually happened. `~~Update section 7.2~~` is meaningless history; `~~change timeout from 30 to 60~~` is real history.

Quick check: if apply would have to ask "what specifically?" to execute a task, the task is too coarse — split it into N atomic tasks.

### 7.2 Apply loop

Apply can run multiple times in sequence:

1. Reads `tasks.md`.
2. Identifies unchecked, non-struck tasks (using `scripts/proposal-status.ts`).
3. For each: re-reads the relevant PRD file (so it sees current state, not stale assumptions), executes the change, marks the task `[x]`.
4. Surfaces discrepancies if the PRD has changed unexpectedly (e.g., a task says "change rule X to Y" but X is no longer present).

This makes the workflow resilient: `propose → apply → clarify → apply → clarify → apply → archive` is supported with no special handling.

---

## 8. Detection and Resumability

### 8.1 Filesystem is the tracking

No state file, no daemon, no global registry. The presence of `<dir>/changes/<slug>/` *is* the signal that work is in flight.

### 8.2 Lazy detection

Detection happens when one of the workflow skills is invoked:

- `propose` — checks for slug conflicts and possible collisions with active proposals.
- `clarify` / `apply` / `verify` — list active proposals (`<dir>/changes/*/` minus `archive/`). If one: use it. If many: ask which. If none: tell the user.
- `archive` — list active proposals; ask which.

### 8.3 Status inference

No `status:` field needed. Read `tasks.md` and count `[ ]` vs `[x]` vs `~~...~~` to infer state. Done via `scripts/proposal-status.ts` (section 19).

### 8.4 No mtime tracking

We don't track last-modified in `intent.md` frontmatter. Filesystem mtime is good enough.

### 8.5 Forgotten proposals

Pure lazy. If the user forgets they have a pending proposal, the agent doesn't surface it until a relevant skill runs. (A `/prd-status` convenience skill could be added later; not in scope for v1.)

### 8.6 Version control

The skill is git-agnostic. It writes and reads files; it does not run git commands, suggest commits, or ship `.gitignore` recommendations for `changes/`.

Users decide their own workflow — commit drafts as they go for audit-trail visibility, gitignore `changes/<slug>/` until applied for cleaner history, use branches for proposal review, or follow whatever convention their team already has.

Lifecycle transitions (propose, apply, archive) are pure filesystem operations. The skill never invokes git directly — no auto-commits at lifecycle boundaries, no prompts asking *"want me to commit?"*. Version control stays entirely in the user's domain.

### 8.7 Resume prompt

When an action skill (`prd-propose`, `prd-clarify`, `prd-apply`, `prd-archive`) is invoked while active proposals exist, the agent surfaces a one-line summary per proposal — but only when the user's intent is ambiguous.

**When to show the resume list:**

- User intent is generic ("let's keep going", "what was I working on") → show.
- User intent is unambiguous and matches a specific slug ("continue `user-onboarding`") → skip; proceed directly to the named proposal.

**One-line status format:**

```
<slug> — <N total tasks>, <M done>, last touched <YYYY-MM-DD>
```

Example:

```
user-onboarding   — 5 tasks, 2 done, last touched 2026-06-04
billing-revamp    — 3 tasks, 0 done, last touched 2026-06-01
```

Powered by `scripts/list-proposals.ts` + `scripts/proposal-status.ts` (section 19). No LLM cost beyond the question that follows.

**Shared phrasing.** The resume-prompt template lives in the umbrella skill's `REFERENCE.md` so all action skills use identical wording — avoids drift between skills.

**No separate "resume" skill.** Resume is a startup behavior of any action skill, not its own action.

---

## 9. Multiple In-Flight Proposals

Allowed. `<dir>/changes/` can contain several active subdirectories simultaneously.

### 9.1 Collision detection

At **propose time only** (cheapest intervention point):

1. List active proposals.
2. Read each `tasks.md` to extract target files + sections (textual collision check).
3. Read first paragraph(s) of each `intent.md` to detect topical overlap (semantic collision check — judgment-based).
4. Surface findings to the user.

### 9.2 Resolution

Always **ask**, never auto-merge:

- "This overlaps with active proposal `auth-improvements` (modifies same sections). Continue that, or proceed separately?"
- If "continue": switch into clarify mode for the existing proposal.
- If "separate": proceed; agent adds a cross-reference note to `intent.md` linking the related proposal. Useful for future audit.

### 9.3 Apply-time safety net

Each task re-reads the PRD before executing. If the world has changed (because another proposal applied in the interim), surface the discrepancy. Don't blindly execute.

### 9.4 No formal dependency tracking

No `depends_on:` or `blocks:` fields in proposals. KISS — detect, surface, ask. The user decides.

---

## 10. Verify Skill

**Scope: single PRD or single proposal.** For cross-PRD consistency checks (terminology drift, persona alignment, capability overlap across multiple PRDs), use `prd-audit` (section 14). The two skills are sibling read-only inspections with different scopes — verify is intra-doc; audit is inter-doc.

### 10.1 Three dimensions

| Dimension | What it checks |
|---|---|
| **Completeness** | All tasks checked or struck; no leftover `[TBD]` markers; cross-references resolve; glossary refs valid; citations in `intent.md` resolve to entries in `research.md` |
| **Correctness** | Template structure followed; rules declarative (not Given-When-Then); priorities from valid set (High/Medium/Low); goals have key results with baseline/target/frequency; vague-language detection ("fast," "easy," "good," "intuitive"); N/A sections explicitly marked |
| **Coherence** | Capabilities trace to goals; functional requirements support capabilities; personas referenced in capabilities exist in Target Users; phases reference real features; cross-PRD changes don't contradict refs |

Plus a **fourth dimension specific to proposal-driven changes: proposal alignment** — does the PRD reflect what `tasks.md` said it would?

### 10.2 Report tiers

| Tier | Examples | Blocks archive? |
|---|---|---|
| **CRITICAL** | Unchecked tasks; broken cross-refs; missing required sections | Yes (with explicit override) |
| **WARNING** | Vague success criteria; orphan capabilities; missing rationale | No |
| **SUGGESTION** | Style polish; missing optional sections that would add value; stale `research.md` entries (>90 days) | No |

### 10.3 When to run

| Timing | Trigger |
|---|---|
| Pre-apply (preview) | User-initiated only; not auto-run |
| Post-apply, pre-archive | **Auto-run via `prd-archive`'s pre-flight** — see section 5.3 |
| Standalone on any PRD | User-initiated; useful for quality audit on legacy docs |

The post-apply/pre-archive timing is NOT silently inserted by `prd-apply` — apply only writes; verify only runs as a deliberate gate at archive time (or when the user explicitly asks). This keeps apply's role pure.

### 10.4 What verify does NOT do

It does NOT check code (we have no code). Our coherence is purely intra-document (and inter-PRD for cross-references), not cross-artifact-to-implementation. This is the key difference from OpenSpec's verify.

---

## 11. External Sources

The skill supports consulting external data sources (analytics, existing docs, MCPs) but treats this as opt-in and audit-friendly.

### 11.1 Where source-related info lives

| Where | What goes there |
|---|---|
| `CLAUDE.md` (user-authored) | Natural-language guidance: "For revenue numbers check Looker. For product analytics use Mixpanel. Ask before searching the web for competitive intel." |
| `research.md` (skill-generated) | Raw findings actually consulted during the proposal — see section 3.4. |

The `.prd.yaml` config stays minimal — it does NOT carry source guidance. YAML is for structural facts (paths), not for prose.

### 11.2 The principle

External data is **opt-in, surfaced, and cited.** Three rules:

1. **Surface before fetching.** Agent tells the user what it's about to consult and gets a nod. No auto-fetch.
2. **Cite in `research.md`.** Every fetched value gets an entry with source + timestamp + finding.
3. **Degrade gracefully.** When a source isn't available (no MCP, no access, broken URL), agent asks the user to paste or marks the field TODO.

### 11.3 How the agent discovers sources

In order of cost / priority:

1. **`CLAUDE.md`** — loaded automatically; respect any guidance there.
2. **Available MCPs in the session** — Linear, Notion, Drive, Mixpanel, etc. Note them as options.
3. **Light repo scan** — `docs/`, `research/`, `OKRs.md`, `metrics.md`. Just to know what's around.
4. **Ask the user** when unclear.

### 11.4 Soft proactive helper

If the agent finds itself asking the user where to find a kind of data repeatedly, it can offer:

> "Want to add a line to `CLAUDE.md` so I remember next time? Something like 'For product metrics, check Mixpanel.'"

Makes the skill self-improving without imposing a config schema. The agent never edits `CLAUDE.md` without explicit user consent.

### 11.5 Apply does NOT re-verify external data

Data captured at interview time is a snapshot. If it goes stale, a new proposal updates it. Apply executes tasks against the PRD; it doesn't re-fetch.

### 11.6 Don't reconcile conflicting sources

If Mixpanel says 32% and Looker says 30%, the agent reports both and asks which to use. Never averages, never silently picks.

### 11.7 Scope discipline

External data is seductive — the agent can spend an hour pulling docs instead of finishing the interview. Rule: fetch in service of *the current question*, then return to the interview.

---

## 12. Interview Design Principles

### 12.1 Product language, not template language

The user describes their product, problem, users, and risks in their own words. The agent's internal model translates to template sections. **The user never sees template section numbers or names in interview prompts.**

| Bad (template language) | Good (product language) |
|---|---|
| "Want to add a Risks section?" | "Anything that could go wrong with this? Risks, things that worry you?" |
| "Add a Background section?" | "Anything I should know about how we got here?" |
| "Should I add section 10 Risk Assessment?" | (never asked this way) |
| "Skip section 8?" | (never asked this way — inferred from content responses) |

Template terminology IS appropriate in `verify`'s report output (a technical document the user reads offline). Anywhere the agent is *speaking* to the user (interview, clarify questions, archive prompts, convert gap-finding), product language only.

If the user has to learn the template's vocabulary, they might as well write the PRD by hand.

### 12.2 Load-bearing sections

The four where shallow answers produce bad PRDs. Agent **must** push back here; everywhere else, accept-as-given.

1. **Problem statement** — what's broken or missing.
2. **Target users** — who experiences the problem.
3. **Success metric** — what specifically changes if this works.
4. **Top 1–2 capabilities** — what the product *does* to solve the problem.

A useful PRD can be written with just these four. The other 8 template sections are scaffolding.

### 12.3 Question flow (natural thinking order)

Interview follows thinking order, not document order. Reassemble to document order at write time.

| Phase | What's asked | Mode |
|---|---|---|
| 0. Setup | New PRD or modifying existing? If existing: agent reads it. If new: agent proposes slug. | Bounded |
| 1. Trigger | What's prompting this? | Open, light |
| 2. Problem | Describe concretely. Who hits it, when, what happens? | Open, **pushback** |
| 3. Users | Primary persona, then secondary. | Open, **pushback** |
| 4. Success metric | What specifically changes? One number. | Open, **pushback** |
| 5. Capabilities | Walk through the main thing(s) — rest can come later. | Open, **pushback on first 1–2** |
| 6. Boundaries | What's NOT in scope? | Open, light |
| 7. Constraints | Security, performance, integrations? | Open, accept-as-given |
| 8. Phases | Single release or rolling out? | Bounded → open |
| 9. Risks | Anything keeping you up at night? | Open, light |
| 10. Context | Background / market / competitive — or skip? | **Default skip**; ask only if user signals it matters |

The template's Context section (template's 1.x) is asked **last** in the interview even though it appears **first** in the document. Most PRDs skip most of Context entirely.

### 12.4 Adaptive questions

Ask only what prior answers haven't foreclosed. If user says "internal tool for our 8-person platform team," agent does NOT ask about competitive landscape or market sizing — those get marked N/A and dropped.

This must be explicit in the skill — LLMs default to the bad version (flat lists of unrelated questions).

### 12.5 Pushback patterns

When a load-bearing answer is thin, agent asks for sharper detail. Not nagging — requesting one concrete instance, specific number, or sharpened persona.

| Bad answer | Pushback pattern |
|---|---|
| "Users find it confusing." (Problem) | "Can you give one concrete example — something a specific user has actually said or done?" |
| "Target users are everyone." (Users) | "Even 'for everyone' has a primary persona. Who feels this problem most acutely today?" |
| "Success is when adoption is high." (Success) | "Specific number — 50% of active users in the first month?" |
| "It lets users manage their settings." (Capability) | "Walk me through the experience — first thing they see, what they do, what changes for them?" |

Pushback happens **at most twice** per question. If still thin, agent marks `TODO: needs sharpening` and moves on. Don't grind.

### 12.6 Stop condition

Agent has enough when **all four load-bearing sections have substantive answers**. At that point, it offers a checkpoint:

> "I have enough to draft — problem, users, success, and one capability are solid. Want me to draft what we have, or keep going on [next phase]?"

Agent should *offer* this checkpoint rather than mining for completeness.

### 12.7 Skip / Omit / N/A / TODO

Internally, three distinct behaviors for sections without full content:

- **Omit** — section doesn't apply. Just leave it out.
- **N/A** — section was considered but explicitly ruled out. Keep header; mark `N/A — <one-line reason>`.
- **TODO** — section can't be filled yet but should be later. Mark `TODO — <what would unblock>`.

**The user never picks between "omit" and "N/A" explicitly** — that's an internal distinction. When ambiguous, agent asks in product language:

> "Should we skip this entirely, or leave a note to come back to it later?"

- "Skip entirely" → agent picks omit or N/A based on context (N/A only when the topic was actively discussed and ruled out).
- "Come back to it later" → TODO.

If clearly inapplicable from context (internal tool → no competitive landscape), agent *proposes* the omit without asking ("This is internal — I'll skip competitive landscape unless you object").

### 12.8 Question format

| Type | Use AskUserQuestion? | Open prose? |
|---|---|---|
| Mode (new / modify) | Yes (2-option) | No |
| Priority (High/Med/Low) | Yes (3-option) | No |
| Skip behavior (skip entirely / come back later) | Yes (2-option) | No |
| Phase count | Yes | No |
| Problem, users, success, capabilities | No | Yes |
| Risks, constraints, boundaries | No | Yes |

Open-ended for substantive content; bounded choice for routing decisions.

### 12.9 Pacing

1. **Acknowledge briefly** between questions ("Got it" / "Ok"). No multi-sentence recaps.
2. **Synthesize at checkpoints** — after the four load-bearing sections, restate concisely ("So: problem is X, primary user is Y, success means Z, main capability is W — that right?") to catch misinterpretations early.
3. **Offer to draft early.** Once load-bearing is locked, ask. Don't keep mining.

### 12.10 Backtracking

Trivial — interview is conversational and in-memory. User says "change my answer about X," agent updates working state, continues. No special mechanism.

### 12.11 In-memory until end

The interview is one continuous conversation. Agent gathers everything in working memory, drafts `intent.md` + `tasks.md` (and `research.md` if external data was consulted) once at the end, then asks for confirmation to write.

Section-level edits after the draft are handled by **clarify** (a separate skill).

---

## 13. Existing PRDs

Most repos will have PRDs that weren't created with this skill. Handle them gracefully — no re-interviewing about content that's already documented; no assumption that the user wants the skill to modify them.

### 13.1 Three modes

| Mode | What the user wants | What the skill does |
|---|---|---|
| **Managed** (default) | Existing PRDs are under skill care — modify them like any skill-created PRD | Standard `propose → apply → archive` against them |
| **Read-only** | Existing PRDs are reference material — never modify them | Read freely; cite freely; refuse to write |
| **Convert** | Migrate an existing PRD into template-shaped form (one-shot) | Separate `convert` skill produces a rewrite proposal |

Multiple modes coexist in the same repo. Most realistic setup: most PRDs managed, a few legacy ones flagged read-only, occasional convert operations.

### 13.2 YAML config

Two fields:

```yaml
root: docs/prds
read_only:
  - legacy/        # any path under <root>/legacy/
  - old-auth.md    # specific file under <root>/
```

Paths resolved relative to `<root>`. Directory entries match everything under them. **No frontmatter on PRD files** — we don't modify legacy documents to track our config.

**Managed is the default.** `read_only` is an exception list. The inverse (read-only by default, managed exceptions) is much rarer; not optimized for it.

### 13.3 Modifying a managed PRD that wasn't created here

When `propose` runs against an existing managed PRD, the agent reads it **first**. Before any interview question, it extracts:

- Section inventory (parse markdown headings).
- Target users, problem, goals, success metrics (if present).
- Capability list.
- Cross-references to other PRDs.
- Glossary references.

Then presents a short summary in product language and confirms before starting the delta interview:

> "I've read `onboarding.md`. It covers users (X), goal (Y), and three capabilities (A, B, C). What's changing?"

The interview compresses to ~4-5 phases:

| Phase | What's asked | Mode |
|---|---|---|
| 0. Setup | Already done — agent has read the PRD | — |
| 1. Trigger | What's prompting this change? | Open, light |
| 2. Delta | What specifically is changing? | Open, **pushback if it touches load-bearing content** |
| 3. Affected areas | Agent proposes which content areas will change; user confirms | Bounded |
| 4. Rationale | Why this change rather than alternatives? | Open, light |

Pushback rules apply only to *new* content (new capability, new metric, new persona). Existing content is taken as-is unless the user explicitly wants to update it.

### 13.4 Handling contradictions

If the user's described change conflicts with the existing PRD, the agent flags it once in product language:

> "The PRD currently says the primary user is senior engineers — should this change update that too, or keep it as-is?"

Never silently overwrite. Either bundle the update into the same proposal (transparently) or leave existing content alone.

### 13.5 Non-template structure

Existing PRDs may have non-standard sections, missing sections, or odd naming. Default: **work with what's there.** If the PRD has "Goals" instead of "Goals and Objectives," the proposal targets "Goals."

If the user signals interest in cleanup, agent can offer ("anything missing here worth adding while we're at it?"). Never forced; always opt-in. If structural cleanup is the *primary* intent, that's convert mode (section 13.7).

### 13.6 Read-only mode

When a path is in `read_only:`, the skill:

- **Reads** the PRD freely as data source.
- **Cites** it freely in `intent.md` and `research.md`.
- **Never writes** to it.

When a proposal would naturally affect a read-only PRD, the agent surfaces the conflict at propose time and asks how to proceed. The information is preserved in `intent.md` under a dedicated section:

```markdown
## Suggested manual updates (read-only PRDs)

These changes weren't applied because the target PRDs are read-only in `.prd.yaml`. Apply manually if desired.

### legacy/old-auth.md
- Capabilities: add "SSO via SAML"
```

The user can either apply manually, or remove the path from `read_only:` and re-run apply.

### 13.7 Convert mode

A separate skill (`prd-convert`) that brings an existing PRD into template-shaped form. Two flavors:

| Flavor | What it does | When to use |
|---|---|---|
| **Reformat** (default) | Map existing content into template sections; preserve prose | Most cases — light cleanup |
| **Rewrite** (opt-in) | Archive existing as legacy; run full propose interview; generate new PRD | Rare — when the existing PRD is so off that rebuilding is easier |

**Convert is a normal proposal workflow.** It generates `intent.md` + `tasks.md` (and optionally `research.md`) — the same artifacts as `prd-propose`. From there, the standard lifecycle applies: user reviews, runs `prd-apply`, then `prd-archive`. Quality gates exist where they always do — verify runs as archive's pre-flight (section 5.3), audit is proactively suggested if apply touches multiple PRDs (section 14.6). **Convert does not invoke verify or audit itself.** The novelty of convert is the *content* of these artifacts (structural mapping vs intent capture), not the artifact list or any special orchestration.

#### Convert + read-only

If the target is in `read_only:`, convert refuses:

> "`legacy/old-auth.md` is in the `read_only` list. Convert would rewrite it. Remove from `read_only` first, then re-run."

Never sneaks around config.

#### Gap discovery is content-focused

Convert identifies template gaps internally, but asks about them in **product language** (per section 12.1).

Bad: "Want to add a Risks section?"
Good: "Anything that could go wrong with this? Risks, things that worry you?"

The agent's internal model knows the user's risk answer maps to template section 10. The user never sees section numbers in questions.

#### Reformat task shape

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

#### Rewrite task shape

Two tasks; nothing meaningful to decompose:

```markdown
- [ ] Archive existing docs/prds/onboarding.md → docs/prds/changes/archive/<date>-onboarding-legacy/legacy-onboarding.md
- [ ] Write new docs/prds/onboarding.md from intent.md following template structure
```

### 13.8 Verify works in all modes

- Read-only: verify reports gaps without changing anything.
- Managed: standard verify.
- Convert: verify runs on the converted PRD as part of the normalization proposal.

Verify is always allowed regardless of mode.

---

## 14. prd-audit (Cross-PRD Consistency)

A read-only inspection skill that checks consistency *across* the PRD corpus. Sibling to `prd-verify`; doesn't replace it.

### 14.1 Scope vs verify

| | `prd-verify` | `prd-audit` |
|---|---|---|
| **Scope** | One PRD or one proposal | All PRDs in `<dir>/` (or a subset) |
| **Finding type** | Attribute findings: "this PRD has issue X" | Relationship findings: "these PRDs disagree on Y" |
| **Mental model** | "Is this PRD correct?" | "Are these PRDs coherent as a set?" |

Both inspect, neither writes. Both produce tiered reports (CRITICAL / WARNING / SUGGESTION) consumed by the user in conversation.

### 14.2 What it checks

| Check | Mechanical or semantic? |
|---|---|
| Cross-references between PRDs resolve to real PRD + section | Mechanical |
| Glossary terms used in PRDs are defined in `glossary.md` | Mechanical |
| Glossary entries defined but unused (orphans) | Mechanical |
| `personas.md` entries referenced by PRDs exist; orphan personas flagged | Mechanical |
| PRD-specific persona drift (e.g., "Reviewer" in PRD-A vs "Approver" in PRD-B for the same role) | Semantic (LLM-assisted) |
| Two PRDs describe overlapping capabilities without cross-referencing each other | Semantic |
| Two PRDs make contradictory claims (user roles, data models, business rules) | Semantic |
| Stale cross-references (target section was renamed or removed) | Mechanical |

### 14.3 What it produces

**Nothing persistent.** Output is a tiered report in the conversation only:

```
prd-audit findings — 5 items

CRITICAL (1)
  - Stale cross-reference: onboarding.md → auth.md section 6.2 (section was renamed to 6.3)

WARNING (3)
  - PRD-specific persona drift
    auth.md (Section 5.2): "Reviewer"
    billing.md (Section 5.2): "Approver"
    Appears to refer to the same role; consider promoting to personas.md
  - Capability overlap without cross-reference
    auth.md (Section 6.1) and onboarding.md (Section 6.3) both describe signup flow
  - Glossary term used but not defined: "tenant"

SUGGESTION (1)
  - Glossary entry "deprecated_role" appears unused across PRDs (orphan)
```

No `<dir>/audit-reports/` folder, no persistent state, no log of past audits.

### 14.4 Suppressions via CLAUDE.md

For findings that are intentional non-issues, the user documents the decision in `CLAUDE.md`:

> "auth.md's 'admin' and billing.md's 'staff' are distinct roles, not terminology drift."

`prd-audit` reads `CLAUDE.md` (already loaded automatically) and respects this — suppressed findings appear as `(suppressed per CLAUDE.md)` or are omitted entirely. **No new artifact, no YAML, no `.audit-ignore` file.**

### 14.5 Audit → propose flow

When findings warrant action, the agent offers `prd-propose` flow(s). Bundling decision is surfaced, not assumed:

> "5 findings — bundle them into one proposal (a 'consistency cleanup' pass), or split by domain (terminology, cross-references, persona drift) into separate proposals?"

Default: **one proposal for related findings; separate proposals when domains genuinely diverge.** The agent proposes a grouping; the user adjusts.

Audit itself doesn't write anything. The follow-up propose flows are where artifacts emerge.

### 14.6 When to invoke

`prd-audit` is **always explicit** (never auto-triggers). The agent proactively suggests it at four moments:

1. **After multi-PRD apply.** When `prd-apply` completes a proposal that touched ≥2 PRD files: *"Run prd-audit to check for new inconsistencies?"*
2. **After a new PRD lands.** When apply creates a brand-new PRD file: *"Audit for potential overlap with existing PRDs?"*
3. **After `prd-convert`'s apply.** Treated like any multi-PRD apply — the agent suggests audit if the conversion affected cross-references in other PRDs. Not auto-run by convert itself.
4. **Surfaced by `prd-archive`'s pre-flight verify** when the proposal touched multiple PRDs — appears as a SUGGESTION-tier note ("consider running prd-audit before closing").

Users can also invoke it on a schedule (weekly, before releases, quarterly hygiene) — but scheduling lives outside the skill.

### 14.7 What it does NOT do

- **Doesn't auto-run.** Always explicit invocation (or confirmed prompt).
- **Doesn't gate apply or archive.** Findings inform; never block.
- **Doesn't reconcile** — surfaces findings; user decides what to do.
- **Doesn't persist findings or maintain state.** Re-running on an unchanged corpus produces the same report.

---

## 15. Explore

`prd-explore` is a formal skill for pre-proposal exploration, mirroring OpenSpec's `/opsx:explore`. It opens an unstructured conversation about the problem space — investigating existing PRDs, glossary, personas; comparing product approaches; clarifying what the user is actually trying to achieve before committing to a proposal.

### 15.1 What it does

- **Reads the corpus for context.** Existing PRDs, glossary, personas — anything that informs the exploration. Powered by `scripts/list-corpus.ts` (section 19) and direct file reads.
- **Open conversation, no interview structure.** Unlike propose, explore has no load-bearing pushback, no required role coverage, no template alignment. The user drives the topic; the agent reflects, compares options, asks clarifying questions.
- **Hands off to propose.** Once exploration crystallizes (*"OK I think we have a direction — let's capture it"*), the agent suggests transitioning to `prd-propose`. The accumulated context from the explore conversation seeds propose's interview in memory.

### 15.2 What it doesn't do

- **No artifacts.** Same as OpenSpec. Walking away mid-explore leaves nothing behind. Anything worth preserving lives in the user's own notes during explore, or gets captured by propose at the transition.
- **No interview machinery.** Load-bearing pushback (section 12.5), product-language translation (section 12.1), implementation-language guards (section 18) — none fire during explore. Explore is exploration; the discipline kicks in at propose.
- **No corpus modifications.** Explore is read-only across the corpus, same as verify and audit.

### 15.3 Explore vs propose

| Signal | Skill |
|---|---|
| User describes a clear feature/change | propose |
| User has a defined audience and problem in mind | propose |
| User says "I want a PRD for X" | propose |
| User is comparing options, weighing tradeoffs | explore |
| User's intent is "let me think out loud" | explore |
| User asks "what should we do about X?" | explore |

When unsure, the umbrella `prd` skill asks: *"Want to think through this first, or jump straight to capturing it as a PRD proposal?"*

### 15.4 Transition to propose

When the user is ready, the agent says: *"Want me to start a propose flow with what we've discussed?"* If yes, propose starts with the explore conversation context preserved in memory. The propose interview can skip questions that explore already answered, going straight to load-bearing gaps.

### 15.5 Triggers

`prd-explore` can auto-trigger from natural language (it's read-only — no consequence to entering it accidentally). User can also invoke explicitly via `/prd-explore`.

---

## 16. Testing Strategy

The skill family is tested in two tiers: a fast deterministic layer in CI and a slow probabilistic layer run manually. Skills are LLM-driven, so full determinism isn't possible — but the structural correctness that matters can be made deterministic. The probabilistic layer covers interview behavior and content quality.

### 16.1 Tier 1 — Deterministic (CI)

Runs on every PR. Cheap, fast, high-signal.

| What | How |
|---|---|
| Lifecycle / filesystem transitions | Simulate `propose → apply → archive` on fixture proposals. Assert folder moves, file presence, content patterns. |
| YAML config parsing | Schema validation, `read_only` resolution, default root path. |
| verify / audit as test oracles | Run verify/audit on a fixture corpus (`fixtures/good/`, `fixtures/bad-missing-section/`, `fixtures/bad-broken-ref/`, ...). Snapshot expected findings; new CRITICAL on a clean fixture = regression. |
| Idempotency | Apply twice on the same proposal; assert second run is a no-op. |
| Structural snapshots | For a frozen `intent.md`, snapshot the *structure* of the produced PRD (sections present, order, YAML keys) — not the prose. |

`prd-verify` and `prd-audit` double as oracles for the rest of the suite. When a structural test wants to assert "this PRD is well-formed," it just runs verify and asserts zero CRITICAL findings — no separate validator to maintain.

### 16.2 Tier 2 — Probabilistic (manual, on-demand)

A three-agent harness that exercises interview behavior, content quality, and end-to-end flow. Not run in CI (cost, flakiness). Triggered manually before releases, after changing skill prompts, or when diagnosing a regression.

**Architecture:**

```
┌─────────────┐    prompt + interview    ┌─────────────┐
│   Persona   │ ◄──────────────────────► │  Executor   │
│  (PM role)  │       replies            │  (skills)   │
└─────────────┘                          └──────┬──────┘
                                                │ artifacts +
                                                │ transcript
                                                ▼
                                         ┌─────────────┐
                                         │  Evaluator  │ → findings.json
                                         │  (+ rubric) │
                                         └─────────────┘
```

- **Persona agent** — given a scenario brief + behavior profile, kicks off the session and answers in character.
- **Executor agent** — vanilla Claude Code with `prd-*` skills loaded. Runs the skill end-to-end.
- **Evaluator agent** — reads the transcript + artifacts + rubric + persona profile. Outputs structured findings (pass/fail per criterion with evidence quotes).

### 16.3 Agent isolation

Each agent runs as a separate `claude -p` subprocess. Three independent processes, three fresh contexts. Nothing shared except:

- Files the executor writes to disk (the artifacts the evaluator reads).
- The rubric file the evaluator reads.
- The transcript captured by the harness for the evaluator to inspect.

No agent sees another's system prompt or working context. Persona never sees the rubric. Executor never sees the persona profile or the rubric. Evaluator never sees either system prompt — only outputs.

### 16.4 Persona autonomy (zero human intervention)

The persona agent must handle anything the executor throws at it without breaking character. This is a prompting problem, fully solvable. Every persona's system prompt encodes:

- **Profile** — role, experience level, decisiveness, communication style.
- **Scenario brief** — what they're building, for whom, why.
- **Strict autonomy rule** verbatim:

  > "Stay in character throughout. Never ask the harness or any external party for help. If the executor asks you something you have no answer for, invent something plausible and consistent with your profile and the scenario, then commit to it for the rest of the session. If asked to repeat or refine an answer, refine it — don't deflect."

- **Termination rule** — when to end the session (executor signals completion, or executor asks an obviously broken question N times in a row).

### 16.5 What the evaluator checks

| Layer | What | How |
|---|---|---|
| Structural | Sections in template order; YAML valid; cross-references resolve; tasks checked/strikethrough; verify returns zero CRITICAL | Deterministic script, called by evaluator |
| Content quality | Requirements measurable; no solution bias; personas concrete; success metrics tied to business goals; rationale present | LLM judgment vs rubric |
| Interview quality | Translated to product language (no template jargon in questions); pushed back on load-bearing sections when persona was vague; adapted question order to prior answers; respected persona's signals to skip irrelevant sections | LLM judgment over transcript |

Persona profile is part of the evaluator's input — so "uncertain PM still got a usable PRD" is testable, not just "the PRD looks fine in isolation."

### 16.6 Directory layout

```
tests/
  fixtures/
    scenarios/                       # WHAT the PM is building
      fintech-instant-payments.md
      ecommerce-checkout-redesign.md
      internal-bug-tracker.md
    personas/                        # HOW the PM behaves
      decisive-pm.md
      uncertain-pm.md
      domain-expert-pm.md
      first-time-pm.md
    rubrics/
      propose.md                     # intent.md quality criteria
      apply.md                       # PRD quality criteria
      interview-flow.md              # interaction quality criteria
  harness/
    eval.sh                          # matrix runner — shell or thin TS
  results/
    <YYYY-MM-DD-label>/
      <scenario>-x-<persona>/
        transcript.jsonl
        artifacts/
        findings.json
```

### 16.7 Design risks

- **Same-model bias.** If executor and evaluator share a model, evaluator may rate same-style output favorably. Pair across model families (e.g., Sonnet evaluates Opus). Cross-check regressions with the alternate pairing.
- **Reproducibility.** Even at temperature 0, results vary. Pin: model version, skill file checksums, persona script verbatim, scenario brief verbatim. Save full transcripts so failures are debuggable.
- **Flakiness as signal vs noise.** Run each cell N=3 times; flag regression only on repeated failures. Single failures go into a "look at this" bucket, not a CI red.
- **Persona drift.** Handled by the autonomy rule (section 16.4) — persona invents and commits rather than asking for help.
- **Cost.** Full matrix (4 scenarios × 4 personas × 3 reps × 3 agents) ≈ ~144 LLM-heavy sessions. Roughly $25–100 per full run at current Opus pricing. Not for CI.

### 16.8 OSS integration

Tier 1 in CI; tier 2 manual via a shell script.

- **Ship fixtures and harness in-repo.** Scenarios, personas, and rubrics are plain markdown. Harness is shell or thin TS. Anyone with `claude` CLI installed can run it — no extra services.
- **Document in `TESTING.md`.** How to run one cell, how to run the full matrix, how to read findings, how to update fixtures.
- **Don't gate CI on tier 2.** Cost and flakiness make it impractical. CI runs the deterministic suite only.
- **Encourage fixture contributions.** Adding a new scenario or persona is a markdown-only PR — good entry point for outside contributors.

Default workflow:

| When | What to run |
|---|---|
| Per PR (CI) | Tier 1 deterministic suite |
| Before tagging a release | Full tier 2 matrix; review findings |
| After changing skill prompts | Tier 2 on affected scenarios / personas |
| When diagnosing a regression | Single tier 2 cell with verbose transcript |

### 16.9 What testing does NOT cover

- **Quality of the underlying model.** If Opus regresses on instruction-following, that's an Anthropic-side regression — not a skill bug. The harness will surface it as failures but the fix is upgrading or pinning the model.
- **User experience of slash commands or UI.** This is a content/behavior layer; UI is Claude Code's concern.
- **Network-dependent tasks.** Anything that requires real MCP servers (Mixpanel, Linear) is mocked or skipped in tier 1. Tier 2 can include them if the harness operator sets up the MCPs locally.

---

## 17. Templates and Customizable Artifacts

The skill ships with a default template bundle but is template-agnostic at the workflow level. Users can fork, customize, or replace the bundle to fit their organization. This section covers what the bundle owns, what `.prd.yaml` owns, and what stays fixed in the skill.

### 17.1 Two layers of files

| Layer | Files | Owned by | Customizable? |
|---|---|---|---|
| **Proposal scaffolding** | `intent.md`, `tasks.md`, `research.md` | Skill | No |
| **Corpus artifacts** | PRDs, glossary, personas, OKRs, decision log, ... | Template bundle | Yes |

Proposal scaffolding is the lifecycle mechanism (section 3). Corpus artifacts are everything the proposal modifies — declared by the active template bundle.

### 17.2 The template bundle

A template bundle is a self-contained directory:

```
templates/prd/v2/
  config.yaml             # manifest: which artifacts, their templates, purposes
  prd.md                  # template for the PRD itself
  glossary.md             # template for glossary artifact
  personas.md             # template for personas artifact
  okrs.md                 # template for OKR artifact
```

Built-in bundles live in `.claude/skills/prd/references/templates/<name>/v<n>/`. Custom bundles live anywhere the user wants.

### 17.3 `config.yaml`

```yaml
name: prd
version: 2.0.0
artifacts:
  prd:
    template: prd.md
    storage: per_instance
    path_pattern: "{slug}.md"
    description: "Long-lived product spec"
    roles:
      problem: "2. Problem Statement"
      users: "5. Target Users"
      success: "3.2 Objectives & Key Results"
      capability: "6. Product Capabilities"
  glossary:
    template: glossary.md
    storage: singleton
    path: glossary.md
    purpose: "Shared terminology used across PRDs"
  personas:
    template: personas.md
    storage: singleton
    path: personas.md
    purpose: "Shared user personas"
  okrs:
    template: okrs.md
    storage: singleton
    path: okrs.md
    purpose: "Quarterly OKRs that PRDs map success metrics to"
```

### 17.4 Storage shapes

Two shapes, declared per artifact:

- **Singleton** — one fixed-path file the whole corpus shares (glossary, personas, OKRs).
- **Per-instance** — one file per "thing," path derived from a slug (PRDs).

The abstraction supports per-product-area glossaries or other multi-instance shared docs if needed.

### 17.5 PRD isn't special-cased

The lifecycle is proposal-driven, not PRD-driven. Any declared artifact can be a target of tasks during apply:

- Proposal introduces a new term → task adds it to `glossary.md`.
- Proposal introduces a new persona → task adds it to `personas.md`.
- Proposal modifies a success metric → task updates an OKR reference.

PRDs are the most common subject of proposals, but they're not architecturally privileged. The `prd` artifact entry in `config.yaml` is one entry among others — distinguished only by storage shape (per-instance) and required role mappings (17.8).

### 17.6 Distribution and discovery

Templates are discovered locally — no remote registries, no fetching, no marketplace. The skill ships a built-in template; users add custom ones by copying them into a known directory.

#### Layout

```
.claude/skills/prd/references/templates/
  builtin/
    prd/
      v1/
        config.yaml, prd.md, glossary.md, ...
      v2/
  custom/
    my-prd/
      config.yaml, prd.md, ...
```

`builtin/` ships with the skill. `custom/` is user-managed and never touched by skill updates.

#### Both folders are editable; no distinction at the behavior level

The skill makes no behavioral distinction between `builtin/` and `custom/` — both are editable, no warnings issued, no agent-side suggestions to copy first. Editing `builtin/` directly is allowed but carries the natural risk that skill updates may overwrite changes. Users who want update-safety copy to `custom/` (same name wins on collision); the skill doesn't push them there.

Inside any bundle the user can:
- Drop artifacts (remove from `config.yaml`, delete the template file).
- Add new ones (add entry, create template file alongside).
- Modify any template's content.
- Adjust the role map for their PRD structure.

No override layer, no `extends:` directive. The bundle is the unit of customization.

#### Resolution in `.prd.yaml`

Explicit namespacing, mirrors the folder structure:

```yaml
template: builtin/prd@1     # built-in, versioned
template: custom/my-prd     # user-added; user versions via git
```

If `@<version>` is omitted on a built-in reference, the skill resolves to the latest version. Custom templates aren't version-managed by the skill — git is their version control.

#### User-scope vs project-scope

`.claude/skills/` exists at both `~/.claude/skills/` (user-global) and `<repo>/.claude/skills/` (project-local). The skill scans both. Project-local wins on name collision — same convention as the rest of Claude Code.

This is the answer to "how does a team share a custom template" without a marketplace: commit the bundle to `<repo>/.claude/skills/prd/references/templates/custom/<name>/` and it travels with the repo.

#### Listing

Any action skill can answer "what templates are available?" by scanning the two folders and reading each bundle's `config.yaml` name + version. No registry needed. Done via `scripts/list-templates.ts` (section 19).

#### Validation at session start

When the skill loads, every available template is validated against the minimum contract (17.8). Bad templates are inert (not selectable) and surfaced as a quiet warning:

> "custom/my-prd is missing the `success` role mapping — won't be available until fixed."

Loud failures only happen when the user explicitly tries to use a bad template.

#### Errors for missing templates

If `.prd.yaml` references a `template:` name that doesn't exist, the skill emits a clear error listing what *is* available — never silently falls back to the built-in default.

#### Explicitly out of scope (v1)

- Remote registries or "skill marketplaces."
- Fetching templates by URL.
- Dependency resolution between templates.

The local model is forward-compatible: if remote fetching becomes a need, a fetcher just drops bundles into `custom/`. Don't pay for the abstraction now.

### 17.7 Load-bearing roles

The four load-bearing concepts (problem, users, success, capability) are universal product reality — the skill owns them. The sections that hold them are template-specific — the bundle owns the mapping via `roles:` (see 17.3).

Interview asks about roles in product language. Skill maps role → section via the bundle. Pushback fires for load-bearing roles regardless of what the template calls those sections.

### 17.8 Minimum template contract

The skill enforces a minimum contract on any template — built-in or custom. Below the contract, the template is rejected at load. Above it, the skill is permissive.

**Hard requirements (load fails):**

1. Exactly one artifact of kind `prd`.
2. That artifact declares a `roles:` map covering all four load-bearing concepts (problem, users, success, capability).
3. Sections referenced in `roles:` exist in the template file.

Without these, the load-bearing pushback machinery has nothing to grip on — the skill would silently degrade to "markdown scaffold." Refuse rather than degrade.

**Soft recommendations (load + warn once):**

A small set of sections that make PRDs useful in practice. If the template doesn't declare role mappings for them, the skill warns once at load:

- Boundaries / scope (in vs out)
- Constraints (security, performance, integrations)
- Risks

The agent skips interview phases for absent roles — no forcing, just no coverage.

**Convert pass-through:** Convert (section 13.7) reconciles existing content rather than authoring new. It gets a pass on soft warnings — a legacy PRD with no risks section doesn't get nagged during normalization.

### 17.9 What `.prd.yaml` becomes

Routing only:

```yaml
root: docs/prds
template: builtin/prd@1           # or custom/<name> — see section 17.6
read_only:                         # optional; for legacy PRDs not under skill management
  - legacy/
```

Picks the template + version, sets the corpus root, optionally lists read-only paths. Doesn't own any content, structural rule, or section-level config.

### 17.10 Scope split

| Layer | What it owns |
|---|---|
| **Skill** | Lifecycle, action set, proposal scaffolding, interview patterns, load-bearing concepts, verify/audit infrastructure, `.prd.yaml` resolution |
| **Bundle** | Set of artifacts, shapes, templates, paths, purposes, role map, per-artifact verify/audit rules |
| **`.prd.yaml`** | Routing: corpus root, template selection, read-only paths |

- **Skill** = how the workflow runs.
- **Bundle** = what the workflow produces.
- **`.prd.yaml`** = which bundle, where.

### 17.11 Verify and audit are template-aware

Verify (section 10) and audit (section 14) check what the template *declared* exists, not against a hardcoded canonical structure.

- If the template declares a `personas` artifact, verify checks PRD persona references resolve there.
- If the template *doesn't* declare a personas artifact, verify doesn't flag missing personas.

Verify can never penalize a user for *not having* an artifact the template doesn't declare. It can penalize them for declaring an artifact incompletely or inconsistently.

### 17.12 Versioning

Built-in bundles are versioned by path: `templates/builtin/prd/v1/`, `templates/builtin/prd/v2/`. Old PRDs don't break when v2 ships — they stay on the version they were written against (declared in PRD frontmatter or inferred from `.prd.yaml` at creation time).

Custom bundles (`templates/custom/<name>/`) aren't versioned by the skill — users version via git like any other repo content. The `@<version>` suffix in `.prd.yaml` only matters for built-ins.

---

## 18. Implementation-Language Guards

The skill is for *product* definition. Implementation details (specific tech, code, schemas, internal data structures) don't belong in PRDs. Each action skill carries its own guard against them; shared definitions live in the umbrella skill's references to avoid repetition.

### 18.1 The default policy

One rule, applied uniformly:

> **Allowed:** what the system does — black-box behavior, user-visible language, system-level descriptions.
> **Not allowed:** how the system does it — code, schemas, specific tech names, internal data structures.

Examples:

- "The system validates the email format and rejects invalid addresses" → allowed.
- "Use a regex `/^[^@]+@[^@]+$/` to validate" → not allowed.

No per-section register declarations. One rule, applied everywhere; the LLM judges by content. Per-section config was rejected as too rigid and easy for users to forget.

### 18.2 Decentralized guards, shared definitions (DRY)

Each skill enforces the rule at the moment it matters:

| Skill | Guard |
|---|---|
| **prd-propose / prd-clarify** | Interview-time translation — agent reflects implementation-flavored input in product language before capturing intent |
| **prd-apply** | Apply-time self-check — before writing PRD content, agent strips/rephrases implementation specifics |
| **prd-verify** | Verify-time detection — flags implementation language in completed PRDs with tiered findings |
| **prd-convert** | Same as verify, but downgrades findings one tier for legacy content (18.8) |

The *definitions* of what counts as implementation language live once in `.claude/skills/prd/references/REFERENCE.md`. Each skill's SKILL.md describes its *application* of the rule and points to REFERENCE.md for the patterns. Single source of truth for the rules; per-skill specialization for when they fire.

### 18.3 What counts as implementation language

Defined in `REFERENCE.md`. Tiered for verify:

| Pattern | Tier |
|---|---|
| Code blocks, function signatures, SQL, REST endpoints | CRITICAL |
| Internal data structures (column names, class names, file paths) | CRITICAL |
| Specific tech names ("PostgreSQL", "React", "Kafka") | WARNING |
| Implementation-flavored verbs ("refactor", "deploy", "ship a feature flag") | WARNING |

### 18.4 Interview-time translation

When the user describes something in implementation terms, the agent reflects in product language and confirms. Extends Section 12.5 pushback patterns:

| Implementation-flavored answer | Translation pushback |
|---|---|
| "We'll use OAuth" | "Users sign in with their existing identity provider — anything else?" |
| "Kafka topic for events" | "External systems get notified when X happens. Which ones?" |
| "Websockets for live updates" | "Users see updates without refreshing." |

The implementation detail never enters captured intent.

### 18.5 Apply-time self-check

Before writing PRD content, the agent checks proposed text against the policy. Implementation specifics get rephrased to product-language equivalents or flagged for user review. Last line of defense before the PRD is touched.

### 18.6 Verify-time detection

Runs the patterns from REFERENCE.md against PRD content with tiered findings. Respects suppressed exceptions (18.7).

### 18.7 Suppression via CLAUDE.md

Some PRDs legitimately reference specific tech — developer-facing APIs, real integration constraints, regulated environments. User documents in CLAUDE.md (same mechanism as audit suppressions, section 14.4):

> "PRDs may reference Salesforce, Stripe, and AWS — these are real integration constraints, not implementation choices. Code blocks should still be flagged."

Each skill's guard reads CLAUDE.md (already loaded automatically) and respects the documented exceptions. No new YAML field, no `.impl-ignore` file.

### 18.8 Convert pass-through

Convert reconciles existing content rather than authoring new. Implementation-language findings during a convert-driven proposal are downgraded one tier (CRITICAL → WARNING, WARNING → SUGGESTION) so the user can decide whether to clean up as part of conversion or accept as-is. Same spirit as the soft template-warnings pass (section 17.8).

### 18.9 Why decentralized + shared

Centralizing the guard in one place (e.g., verify only) misses the most valuable interventions — interview-time translation prevents implementation language from entering captured intent in the first place. Putting a guard in each skill catches it everywhere.

To avoid repeating the *definitions* across SKILL.md files, the *what* (patterns, tiers, examples) lives in the umbrella skill's `REFERENCE.md`. The *how* (which moment the skill applies it) lives in each skill's SKILL.md. Single source of truth for the rules; per-skill specialization for the application.

---

## 19. Deterministic Scripts

Mechanical operations (filesystem listing, YAML parsing, structural validation) live in TypeScript scripts under the umbrella skill. They're invoked by the action skills as primitives — the LLM orchestrates; scripts do the deterministic work.

### 19.1 Why scripts

| Reason | Effect |
|---|---|
| Single source of truth | Every skill that lists proposals does it the same way; no drift between propose's view and clarify's view |
| Tier 1 test oracles | Section 16.1 deterministic tests call scripts directly; the script is both the implementation and the test oracle |
| Survives LLM regressions | If the model gets sloppier about file globbing, the skill still lists proposals correctly because globbing isn't asked of the model |
| Cheaper | Listing 30 PRDs is a directory read, not context-window expansion |

### 19.2 What's a script vs what's the LLM

| Operation | Script? | Why |
|---|---|---|
| List active / archived proposals | Yes | Pure filesystem read |
| List corpus artifacts (PRDs, glossary, ... per the bundle) | Yes | Filesystem + bundle config read |
| List available templates (`builtin/` + `custom/`) | Yes | Filesystem read |
| Read `tasks.md` and count states (`[ ]`, `[x]`, `~~`) | Yes | Mechanical parse |
| Resolve `.prd.yaml` (root, template, read_only) | Yes | YAML parse |
| Validate a template against the minimum contract (17.8) | Yes | Structural check |
| Check slug collision against existing proposals | Yes | Filesystem read |
| Resolve cross-references (does `glossary.md` define term X?) | Yes | Grep |
| Match a PRD path against `read_only:` patterns | Yes | Glob match |
| Interview interaction, pushback, translation | No | LLM judgment |
| Apply (writing corpus content) | No | LLM authoring |
| Verify *content* quality (vague language, solution bias) | No | LLM judgment |
| Verify *structural* checks (cross-refs resolve, required sections present) | Yes | Mechanical |
| Audit semantic checks (persona drift, capability overlap) | No | LLM judgment |
| Audit *mechanical* checks (orphan glossary entries, stale cross-refs) | Yes | Filesystem + grep |

Verify and audit are mixed: deterministic core wrapped by an LLM layer for content judgment.

### 19.3 Runtime and conventions

- **Runtime:** Node 20.19+ and TypeScript via `tsx` (run `.ts` files directly, no build step).
- **Why TypeScript:** matches OpenSpec convention (same corner of the ecosystem) and gives type safety around YAML schemas (`config.yaml`, `.prd.yaml`); minimal overhead via `tsx`.
- **Why `tsx`:** scripts stay immediately editable; no `dist/` directory to manage; no compile step on save.
- **Dependency cap:** `js-yaml` for YAML, `tsx` (dev), `vitest` (dev). Anything more, reconsider.

### 19.4 Layout

```
.claude/skills/prd/scripts/
  package.json                 # "type": "module", deps: js-yaml; devDeps: tsx, vitest
  tsconfig.json                # Node 20 / ESNext / strict
  list-proposals.ts            # active vs archive
  list-corpus.ts               # corpus artifacts per active bundle
  list-templates.ts            # builtin/ + custom/
  proposal-status.ts           # tasks.md → draft / partial / complete / strikethrough counts
  resolve-config.ts            # .prd.yaml → resolved values
  validate-template.ts         # minimum contract check (17.8)
  check-readonly.ts            # is this PRD read-only per .prd.yaml?
  resolve-xref.ts              # cross-reference resolution
  __tests__/                   # vitest tests
```

### 19.5 Invocation

Each action skill's SKILL.md describes its mechanical primitives as script invocations:

```
To list active proposals:
  npx tsx scripts/list-proposals.ts <root>
```

The LLM treats scripts as deterministic primitives — it doesn't reason about how they work, only about what they return.

### 19.6 Output format

Scripts output **structured JSON** (or support a `--json` flag), not human prose. Reasons:

- Tier 1 tests parse output without regex.
- The LLM consuming script output gets a stable shape.
- Adding human-formatting later is trivial; the reverse isn't.

### 19.7 Required unit tests

**Every script in `scripts/` ships with a unit test in `__tests__/<script-name>.test.ts`. No exceptions.** Tests are part of the contract, not optional.

Tests cover:

- **Happy path** — valid fixture inputs produce expected JSON output.
- **Edge cases** — empty corpus, missing files, malformed YAML, slug collisions, partial states (some tasks checked, some not), strikethrough handling.
- **Errors** — invalid input produces structured error output and a non-zero exit code (so downstream callers can detect failure deterministically).

Tests run via Vitest (also OpenSpec's choice — keeps convention consistent). CI runs the suite on every PR; a script without tests, or with failing tests, doesn't merge.

These unit tests double as **Tier 1 deterministic test oracles** (section 16.1): the same fixture-based test that verifies the script behaves correctly is what the broader test suite uses to assert "filesystem listing works." One layer of tests, two purposes.

### 19.8 Backwards compatibility and custom templates

Built-in skills only call scripts that ship with the umbrella skill. Custom templates can add their own scripts (e.g., a corpus-specific lint), but the skill makes no contract about discovering them — that's a future concern. For v1, scripts live in the umbrella; custom bundles are content-only.

---

## 20. Open Questions

To return to later:

1. **PRD formatting conventions.** Header levels, section numbering, how omitted sections render.

## 21. Resolved

Captured here so prior decisions don't get re-litigated:

- **Interview mechanics** — section 12. Load-bearing sections, question flow, pushback patterns, stop condition all specified.
- **External sources and data fetching** — section 11. Guidance lives in `CLAUDE.md`; raw evidence lives in `research.md`; `.prd.yaml` stays minimal.
- **Quality enforcement** — both: pushback during interview (section 12.5) catches issues early; verify (section 10) catches what slipped through.
- **Product language vs template language** — section 12.1. Interviews speak the user's domain; agent translates to template internally. Template terminology only allowed in `verify` reports.
- **Existing PRDs handling** — section 13. Three modes (managed default, read-only via `.prd.yaml`, convert as separate skill). No frontmatter on PRD files. No new artifact for suggested updates; they live in `intent.md`.
- **Engagement with PRDs that didn't come from this skill** — section 13.3. Pre-interview read step; compressed 4-5 phase interview focused on the delta.
- **One-way dependency between proposals and PRDs** — section 3.5. Proposals consume PRDs; PRDs never reference proposals (including archived ones).
- **Qualitative content guidance** — `SKILL.md`. The template uses qualitative phrasing ("brief," "concise") rather than numeric length caps. Numeric limits only enforce genuine quality constraints (e.g., one number for a success metric).
- **Template trimming** — TEMPLATE.md. Section 1 Context trimmed to Background + Strategic Rationale; User Research Insights moved to Section 5; Section 7 Functional Requirements marked optional; Template Usage Guide moved to `SKILL.md`.
- **Skill naming** — section 2.1. `prd-` prefix; flat top-level structure (Claude Code doesn't support nested skills); seven skills: `prd-explore`, `prd-propose`, `prd-clarify`, `prd-apply`, `prd-verify`, `prd-archive`, `prd-convert`.
- **Skill triggers and invocation** — section 2.2. Same skill name does double duty (natural-language + slash). No parallel `.claude/commands/` files. Trigger priority: slash > artifact ref > filesystem > NL match. `apply`/`audit`/`archive`/`convert` never auto-trigger from natural language alone.
- **Cross-PRD consistency** — section 14. New `prd-audit` skill (eighth action skill) for terminology drift, persona alignment, capability overlap, stale cross-references. Read-only, produces transient reports, never persists state. Findings drive new `prd-propose` flows.
- **Umbrella `prd` skill** — section 2.1. Hosts shared references (`TEMPLATE.md`, `REFERENCE.md`, glossary template, personas template) used by all action skills. Also serves as a vague-intent entry point.
- **Shared `personas.md`** — section 4. New cross-PRD file (sibling to `glossary.md`) defining shared user personas. PRDs reference entries rather than redefining; drift on shared personas is prevented by construction.
- **Audit suppressions via CLAUDE.md** — section 14.4. Intentional non-issues documented in `CLAUDE.md`; no new artifact, no YAML suppressions file.
- **Archive pre-flight verify** — sections 5.3, 10.3. Archive auto-runs verify as a fast pre-flight check. CRITICAL findings block archive by default; user overrides with `--abandon` to archive a proposal as-is (e.g., intentional abandonment). Verify's completeness check subsumes the previous standalone "unchecked tasks" warning.
- **Convert is a normal proposal workflow** — section 13.7. Convert produces the standard proposal artifacts (`intent.md` + `tasks.md` + optional `research.md`); the standard lifecycle handles quality gates. No convert-specific auto-runs of verify or audit. Convert is one entry point into the lifecycle, not an orchestrator.
- **Clarify can run after apply** — sections 6, 7. The strikethrough rule + idempotent apply support `propose → apply → clarify → apply → clarify → apply → archive` with no special handling. Only restriction: clarify cannot run after archive (proposal is read-only history).
- **Testing strategy** — section 16. Two-tier: deterministic structural tests in CI (lifecycle simulation, idempotency, structural snapshots, verify/audit as oracles) plus an on-demand three-agent harness for interview and content quality. Tier 2 (persona → executor → evaluator, each isolated as a separate `claude -p` subprocess) is not in CI due to cost (~$25–100 per full matrix) and flakiness; ships as an in-repo script for manual runs. Persona handles uncertainty autonomously via a strict in-character "invent and commit" rule — zero human intervention during runs.
- **Templates and customizable artifacts** — section 17. One canonical template (not multiple PRD types); template-as-bundle (`config.yaml` + per-artifact templates); artifacts declared in the bundle's `config.yaml` (not in `.prd.yaml`); two storage shapes (singleton vs per-instance); PRD not architecturally privileged — it's one declared artifact among others, lifecycle works across the whole corpus.
- **Minimum template contract** — section 17.8. Hard requirements (one `prd` artifact, all four load-bearing roles mapped, referenced sections exist) refuse the template at load. Soft recommendations (scope, constraints, risks) warn once but don't enforce. Convert gets a pass on soft warnings — it reconciles legacy content rather than authoring new.
- **Skill / bundle / `.prd.yaml` scope split** — section 17.10. Skill owns workflow guarantees and mechanism; bundle owns corpus content and content rules; `.prd.yaml` is thin routing only (root, template selection, read-only paths). No override layer; customization is via forking the bundle.
- **Verify and audit are template-aware** — section 17.11. They check what the template *declared*, never against a hardcoded canonical structure. Missing artifacts the template didn't declare don't produce findings.
- **Implementation-language guards** — section 18. One default policy across the whole PRD ("what the system does, not how" — no per-section register declarations; that approach was rejected as too rigid and easy to forget). Decentralized guards in each action skill (interview translation, apply self-check, verify detection); shared definitions in umbrella `REFERENCE.md` to avoid repetition (DRY). CLAUDE.md prose-based suppression for legitimate exceptions (integration constraints, regulated domains). Convert pass-through downgrades findings one tier for legacy content.
- **Template distribution and discovery** — section 17.6. Local-only discovery; no remote registries, no fetching, no marketplace at v1. Two sibling subfolders under `.claude/skills/prd/references/templates/`: `builtin/` (ships with skill, may be overwritten on update) and `custom/` (user-managed, never touched). Both are equally editable — no warnings, no agent-side discouragement of editing `builtin/`. `.prd.yaml` references by namespace: `builtin/<name>@<version>` or `custom/<name>`. User-scope (`~/.claude/skills/`) and project-scope (`<repo>/.claude/skills/`) both scanned; project wins on name collision. Validation at session start; bad templates are inert with a quiet warning. Missing-template references emit a clear error listing available templates — never silent fallback to default.
- **Deterministic scripts for mechanical operations** — section 19. TypeScript via `tsx` (no build step), Node 20.19+, matches OpenSpec convention. Lives in umbrella skill at `scripts/`. LLM orchestrates; scripts do filesystem listing, YAML parsing, structural validation, cross-reference resolution, status counting, slug-collision checks. Verify and audit are mixed — deterministic structural core + LLM content judgment. Scripts output JSON and double as Tier 1 test oracles (Vitest, also matching OpenSpec). Dependency cap: `js-yaml` (runtime), `tsx` + `vitest` (dev). **Every script ships with a unit test (section 19.7) — no exceptions; CI gates on it.**
- **Task granularity** — section 7.1. Every task in `tasks.md` is atomic: one file, one section, one operation (add/modify/remove), one concrete change, specified in enough detail that apply can execute without asking the user. "Update section 7.2" is too coarse; "Section 7.2: change session timeout from 30min to 60min" is right. Reasons: user previews changes before apply runs, apply executes without inventing details, audit trail stays meaningful after strikethrough. Check: if apply would have to ask "what specifically?" the task is too coarse — split into N.
- **Resume behavior** — section 8.7. When an action skill is invoked while active proposals exist, the agent shows a one-line summary per proposal (slug, task counts, last-touched date) and asks what to do — but only when user intent is ambiguous. If the user names a specific slug, skip the list and proceed. Powered by `scripts/list-proposals.ts` + `scripts/proposal-status.ts`. Shared resume-prompt phrasing lives in the umbrella skill's `REFERENCE.md` so action skills don't drift. No separate "resume" skill — it's a startup behavior of any action skill.
- **Explore as a formal skill** — section 15. Mirrors OpenSpec's `/opsx:explore`. `prd-explore` opens unstructured conversation for pre-proposal exploration: reads the corpus for context, compares product approaches, no artifacts, no interview machinery, no implementation-language guards firing. Transitions to `prd-propose` when ideas crystallize, passing accumulated context in memory so propose's interview can skip questions explore answered. Auto-triggers from natural language (read-only — safe to enter accidentally). Keeps the action set at eight skills.
- **Version control of `changes/` — skill is git-agnostic** — section 8.6. Skill writes and reads files; it does not run git commands, suggest commits at lifecycle boundaries, or ship `.gitignore` recommendations. User decides their own version-control workflow (commit all drafts, gitignore until applied, branch-per-proposal, whatever). Lifecycle transitions are pure filesystem operations.
