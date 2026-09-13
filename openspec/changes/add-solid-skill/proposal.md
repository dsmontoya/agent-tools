## Why

Agents asked to "apply SOLID" reliably over-abstract: an interface per class, a DI container in a 300-line CLI, a coherent module split across six files that each do nothing. Pattern-shaped output looks like competence, so the failure is invisible at review time. SOLID is also not language-agnostic as stated — LSP presumes inheritance, ISP presumes declared interfaces, OCP presumes polymorphic dispatch — so naively applying it to Go, Rust, Python, or Haskell produces Java-in-another-language.

No skill in this repo covers code structure. `design-md` covers UI, the `prd-*` family covers requirements. This is the first entry on a prospective code-craft shelf.

## What Changes

- New skill at `skills/solid-principles/` — **teaching only**. No scripts, no artifacts, no review pipeline, no umbrella.
- `SKILL.md` (~250 lines) carrying the four-axis reframe, the gate list, the consistency rule, and negative triggers.
- Three reference files for depth: the paradigm matrix, the smell catalog, and the inversions list.
- README entry under a new "Code Craft" heading, following the existing per-skill format.

The skill's substance is a set of **gates** — rules that are failable in one sentence, decided by evidence rather than taste, carrying no syntax assumptions, and blocking by default. Failing a gate is free; passing one costs. That asymmetry is what counter-programs the over-abstraction default, and it is the reason this is a skill rather than a summary of the five principles.

Two design decisions are load-bearing and deliberate:

- **It must not load on every code edit.** Keeping SOLID material permanently in context primes the agent to look for applications of it, which induces the exact over-abstraction the skill exists to prevent. Triggering is scoped to structural moments, and the description carries explicit negative triggers.
- **Existing code wins by default.** A locally-SOLID module inside a non-SOLID codebase yields two architectures, not one good module. Deviation requires cited pain, exactly as abstraction requires a cited commit.

## Capabilities

### New Capabilities
- `solid-principles`: Language-agnostic SOLID guidance delivered as teaching — the four-axis reframe, the evidence gates governing when to add, deviate, report, and remove structure, the consistency-beats-SOLID rule, and the trigger scoping that keeps the skill out of routine edits.

### Modified Capabilities
<!-- None. openspec/specs/ is empty; this is the first capability in the repo. -->

## Impact

- **New**: `skills/solid-principles/SKILL.md`, `skills/solid-principles/references/{paradigms,smells,inversions}.md`, `skills/solid-principles/tests/fixtures/triggers.md`
- **Modified**: `README.md` — new "Code Craft" section with install line
- **Not modified**: `AGENTS.md`. The family-vs-shelf convention and the cross-skill reference rule surfaced during exploration belong in a separate change, so this one stays scoped to the skill.
- **Adjacent skills**: overlaps `code-review` and `simplify`. This skill teaches structure and declines line-level defect hunting; the boundary is stated in "What This Skill Is Not For" rather than enforced.
- **Known fragility, not addressed here**: seven `prd-*` skills hard-link `../prd/references/REFERENCE.md` while the README advertises per-skill installs. `solid-principles` avoids the pattern by carrying its own references, but the underlying question is left open.
