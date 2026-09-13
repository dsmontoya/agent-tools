## 1. Scaffold

- [x] 1.1 Create `skills/solid-principles/` with `SKILL.md`, `references/`, and `tests/fixtures/`
- [x] 1.2 Write frontmatter: `name: solid-principles`, `license: Apache-2.0`, `metadata.author: daniel`, `metadata.version: "0.1.0"`
- [x] 1.3 Write the `description` field following the draft in design.md "Triggering on structural moments" — boundary test first, verbatim phrasings, negative-trigger clauses for both routine edits and throwaway work (prototype, PoC, spike, experiment), prototype promotion as a positive trigger, uncertainty default with its reason, abstraction vocabulary confined to negative clauses

## 2. SKILL.md core

- [x] 2.1 Write the four-axis reframe: SRP+ISP as cohesion, OCP as variation, LSP as contract, DIP as direction, with the Liskov & Wing note on why LSP ports
- [x] 2.2 Write the precedence ladder at the top of SKILL.md, above G0: project's documented guidelines > language version's native mechanisms > file/package/repo idiom > this skill. Then "Read the neighbors first" — establish the idiom of this repo before judging anything
- [x] 2.3 Write G0 and the five *add structure* gates (G1 name the actors, G2 cite the variation cheapest-evidence-first, G3 scatter evaluated twice — at plan time where it can change the plan, and on the closing summary where it can only add one line, G4 count the implementations using the binary fake test, G5 blast radius). State the G1/G3 symmetry — same principle, split vs consolidate. G5 bounds both: splits stay within the occasioning task, and scatter authorizes a same-size alternative plan, never a refactor first
- [x] 2.4 Write the two *deviate* gates (G6 match the neighbors with nearest-wins layering, G7 would a native write this)
- [x] 2.5 Write the four *report a problem* gates, each naming its mechanical check (G8 build test via grep for infra imports in domain paths, G9 signature lie via grep for NotImplemented-style throws, G10 unused surface via LSP find-references per member per client, G11 inversions as knowledge with no command). Prefer grep-shaped checks; treat LSP as a bonus since availability varies
- [x] 2.6 Write G12 seam check for removal
- [x] 2.7 Write the three behavioral rules: gates are internal; failing is free while passing costs; and no gate may require *interpretation* to fail — a check returning an answer is fine however obtained, a check returning evidence that must then be judged is not. State the coupling-is-detectable / cohesion-is-not split
- [x] 2.8 Write the propose-don't-do exception
- [x] 2.9 Write "Consistency outranks SOLID" with the shared evidentiary standard (cited commit for abstraction, cited pain for deviation)
- [x] 2.10 Write "What This Skill Is Not For" — declines line-level defect hunting to `code-review`, not a general quality reviewer, not always-on
- [x] 2.11 Add the over-abstraction gallery: interface-per-class, DI container in a small CLI, splitting until nothing does anything, wrapper around a stable stdlib API, speculative plugin system

## 3. References

- [x] 3.1 Write `references/paradigms.md` — the four axes across class-OO, structural (Go/TS), functional, and dynamic, with the concrete mechanism per cell
- [x] 3.2 Write `references/smells.md` — each entry as signal → principle → falsifiers → minimal fix, with falsifiers given at least equal weight
- [x] 3.3 Write `references/inversions.md` — paradigm sections as the spine (expression problem inverting OCP under sum types, Go implicit interfaces as ISP by construction, typeclass laws as LSP verified by property tests)
- [x] 3.3a Add six short per-language notes to `inversions.md`: Go (ISP free by construction), Python (Protocol vs ABC vs duck typing — whether an interface is needed at all), TypeScript/JavaScript (structural typing, discriminated unions flipping OCP), Java/C# (home turf, so the note is restraint), Rust (enums plus traits, expression problem, orphan rule), Ruby (framework conventions are the neighbours — SOLID against Rails' imposed structure is the classic failure; duck typing makes ISP about what callers invoke; mixins carry composition)
- [x] 3.4 Add the GoF-patterns-as-missing-features material to `inversions.md` or `paradigms.md`: strategy is a function, command is a closure, factory is a function returning a value

## 4. Trigger fixture

- [x] 4.1 Write `tests/fixtures/triggers.md` with a "How to run" section requiring a realistic decoy skill list (`code-review`, `simplify`, `design-md`, plus unrelated skills) — a skill offered in isolation fires on everything
- [x] 4.2 Write ~10 should-load cases, including the hard ones that carry no structural vocabulary: a second implementation phrased as a routine feature request, and complicated-mock testability pain
- [x] 4.3 Write ~12 should-not-load cases, including the traps that contain abstraction vocabulary while being routine (adding a field to an interface, renaming an interface, updating a dependency version) and at least two framed as throwaway work ("spike a quick version of X", "just a PoC to see if this is possible")
- [x] 4.3a Add a should-load case for prototype promotion ("let's productionize the spike")
- [x] 4.4 Mark contested cases explicitly and exclude them from scoring
- [x] 4.5 Write the scoring section with the asymmetric bar — zero hard failures (loading on an uncontested should-not-load), at most two soft failures (missing a should-load)

## 5. Conventions check

- [x] 5.1 Confirm `SKILL.md` is under the 500-line cap; move overflow into `references/`
- [x] 5.2 Confirm every link resolves within `skills/solid-principles/` — no `../` references to sibling skills
- [x] 5.3 Confirm references are at most one level deep from `SKILL.md`

## 6. Repo integration

- [x] 6.1 Add a "Code Craft" section to `README.md` with the `solid-principles` entry, matching the existing per-skill format (description, "Use when", install line)
- [x] 6.2 Add the install line `npx skills add dsmontoya/agent-tools@solid-principles`

## 7. Review against the design

- [x] 7.1 Re-read `SKILL.md` against design.md's gate definition — every gate failable in one sentence, evidence-decided, syntax-free, blocking by default. Demote anything that fails all four to `references/`
- [x] 7.2 Verify the description against the Tier 1 static properties: boundary test opens it, at least one verbatim phrasing, negative-trigger clause present, uncertainty default present with reason, no abstraction vocabulary in any positive clause
- [ ] 7.3 Run the trigger fixture once and record the result. Hard-failure bar is zero; if a trap fires, rewrite the description rather than relabelling the case
- [x] 7.4 Confirm no gate as written requires interpreting a command's output in order to fail. Then resolve or defer the remaining open question in design.md: whether G3's plan-time scatter check needs a retrospective re-check when a plan under-counts
