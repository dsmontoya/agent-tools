# Glossary

Shared terminology used across PRDs in this corpus. Define each term once here; reference from individual PRDs rather than redefining inline.

Entries are organized alphabetically. Each entry follows the same shape:

- **Term** — definition (one or two sentences). If the term has nuance specific to this product, note it. If it carries a specific scope or boundary, name it.

When `prd-audit` runs, it flags:
- Terms used in PRDs but not defined here (gap).
- Terms defined here but unused across all PRDs (orphan).
- Multiple PRDs using slightly different wording for what appears to be the same concept (drift).

Resolve drift by promoting the agreed definition here and removing the local variants from PRDs.

---

## A

[Define terms starting with A. Remove this section entirely if empty.]

- **[Term A]** — [definition].

## B

[…]

## C

[…]

---

<!--
Authoring tips:
- Keep definitions short. Two sentences max; if longer, the term may need to be split.
- Don't restate the obvious. "User: a person who uses the product" adds nothing.
- Use this glossary for *domain* terms (the language of the product / business),
  not generic technical terms (HTTP, JSON, OAuth). Those don't belong in PRDs at
  all — see implementation-language guards in REFERENCE.md §3.
- Cross-reference between entries with [[Term]] notation; resolve manually until
  the skill grows a linker.
-->
