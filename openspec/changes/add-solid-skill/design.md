## Context

SOLID was formulated for class-based OO in the Java/C++ era, and three of the five principles carry syntactic assumptions: LSP presumes subtyping via inheritance, ISP presumes declared nominal interfaces, OCP presumes polymorphic dispatch as the extension mechanism. A skill that restates the five principles and says "now do it in your language" produces Java-in-Python. The translation layer is the product; without it the skill is a Wikipedia summary.

The second constraint is behavioral rather than technical. Models over-abstract when given design vocabulary, because pattern-shaped output resembles competence. A skill that improves the agent's SOLID vocabulary without countering that tendency produces better-informed over-abstraction, which is worse than none — the wrong interface now arrives with an articulate rationale.

This is the first entry on a prospective code-craft shelf (logging, naming, comments may follow). Shelf entries are independent dimensions of quality with no shared lifecycle, unlike the `prd-*` family whose prefix encodes genuine sequential coupling. That distinction drives the naming and packaging decisions below.

## Goals / Non-Goals

**Goals:**

- Translate each SOLID axis into the idiom of whatever language and paradigm is in play, including languages where a principle inverts or is already satisfied by construction.
- Counter the over-abstraction default structurally, not by exhortation — the cheap path must be the restrained one.
- Compose underneath existing skills (`code-review`, `simplify`) and under ordinary feature work, without competing with them for triggers.
- Stay installable standalone, with no cross-skill file dependencies.

**Non-Goals:**

- Not a review pipeline, linter, or report generator. No scripts, no artifacts, no persisted findings.
- Not a general code-quality reviewer. Line-level defect hunting belongs to `code-review`.
- Not always-on. Routine edits must not load it.
- Not a rewrite of the `prd-*` prefix convention, and not a fix for the cross-skill reference fragility that surfaced during exploration. Both are separate changes.

## Decisions

### Teaching, not a review pipeline

A five-stage pipeline (scope → orient → gather → judge → advise) was designed and rejected. Four of its five stages were compensating for a knowledge gap rather than a procedure gap — "don't judge from one file," "match the local idiom," "look at what actually varied," "most smells are fine" are all things teaching can say directly. Only the report format genuinely required machinery, and a report format is the least valuable part of the design.

Teaching also buys three things a pipeline cannot: it is in context at *generation* time, which is the highest-value moment and the one a review pipeline never reaches; it composes under other skills without trigger negotiation; and it dissolves the report-axis, git-dependency, scope-default, and symmetry-boundary questions rather than deferring them. The repo's own `design-md` sets the precedent — format, mental model, discovery, and "what this is not for," with no pipeline.

### Four axes, not five principles

Five sibling bullets is how SOLID is taught, not how it is used. SRP and ISP are the same idea at two granularities (module surface vs. interface surface) and saying so is more useful than pretending they are independent. The remaining three become variation (OCP), contract (LSP), and direction (DIP).

LSP earns separate treatment because it is the only principle with a formal definition — Liskov & Wing's behavioral subtyping: preconditions cannot strengthen, postconditions cannot weaken, invariants and history constraints hold. That formalism is about contracts rather than syntax, which is exactly why it survives translation to languages with no inheritance at all.

### Gates rather than guidance

The skill's substance is a set of gates. A gate is failable in one sentence, decided by evidence you can point at, free of syntax assumptions, and blocking by default. Anything failing all four tests is guidance and belongs in `references/`, not in the gate list.

The asymmetry is the mechanism: **failing a gate requires no justification; passing one requires cited evidence.** That makes the cheap path the restrained path, inverting the model's default.

A corollary constrains what may count as evidence: **no gate may require *interpretation* in order to fail.** A check that returns an answer is legitimate however it is obtained; a check that returns evidence the agent must then judge is not. `grep -r "^from db" domain/` prints lines or it does not — fine. An LSP implementation count returns a number — fine. Git co-change returns pairs whose meaning must be argued, and the argument is the expensive part, not the command: the four `prd-*` skills in this repository form a co-change clique that is correctly designed parallelism, and no amount of history tells you that. So version-control history may confirm a gate the agent is already examining, and is never a prerequisite for one.

Where a mechanical check exists, it is the preferred evidence — better than asking the user, because it is first-hand. **Coupling is mechanically detectable; cohesion is not.** Coupling is a fact about the import graph, which `grep` sees and a language server sees better. Cohesion is a claim about why something changes, which has no syntactic footprint — file size is the tempting proxy and it is wrong. Prefer `grep`-shaped checks and treat LSP as a bonus: language-server availability varies by language and setup, while `grep` is universal.

Contrast the two registers:

| Guidance (weak) | Gate (strong) |
|---|---|
| "SRP means one reason to change, apply it thoughtfully" | Name the two actors. Cannot name them? Do not split. |
| "OCP: isolate expected variation" | Point at a second case already in the code. None? No abstraction. |
| "DIP: depend on abstractions" | Can the core build with the driver absent? That is the whole test. |

Gates are organized by the moment they fire, not by principle, so the agent carries three or four at a time rather than twelve.

Before any gate is consulted, a precedence order applies, and it is stated at the top of `SKILL.md` so it is read before the gates rather than discovered inside one. It extends G6's nearest-wins ladder upward rather than adding a separate rule:

```
  project's documented guidelines      ← CLAUDE.md, style guide, linter config
        ▲
  language version's native mechanism  ← Python 3.8+ has Protocol; earlier does not
        ▲
  file → package → repo idiom          ← the existing G6 ladder
        ▲
  this skill
```

Two things outrank everything here. A convention the project has written down is a decision already made, and this skill does not reopen it. And the *version* of the language in use governs which mechanisms exist — advice that predates a native construct is wrong once the construct is available, so the skill's examples yield to what the language now offers.

**G0 · The null result is a result.** Default is no structural change. Every abstraction, split, or deviation must name the pain it prevents; if it cannot, it *is* the pain. Test: complete "without this, ___ happens." The blank must be concrete and near-term.

*About to add structure:*

Cohesion has two failure directions, and G1 and G3 are the same principle pointed at each. G1 asks whether a unit should be pulled **apart**; G3 asks whether scattered knowledge should be pulled **together**.

- **G1 · Name the actors** (SRP, split direction). Name the two or more distinct actors who request changes to this unit and why they change on independent schedules. Fails when the split can only be described in verbs or size — "it parses *and* validates" is not two actors. Catches: two things that always change together for the same reason are one responsibility, however different they look. No mechanical check exists; this is reasoning, which is why G5 bounds what it may authorize.
- **G2 · Cite the variation** (OCP). Point at an actual instance of the axis varying, cheapest evidence first: a second case already present in the code (`grep`), or a requirement the user has stated. Fails on hypotheticals. Fallback: one case inline it, two note the duplication, three abstract.
- **G3 · Scatter** (SRP, consolidate direction). Evaluated twice on the same question — **does this write the same fact in more than one place?** — at two moments with different authority. At *plan time*, before committing: a scatter finding authorizes switching to a same-size alternative plan. After the work, riding along on the summary the agent produces anyway: a scatter finding authorizes one line of comment and nothing more. The second pass exists because plans under-count — the agent expects three files and edits seven — and it costs nothing, because the moment already exists. Not "does it touch many files" — normal layering touches many files, and a rename touches many files while repeating no knowledge. Scatter is one fact appearing twice. Adding a provider and having to teach four files what that provider is scatters; adding a field across model, migration, and test does not. The agent is the one making the edits, so this evidence is first-hand and already in context — it requires neither asking the user nor reading history.
- **G4 · Count the implementations** (ISP/DIP). One implementation means the interface is a synonym for the concrete type *unless* a test double earns it. The check is binary and inspectable — **what does the fake do that the real implementation cannot?** Either you can name it (avoids the network, controls the clock, forces an untriggerable error path) or you cannot. Can name it: the interface is a seam, keep it. Cannot: the fake mirrors the real thing and the interface bought nothing. Implementation count comes free from an LSP find-implementations query where one is available.
- **G5 · Blast radius.** Structural work must not exceed the size of the task that occasioned it. Twenty-line feature, two-hundred-line refactor → stop and propose. This gate binds G1 and G3: named actors authorize a split only within this limit, and scatter detected at plan time authorizes switching to a same-size plan that avoids it — never a refactor first. Detecting the problem earlier makes acting on it more tempting, so the limit matters more, not less.

*About to deviate from surrounding code:*

- **G6 · Match the neighbors.** Would a reader notice this file is shaped differently from its siblings? Then the reason must be stronger than "it is more SOLID." Nearest wins: file → package → repo → language community.
- **G7 · Would a native write this?** Would an experienced writer of this language who has never heard of SOLID arrive at this shape? Sharp form: if the mechanism can only be named as *factory*, *strategy*, or *visitor* in a language with first-class functions, it is a workaround for a missing feature. Strategy is a function. Command is a closure. Factory is a function that returns a value.

*About to report a problem — is there actually one?*

Every gate in this group is backed by a command, which is what distinguishes it from the judgment-and-free-evidence gates above.

- **G8 · The build test** (DIP). Can the core be built, imported, and tested with the infrastructure dependency absent? Mechanically: `grep` for infrastructure imports inside domain paths. Binary and language-agnostic. Applies only where a boundary is actually claimed.
- **G9 · The signature lie** (LSP). Would swapping one implementation for another break a caller who read only the signature? Mechanically: `grep` overrides for `NotImplemented`-style throws, which catches the loud cases; the quiet ones — narrowed inputs, unexpressed call ordering, null where siblings return a value — still need reading.
- **G10 · The unused surface** (ISP). Does a client depend on a type while using a small fraction of its members? Mechanically: an LSP find-references per member, counted per client. Falsifier: if nearly every client uses nearly all of it, size is not the problem.
- **G11 · Is the principle even pointing this way?** Adding a variant to a sum type *should* touch every match site — the expression problem, not an OCP violation. Go interfaces are ISP by construction. Typeclass laws are LSP under another name, verified by property tests. Knowledge, not a command.

*About to remove structure:*

- **G12 · The seam check.** Before deleting an abstraction, check whether it is load-bearing for something invisible in the code: test substitution, build- or link-time swapping, a published API contract, a process boundary. Absence of a second implementation *in this repo* is not absence of a second consumer, and removal from an exported surface is a one-way door.

### Gates stay internal

Gate evaluation produces structure, not commentary. The user should never read "SRP gate failed" — they should simply receive code without a spurious interface. The single exception is the propose-don't-do path: where the existing pattern genuinely is the pain the user described but no design change was requested, the agent names it in a line or two and leaves the decision to the user. That decouples the value of the diagnosis from the risk of the refactor, capturing most of the upside at nearly none of the cost.

### Triggering on structural moments, with negative triggers

The skill must not load on every code edit. This is not primarily about context cost. Skills prime: keeping five principles about abstraction permanently in front of the model makes it look for applications of them, which induces the exact failure the skill exists to prevent. Gates fight that priming rather than escaping it, so it is cheaper not to create the pressure.

Loading is therefore scoped to structural decision points, and the description carries explicit negative triggers — an unusual move justified by over-triggering being the main hazard here.

**Determinism is the wrong target; asymmetric error is the achievable one.** Because a false positive primes over-abstraction while a false negative merely means the agent writes ordinary code, the description is tuned to *under-fire* rather than to fire accurately. That is the same asymmetry the gates use, applied one level up: failing is free.

Four techniques implement it.

1. **Anchor on the user's literal words, not on situations.** A situation ("structural decision point") requires the model to classify a moment; a quoted phrase is text-to-text matching. `design-md` shows the ideal — its most reliable trigger is the filesystem fact *"DESIGN.md present in repo."* No such observable anchor exists for structure, so verbatim phrasings are the closest substitute.
2. **Carry one decision question.** Replace the category with a single test: *is a boundary being created or crossed?* One judgment with a clear failure direction beats a vibe about "structural."
3. **State the default inside the description**, with its reason, so the model can apply it rather than merely obey it.
4. **Make negative triggers phrasal too** — not "routine edits" but "fix the bug", "rename this", "add a field".

The resulting description, which implementation should follow closely:

```yaml
description: |
  Load when a boundary is being created or crossed — a new module, a
  second implementation of something that had one, a dependency wired
  across a layer — or when the user says "how should I structure this",
  "should this be an interface", "this is getting messy", "I have to
  touch five files every time", or "productionize this prototype".
  Teaches SOLID in the idiom of the language in play, and when not to
  abstract at all.

  Do NOT load for bug fixes, added fields, tests, renames, or any edit
  local to one function, nor for throwaway work — prototype, PoC,
  spike, experiment. When uncertain, do not load: firing on routine
  work costs more than missing a structural moment.
```

The rule about abstraction vocabulary is about naming a topic, not about the words themselves. "Load when the code involves interfaces" pulls the skill into any task that mentions one; the quoted phrasing `"should this be an interface"` matches text rather than topic, and "a dependency wired across a layer" triggers on the boundary rather than the noun. Both appear positively above, deliberately — techniques 1 and 2 doing their job. What must never appear positively is the bare subject area.

An earlier draft also carried an explicit *"do not load merely because the code mentions an interface, a dependency, or an abstraction"* clause. It was cut: the spec does not require it, and it reintroduces the exact vocabulary it warns against, which negation may not reliably suppress. Whether that was the right call is measurable — fixture traps N3, N4, and N8 test precisely this, and a hard failure there is the signal to put it back.

Alternatives considered. *Always-on via hook* reintroduces the priming problem with extra machinery. *Explicit-only invocation* never fires when it is most needed. *Project `CLAUDE.md` pointer* remains available for teams who genuinely want it always-on, which correctly puts that judgment with people who can assess their own codebase.

Throwaway work is suppressed on the same reasoning. A spike exists to be discarded, so structure imposed on it is waste. The obvious objection — that prototypes become production — argues for suppression rather than against it: promotion is itself a structural moment, which is why "productionize this" is a positive trigger. Structure added during a spike is lost if the spike dies and re-derived anyway if it survives, so the promotion is the moment that pays, and it is one the description can catch.

This leaves a deliberate coverage gap: a user asks for something innocuous, the agent over-abstracts spontaneously, and the skill never loads. That is not fixable by description, and it is accepted because the damage from over-abstracting a small ask is small, while the structural decisions where damage compounds are exactly where the skill does load.

### Consistency outranks SOLID

Existing code wins by default, and it should not be close. A pattern repeated across forty files is a convention encoding constraints the agent cannot see from inside one task. More decisively: a locally-SOLID module inside a non-SOLID codebase does not yield one good module, it yields two architectures, and every future reader must learn both. Consistency compounds in a way a single well-structured module cannot repay.

The unifying property is that both halves of the skill run on one evidentiary standard — abstraction requires a cited commit, deviation requires cited pain. Speculation authorizes neither.

### Name: `solid-principles`

The name sets the neighborhood; the description sets the boundary. A name in the wrong neighborhood does not guarantee a false positive — it forces the description to do rescue work on every load decision, and names do the coarse filtering before any description is weighed.

Three candidates were considered. Bare `solid` collides with **SolidJS**, a real frontend framework, which is a wrong-domain match rather than a fuzzy one; its adjective reading ("make this solid") is comparatively benign since that phrasing often is a structural request. `solid-design` is worse: "design" is already owned in this repo by `design-md` (visual design systems, tokens, theming), so every load decision would need to disambiguate two skills whose names centre on the same word for near-opposite subjects, and "solid design" re-parses as adjective + noun, resurfacing the ambiguity the rename was meant to close.

`solid-principles` closes all three failure modes — adjective reading, framework collision, and visual-design neighborhood. The objection that "principles" faintly suggests *here are five principles, go apply them* is real but does not survive the alternatives: no name can encode "SOLID, but with restraint," and the description already carries that.

### Shelf, not family; references carried locally

No prefix and no umbrella. A `craft-` prefix would carry no information because there is no workflow to belong to, and an umbrella that routes "help me with code quality" would load every dimension at once, which is the priming problem again. Namespacing, if wanted later, belongs at the packaging layer — the Vercel plugin carries thirty-three skills named `ai-sdk`, `nextjs`, `shadcn` with the prefix supplied by `plugin.json`.

References live under `skills/solid-principles/references/`, not in a shared directory. The rule: share what is large and mechanical (templates, scripts); inline what is short and philosophical. This keeps the skill installable standalone and avoids the pattern where seven `prd-*` skills hard-link `../prd/references/REFERENCE.md` while the README advertises per-skill installs.

### Reference depth: paradigm spine, six language notes

`inversions.md` is organized by paradigm, with short per-language notes where a language genuinely bends a principle rather than merely expressing it differently. Six earn a note: **Go** (implicit, consumer-declared interfaces make ISP free — nothing to do), **Python** (Protocol vs ABC vs duck typing, so mostly *whether you need an interface at all*), **TypeScript/JavaScript** (structural typing and discriminated unions flip OCP), **Java/C#** (SOLID's home turf, so the note is about restraint rather than application), **Rust** (enums plus traits give the expression problem its clearest form, plus the orphan rule), and **Ruby** (a framework's conventions are the neighbours — applying SOLID against Rails' imposed structure is the classic local failure; duck typing makes ISP a question about what callers actually invoke rather than what a type declares; mixins carry composition where other languages reach for interfaces).

Rust earns a slot despite lower usage because it is the sharpest illustration of a principle pointing backwards, which is the file's whole subject. The cost is maintenance: every per-language note is something that can go stale, and paradigm-level treatment is the fallback if they do.

### Testing the trigger boundary in two tiers

`skills/prd/TESTING.md` sets the house rule: *"If a check can be expressed as 'given input X, the JSON output should be Y,' it belongs in Tier 1. Anything that requires judgment about quality, tone, or interview behavior belongs in Tier 2."* Trigger behavior is Tier 2, and the spec must not dress it as Tier 1.

There is, however, a deterministic part hiding inside it. Loading behavior cannot be tested, but the *static properties of the description believed to produce good loading behavior* can be — presence of a negative-trigger clause, presence of the uncertainty default, the boundary test appearing before any vocabulary, and abstraction vocabulary confined to negative clauses. Those are greppable, so they become Tier 1 requirements.

Tier 2 is a fixture at `tests/fixtures/triggers.md`: roughly twenty labelled prompts, weighted toward cases where the description could plausibly fail rather than toward obvious ones. Three properties matter.

- **Decoys are mandatory, and the set is fixed.** The evaluator must be offered a realistic skill list including adjacent descriptions (`code-review`, `simplify`, `design-md`). Offered in isolation, any skill fires on everything; the test measures discrimination, not enthusiasm. The set is checked into the fixture rather than drawn from whatever the running user happens to have installed, so results stay comparable across runs.
- **The bar is asymmetric**, mirroring the skill's own design. Loading on an uncontested should-not-load case is a hard fail with a bar of zero; missing a should-load case is a soft fail tolerated up to two. A run that passes the hard bar while failing several soft cases is acceptable; the reverse is not.
- **Contested cases are marked, not resolved.** Prompts where reasonable people disagree are recorded and excluded from both bars, so the fixture cannot punish the description for a labelling dispute.

The trap cases carry most of the value. Prompts containing "interface" or "dependency" while being trivially routine ("add a field to the User interface", "rename the PaymentGateway interface", "update the dependency to v3") directly test whether confining that vocabulary to negative clauses works. Their failure is far more actionable than an aggregate score. In the other direction, prompts that are genuinely structural while containing no structural vocabulary ("add Stripe support" where PayPal exists; "the mock for this is really complicated") test whether the boundary question is carrying its weight.

This is primarily a regression test. Its long-term value is that a future editor tightening the description reruns the prompts and learns immediately whether the traps started firing — which is why it ships with a runner rather than prose instructions alone.

`tests/harness/eval.sh` implements it. The fixture stays the single source of truth: prompts, labels, contested marks and the decoy list are all parsed out of it, and the description under test is read live from `SKILL.md` so the harness always exercises what actually ships. Each prompt goes to a fresh `claude -p` with no prior context, which is the only way to get an evaluator that does not already know the answer key. Three runs per prompt with a majority vote, because single-shot model decisions vary and a hard-failure bar of zero is otherwise hostage to noise. Results land in a gitignored `tests/results/<label>/`.

One fixture detail the runner has to handle: L3 reads *"Add Stripe support"* with *(PayPal already exists)* as an aside. In real use the agent can see the repository, so the parenthetical is folded into the prompt as context rather than dropped — without it the case would be unfairly labelled, since nothing in the bare prompt reveals a second implementation.

### What the first measurements showed

The fixture was run twice at three runs per prompt with majority voting, the second time after restoring one phrasing. Results live in a gitignored `tests/results/`, so what matters is recorded here.

**The hard bar is robust.** Across both runs, all thirteen uncontested skip cases returned 0/3 — seventy-eight evaluator calls with zero false positives. Every trap held: N3, N4 and N8 ("add a field to the User interface", "rename the PaymentGateway interface", "update the dependency to v3") confirm that confining abstraction vocabulary to negative clauses works and that cutting the explicit *"do not load merely because the code mentions…"* clause was safe; N13 and N14 confirm the throwaway-work clause. This is the result the design most needed, and it is now settled by measurement rather than argument.

**The soft side is too noisy to read at three runs.** Between the two runs the only change was restoring `"this is hard to test"` to the phrasing list, which cannot affect prompts that do not concern testability. Yet L7 moved 0/3 → 2/3, L9 moved 1/3 → 3/3, and L6 — a *verbatim* phrasing match — regressed 3/3 → 2/3. Individual load-case verdicts therefore carry little signal at this sample size, and the second run's clean pass should be read as "within noise of passing" rather than as proof the description improved. Soft-side conclusions need five or more runs; the hard bar tolerates three because its cases are unanimous.

**The restored phrasing is justified by reasoning, not by that measurement.** `"this is hard to test"` was cut during simplification as redundant with the two pain phrasings retained. It is not: those cover vagueness and scatter, while testability is the DIP signal and had no other anchor in the description. L5's 1/3 → 2/3 movement is consistent with that but well inside the observed noise band, so it corroborates nothing on its own.

**L7 and L9 remain genuine labelling disputes even though they now score as passes.** Their reasoning was coherent on the runs where they declined — "split this module in two" reads as execution of a decision already made, and "can the domain code import the database driver?" reads as a question about existing convention. Both apply the description's conservative default correctly. The distinction they expose — deciding a structure versus executing or asking about one — was not accounted for when the labels were written, and passing on one run does not resolve it.

**Three harness bugs were fixed before any result could be trusted**, worth recording because a broken harness produces confident nonsense. `xargs` quoting broke on apostrophes in prompts while the pipeline still reported success; asking for a bare name list with "no explanation" made every case answer "none", producing a meaningless all-pass; and the scoring loop piped into `tee` ran in a subshell, discarding its counters. The evaluator now reasons and terminates with a parsed `ANSWER:` line, and transport failures are retried rather than scored as "did not load".

## Risks / Trade-offs

- **Better-informed over-abstraction.** Design vocabulary without counter-programming makes the failure more articulate, not less. → The gates, and specifically the free-to-fail asymmetry, exist for this. If reviewers find the skill producing more structure rather than less, that asymmetry is the thing to check first.
- **Twelve gates may exceed working memory.** The argument for gates over a pipeline was that they lodge and survive compression; twelve items is close to pipeline-shaped. → Organized by moment so only three or four are carried at once. If practice shows roughly six firing, the rest demote to `references/`.
- **No enforcement.** If the description does not match, the skill never loads and nothing happens. → Equally true of the rejected pipeline, with more machinery, so this is a wash on risk and a clear win on cost.
- **Overlap with `code-review` and `simplify`.** Particularly on the removal side, where flagging over-abstraction is arguably `simplify`'s territory. → Stated as a boundary in "What This Skill Is Not For" rather than enforced. Worth revisiting once both have run against the same code.
- **The trigger fixture can be gamed.** Tuning the description until the fixture passes optimises for twenty-two prompts rather than for real usage. → Contested cases are excluded from the bars, and a failing trap is treated as a signal to rewrite the description rather than to relabel the case.
- **Reference material can drift toward an essay.** `paradigms.md`, `smells.md`, and `inversions.md` invite completionism. → Each entry must earn its place by changing what the agent would do; anything that only informs belongs in neither.

## Open Questions

- **Whether G3's closing-summary pass becomes noise.** The second evaluation can only produce a line of comment, and a line of comment on every task that touched several files would wear thin fast. It should fire only on genuine repetition, but "genuine" is judged, not counted — if it starts commenting routinely, restrict it to plan time and accept the under-count.
- **Whether the six per-language notes in `inversions.md` are the right six, and whether they can be kept accurate.** Each one is a maintenance liability; if they start drifting, the fallback is paradigm-level only.
