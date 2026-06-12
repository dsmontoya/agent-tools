# Rubric: prd-apply

Evaluate the PRD content produced by `prd-apply` against the proposal's intent and the writing principles in `../prd/references/REFERENCE.md`.

## Inputs you'll read

- `transcript.jsonl` — apply's session.
- `artifacts/intent.md`, `artifacts/tasks.md` — what apply consumed.
- `artifacts/prds/*.md` — what apply wrote (or modified).

## Criteria

For each item, output `pass` / `fail` / `n/a` with one short evidence quote.

### Structural

- **S1** — All tasks in `tasks.md` are checked (`- [x]`) or struck through (`~~...~~`) at the end of apply, or any unchecked task has a documented reason (read-only target, deferred discrepancy).
- **S2** — Each PRD touched by apply has the four load-bearing roles populated (problem, users, success, capability).
- **S3** — No `[TBD]` markers remain in PRD content unless an explicit TODO line is present.
- **S4** — Skip states are rendered correctly: `N/A — <reason>`, `TODO — <unblocker>`, or omitted entirely.

### Content quality

- **C1** — Requirements are declarative (no Given-When-Then).
- **C2** — Success metrics are specific numbers, not vague terms.
- **C3** — Capabilities are described in user-visible terms.
- **C4** — Rationale ("why") is present for non-obvious decisions.
- **C5** — No implementation-language CRITICAL violations in PRD content.

### Coherence

- **CO1** — Capabilities trace back to goals in the same PRD.
- **CO2** — Personas referenced in capabilities exist in the Target Users section (or `personas.md`).
- **CO3** — Cross-references between PRDs (if any) resolve to real targets.

## Output format

```json
{
  "criteria": { "...": "..." },
  "summary": { "passed": 0, "failed": 0, "n_a": 0, "notes": "..." }
}
```
