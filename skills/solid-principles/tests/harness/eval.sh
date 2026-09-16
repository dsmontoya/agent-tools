#!/usr/bin/env bash
# Trigger-discrimination harness for solid-principles.
#
# Runs each prompt in ../fixtures/triggers.md past a fresh `claude -p` that has
# never seen this skill, and reports whether solid-principles would load.
#
# The fixture is the single source of truth: prompts, labels, contested marks,
# and the decoy list are all parsed from it. The description under test is read
# live from ../../SKILL.md, so this always tests what is actually shipped.
#
#   ./eval.sh                 # 3 runs per prompt, majority vote
#   RUNS=1 ./eval.sh          # quick single-shot pass
#   PARALLEL=8 ./eval.sh      # more concurrency
#   ./eval.sh --label pre-release

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE="$HERE/../fixtures/triggers.md"
SKILL="$HERE/../../SKILL.md"
RUNS="${RUNS:-3}"
PARALLEL="${PARALLEL:-4}"
LABEL="$(date +%Y-%m-%d-%H%M%S)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) LABEL="$2"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

command -v claude >/dev/null || { echo "claude CLI not found in PATH" >&2; exit 1; }
[[ -f "$FIXTURE" ]] || { echo "fixture not found: $FIXTURE" >&2; exit 1; }

RESULTS="$HERE/../results/$LABEL"
mkdir -p "$RESULTS"

# ---------------------------------------------------------------- skill listing
# Decoys come from the fenced block in the fixture; the skill under test is
# appended with its live description so an edit is picked up without touching
# this script.

DECOYS="$(awk '/^```$/{f=!f; next} f && /^[a-z-]+ /' "$FIXTURE")"

DESCRIPTION="$(awk '
  /^description: \|/ { on=1; next }
  on && /^[a-z_]+:/  { exit }
  on                 { sub(/^  /, ""); print }
' "$SKILL" | sed '/^$/d' | tr '\n' ' ')"

LISTING="$DECOYS
solid-principles  $DESCRIPTION"

# ------------------------------------------------------------------- fixture
# Rows look like:  | L3 | "Add Stripe support" *(PayPal already exists)* | why |
# The parenthetical is repo context the agent would have in reality, so it is
# folded into the prompt rather than dropped.

parse_rows() {
  grep -E '^\| [LN][0-9]+ \|' "$FIXTURE" | while IFS='|' read -r _ id prompt why _rest; do
    id="$(echo "$id" | xargs)"
    text="$(echo "$prompt" | sed -E 's/.*"([^"]*)".*/\1/')"
    ctx="$(echo "$prompt" | sed -nE 's/.*\*\(([^)]*)\)\*.*/\1/p')"
    [[ -n "$ctx" ]] && text="$text  (context: $ctx)"
    contested=no
    echo "$why" | grep -qi 'contested' && contested=yes
    printf '%s\t%s\t%s\n' "$id" "$contested" "$text"
  done
}

# Asking for a bare name list with "no explanation" produces degenerate "none"
# answers — the model picks the cheapest reply rather than deciding. Letting it
# reason briefly and then parsing a required final line is both more accurate
# and leaves a readable log for diagnosis.
ask() {
  claude -p "Here are the skills available in this session:

$LISTING

A user sends this request:

  $1

Decide which of these skills, if any, you would load before responding to that
request. Think it through briefly, then end your reply with a final line in
exactly this form:

ANSWER: <comma-separated skill names, or NONE>" 2>/dev/null || true
}

loaded_p() {
  # Only the final ANSWER: line counts — the reasoning above it will often
  # mention solid-principles while ruling it out.
  local answer
  answer="$(grep -i '^ANSWER:' <<<"$1" | tail -1 | tr '[:upper:]' '[:lower:]')"
  [[ -z "$answer" ]] && { echo "  !! no ANSWER line" >&2; return 1; }
  grep -q 'solid-principles' <<<"$answer"
}

# A transport failure is not a verdict. Retry rather than scoring it as "did
# not load", which would silently turn infrastructure noise into soft failures.
ask_retrying() {
  local out attempt
  for attempt in 1 2 3; do
    out="$(ask "$1")"
    if grep -qi '^ANSWER:' <<<"$out" && ! grep -qi 'API Error' <<<"$out"; then
      printf '%s' "$out"; return 0
    fi
    sleep 2
  done
  printf '%s' "$out"
}

run_case() {
  local id="$1" contested="$2" text="$3" hits=0 r out
  : > "$RESULTS/logs/$id.log"
  for ((r = 1; r <= RUNS; r++)); do
    out="$(ask_retrying "$text")"
    printf -- '--- run %s ---\n%s\n' "$r" "$out" >> "$RESULTS/logs/$id.log"
    loaded_p "$out" && hits=$((hits + 1))
  done
  local loaded=no
  (( hits * 2 > RUNS )) && loaded=yes
  printf '%s\t%s\t%s\t%s/%s\t%s\n' "$id" "$contested" "$loaded" "$hits" "$RUNS" "$text" \
    > "$RESULTS/cases/$id.tsv"
}

echo "solid-principles · trigger discrimination"
echo "runs per prompt: $RUNS   parallel: $PARALLEL   results: $RESULTS"
echo

mkdir -p "$RESULTS/logs" "$RESULTS/cases"
parse_rows > "$RESULTS/prompts.tsv"
total=$(wc -l < "$RESULTS/prompts.tsv" | tr -d ' ')
(( total > 0 )) || { echo "no cases parsed from $FIXTURE" >&2; exit 1; }

# Plain background jobs rather than xargs: prompts contain apostrophes, which
# xargs quoting mangles, and one file per case avoids interleaved appends.
while IFS=$'\t' read -r id contested text; do
  while (( $(jobs -rp | wc -l) >= PARALLEL )); do sleep 0.2; done
  run_case "$id" "$contested" "$text" &
done < "$RESULTS/prompts.tsv"
wait

cat "$RESULTS"/cases/*.tsv | sort > "$RESULTS/raw.tsv"
got=$(wc -l < "$RESULTS/raw.tsv" | tr -d ' ')
(( got == total )) || { echo "expected $total results, got $got" >&2; exit 1; }

# --------------------------------------------------------------------- scoring
# Counts are derived from the written report rather than incremented in the
# loop: piping the loop into tee would run it in a subshell and discard them.
{
  echo "ID      expect  loaded  votes   verdict"
  while IFS=$'\t' read -r id contested loaded votes text; do
    expect=load; [[ $id == N* ]] && expect=skip
    verdict=ok
    if [[ $contested == yes ]]; then
      verdict="contested (excluded)"
    elif [[ $expect == skip && $loaded == yes ]]; then
      verdict="HARD FAIL"
    elif [[ $expect == load && $loaded == no ]]; then
      verdict="soft fail"
    fi
    printf '%-7s %-7s %-7s %-7s %s\n' "$id" "$expect" "$loaded" "$votes" "$verdict"
  done < "$RESULTS/raw.tsv"
} > "$RESULTS/report.txt"

hard=$(grep -c 'HARD FAIL' "$RESULTS/report.txt" || true)
soft=$(grep -c 'soft fail'  "$RESULTS/report.txt" || true)

{
  echo
  echo "hard failures: $hard   (bar: 0 — loading on an uncontested skip case)"
  echo "soft failures: $soft   (bar: 2 — missing a load case)"
} >> "$RESULTS/report.txt"
cat "$RESULTS/report.txt"

if (( hard > 0 )); then
  echo
  echo "FAILED on the hard bar. Rewrite the description — do not relabel the case."
  echo "Traps N3/N4/N8 test whether abstraction vocabulary stays out of positive"
  echo "clauses; N13/N14 test the throwaway-work clause."
  exit 1
fi
if (( soft > 2 )); then
  echo
  echo "Passed the hard bar but missed $soft load cases. Acceptable only if L1 and L2 held."
  exit 1
fi

echo
echo "PASS"
