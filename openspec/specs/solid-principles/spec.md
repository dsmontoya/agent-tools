# solid-principles

## Purpose

Language-agnostic SOLID guidance delivered as teaching rather than as a review pipeline. The capability translates the principles out of their class-OO origins into whatever language and paradigm is in play, and counter-programs the over-abstraction that design vocabulary tends to induce in an agent.

Its substance is a set of gates: each failable in one sentence, decided by evidence, free of syntax assumptions, and blocking by default. Failing a gate is free; passing one requires cited evidence. That asymmetry is what makes restraint the cheap path.

Delivered as an installable skill at `skills/solid-principles/`.

## Requirements

### Requirement: Skill conforms to repository conventions

The skill SHALL live at `skills/solid-principles/` with an uppercase `SKILL.md` carrying `name`, `description`, `license: Apache-2.0`, and `metadata.author` frontmatter. `SKILL.md` MUST stay under the 500-line cap set by `AGENTS.md`, with depth pushed into `references/`. Reference files MUST be at most one level deep from `SKILL.md`, and the skill MUST NOT link to files outside its own directory.

#### Scenario: Skill is installed standalone
- **WHEN** `skills/solid-principles/` is installed on its own, without the rest of the repository
- **THEN** every link in `SKILL.md` resolves, because all referenced files live under `skills/solid-principles/`

#### Scenario: SKILL.md approaches the line cap
- **WHEN** content growth would push `SKILL.md` past 500 lines
- **THEN** the material moves into `references/` rather than extending `SKILL.md`

### Requirement: Skill teaches the four-axis reframe

The skill SHALL present SOLID as four axes rather than five sibling principles: SRP and ISP as **cohesion** at differing granularities, OCP as **variation**, LSP as **contract**, DIP as **direction**. It MUST state that LSP is the only principle with a formal definition (Liskov & Wing, 1994) and that this is why it ports to languages without inheritance.

#### Scenario: Agent reasons about a language without inheritance
- **WHEN** the agent applies the skill to Go, Rust, or a functional language
- **THEN** it reasons in terms of contract conformance rather than searching for a subclass relationship that the language does not have

### Requirement: Structural change is gated by evidence

The skill SHALL supply gates that are failable in one sentence, decided by evidence rather than taste, free of syntax assumptions, and blocking by default. Failing a gate MUST require no justification; passing one MUST require cited evidence. Gates MUST be organized by the moment they fire — adding structure, deviating from surrounding code, reporting a problem, and removing structure — rather than by principle.

No gate MAY require interpretation in order to fail. A check that returns an answer is legitimate however it is obtained; a check that returns evidence the agent must then judge is not. Where a mechanical check exists it MUST be the preferred evidence, since it is first-hand — and `grep`-shaped checks MUST be preferred over language-server checks, because language-server availability varies by language and setup while `grep` does not. Version-control history MAY confirm a gate the agent is already examining, and MUST NOT be a prerequisite for any gate.

#### Scenario: Abstraction is proposed without evidence
- **WHEN** the agent considers introducing an interface, strategy, plugin, or config hook and cannot cite a prior instance of that axis varying
- **THEN** it does not introduce the variation point

#### Scenario: Splitting a unit without identifiable actors
- **WHEN** the agent considers splitting a unit but can describe the split only in terms of size or verbs, without naming distinct actors who change it on independent schedules
- **THEN** it does not split the unit

#### Scenario: Actors are named but no collision has been reported
- **WHEN** distinct actors can be named and the resulting split stays within the size of the task that occasioned it
- **THEN** the agent performs the split, since the blast-radius limit bounds the cost of being wrong

#### Scenario: Actors are named but the split is large
- **WHEN** distinct actors can be named and the resulting split would exceed the size of the occasioning task
- **THEN** the agent names the observation and leaves the decision to the user rather than performing the split

#### Scenario: Sole implementation whose fake mirrors the real thing
- **WHEN** an interface has exactly one implementation, and nothing can be named that its test double does which the real implementation cannot
- **THEN** the skill treats the interface as a synonym for the concrete type rather than an abstraction

#### Scenario: Sole implementation whose fake removes a real constraint
- **WHEN** the test double avoids the network, controls the clock, or forces an otherwise untriggerable error path
- **THEN** the interface is a seam and the skill leaves it in place

#### Scenario: Plan writes one fact in several places
- **WHEN** the agent's plan for a task would teach several files the same fact — for example what a newly added provider is and how it behaves
- **THEN** the agent treats this as evidence that an abstraction is missing, and switches to a same-size plan that avoids the repetition if one exists

#### Scenario: Plan under-counts the files it will touch
- **WHEN** the work turns out to repeat a fact across more files than the plan anticipated
- **THEN** the agent names it in one line when summarizing the work, and does not restructure after the fact

#### Scenario: Plan touches many files without repeating knowledge
- **WHEN** a plan spans model, migration, and test, or performs a rename across many files
- **THEN** no scatter is reported, because normal layering and mechanical renames touch many files while repeating no knowledge

#### Scenario: Refactor exceeds the occasioning task
- **WHEN** the structural change under consideration is substantially larger than the task that prompted it
- **THEN** the agent stops and proposes the change instead of performing it

### Requirement: Project guidelines and language version outrank the skill

`SKILL.md` SHALL state a precedence order before any gate is presented. A convention the project has documented — in `CLAUDE.md`, a style guide, or linter configuration — MUST outrank this skill's guidance. The native mechanisms of the language version in use MUST outrank the skill's examples, which may predate them. Only below those does the file-to-package-to-repository idiom ladder apply, and the skill itself sits at the bottom.

#### Scenario: Project documents a conflicting convention
- **WHEN** the repository's own guidelines specify a structure that contradicts this skill
- **THEN** the agent follows the project's guideline and does not reopen the decision

#### Scenario: Language version provides a native mechanism
- **WHEN** the language version in use offers a construct that the skill's examples predate
- **THEN** the agent uses the native construct rather than the skill's older illustration

### Requirement: Existing code wins by default

The skill SHALL treat surrounding code as evidence of decisions the agent cannot see. Deviation from established local structure MUST require cited pain, matching the evidentiary standard the abstraction gates impose. When consistency signals conflict, the nearest MUST win: file idiom over package convention over repository architecture over language-community idiom.

#### Scenario: Repository pattern conflicts with SOLID
- **WHEN** the surrounding modules share a structure that a SOLID reading would call a violation, and no pain from that structure has been cited
- **THEN** the agent matches the surrounding structure

#### Scenario: Repository has no established pattern
- **WHEN** no local, package, or repository precedent exists for the code being written
- **THEN** the agent falls through to the idiom of the language community and picks the simplest thing that works

### Requirement: Gates produce structure, not reports

Gate evaluation SHALL be internal. The agent MUST NOT surface gate names, gate outcomes, or principle labels to the user as findings. The skill's output is the absence of unwarranted structure.

#### Scenario: A gate fails during ordinary work
- **WHEN** the agent evaluates a gate and it fails
- **THEN** the agent silently declines the structural change and reports nothing about the gate

### Requirement: Genuine problems are proposed, not enacted

WHERE the surrounding pattern is the cause of pain the user has described, but the user has not asked for a design change, the skill SHALL have the agent name the problem briefly and leave the decision to the user.

#### Scenario: User reports pain while asking for a feature
- **WHEN** the user says a change keeps breaking or requires touching many files, and asks for an unrelated feature
- **THEN** the agent delivers the feature and names the structural cause in a line or two without restructuring anything

### Requirement: Paradigm inversions are respected

The skill SHALL document where a principle inverts or is already satisfied by the language, and the agent MUST check this before reporting a violation. It MUST cover at minimum: the expression problem inverting OCP under sum types, Go's implicit interfaces satisfying ISP by construction, and typeclass laws being LSP under another name.

#### Scenario: Sum type gains a variant
- **WHEN** adding a variant to a sum type requires editing every match site
- **THEN** the agent recognizes this as the expression problem and does not report an OCP violation

#### Scenario: Pattern exists only to work around a missing language feature
- **WHEN** the structure under consideration can be named only as a GoF pattern such as strategy or factory, in a language with first-class functions
- **THEN** the agent uses the language's native mechanism instead

### Requirement: Removing structure is gated too

The skill SHALL apply gates to the removal of abstractions as well as their addition. Before recommending deletion, the agent MUST check whether the abstraction is load-bearing for something invisible in the code: test substitution, build- or link-time swapping, a published API contract, or a process boundary.

#### Scenario: Sole-implementation interface is exported
- **WHEN** an abstraction with one in-repository implementation is part of a published API
- **THEN** the agent does not recommend deletion, because consumers outside the repository are not visible

### Requirement: Description carries the trigger-discipline properties

The `description` field SHALL be structured to under-fire rather than to fire accurately, because a false positive primes the over-abstraction the skill exists to prevent while a false negative merely yields ordinary code. It MUST open with the boundary test — whether a boundary is being created or crossed — before any other content. It MUST include verbatim user phrasings as triggers rather than abstract situation categories. It MUST carry an explicit negative-trigger clause naming bug fixes, added fields, tests, renames, and edits local to a single function, and a second naming throwaway work — prototype, PoC, spike, experiment. It MUST include promotion of a prototype to production as a positive trigger. It MUST state that the skill is not loaded when the decision is uncertain, together with the reason. Abstraction vocabulary — "interface", "abstraction", "dependency", "coupling" — MUST NOT appear as a bare category in a positive trigger clause, because a description that loads on the mere presence of these words loads on nearly every task. The same words MAY appear in a positive clause in two forms: inside a **quoted user phrasing** (`"should this be an interface"`), since a specific quote matches text rather than topic; and inside a **concrete boundary description** (`"a dependency wired across a layer"`), since the boundary, not the word, is what triggers. The distinction is between naming a topic and naming a situation.

These are static properties of the description text and are verifiable by inspection.

#### Scenario: Description is inspected for required clauses
- **WHEN** the `description` field is read
- **THEN** it contains the boundary test before any vocabulary, at least one verbatim user phrasing, a negative-trigger clause, and the uncertainty default with its reason

#### Scenario: Abstraction vocabulary names a bare topic
- **WHEN** a positive clause loads the skill on code that involves interfaces, dependencies, or abstractions as a subject area
- **THEN** the description does not satisfy this requirement and is rewritten

#### Scenario: Abstraction vocabulary appears inside a quoted phrasing or a boundary description
- **WHEN** a positive clause quotes a user phrasing containing such a term, or describes a concrete boundary being crossed using one
- **THEN** the description satisfies this requirement, because the trigger is the phrase or the boundary rather than the vocabulary

### Requirement: Trigger discrimination is validated behaviourally

Loading behaviour SHALL be validated against a fixture of labelled prompts at `tests/fixtures/triggers.md`, evaluated probabilistically rather than asserted deterministically. The fixture MUST present the evaluator with a realistic skill list including adjacent decoys, since a skill offered in isolation fires on everything. It MUST weight cases toward those where the description could plausibly fail, including prompts that contain abstraction vocabulary while being routine, and prompts that are structural while containing none. Cases where reasonable people disagree MUST be marked as contested and excluded from scoring.

The pass bar MUST be asymmetric: loading on an uncontested should-not-load prompt is a hard failure, while missing a should-load prompt is a soft failure tolerated within a stated limit.

#### Scenario: Routine prompt containing abstraction vocabulary
- **WHEN** the fixture presents a prompt such as renaming an interface or updating a dependency version
- **THEN** the skill does not load, and loading on such a prompt is recorded as a hard failure

#### Scenario: Structural prompt containing no structural vocabulary
- **WHEN** the fixture presents a prompt such as adding a second payment provider where one already exists
- **THEN** the skill loads, and failing to load is recorded as a soft failure

#### Scenario: Prompt framed as throwaway work
- **WHEN** the fixture presents a prompt framed as a prototype, PoC, spike, or experiment
- **THEN** the skill does not load, since structure imposed on work meant to be discarded is waste

#### Scenario: Prompt promoting a prototype to production
- **WHEN** the fixture presents a prompt asking to productionize or harden an existing prototype
- **THEN** the skill loads, since promotion is itself a structural moment

#### Scenario: Description is edited after release
- **WHEN** the `description` field is changed
- **THEN** the fixture is rerun and the hard-failure bar of zero still holds

### Requirement: Skill declines adjacent work

`SKILL.md` SHALL state what the skill is not for. It MUST decline line-level defect hunting, which belongs to `code-review`, and it MUST NOT present itself as a general code-quality reviewer.

#### Scenario: User asks for a bug review
- **WHEN** the user asks for correctness review of a diff
- **THEN** the skill defers to `code-review` rather than reporting structural findings
