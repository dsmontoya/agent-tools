# SKILL: Product Requirements Document

This is a stub. The full skill design is captured in `SKILL_DESIGN.md` and will be assembled into this file once the design is complete. For now, this file holds the writing principles and quality guidance that govern PRD content.

## Writing Principles

When the agent writes PRD content (via apply), it follows these principles:

- **Be specific and measurable.** Avoid vague terms like "fast," "easy," or "good."
- **Include rationale.** Explain *why* design decisions were made, not just *what* they are.
- **Prioritize ruthlessly.** Not everything is high priority.
- **Use declarative language.** State requirements clearly without ambiguity.
- **Consider all stakeholders.** Write for product, design, engineering, and ops.

## Content Guidance Is Qualitative, Not Numeric

The template uses qualitative guidance for content ("brief," "concise," "specific") rather than imposing length caps or item counts. The agent judges what's appropriate based on context.

Numeric limits are reserved for genuine quality constraints — e.g., "exactly one number" for a success metric forces specificity. Arbitrary length caps ("2-3 paragraphs max," "3-5 items") are not used.

This applies to both interview prompts and PRD content.

## PRDs Don't Reference Proposals

Proposals (`intent.md`, `tasks.md`, `research.md`) are internal scaffolding. PRDs are the long-lived public artifact. The dependency only flows one way:

| Direction | Allowed? |
|---|---|
| Proposals consume PRDs (read as context, plan changes against them) | Yes |
| PRDs reference other PRDs (cross-references between long-lived docs) | Yes |
| PRDs reference external docs (README, wiki, design specs) | Yes |
| PRDs reference archived proposals | **No** |

Proposals are internal scaffolding for the agent + user during a change. Once archived, they're audit history, not public documentation. The PRD must stand on its own — readers shouldn't need to learn the proposal lifecycle to understand the product.

**Practical consequence:** when apply writes PRD content, it must NOT include citations or links back to the proposal it came from. Tempting for traceability — but pollutes the PRD with internal lifecycle noise.

## Common Pitfalls

- Solution bias in requirements — describe the problem, not the proposed solution.
- Priority inflation — marking everything "high priority."
- Vague success criteria.
- Missing edge cases that are actually important design decisions.
- Citing proposal artifacts from the PRD (see above).
- Using template terminology in user-facing prompts (see SKILL_DESIGN.md section 12.1).

## When to Use This Skill

- New feature development requiring cross-team alignment.
- Major product changes affecting user workflows.
- Building foundational capabilities (auth, search, billing, etc.).
- Complex integrations with external systems.

## When NOT to Use

- Simple bug fixes or small enhancements (use a ticket instead).
- Exploration/spikes where learning is the primary goal (use a spike doc).
- Routine maintenance or tech debt with minimal user impact.
