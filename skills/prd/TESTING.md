# Testing the PRD Skill Family

The skill family is tested in two tiers:

| Tier | What | Where it runs | Runs in CI? |
|---|---|---|---|
| **Tier 1 — Deterministic** | Per-script unit tests + cross-script integration + corpus fixtures + lifecycle simulation | Vitest under `scripts/__tests__/` | Yes |
| **Tier 2 — Probabilistic** | Three-agent harness (persona × executor × evaluator) exercising real interview behavior and content quality | `tests/harness/eval.sh` (planned) | No — manual, before releases |

Skills are LLM-driven, so full determinism isn't possible — but the structural correctness that matters can be made deterministic. The probabilistic layer covers interview behavior and content quality. See [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §16 for the full design.

---

## Tier 1 — Deterministic Tests (CI)

Fast, cheap, high-signal. Runs on every PR.

### Running

```bash
cd skills/prd/scripts
npm install
npm test
```

Vitest discovers everything under `__tests__/`. As of this writing: **109 tests across 9 files**, ~500ms wall time.

### What's covered

**Per-script unit tests** (`__tests__/<script>.test.ts`) — every deterministic script ships with one:

| Script | Test file | Coverage |
|---|---|---|
| `resolve-config.ts` | `resolve-config.test.ts` | YAML parsing, defaults, template-ref validation, read-only normalization |
| `list-proposals.ts` | `list-proposals.test.ts` | Active vs archived split; archive folder name parsing; sort order |
| `proposal-status.ts` | `proposal-status.test.ts` | Strikethrough counting (`- [x]`, `- [x] ~~...~~`, `- [ ] ~~...~~`, etc.) |
| `list-templates.ts` | `list-templates.test.ts` | Builtin + custom scanning; multi-source override |
| `validate-template.ts` | `validate-template.test.ts` | Required + soft roles; section presence; storage shape rules |
| `list-corpus.ts` | `list-corpus.test.ts` | Singleton + per-instance enumeration; `changes/` exclusion; singleton/per-instance dedup |
| `check-readonly.ts` | `check-readonly.test.ts` | Pattern normalization; directory matching; path-outside-root rejection |
| `resolve-xref.ts` | `resolve-xref.test.ts` | Inline link extraction; external classification; same-file + cross-file anchor resolution |

**Cross-script integration** (`__tests__/integration.test.ts`):

- Builtin bundle validates clean (catches bundle regressions).
- Corpus enumeration + xref resolution against `fixtures/corpus-good/`: expected entries, working anchors.
- Same scripts against `fixtures/corpus-broken-xref/`: same enumeration, broken anchor correctly flagged.
- **Lifecycle simulation** — walks a fixture proposal through draft → partial → fully-applied → archived using filesystem operations only. Asserts `list-proposals` + `proposal-status` outputs at each transition. Also covers idempotency (re-running on an unchanged proposal is a no-op) and the strikethrough rule (superseded tasks counted separately from pending).

### Fixtures

```
scripts/__tests__/fixtures/
  corpus-good/             # well-formed corpus: onboarding.md, billing.md, glossary.md, personas.md
  corpus-broken-xref/      # same shape, but onboarding.md links to a missing anchor in billing.md
```

The bundle used by the integration tests is the real builtin bundle at `references/templates/builtin/prd/v1/` — not a fixture copy. If someone breaks the builtin bundle, the integration suite catches it.

### Adding a new test

- **New script** → add `__tests__/<name>.test.ts` with the script. Required, not optional (per [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §19.7).
- **New corpus fixture** → add a folder under `__tests__/fixtures/`; reference it from `integration.test.ts`. Markdown only.
- **New lifecycle case** → add a `describe`/`it` block in `integration.test.ts` using `makeTempRoot` from `helpers.ts`.

### What Tier 1 cannot cover

Tier 1 tests the deterministic scripts. It cannot test:

- The LLM portions of `prd-verify`, `prd-audit`, the interview in `prd-propose`/`prd-clarify`, or the write step of `prd-apply`.
- Skill-level behavior (does the agent actually push back on a thin success metric?). That's Tier 2.
- Quality of generated content (is the PRD well-written?). That's Tier 2.

If a check can be expressed as "given input X, the JSON output should be Y," it belongs in Tier 1. Anything that requires judgment about quality, tone, or interview behavior belongs in Tier 2.

---

## Tier 2 — Probabilistic Harness (manual)

Architecture per [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §16.2–§16.6: three isolated `claude -p` subprocesses (persona, executor, evaluator) run the skills end-to-end against scenario × persona fixtures, then a rubric-driven evaluator produces `findings-<rubric>.json` per cell.

### Layout

```
tests/
  fixtures/
    scenarios/   # fintech-instant-payments.md, ecommerce-checkout-redesign.md, internal-bug-tracker.md
    personas/    # decisive-pm.md, uncertain-pm.md, first-time-pm.md
    rubrics/     # propose.md, apply.md, interview-flow.md
  harness/
    eval.sh      # matrix runner (single cell or full matrix)
  results/       # gitignored; created on first run
    <label>/
      <scenario>-x-<persona>/
        transcript.jsonl
        artifacts/
        findings-<rubric>.json
```

### Running

Pre-flight: `claude` CLI and `jq` must be in PATH.

```bash
cd skills/prd/tests/harness

# Single cell
./eval.sh fintech-instant-payments decisive-pm

# Single cell with a specific rubric (default: propose)
./eval.sh ecommerce-checkout-redesign uncertain-pm --rubric apply

# Full matrix — 9 cells × 3 rubrics. Cost roughly $25–$100.
./eval.sh --matrix --label 2026-06-12-pre-release

# Help (lists available scenarios / personas / rubrics)
./eval.sh --help
```

### How it works

Per cell (one scenario × persona pair):

1. **Set up an isolated work dir** under `$TMPDIR/` with `.claude/skills/` symlinking the eight action skills + the umbrella.
2. **Persona** is seeded with its profile + the scenario brief + the autonomy rule, opens the conversation.
3. **Persona ↔ executor turn loop.** Each agent runs as its own `claude -p` subprocess; sessions are resumed across turns via `--resume <session-id>`. Each turn logs `{turn, actor, content}` to `transcript.jsonl`. Loop ends when:
   - Persona outputs `[END SESSION]`, or
   - Executor signals completion (`Proposal captured at...`, `All tasks applied...`, `Archive complete`), or
   - `MAX_TURNS` (default 30) is hit.
4. **Artifacts** the executor wrote (everything under the work dir except `.claude/`) are copied to `artifacts/`.
5. **Evaluator** is invoked per rubric — a single-shot `claude -p` that receives the rubric + persona profile + scenario + transcript + artifact contents and outputs the JSON specified by the rubric. Saved as `findings-<rubric>.json`.

If a cell already has a non-empty `transcript.jsonl` and `artifacts/` dir, the conversation is **reused** — only the evaluator re-runs. Useful for adding new rubrics without paying for fresh conversations.

### CLI assumptions

The harness assumes `claude -p`:
- supports `--resume <session-id>` to continue a session in print mode,
- supports `--output-format json` returning at minimum `{ "session_id": "...", "result": "..." }`.

If your `claude` version differs, the cleanest adjustment is in `run_claude()` at the top of `eval.sh`. If `--resume` doesn't work in print mode, drop the resume args and pass the full conversation each turn as the prompt — slower and more expensive, but works regardless.

### Why it's not in CI

- **Cost.** A single cell is roughly $5–10 with Opus. The full 3 × 3 × 3 matrix is roughly $25–$100. Not appropriate for per-PR runs.
- **Flakiness.** Even at temperature 0, results vary. Single failures aren't always regressions — see [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §16.7 on running N=3 repetitions and flagging only repeated failures.
- **Network dependence.** Some scenarios may touch MCP servers; CI shouldn't.

Run before tagging a release, after material skill-prompt changes, or when diagnosing a regression.

### Design risks

See [`SKILL_DESIGN.md`](./SKILL_DESIGN.md) §16.7 for documented risks (same-model bias, reproducibility, persona drift, cost) and the mitigations.

---

## Default Workflow

| When | What to run |
|---|---|
| Per PR (CI) | Tier 1 — `npm test` from `scripts/` |
| Before tagging a release | Tier 2 full matrix; review findings |
| After changing skill prompts | Tier 2 on affected scenarios / personas |
| When diagnosing a regression | Single Tier 2 cell with verbose transcript |

## What Testing Does NOT Cover

- **Quality of the underlying model.** Opus regressions are an Anthropic-side issue — the harness surfaces them, but the fix is upgrading or pinning the model.
- **UI / slash-command UX.** Claude Code's concern, not the skill's.
- **Real network-dependent tasks.** Mocked or skipped in Tier 1. Tier 2 can include them if the operator sets up the relevant MCPs locally.
