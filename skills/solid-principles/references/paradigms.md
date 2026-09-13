# The Four Axes Across Paradigms

How cohesion, variation, contract, and direction land in each family of languages. Read the column that matches the code in front of you — and check [`inversions.md`](./inversions.md) before reporting anything, because several of these cells point backwards from the OO default.

Paradigm is a better organizing unit than language here. TypeScript spans three columns depending on how it is written; Python spans two.

---

## The matrix

|   | **Class-OO**<br>Java, C#, C++ | **Structural**<br>Go, TS interfaces | **Functional**<br>Haskell, Elixir, Clojure, F# | **Dynamic**<br>Python, Ruby, JS |
|---|---|---|---|---|
| **COHESION**<br>*SRP + ISP* | Class per actor; role interfaces split by client | Tiny interfaces declared at the **consumer**, not the provider; package boundaries | Module per concern; narrow function signatures; one typeclass per capability | Module and file boundaries; `Protocol`/duck typing only where a second shape exists |
| **VARIATION**<br>*OCP* | Polymorphism; strategy objects | Interface plus registry; discriminated unions | Higher-order functions; sum types **⚠ inverted** — see below; protocols, multimethods | Dispatch dict; duck typing; plugin registry keyed by string |
| **CONTRACT**<br>*LSP* | Override obeys the base contract: no strengthened preconditions, no weakened postconditions | Implementation must not surprise the interface — an `io.Writer` that panics on empty input is a lie | **Typeclass / trait laws are LSP**, verified by property tests rather than review | The test suite *is* the contract; there is nothing else holding it |
| **DIRECTION**<br>*DIP* | Inject interfaces; composition root at `main` | Consumer-side interfaces — **inverted by default**, the language does this for you | Pass effects as arguments; ports as records-of-functions; effect systems | Pass collaborators in; never import concrete infrastructure inside domain modules |

---

## Cohesion

The question is always *what groups together, and whose change does it answer to* — never *how big is this file*.

**Class-OO.** One class per actor. Where a class serves several clients, split the *interface* by client rather than splitting the class — that is ISP doing cohesion work at a finer grain.

**Structural.** Go's idiom is the sharpest statement of this anywhere: *"the bigger the interface, the weaker the abstraction."* Interfaces are declared by the consumer, sized to exactly what that consumer calls. A one-method interface is normal, not a smell.

**Functional.** Cohesion lives in module boundaries and in signature width. A function taking a whole config record when it needs two fields is the functional form of an unused-surface violation.

**Dynamic.** Most cohesion work is file and module placement. Resist declaring an interface at all until a second shape exists — `Protocol` and ABC are for when you have something to check, not for decoration.

## Variation

**⚠ The big inversion.** Under sum types (Rust enums, Haskell ADTs, Elm custom types, TS discriminated unions), adding a *variant* forces edits at every match site, while adding an *operation* is free. That is the exact opposite of the OO trade-off, where adding a subclass is free and adding an operation touches every class.

This is the expression problem, not an OCP violation. A skill that does not know this gives actively harmful advice in half the languages it claims to cover. Full treatment in [`inversions.md`](./inversions.md).

**Class-OO.** Polymorphic dispatch is the extension mechanism. Strategy objects where behaviour varies independently of type.

**Structural.** Interface plus a registry, or a union type where the variant set is closed. Go has no sum types, so a closed set is conventionally a type switch — and a growing type switch over an *open* set is a genuine signal.

**Functional.** Higher-order functions absorb most variation without any named abstraction. Protocols (Clojure) and multimethods dispatch on value, not just type.

**Dynamic.** A dict of handlers is usually the whole answer. Duck typing means new cases need no registration at all, provided they respond to the same calls.

## Contract

This axis ports cleanly everywhere, because Liskov & Wing defined it over *behaviour*, not syntax.

The invariants: **preconditions cannot strengthen, postconditions cannot weaken, invariants hold, history constraints hold.** Read that as *"a caller who saw only the signature must not be surprised."*

**Class-OO.** The classic form — an override that rejects inputs the base accepted is a violation, whether or not it compiles.

**Structural.** Nothing in Go or TypeScript checks behaviour, only shape. An implementation satisfying the shape while violating the contract type-checks perfectly and breaks at runtime.

**Functional.** Typeclass and trait laws *are* behavioural subtyping with a different vocabulary. `Monoid` associativity, `Functor` identity, `Eq` reflexivity — a lawless instance is precisely an LSP violation. The verification mechanism is property-based testing, which makes this the one paradigm where contract conformance is routinely machine-checked.

**Dynamic.** With no type system to lean on, the test suite carries the entire contract. That is not a weakness to be corrected with abstract base classes — it is where the contract genuinely lives, and where it should be written down.

## Direction

The universal test, free of syntax assumptions:

> **Can the core be built, imported, and tested with the infrastructure dependency absent?**

If not, the dependency points the wrong way. This works identically in every language, and applies only where a boundary is actually *claimed* — no intended domain/infra split means nothing is inverted.

**Class-OO.** Constructor injection against interfaces; wire everything at a composition root in `main`. Containers are optional and usually unnecessary below a certain size.

**Structural.** Go inverts by default. Because the consumer declares the interface, the dependency arrow already points toward the caller without any deliberate act. Much DIP ceremony imported from Java is redundant here.

**Functional.** Pass effects as arguments. A "port" is a record of functions, and the adapter is a value you construct at the edge. Effect systems and `Reader` formalize the same thing.

**Dynamic.** Pass collaborators in rather than importing them. The grep-able form of the violation: a concrete infrastructure import at the top of a domain module.
