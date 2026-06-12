# Rubric: prd-propose

Evaluate the artifacts produced by `prd-propose` against the persona's intent and the writing principles in `../prd/references/REFERENCE.md`.

## Inputs you'll read

- `transcript.jsonl` — full back-and-forth between persona and executor.
- `artifacts/intent.md`, `artifacts/tasks.md`, `artifacts/research.md` (if present) — what the executor wrote.
- `persona.md` — who the persona is (so you can judge *"did the executor handle this persona well?"*).
- `scenario.md` — what the persona was building.

## Criteria

For each item, output `pass` / `fail` / `n/a` with one short evidence quote (from transcript or artifact). Use `n/a` only when the criterion genuinely doesn't apply.

### Structural

- **S1** — `intent.md` exists and is non-empty.
- **S2** — `tasks.md` exists and contains at least one `- [ ]` task.
- **S3** — `tasks.md` tasks are atomic — each names one file, one section, one operation, one concrete change.
- **S4** — `research.md` exists if and only if the transcript shows external data was consulted.

### Content quality

- **C1** — The problem statement is concrete (names a specific behavior or symptom, not *"users find it confusing"*).
- **C2** — Target users are specific (a named persona, not *"everyone"*).
- **C3** — Success metric is a single number with a direction and (where appropriate) a timeframe.
- **C4** — At least one capability is described in user-visible terms (what the user sees / does / experiences).
- **C5** — No implementation-language CRITICAL violations in captured intent (no code, SQL, endpoints, internal data structures). Tier definitions in `../prd/references/REFERENCE.md` §3.

### Interview quality

- **I1** — Executor pushed back on at least one load-bearing answer that was thin in the transcript (problem / users / success / capability — see `../prd/references/REFERENCE.md` §7).
- **I2** — Executor did not push back more than twice on the same question.
- **I3** — Executor used product language throughout questions (no *"Want to add a Risks section?"* — see `../prd/references/REFERENCE.md` §1, §5).
- **I4** — If the persona answered in implementation terms (*"we'll use OAuth"*), executor reflected the user-visible behavior underneath rather than capturing the implementation verbatim.
- **I5** — Executor offered a draft once the load-bearing four were solid; didn't keep mining the persona.

## Output format

A single JSON object, written to `findings.json`:

```json
{
  "criteria": {
    "S1": { "result": "pass", "evidence": "intent.md is 47 lines, well-formed" },
    "S2": { "result": "pass", "evidence": "tasks.md has 4 `- [ ]` tasks" },
    "...": { "...": "..." }
  },
  "summary": {
    "passed": 12,
    "failed": 2,
    "n_a": 1,
    "notes": "Free-form observations the harness operator should know about."
  }
}
```
