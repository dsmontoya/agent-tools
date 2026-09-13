---
name: solid-principles
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
license: Apache-2.0
metadata:
  author: daniel
  version: "0.1.0"
---

# SOLID Principles, Any Language

SOLID was written for class-based OO in the Java/C++ era. Three of its five principles carry syntactic assumptions that do not survive the trip to Go, Rust, Python, Elixir, or Haskell. This skill carries the translation, and — just as importantly — the restraint.

**The failure this skill exists to prevent is not under-abstraction. It is over-abstraction.** An interface per class. A DI container in a 300-line CLI. A coherent module split across six files that each do nothing. Pattern-shaped output looks like competence, which is exactly why it slips through review.

## Precedence

Before any gate below, this order applies. The skill sits at the bottom of it.

```
  project's documented guidelines      ← CLAUDE.md, style guide, linter config
        ▲
  language version's native mechanism  ← Python 3.8+ has Protocol; earlier does not
        ▲
  file → package → repo idiom          ← what the neighbouring code already does
        ▲
  this skill
```

Two things outrank everything here:

- **A convention the project has written down is a decision already made.** Do not reopen it.
- **The language version in use governs which mechanisms exist.** Advice that predates a native construct is wrong once the construct ships. Check what the language offers now before reaching for a pattern that works around its absence.

## Read the neighbours first

Before judging anything, establish the idiom of *this* repository — not just the language. A Python codebase that already uses `Protocol` gets different advice from one that duck-types throughout. A Rails app gets Rails structure.

Advice that does not match the neighbours produces foreign-looking code, which is its own defect.

## The four axes

Five sibling principles is how SOLID is taught, not how it is used. It collapses:

```
   SOLID as stated                          What actually transfers
   ───────────────                          ───────────────────────

   SRP ─┐  "one actor's reason to change"
        ├──────────────────────────────▶    COHESION
   ISP ─┘  "clients see only what they      What groups together, and
            actually use"                   whose change it answers to

   OCP ────────────────────────────────▶    VARIATION
           "extend without modifying"       Where change is expected,
                                            and how it is absorbed

   LSP ────────────────────────────────▶    CONTRACT
           "substitutable behaviour"        What every implementation
                                            promises beyond its signature

   DIP ────────────────────────────────▶    DIRECTION
           "depend on abstractions"         Which way dependency arrows
                                            point across a boundary
```

SRP and ISP are the same idea at two granularities — module surface and interface surface. Say so rather than treating them as independent.

**LSP is the only principle with a formal definition**: Liskov & Wing (1994) behavioural subtyping — preconditions cannot strengthen, postconditions cannot weaken, invariants and history constraints hold. That formalism is about *contracts*, not syntax, which is precisely why it ports to languages with no inheritance at all. In a typeclass or trait language, the laws (associativity, identity) *are* LSP, verified by property tests rather than by review.

Full per-paradigm mechanics in [`references/paradigms.md`](./references/paradigms.md).

## The gates

A gate is **failable in one sentence**, decided by **evidence you can point at**, free of syntax assumptions, and **blocking by default**.

Three rules govern how they behave.

**Failing is free; passing costs.** No gate requires justification to fail. That asymmetry is the entire mechanism — it makes the restrained path the cheap one, which is the inverse of the default.

**No gate may require interpretation in order to fail.** A check that returns an *answer* is legitimate however obtained. A check that returns *evidence you must then judge* is not. `grep -r "^from db" domain/` prints lines or it does not — fine. An implementation count returns a number — fine. Git co-change returns pairs whose meaning must be argued, and the argument is the expensive part. Version-control history may confirm a gate you are already looking at; it is never a prerequisite for one.

> **Coupling is mechanically detectable. Cohesion is not.**
> Coupling is a fact about the import graph — `grep` sees it, a language server sees it better. Cohesion is a claim about *why* something changes, which has no syntactic footprint. File size is the tempting proxy and it is wrong.

Prefer `grep`-shaped checks; treat a language server as a bonus. LSP availability varies by language and setup. `grep` does not.

**Gates are internal.** Their output is the absence of unwarranted structure, not commentary. The user should never read "SRP gate failed" — they should simply receive code without a spurious interface. One exception, below.

---

### G0 · The null result is a result

Default is no structural change. Every abstraction, split, or deviation must name the pain it prevents. If it cannot, it *is* the pain.

Test: complete *"without this, ___ happens."* The blank must be concrete and near-term. "It would be harder to extend" does not fill it.

---

### About to add structure

Cohesion fails in two directions, and G1 and G3 are the same principle pointed at each. **G1 asks whether a unit should be pulled apart. G3 asks whether scattered knowledge should be pulled together.**

**G1 · Name the actors** *(SRP, split direction)*
Name the two or more distinct actors who request changes to this unit, and why they change on independent schedules.
*Fails when* the split can only be described in verbs or size — "it parses **and** validates" is not two actors.
*Catches:* two things that always change together for the same reason are **one** responsibility, however different they look.
No mechanical check exists. This is reasoning, which is why G5 bounds what it can authorize.

**G2 · Cite the variation** *(OCP)*
Point at an actual instance of this axis varying. Cheapest evidence first: a second case already in the code (`grep`), or a requirement the user has stated.
*Fails on hypotheticals.* "We might add another provider" is not evidence.
*Fallback:* one case, inline it. Two, note the duplication and leave it. Three, abstract.

**G3 · Scatter** *(SRP, consolidate direction)*
**Does this write the same fact in more than one place?**

Evaluated twice on that one question, with different authority each time:

| moment | authority |
|---|---|
| **plan time**, before committing | switch to a same-size alternative plan that avoids it |
| **closing summary**, after the work | one line of comment, nothing more |

The second pass exists because plans under-count — you expect three files and edit seven — and it costs nothing, because the summary happens anyway.

Not *"does it touch many files."* Normal layering touches many files; a rename touches many while repeating no knowledge. **Scatter is one fact appearing twice.** Adding a provider and having to teach four files what that provider is scatters. Adding a field across model, migration, and test does not.

You are the one making the edits, so this evidence is first-hand and already in context. It requires neither asking the user nor reading history.

**G4 · Count the implementations** *(ISP / DIP)*
One implementation means the interface is a synonym for the concrete type — *unless* a test double earns it. The check is binary and inspectable:

> **What does the fake do that the real implementation cannot?**

Can name it (avoids the network, controls the clock, forces an untriggerable error path) → the interface is a seam, keep it.
Cannot → the fake mirrors the real thing and the interface bought nothing.

Stated as a thought experiment: inline the concrete type — would any test break for a reason other than the type name changing? Implementation count comes free from a find-implementations query where a language server is available.

**G5 · Blast radius**
Structural work must not exceed the size of the task that occasioned it. Twenty-line feature, two-hundred-line refactor → stop and propose.

This gate **binds G1 and G3**. Named actors authorize a split only within this limit. Scatter detected at plan time authorizes switching to a same-size plan — never a refactor first. Detecting a problem earlier makes acting on it more tempting, so the limit matters more, not less.

---

### About to deviate from surrounding code

**G6 · Match the neighbours**
Would a reader notice this file is shaped differently from its siblings? Then the reason must be stronger than "it is more SOLID."
Nearest wins: file → package → repo → language community. Fall through to community idiom only when the repo has no position at all.

**G7 · Would a native write this?**
Would an experienced writer of this language, who has never heard of SOLID, arrive at this shape?
*Sharp form:* if the mechanism can only be named as *factory*, *strategy*, or *visitor* in a language with first-class functions, it is a workaround for a missing feature. **Strategy is a function. Command is a closure. Factory is a function that returns a value.**

---

### About to report a problem — is there actually one?

Every gate in this group is backed by a command. That is what separates them from the judgment gates above.

**G8 · The build test** *(DIP)*
Can the core be built, imported, and tested with the infrastructure dependency absent?
*Mechanically:* `grep` for infrastructure imports inside domain paths. Binary, language-agnostic.
Applies only where a boundary is actually *claimed*. No intended domain/infra split → nothing is inverted.

**G9 · The signature lie** *(LSP)*
Would swapping one implementation for another break a caller who read only the signature? Then the contract is a lie — the type promises less than the code demands.
*Mechanically:* `grep` overrides for `NotImplemented`-style throws. That catches the loud cases. The quiet ones — narrowed inputs, unexpressed call ordering, null where siblings return a value — still need reading.

**G10 · The unused surface** *(ISP)*
Does a client depend on a type while using a small fraction of its members? Count it.
*Mechanically:* find-references per member, counted per client.
*Falsifier:* if nearly every client uses nearly all of it, size is not the problem.

**G11 · Is the principle even pointing this way?**
Check before reporting. Adding a variant to a sum type **should** touch every match site — that is the expression problem, not an OCP violation. Go interfaces are ISP by construction. Typeclass laws are LSP under another name.
Knowledge, not a command. Full catalogue in [`references/inversions.md`](./references/inversions.md).

---

### About to remove structure

**G12 · The seam check**
Before deleting an abstraction, check whether it is load-bearing for something invisible in the code: test substitution, build- or link-time swapping, a published API contract, a process boundary.

Absence of a second implementation *in this repo* is not absence of a second consumer. Removal from an exported surface is a one-way door for people you cannot see, so hold deletion to a standard at least as strict as addition.

## Propose, don't do

The one exception to gates being internal.

Where the existing pattern genuinely **is** the pain the user described, but they did not ask for a design change: name it in a line or two and leave the decision to them.

> "Adding this provider meant repeating the provider-specific bits in four places. Worth consolidating at some point."

That decouples the value of the diagnosis from the risk of the refactor — most of the upside, almost none of the cost.

## Consistency outranks SOLID

Existing code wins by default, and it is not close.

- **The codebase is evidence.** A pattern repeated across forty files is a convention encoding constraints you cannot see from inside one task.
- **Locally-SOLID inside a non-SOLID codebase is worse than either.** One module with ports-and-adapters among thirty with direct DB calls does not give you one good module. It gives you two architectures, and every future reader must learn both. Consistency compounds in a way a single well-structured module cannot repay.

Both halves of this skill run on one evidentiary standard:

```
  abstraction  →  requires a second case you can point at
  deviation    →  requires pain that has actually occurred
```

Speculation authorizes neither.

## When SOLID goes wrong

The gallery. Each of these has been produced by someone applying SOLID sincerely.

| | |
|---|---|
| Interface with one implementation, three years running | G4 |
| A coherent 80-line module split across six files that each do nothing | G1, G5 |
| DI container in a 300-line CLI | G0, G7 |
| Wrapper around a stable stdlib API "for testability" | G4 |
| Plugin system for a variation axis that has never varied | G2 |
| `AbstractRepositoryFactoryProvider` in a language with first-class functions | G7 |
| One module restructured to ports-and-adapters while thirty siblings use direct calls | G6 |

Signal → principle → falsifiers → minimal fix for each, in [`references/smells.md`](./references/smells.md).

## What this skill is not for

- **Line-level defect hunting.** Null derefs, off-by-ones, race conditions — that is `code-review`. This skill teaches structure and declines correctness review.
- **Being a general code-quality reviewer.** It covers one dimension. Naming, logging, comments, and test quality are not its subject.
- **Running on every edit.** Bug fixes, added fields, tests, renames, and single-function edits do not need it. Keeping abstraction principles permanently in context primes the over-abstraction the skill exists to prevent.
- **Throwaway work.** A spike exists to be discarded; structure imposed on it is waste. If the prototype is later promoted, *that* is the structural moment — and "productionize this" loads the skill.
- **Substituting for the project's own guidelines.** See Precedence.

## References

- [`references/paradigms.md`](./references/paradigms.md) — the four axes across class-OO, structural, functional, and dynamic languages, with the concrete mechanism per cell.
- [`references/smells.md`](./references/smells.md) — signal → principle → falsifiers → minimal fix. The falsifiers carry at least as much weight as the signals.
- [`references/inversions.md`](./references/inversions.md) — where a principle points backwards or is already satisfied by construction, with per-language notes for Go, Python, TypeScript/JavaScript, Java/C#, Rust, and Ruby.
