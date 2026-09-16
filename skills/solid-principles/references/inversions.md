# Where the Principles Point Backwards

Check this file **before reporting a violation.** Several SOLID principles invert, dissolve, or come free depending on the language. Reporting a violation that the language has already solved — or that the language deliberately trades away — is worse than saying nothing.

Organized by paradigm, then short per-language notes where a language genuinely bends a principle rather than merely expressing it differently.

---

## The expression problem — OCP inverted

The single most important entry here.

Under **sum types** — Rust enums, Haskell ADTs, Elm custom types, TypeScript discriminated unions, OCaml variants — the trade-off runs opposite to the OO default:

```
                      add a new CASE        add a new OPERATION
                      ──────────────        ───────────────────
  OO / subclassing    free                  touch every class
  Sum types           touch every match     free
```

Neither is wrong. They are two halves of a genuine trade-off, and a language picks one.

**So:** adding a variant to a sum type and having to fix every `match` is **not** an OCP violation. It is the language doing what it was designed to do, and the compiler exhaustiveness check is the *feature* — it tells you every place that needs attention. Advising someone to add a trait-object layer to escape it usually trades a compile-time guarantee for a runtime one.

**When it is worth abstracting anyway:** the variant set is genuinely open (third-party plugins), or the operations vastly outnumber the cases and are themselves stable.

## Structural typing — ISP by construction

Where interfaces are satisfied implicitly and declared by the consumer (Go, and TypeScript when used structurally), interface segregation is not a discipline you apply. It is the default state.

The consumer declares exactly the shape it needs. There is no way for a caller to depend on members it does not use, because the caller wrote the interface. Reporting an ISP violation in idiomatic Go usually means misreading a wide *concrete* type as an interface.

## Typeclass laws — LSP with a different name

`Monoid` associativity. `Functor` identity and composition. `Eq` reflexivity, symmetry, transitivity.

These are behavioural subtyping contracts. A lawless instance is **precisely** an LSP violation, and the verification mechanism — property-based testing — is the only place in mainstream practice where contract conformance is routinely machine-checked rather than reviewed.

In a language with typeclasses or traits, "does this obey LSP?" translates directly to "does this instance satisfy the laws?", and the answer is testable rather than arguable.

## Dynamic dispatch — DIP without ceremony

Where collaborators are passed as plain values and there is no compile-time type to satisfy, dependency inversion reduces to a parameter. No container, no registration, no interface declaration.

The violation still exists — a concrete infrastructure import inside a domain module — and it is `grep`-able. But the *fix* is a function argument, not an architecture.

---

# Per-language notes

## Go

**ISP is free.** Interfaces are implicit and consumer-declared. *"The bigger the interface, the weaker the abstraction"* is a language proverb, not advice you need to supply. One-method interfaces are normal.

**DIP is largely free too.** Because the consumer declares the interface, the dependency arrow already points toward the caller. Constructor-injection ceremony imported from Java is usually redundant.

**What does apply:** a growing type switch over an open set is a real OCP signal, since Go has no sum types to make the trade-off deliberate. Accepting interfaces and returning structs is the idiom; inverting that is the deviation worth noticing.

## Python

**The question is usually whether you need an interface at all.** Duck typing means a second implementation needs no declaration to be substitutable.

**Check the version before recommending a mechanism.** `typing.Protocol` (3.8+) gives structural typing — consumer-declared, ISP-by-construction, the Go model. `abc.ABC` gives nominal typing and forces inheritance. Recommending ABC where `Protocol` fits imposes a coupling the language stopped requiring.

**What does apply:** DIP, in its grep-able form — concrete infrastructure imported at the top of a domain module. The fix is a parameter.

## TypeScript / JavaScript

**Three languages in one trench coat**, and the axis changes with the style in use:

- *Structural interfaces* → ISP by construction, as Go.
- *Discriminated unions* → the expression problem applies; exhaustive `switch` with a `never` check is the feature, not a smell.
- *Classes with `implements`* → closest to the OO column, and the only place classic advice transfers unmodified.

**What does apply:** structural typing means a type is satisfied by shape, so an implementation can honour the shape while violating the contract and still compile. LSP has no compiler help here.

## Java / C#

**SOLID's home turf** — and therefore where over-application is most tempting, because every pattern has first-class language support and a framework eager to supply it.

The note here is **restraint, not application**. A DI container is not free; an interface per class is not architecture. Modern versions have narrowed the gap: records, sealed types, and pattern matching bring the sum-type trade-off into the language, which means the expression-problem entry above now applies to some Java and C# code too.

## Rust

**The clearest illustration of a principle pointing backwards.** `enum` plus `match` is the expression problem in its sharpest form, and exhaustiveness checking makes the "violation" into a safety guarantee.

**Traits are LSP made checkable** — trait laws, verified by property tests.

**The orphan rule** constrains where implementations may live, which means some "just implement the trait for their type" advice is simply not available. Extension traits and newtypes are the idiomatic responses, and they are language mechanics rather than design failures.

## Ruby

**The framework's conventions are the neighbours.** Applying SOLID against Rails' imposed structure — models, controllers, concerns, jobs — is the classic local failure. Rails has already made the structural decisions; G6 outranks this skill there, and "extract a service object" is a Rails-community judgment call, not a SOLID deduction.

**Duck typing makes ISP a question about what callers actually invoke**, never about what a type declares. There is nothing to segregate.

**Mixins carry composition** where other languages reach for interfaces. A module included for behaviour is the idiomatic mechanism, and reaching for an injected collaborator instead is the deviation that needs justifying.
