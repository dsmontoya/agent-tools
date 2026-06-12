#!/usr/bin/env bash
#
# eval.sh — Tier 2 probabilistic harness for the PRD skill family.
#
# Architecture (per SKILL_DESIGN.md §16.2–§16.6):
#
#   ┌─────────────┐    prompt + interview    ┌─────────────┐
#   │   Persona   │ ◄──────────────────────► │  Executor   │
#   │  (PM role)  │       replies            │  (skills)   │
#   └─────────────┘                          └──────┬──────┘
#                                                   │ artifacts +
#                                                   │ transcript
#                                                   ▼
#                                            ┌─────────────┐
#                                            │  Evaluator  │ → findings.json
#                                            │  (+ rubric) │
#                                            └─────────────┘
#
# Each agent runs as a separate `claude -p` subprocess. Three independent
# processes, three fresh contexts. Nothing shared except files the executor
# writes, the rubric, and the transcript captured here.
#
# Usage:
#   ./eval.sh <scenario> <persona> [--rubric <name>] [--label <label>] [--max-turns N]
#   ./eval.sh --matrix [--label <label>] [--max-turns N]
#
# Examples:
#   ./eval.sh fintech-instant-payments decisive-pm
#   ./eval.sh ecommerce-checkout-redesign uncertain-pm --rubric apply
#   ./eval.sh --matrix --label 2026-06-12-pre-release
#
# Cost note: a single cell is roughly $5–10 with Opus. The full
# 3 × 3 matrix evaluated against all 3 rubrics is roughly $25–100.
# Do not run unattended.
#
# CLI assumptions documented at the bottom of this file.

set -euo pipefail

# ────────────────────────────────────────────────────────────────────────────
# Paths
# ────────────────────────────────────────────────────────────────────────────

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$HARNESS_DIR/.." && pwd)"
PRD_DIR="$(cd "$TESTS_DIR/.." && pwd)"
SKILLS_ROOT="$(cd "$PRD_DIR/.." && pwd)"

FIXTURES_DIR="$TESTS_DIR/fixtures"
SCENARIOS_DIR="$FIXTURES_DIR/scenarios"
PERSONAS_DIR="$FIXTURES_DIR/personas"
RUBRICS_DIR="$FIXTURES_DIR/rubrics"
RESULTS_DIR="$TESTS_DIR/results"

MAX_TURNS="${MAX_TURNS:-30}"
DEFAULT_RUBRIC="${DEFAULT_RUBRIC:-propose}"

# ────────────────────────────────────────────────────────────────────────────
# Pre-flight
# ────────────────────────────────────────────────────────────────────────────

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: required command '$1' not found in PATH" >&2
    exit 1
  }
}
require_cmd claude
require_cmd jq

# ────────────────────────────────────────────────────────────────────────────
# Usage
# ────────────────────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
Usage:
  $(basename "$0") <scenario> <persona> [--rubric <name>] [--label <label>] [--max-turns N]
  $(basename "$0") --matrix [--label <label>] [--max-turns N]

Args:
  <scenario>         Scenario name (matches fixtures/scenarios/<name>.md)
  <persona>          Persona name (matches fixtures/personas/<name>.md)
  --rubric <name>    Rubric name (matches fixtures/rubrics/<name>.md); default: $DEFAULT_RUBRIC
  --label <label>    Label for the results dir; default: today's date
  --max-turns N      Cap turns per cell; default: $MAX_TURNS
  --matrix           Run the full scenario × persona × rubric matrix
  --help             Show this help

Available scenarios:
$(cd "$SCENARIOS_DIR" && for f in *.md; do echo "  - ${f%.md}"; done)

Available personas:
$(cd "$PERSONAS_DIR" && for f in *.md; do echo "  - ${f%.md}"; done)

Available rubrics:
$(cd "$RUBRICS_DIR" && for f in *.md; do echo "  - ${f%.md}"; done)

Cost note: a single cell is roughly \$5–10 with Opus.
The full 3 × 3 × 3 matrix is roughly \$25–100. Do not run unattended.
EOF
}

# ────────────────────────────────────────────────────────────────────────────
# Arg parsing
# ────────────────────────────────────────────────────────────────────────────

MODE=""
SCENARIO=""
PERSONA=""
RUBRIC="$DEFAULT_RUBRIC"
LABEL="$(date +%Y-%m-%d)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --matrix) MODE="matrix"; shift ;;
    --rubric) RUBRIC="$2"; shift 2 ;;
    --label) LABEL="$2"; shift 2 ;;
    --max-turns) MAX_TURNS="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    --*) echo "ERROR: unknown flag '$1'" >&2; usage; exit 2 ;;
    *)
      if [[ -z "$SCENARIO" ]]; then SCENARIO="$1"
      elif [[ -z "$PERSONA" ]]; then PERSONA="$1"
      else echo "ERROR: unexpected positional arg '$1'" >&2; usage; exit 2
      fi
      shift
      ;;
  esac
done

# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

# Run `claude -p` with optional --resume and capture session_id.
# Args:
#   $1 — working directory ("" for harness dir)
#   $2 — prompt content
#   $3 — (optional) session id to resume
# Echoes a JSON object: {"session_id": "...", "result": "..."}
run_claude() {
  local work_dir="$1" prompt="$2" resume_id="${3:-}"
  local args=()
  [[ -n "$resume_id" ]] && args+=(--resume "$resume_id")
  args+=(-p "$prompt" --output-format json)
  if [[ -n "$work_dir" ]]; then
    (cd "$work_dir" && claude "${args[@]}")
  else
    claude "${args[@]}"
  fi
}

# Append one turn to the transcript file.
log_turn() {
  local file="$1" turn="$2" actor="$3" content="$4"
  jq -nc \
    --argjson turn "$turn" \
    --arg actor "$actor" \
    --arg content "$content" \
    '{turn: $turn, actor: $actor, content: $content}' >> "$file"
}

# Set up an isolated work dir with .claude/skills/ pointing at the real skills.
setup_work_dir() {
  local work_dir
  work_dir="$(mktemp -d -t prd-eval-XXXXXX)"
  mkdir -p "$work_dir/.claude/skills"
  for d in "$SKILLS_ROOT"/prd "$SKILLS_ROOT"/prd-*; do
    [[ -d "$d" ]] || continue
    ln -s "$d" "$work_dir/.claude/skills/$(basename "$d")"
  done
  echo "$work_dir"
}

# Copy artifacts from work_dir to results (everything except .claude/ symlinks).
copy_artifacts() {
  local work_dir="$1" artifacts_dir="$2"
  mkdir -p "$artifacts_dir"
  (cd "$work_dir" && find . -mindepth 1 -not -path './.claude*' -print0) \
    | while IFS= read -r -d '' rel; do
        local src="$work_dir/${rel#./}"
        local dst="$artifacts_dir/${rel#./}"
        if [[ -d "$src" ]]; then
          mkdir -p "$dst"
        else
          mkdir -p "$(dirname "$dst")"
          cp "$src" "$dst"
        fi
      done
}

# ────────────────────────────────────────────────────────────────────────────
# Conversation: persona ↔ executor
# Reuses an existing transcript+artifacts directory if both already exist
# under $cell_dir.
# ────────────────────────────────────────────────────────────────────────────

run_conversation() {
  local scenario_name="$1" persona_name="$2" cell_dir="$3"
  local transcript="$cell_dir/transcript.jsonl"
  local artifacts_dir="$cell_dir/artifacts"

  if [[ -s "$transcript" && -d "$artifacts_dir" ]]; then
    echo "Conversation already recorded at $cell_dir — reusing"
    return 0
  fi

  local scenario_file="$SCENARIOS_DIR/$scenario_name.md"
  local persona_file="$PERSONAS_DIR/$persona_name.md"
  [[ -f "$scenario_file" ]] || { echo "ERROR: missing $scenario_file" >&2; exit 2; }
  [[ -f "$persona_file" ]] || { echo "ERROR: missing $persona_file" >&2; exit 2; }

  mkdir -p "$cell_dir"
  : > "$transcript"

  local work_dir
  work_dir="$(setup_work_dir)"

  # Trap cleanup of work_dir on early exit; we copy artifacts before EOF.
  trap 'rm -rf "$work_dir"' RETURN

  local persona_content scenario_content
  persona_content="$(cat "$persona_file")"
  scenario_content="$(cat "$scenario_file")"

  # Persona's seed: profile + scenario + the autonomy rule is in the persona file.
  local persona_seed
  persona_seed="$(cat <<EOF
$persona_content

---

# Scenario

$scenario_content

---

You are now starting a conversation with a PRD-writing assistant. Open
by stating what you want to do in 1–2 sentences. Stay in character
throughout this entire session, including all later turns.
EOF
)"

  echo "===== $scenario_name × $persona_name ====="
  echo "  work_dir:   $work_dir"
  echo "  cell_dir:   $cell_dir"

  # Turn 0 — persona opens.
  local persona_json persona_session_id persona_msg
  persona_json="$(run_claude "" "$persona_seed")"
  persona_session_id="$(echo "$persona_json" | jq -r '.session_id // empty')"
  persona_msg="$(echo "$persona_json" | jq -r '.result // .response // empty')"

  [[ -n "$persona_msg" ]] || { echo "ERROR: persona produced empty opener" >&2; rm -rf "$work_dir"; exit 1; }
  log_turn "$transcript" 0 persona "$persona_msg"
  printf '[persona, turn 0]: %s\n' "$(printf '%s' "$persona_msg" | head -c 240)"

  local executor_session_id="" executor_json executor_msg
  local terminate=false

  for turn in $(seq 1 "$MAX_TURNS"); do
    # Executor turn
    if [[ -z "$executor_session_id" ]]; then
      executor_json="$(run_claude "$work_dir" "$persona_msg")"
    else
      executor_json="$(run_claude "$work_dir" "$persona_msg" "$executor_session_id")"
    fi
    executor_session_id="$(echo "$executor_json" | jq -r '.session_id // empty')"
    executor_msg="$(echo "$executor_json" | jq -r '.result // .response // empty')"
    log_turn "$transcript" "$turn" executor "$executor_msg"
    printf '[executor, turn %d]: %s\n' "$turn" "$(printf '%s' "$executor_msg" | head -c 240)"

    if echo "$executor_msg" | grep -qE 'Proposal captured at|All tasks applied|Archive complete'; then
      terminate=true
      break
    fi

    # Persona turn
    persona_json="$(run_claude "" "$executor_msg" "$persona_session_id")"
    persona_msg="$(echo "$persona_json" | jq -r '.result // .response // empty')"
    log_turn "$transcript" "$turn" persona "$persona_msg"
    printf '[persona, turn %d]: %s\n' "$turn" "$(printf '%s' "$persona_msg" | head -c 240)"

    if echo "$persona_msg" | grep -qF '[END SESSION]'; then
      terminate=true
      break
    fi
  done

  [[ "$terminate" == "true" ]] || echo "WARN: hit MAX_TURNS=$MAX_TURNS without natural termination" >&2

  copy_artifacts "$work_dir" "$artifacts_dir"
  rm -rf "$work_dir"
  trap - RETURN
}

# ────────────────────────────────────────────────────────────────────────────
# Evaluator
# ────────────────────────────────────────────────────────────────────────────

run_evaluator() {
  local scenario_name="$1" persona_name="$2" rubric_name="$3" cell_dir="$4"
  local rubric_file="$RUBRICS_DIR/$rubric_name.md"
  local scenario_file="$SCENARIOS_DIR/$scenario_name.md"
  local persona_file="$PERSONAS_DIR/$persona_name.md"
  [[ -f "$rubric_file" ]] || { echo "ERROR: missing $rubric_file" >&2; exit 2; }

  local transcript="$cell_dir/transcript.jsonl"
  local artifacts_dir="$cell_dir/artifacts"
  local findings_file="$cell_dir/findings-$rubric_name.json"

  echo "  evaluator → $rubric_name"

  local rubric_content scenario_content persona_content transcript_content artifact_inventory artifact_contents
  rubric_content="$(cat "$rubric_file")"
  scenario_content="$(cat "$scenario_file")"
  persona_content="$(cat "$persona_file")"
  transcript_content="$(cat "$transcript")"

  if [[ -d "$artifacts_dir" ]]; then
    artifact_inventory="$(cd "$artifacts_dir" && find . -type f | sort | sed 's|^\./||')"
    artifact_contents="$(cd "$artifacts_dir" && find . -type f \
      \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' -o -name '*.txt' -o -name '*.json' \) \
      | sort | while IFS= read -r f; do
          printf '\n=== %s ===\n' "${f#./}"
          cat "$f"
        done)"
  else
    artifact_inventory="(no artifacts captured)"
    artifact_contents=""
  fi

  local eval_prompt
  eval_prompt="$(cat <<EOF
You are evaluating a PRD-writing skill session against the rubric below.

# Rubric

$rubric_content

# Persona profile

$persona_content

# Scenario brief

$scenario_content

# Transcript (JSONL, one turn per line)

$transcript_content

# Artifact inventory

$artifact_inventory

# Artifact contents

$artifact_contents

# Your job

Apply every criterion in the rubric to the transcript and artifacts above.
Output ONLY a JSON object matching the schema described in the rubric.
No prose before or after. No code fence. Emit raw JSON.
EOF
)"

  local eval_json eval_result
  eval_json="$(run_claude "" "$eval_prompt")"
  eval_result="$(echo "$eval_json" | jq -r '.result // .response // empty')"
  # Strip a possible ```json fence the evaluator may have produced despite instructions.
  eval_result="$(echo "$eval_result" | sed -e 's/^```json$//' -e 's/^```$//')"
  echo "$eval_result" > "$findings_file"
}

# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

if [[ "$MODE" == "matrix" ]]; then
  for s_file in "$SCENARIOS_DIR"/*.md; do
    s_name="$(basename "$s_file" .md)"
    for p_file in "$PERSONAS_DIR"/*.md; do
      p_name="$(basename "$p_file" .md)"
      cell_dir="$RESULTS_DIR/$LABEL/${s_name}-x-${p_name}"
      run_conversation "$s_name" "$p_name" "$cell_dir"
      for r_file in "$RUBRICS_DIR"/*.md; do
        r_name="$(basename "$r_file" .md)"
        run_evaluator "$s_name" "$p_name" "$r_name" "$cell_dir"
      done
    done
  done
  echo "Matrix complete. Results in $RESULTS_DIR/$LABEL/"
  exit 0
fi

# Single-cell mode
[[ -n "$SCENARIO" && -n "$PERSONA" ]] || { usage; exit 2; }

CELL_DIR="$RESULTS_DIR/$LABEL/${SCENARIO}-x-${PERSONA}"
run_conversation "$SCENARIO" "$PERSONA" "$CELL_DIR"
run_evaluator "$SCENARIO" "$PERSONA" "$RUBRIC" "$CELL_DIR"

echo ""
echo "Cell complete:"
echo "  Transcript: $CELL_DIR/transcript.jsonl"
echo "  Artifacts:  $CELL_DIR/artifacts/"
echo "  Findings:   $CELL_DIR/findings-$RUBRIC.json"

# ────────────────────────────────────────────────────────────────────────────
# CLI assumptions
#
# This script assumes the `claude` CLI supports:
#   - `claude -p <prompt>` for non-interactive (print) mode
#   - `claude --resume <session-id> -p <prompt>` to continue a session
#   - `--output-format json` returning at minimum `{ "session_id": "...", "result": "..." }`
#
# If your `claude` version differs, the cleanest adjustment is in `run_claude`
# (above). If `--resume` isn't supported in print mode, drop the resume
# arguments and pass the full conversation each turn as the prompt — slower
# and more expensive, but works regardless.
#
# This script does NOT use --append-system-prompt; the persona's profile
# and scenario are injected as the persona's first user message instead.
# The session_id keeps that context across turns.
# ────────────────────────────────────────────────────────────────────────────
