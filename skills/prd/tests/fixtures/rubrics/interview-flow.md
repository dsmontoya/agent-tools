# Rubric: interview-flow

Evaluate the *behavior* of the executor during the interview, independent of the final artifact content.

## Inputs you'll read

- `transcript.jsonl` — the back-and-forth.
- `persona.md` — who the persona is.
- `scenario.md` — the scenario brief.

## Criteria

For each item, output `pass` / `fail` / `n/a` with one short evidence quote from the transcript.

### Pacing

- **P1** — Executor acknowledged briefly between questions (no multi-sentence recaps every turn).
- **P2** — Executor synthesized at checkpoints — after the load-bearing four, restated concisely to catch misinterpretations.
- **P3** — Executor offered to draft once load-bearing was locked; didn't keep mining.

### Adaptation

- **A1** — Executor adapted questions to prior answers (e.g., if persona said *"internal tool"*, executor did not ask about competitive landscape).
- **A2** — Executor used product language consistently — no template section numbers / names (*"section 10 Risk Assessment"*) in user-facing prompts.
- **A3** — If persona was uncertain or vague on a load-bearing answer, executor used the pushback patterns from `../prd/references/REFERENCE.md` §8 rather than open-ended re-asking.

### Persona handling

- **PH1** — Executor handled the persona's communication style (terse / hedging / implementation-flavored) without breaking the interview structure.
- **PH2** — If the persona signaled to skip a section (*"don't worry about that"*), executor proposed omit or N/A rather than continuing to push.
- **PH3** — Executor never asked the persona to "learn the template" or use template terminology.

### Termination

- **T1** — Session terminated cleanly. Either persona output `[END SESSION]` or executor signaled completion.
- **T2** — Session did not exceed 30 turns of back-and-forth.

## Output format

```json
{
  "criteria": { "...": "..." },
  "summary": { "passed": 0, "failed": 0, "n_a": 0, "notes": "..." }
}
```
