# Changelog

Notable changes to the PRD skill family. Dates are merge dates — when the change landed on `main` and became available to anyone running `skills update`. Entries in progress live under `## Unreleased` until the merge commit stamps them with a date.

Template bundles carry their own versions (e.g., `builtin/prd@1`); entries note the bundle when they describe template changes.

## Unreleased

### Added

- **Stable anchors in `intent.md`.** Every atomic piece of captured content (persona, risk, capability, boundary, constraint, phase) is now written under its own markdown heading. The heading slug becomes a stable `intent.md#<slug>` anchor referenceable from `tasks.md`. See `SKILL_DESIGN.md` §3.6 and `REFERENCE.md` §9.
- **Two task shapes in `tasks.md`.** Shape A (inline content) and Shape B (`transclude intent.md#<anchor>`). Shape B lets `tasks.md` reference content captured in `intent.md` instead of re-serializing it. Apply reads the anchored body verbatim — no paraphrasing. See `SKILL_DESIGN.md` §7.3 and `REFERENCE.md` §10.
- **Transclusion lock-in.** Applied Shape B tasks snapshot intent.md content into the corpus at apply time. Subsequent edits to intent.md do not silently propagate; propagating requires a clarify-generated `re-transclude` task, following the existing strikethrough rule. See `SKILL_DESIGN.md` §6.7 and `REFERENCE.md` §11.
- **Why-note convention on clarify-generated tasks.** Tasks created during clarify carry a short why-note (em dash + phrase) when the prompt for the change isn't visible from the task content alone. Required for re-transcludes (Shape B doesn't show prose diffs); recommended for inline supersessions and brand-new additions; optional for typographical cleanup. See `SKILL_DESIGN.md` §6.8 and `REFERENCE.md` §12.
- **`scripts/resolve-anchor.ts`.** New deterministic CLI used by `prd-apply` and `prd-verify` to resolve an `intent.md` anchor to its body, or report that the anchor doesn't exist. Backed by `lib/markdown.ts#extractSectionBody` and tested under `__tests__/resolve-anchor.test.ts`.
- **`lib/tasks.ts#classifyTaskShape`.** New helper that distinguishes Shape A inline tasks from Shape B transclude tasks (including `re-transclude`) and captures any trailing why-note. Used by verify to detect broken transclusion anchors as CRITICAL.

### Changed

- `prd-propose` SKILL.md: documents the new `intent.md` anchor structure and the two-shape task model; picks the shape based on whether content is net-new (Shape A) or sourced from a single intent.md heading (Shape B).
- `prd-clarify` SKILL.md: documents the transclusion lock-in semantics, the re-transclude pattern, and the why-note convention; both apply during the strikethrough handling of applied transclude tasks.
- `prd-apply` SKILL.md: detects task shape; resolves Shape B anchors via `resolve-anchor.ts` and writes the body into the target section; surfaces missing-anchor as a discrepancy with three resolutions (apply as written, edit the task, pause for clarify).
- `prd-verify` SKILL.md: broken Shape B anchors on unchecked tasks are now CRITICAL findings; re-transcludes missing a why-note are flagged as WARNING.

- PRD template (`builtin/prd@1`): rescoped §7 Functional Requirements to non-user-facing system behaviors only (scheduled jobs, audit logging, system-emitted events, background reconciliation). Removed "data models, APIs, integrations, algorithms" framing. Section intro now explicitly forbids code, schemas, endpoints, and tech names, and explicitly forbids restating §6 Rules.
- PRD template (`builtin/prd@1`): rewrote §8 Non-Functional Requirements example placeholders in product-language. Removed implementation-flavored suggestions (RESTful APIs, MFA, auto-scaling on CPU/memory, encryption at rest, browser version lists). Folded the previous "Integration APIs" sub-bullet into Data Management as "Portability."
- PRD template (`builtin/prd@1`): renamed §9 "Implementation Phases" → "Rollout Phases".
- PRD template (`builtin/prd@1`): rewrote §10.1 Technical Risks example list in product-language (user-observable outcomes rather than internal failure modes).
- PRD template (`builtin/prd@1`): renamed §1.2 bullet "Portfolio fit" → "Alignment". Cleaner, symmetric with the sibling bullets ("Why now", "Dependencies"), and avoids redundancy with the parent "Strategic Rationale" heading. Description unchanged.
- PRD template (`builtin/prd@1`): sharpened §1.2 Dependencies bullet description. Replaced the "technical and organizational" shorthand with concrete categories (foundational work, prior features, organizational prerequisites), anchored timing ("before this can ship"), and added an explicit guardrail against implementation detail ("Name the *capability* or *milestone* required, not how it's built").

### Fixed

- PRD template (`builtin/prd@1`): §4 heading was missing its period (`## 4 Core Concepts and Terminology` → `## 4. Core Concepts and Terminology`).
- PRD template (`builtin/prd@1`): §6 intro pointed writers to §7 for "system-level technical contracts (APIs, data models, integrations)" — stale after §7's recent rescoping, which explicitly forbids those. Cross-reference now sends non-user-facing *behaviors* to §7 and *implementation details* to engineering design docs.
- PRD template (`builtin/prd@1`): §11.4 placeholder had a misplaced period outside the bracket (`...data].` → `...data.]`).
- PRD template (`builtin/prd@1`): §12.1 Glossary line had a stray trailing `]` with no matching opener.
- PRD template (`builtin/prd@1`): §10.4 External Risks was missing its example block while §10.1–§10.3 each had one. Added five product-language example external risks (vendor deprecations, regulatory changes, competitor moves, partner delays, geopolitical access).
- PRD template (`builtin/prd@1`): flattened the Table of Contents so depth is uniform. Removed the §1 and §3 subsection entries (no other top-level section listed its subsections, so they were the outliers). TOC is now top-level only.

### Notes

- Non-breaking. The bundle stays at `v1`; existing PRDs continue to render. Section numbers are unchanged.
- Existing PRDs authored under the old wording may contain implementation-language that the new template no longer normalizes as examples. Run `prd-audit` to surface these as WARNING-tier findings, then `prd-propose` to clean them up.
