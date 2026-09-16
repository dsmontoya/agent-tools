# Smell Catalogue

Each entry is **signal → principle → falsifiers → minimal fix**.

The falsifiers are not garnish. They are the majority of the content, and most candidate findings should die there. A reviewer that reports every signal it detects is worse than one that reports none, because it asks people to undo considered decisions.

**A worked example of why.** In this repository, four `prd-*` skills always change together — a textbook shotgun-surgery signal. It should not be reported, because: the parallelism is deliberate and documented; the shared content is already extracted to `../prd/references/`; and the platform only discovers flat `<name>/SKILL.md`, so there is no inheritance mechanism to use even if you wanted one. Three falsifiers, one silent finding.

---

## Growing type switch

**Signal.** A `switch`/`if isinstance`/`match` over a kind tag that gains a branch every time a feature lands.

**Principle.** Variation (OCP).

**Falsifiers.**
- The variant set is **closed and stable** — AST node kinds, HTTP verbs, chess pieces. A closed set is data, not an extension point.
- **The language uses sum types.** Adding a variant *should* touch every match site. That is the expression problem, not a violation. See [`inversions.md`](./inversions.md).
- Only **one operation** exists over the variants. One switch is not a pattern.
- The axis has varied exactly **once, ever.**

**Minimal fix.** Move the varying behaviour to the variant itself (polymorphism), or to a dispatch table keyed by the tag. Not a plugin system. Not a registry with lifecycle hooks.

---

## Interface with one implementation

**Signal.** An interface, protocol, or trait with exactly one concrete implementor.

**Principle.** Cohesion (ISP) and direction (DIP), both failing to pay for themselves.

**Falsifiers.**
- A test double exists **and earns it** — apply the binary check: *what does the fake do that the real implementation cannot?* Avoiding the network, controlling the clock, forcing an untriggerable error path all count. Mirroring the real thing does not.
- The interface is a **published API** — consumers outside this repository are invisible to you.
- A build- or link-time **swap** exists (platform backends, feature builds).
- A second implementation is **already written** and merging.

**Minimal fix.** Delete the interface and use the concrete type. If a legitimate fake exists, keep the interface — that *is* the second implementation.

---

## Client uses a fraction of a type

**Signal.** A caller depends on a twelve-member type and invokes two of them.

**Principle.** Cohesion (ISP).

**Falsifiers.**
- Nearly **every client uses nearly all** of it — then size is not the problem and splitting only adds indirection.
- The type is a **data record**, not a behaviour surface. Records are allowed to be wide.
- The language **already narrows at the consumer** — in Go the caller declares the interface it needs, so the wide concrete type is irrelevant.

**Minimal fix.** Declare a narrow interface at the *consumer*, sized to what that consumer calls. Do not split the implementing type.

---

## Domain code imports infrastructure

**Signal.** A concrete database driver, HTTP client, or file-system module imported at the top of a domain module.

**Principle.** Direction (DIP).

**Falsifiers.**
- **No boundary is claimed.** If the project never intended a domain/infra split, there is nothing inverted — this is just a program.
- It is the **standard library**. Wrapping a stable stdlib API "for testability" is itself an anti-pattern.
- The module **is** the adapter. Adapters are supposed to import infrastructure; that is their job.

**Minimal fix.** Pass the collaborator in as a parameter. Usually one function signature, not a layer.

**Mechanical check.** `grep` for infrastructure imports under domain paths. Binary: lines or no lines.

---

## Implementation that surprises its interface

**Signal.** An implementation that throws `NotImplemented`, rejects inputs its siblings accept, requires a call order the signature does not express, or returns null where others return a value.

**Principle.** Contract (LSP).

**Falsifiers.**
- The interface **genuinely is optional-capability** and the language has no better expression — but check first whether splitting the interface is the real answer.
- The "narrowing" is **documented in the type** (a narrower parameter type is not a violation, it is a different signature).

**Minimal fix.** Split the interface so that no implementation must refuse part of it. `NotImplemented` is nearly always ISP telling you the interface is too wide, not LSP telling you the implementation is wrong.

**Mechanical check.** `grep` overrides for `NotImplemented`-style throws. Catches the loud cases only; narrowed inputs and ordering requirements need reading.

---

## One change, many files

**Signal.** Adding a single logical capability requires editing several files.

**Principle.** Cohesion (SRP, consolidate direction).

**Falsifiers.**
- **It is layering, not scatter.** Model + migration + test is three files receiving *different* content. Scatter is the *same fact* written twice.
- **It is a rename.** Mechanical changes touch many files and repeat no knowledge.
- The files are **deliberately parallel** — see the `prd-*` example above.
- The repetition is **already extracted**, and what remains genuinely differs per site.

**Minimal fix.** Move the repeated fact to one place. Usually a table, a constant, or a single function — rarely a new abstraction layer.

---

## Module serving several actors

**Signal.** A file that billing, compliance, and integrations all edit, on independent schedules.

**Principle.** Cohesion (SRP, split direction).

**Falsifiers.**
- **You cannot name the actors.** "It parses and validates" describes verbs, not actors. No names, no split.
- The parts **always change together** for the same reason — that is one responsibility wearing two hats.
- **File size is the only evidence.** Length is not a signal. It never was.

**Minimal fix.** Extract the part with the distinct owner, bounded by blast radius: the extraction must not exceed the size of the task that occasioned it. If it would, name the observation and leave the decision to the user.

---

## Pattern that names a missing language feature

**Signal.** A class whose only job is to hold one method — `PaymentStrategy`, `UserFactory`, `RequestVisitor` — in a language with first-class functions.

**Principle.** Not a SOLID violation at all. A translation failure.

**Falsifiers.**
- The language **genuinely lacks** first-class functions or closures.
- The repo's **existing idiom** uses these patterns throughout — consistency outranks this, see G6.
- The object **carries state** across calls, in which case it is an object, not a disguised function.

**Minimal fix.** Use the function. Strategy is a function, command is a closure, factory is a function that returns a value.
