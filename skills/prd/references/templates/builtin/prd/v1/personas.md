# Personas

Shared user personas referenced by PRDs in this corpus. Define each persona once here; reference from individual PRDs rather than redefining inline.

PRDs reference a persona using its anchor:

```markdown
- **[Marcus the Field Tech](./personas.md#marcus-the-field-tech)** — primary user of this feature.
```

PRD-specific personas (one-off user types unique to one feature) live in the PRD's Target Users section, not here. If a PRD-specific persona appears in three or more PRDs, promote it here.

When `prd-audit` runs, it flags:
- Personas referenced by PRDs but not defined here (gap).
- Personas defined here but unused across all PRDs (orphan).
- Two PRDs that appear to describe the same role under different names (drift) — e.g., "Reviewer" in one PRD and "Approver" in another for the same person. Resolve by promoting the agreed name here.

---

## [Persona Name 1]

**Role**: [one line — what they do, day-to-day]
**Context**: [environment they work in — desk, field, mobile, regulated, etc.]
**Goals**: [what they're trying to accomplish at work; the broader job-to-be-done]
**Pain points**: [what gets in their way today]
**Tools used**: [the systems and channels they currently rely on]
**Decision authority**: [what they can decide unilaterally; what needs approval]

---

## [Persona Name 2]

**Role**:
**Context**:
**Goals**:
**Pain points**:
**Tools used**:
**Decision authority**:

---

<!--
Authoring tips:
- Persona names should be evocative, not generic. "Marcus the Field Tech" beats
  "Technician User" — easier to reference, harder to confuse with another role.
- Keep personas grounded in observed behavior. If a persona is speculative
  ("imagined power user"), say so explicitly.
- Don't proliferate. Most products need 3–6 personas. If you have 12, you
  probably have role variants (junior/senior) being treated as distinct
  personas when they aren't.
- "Decision authority" matters for capability scoping — if a persona can't
  decide X, the feature should account for the escalation.
-->
