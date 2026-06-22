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

### Notes

- Non-breaking. The bundle stays at `v1`; existing PRDs continue to render. Section numbers are unchanged.
- Existing PRDs authored under the old wording may contain implementation-language that the new template no longer normalizes as examples. Run `prd-audit` to surface these as WARNING-tier findings, then `prd-propose` to clean them up.
