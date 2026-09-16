# Fixture: trigger discrimination

Regression test for the `description` field in [`../../SKILL.md`](../../SKILL.md). Rerun after any description edit.

The cases are weighted toward prompts where the description could plausibly fail. Obvious cases prove nothing.

## How to run

For each prompt, present the evaluator with the decoy skill list below **plus** `solid-principles`, and the prompt alone with no other context. Ask which skills it would load. Record whether `solid-principles` appears.

**Decoys are mandatory.** Offered in isolation, any skill fires on everything — the test measures discrimination, not enthusiasm. The set is fixed and checked in here rather than drawn from whatever the running user has installed, so results stay comparable across runs.

```
code-review      Review the current diff for correctness bugs and cleanups.
simplify         Review changed code for reuse, simplification, efficiency; apply fixes.
design-md        Work with DESIGN.md — design tokens, theming, UI generation.
prd-propose      Interview-driven PRD proposal authoring.
run              Launch and drive this project's app to see a change working.
security-review  Security review of pending changes on the current branch.
```

## Should load

| ID | Prompt | Why |
|---|---|---|
| L1 | "How should I structure the payments module?" | Explicit structure question |
| L2 | "Should this be an interface or just a function?" | Explicit abstraction decision |
| L3 | "Add Stripe support" *(PayPal already exists)* | ⚠ **Hard.** Second implementation of an existing shape, phrased as a routine feature, carrying no structural vocabulary |
| L4 | "I have to touch five files every time I add a provider" | Reported scatter |
| L5 | "The mock for this is really complicated" | ⚠ **Hard, and a known weakness.** Testability pain is a DIP signal with no structural words present. Scored 1/3, 2/3 and 2/5 across runs — the description's `"this is hard to test"` phrasing sits too far from how this is actually voiced. Fix by widening the phrasing deliberately, not by relabelling |
| L6 | "Clean this up, it's getting messy" | Verbatim phrase trigger |
| L7 | "Split this module in two" | ⚠ **Hard.** Reads as executing a decided refactor, and evaluators have declined it on those grounds. Label retained deliberately: G1 exists to ask *name the two actors first*, so a skill that stays out here lets the agent split unchecked — the failure it is meant to prevent |
| L8 | "We're adding a second storage backend" | Boundary being created |
| L9 | "Can the domain code import the database driver?" | ⚠ **Contested.** A question about what the code already permits, answerable by reading it. G8 owns the subject, but nothing is being built or crossed |
| L10 | "Why does changing the logger break unrelated tests?" | ⚠ **Contested.** Coupling pain phrased as a bug report; may legitimately be a bug |
| L11 | "Let's productionize the spike" | Promotion of a prototype is itself a structural moment |

## Should not load

| ID | Prompt | Why |
|---|---|---|
| N1 | "Fix the null check in parseDate" | Local to one function |
| N2 | "Rename userId to accountId" | Rename |
| N3 | "Add a field to the User interface" | 🪤 **Trap.** Contains "interface"; trivially routine |
| N4 | "Rename the PaymentGateway interface" | 🪤 **Trap.** Contains "interface"; still a rename |
| N5 | "Write a test for the payment processor" | 🪤 **Trap.** Names a structural domain object; routine work |
| N6 | "This function is getting long" | 🪤 **Trap.** Length is not an SRP signal — see G1 |
| N7 | "Extract these three lines into a helper" | Local refactor, no boundary |
| N8 | "Update the dependency to v3" | 🪤 **Trap.** Contains "dependency" |
| N9 | "Why is this test flaky?" | Debugging |
| N10 | "Add logging to the checkout flow" | Routine addition |
| N11 | "Make this more solid" | 🪤 **Trap.** Adjective reading of the skill name |
| N12 | "What's the difference between an abstract class and an interface?" | 🪤 **Contested.** General knowledge question, not a decision about this codebase |
| N13 | "Spike a quick version of the importer so we can see if it's feasible" | 🪤 **Trap.** Throwaway work — structure here is waste |
| N14 | "Just a PoC to check whether the vendor API can do what we need" | 🪤 **Trap.** Throwaway work, and it names an external boundary |

## Scoring

The bar is asymmetric, matching the skill's own design: a false positive primes the over-abstraction the skill exists to prevent, while a false negative merely means ordinary code gets written.

- **Hard fail** — loading on any uncontested should-not-load case. Bar: **zero**.
- **Soft fail** — missing a should-load case. Bar: **at most two**, and never both L1 and L2, which are the unambiguous ones.
- **Contested cases** (L9, L10, N12) are recorded but excluded from both bars. If one flips consistently across runs, resolve the label rather than tuning the description around it.

A run that passes the hard bar while failing three or four soft cases is acceptable. The reverse is not.

**When a trap fires, rewrite the description — do not relabel the case.** N3, N4, and N8 exist specifically to test whether confining "interface" and "dependency" to negative clauses works; N13 and N14 test the throwaway-work clause. Their failure is far more actionable than an aggregate score.
