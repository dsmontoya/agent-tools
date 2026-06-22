# Changelog

Notable changes to the PRD skill family. Dates are merge dates — when the change landed on `main` and became available to anyone running `skills update`. Entries in progress live under `## Unreleased` until the merge commit stamps them with a date.

Template bundles carry their own versions (e.g., `builtin/prd@1`); entries note the bundle when they describe template changes.

## Unreleased

### Changed

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
