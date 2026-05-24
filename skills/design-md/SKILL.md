---
name: design-md
description: |
  Use when a project contains a DESIGN.md file (Google Labs' open-source format
  for design systems) and the user is doing UI, theming, or component work.
  This skill teaches the format — YAML token frontmatter plus markdown prose —
  and how to apply it when generating or modifying UI in any framework (React,
  Vue, Svelte, plain CSS, mobile, etc.). Triggers: DESIGN.md present in repo;
  UI / theme / component edits; design token mentions; "make it look like X"
  or "match the brand" tasks when a design system is in the project.
license: Apache-2.0
metadata:
  author: daniel
  version: "0.1.0"
---

# DESIGN.md Format

Teach AI agents to read, write, and apply DESIGN.md — an open-source design-system format from Google Labs. The skill is stack-agnostic: it explains the format and how to translate its tokens and prose into UI code in whatever framework the host project uses.

## When to Apply

Activate this skill when:

- The project contains one or more `DESIGN.md` files
- The user is creating, editing, or styling UI components
- The user mentions design tokens, theming, or a "design system"
- A request implies a visual change ("make it look like X", "match the brand", "match the design")

If no `DESIGN.md` exists, exit quietly — there is nothing to apply.

## What This Skill Is Not For

- Generating a `DESIGN.md` from a vibe prompt — that is the LLM's job; this skill teaches the format the LLM should produce.
- Replacing design tools like Figma or Stitch.
- Reverse-engineering existing CSS into a `DESIGN.md`. For that, use Google's `extract-design-md` skill.

## Discovery

Before applying the skill, find the relevant `DESIGN.md`:

1. If the user named a specific path, use it.
2. Otherwise search the project: `find . -name "DESIGN.md" -not -path "*/node_modules/*"`.
3. If exactly one match: use it. If multiple: prefer the one closest to the file being edited, or ask the user which applies.
4. If none: do not silently proceed. Tell the user and offer to scaffold one.

Some projects keep theme variants (`DESIGN.light.md` / `DESIGN.dark.md`) or per-app files in a monorepo. Treat each as an independent design system; do not merge them.

## The Mental Model

A `DESIGN.md` file has two layers that work together:

- **YAML frontmatter** — precise, machine-readable tokens (colors, typography, spacing, radii, components).
- **Markdown prose** — design rationale and visual properties that don't fit in tokens (shadows, blurs, gradients, transitions, glows, borders, z-index conventions).

**You must read both.** A surprising amount of the design language lives only in the prose.

## File Structure

```
---
name: <design-system-name>
colors:     { ... }
typography: { ... }
rounded:    { ... }
spacing:    { ... }
components: { ... }
---

## Brand & Style
## Colors
## Typography
## Layout & Spacing
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts   (optional)
```

Sections that are present must appear in this order. Sections can be omitted. Full schema in `references/spec.md`.

## Token Reference Syntax

Inside the YAML, tokens can reference other tokens using `{path.to.token}`:

```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
```

When generating code, resolve references to their leaf values.

## Color Naming

Many `DESIGN.md` files use Material Design 3 role naming, with `on-*` pairs (text-on-background), `*-container` tonal variants, and `*-fixed` cross-theme stable colors:

```
primary  →  on-primary  →  primary-container  →  on-primary-container
                       →  primary-fixed       →  on-primary-fixed
inverse-primary, inverse-surface, inverse-on-surface
surface  →  surface-dim / surface-bright
         →  surface-container-{lowest..highest}
outline, outline-variant, surface-tint
```

But MD3 is not required. Simpler palettes (`primary`, `accent`, `text`, `background`) are equally valid. Read whatever's in the file; do not assume names exist.

## Component Schema

Allowed component properties: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.

**Variants are sibling components, not nested keys:**

```yaml
# correct
button-primary:        { ... }
button-primary-hover:  { ... }

# WRONG — do not do this
button-primary:
  default: { ... }
  hover:   { ... }
```

Canonical variant suffixes: `-hover`, `-active`, `-focus`, `-disabled`, `-pressed`.

## Tokens vs Raw Values

Prefer token references. Raw values are acceptable when no token cleanly applies:

- Alpha overlays: `rgba(255, 255, 255, 0.1)`
- Positional padding: `padding: 0 24px`
- Specific heights / widths: `height: 48px`

**Never invent token names.** If a token isn't in the file, it doesn't exist.

## Prose-Only Properties

These properties are typically described in the markdown body, never in YAML. When generating code, read the relevant `##` section:

| Property                          | Found in                                |
| --------------------------------- | --------------------------------------- |
| Shadows (`box-shadow`)            | `## Elevation & Depth`                  |
| Backdrop blur (`backdrop-filter`) | `## Elevation & Depth`                  |
| Gradient definitions              | `## Colors` or `## Brand & Style`       |
| Border styles                     | `## Elevation & Depth` or `## Shapes`   |
| Transitions / easings             | `## Components`                         |
| Text-shadow / glow                | `## Typography` or `## Components`      |
| Z-index / stack levels            | `## Elevation & Depth`                  |

## Task-to-Section Map

| Task                          | Read these sections                                       |
| ----------------------------- | --------------------------------------------------------- |
| Style a button                | `## Components`, `## Shapes`, `## Colors`                 |
| Style a card / surface        | `## Components`, `## Elevation & Depth`, `## Shapes`      |
| Build a layout                | `## Layout & Spacing`, `## Brand & Style`                 |
| Add a typography choice       | `## Typography`, `## Components`                          |
| Define a new component        | All sections, then run the linter                         |

## Applying DESIGN.md

1. **Detect host project conventions** — framework (React / Vue / Svelte / mobile / plain), styling approach (Tailwind / CSS modules / CSS-in-JS / plain CSS), and any existing theme files.
2. **Read DESIGN.md fully** — both tokens and prose for the relevant sections. Use the task-to-section map above.
3. **Generate code in the project's existing style.** Do not rewrite the styling architecture to fit DESIGN.md; map DESIGN.md onto what's already there.
4. **Apply tokens precisely; apply prose treatments approximately.** Prose is direction, not specification — pick reasonable values that honor the described intent.
5. **Verify** — see below.

## Verification

In order of preference:

| Option                  | Command                                | Requires    |
| ----------------------- | -------------------------------------- | ----------- |
| A. Official linter      | `npx @google/design.md lint <path>`    | Node.js     |
| B. Manual trace         | Read DESIGN.md, confirm every value in generated code traces to a token or prose section | Nothing |
| C. Skip                 | —                                      | Not recommended |

The linter returns JSON findings — errors, warnings, contrast ratios. Fix every error before considering work complete.

To diff two versions of a design system:

```bash
npx @google/design.md diff <old> <new>
```

## Editing DESIGN.md

When the user asks to modify the design system itself:

- **Add a new token** — add to YAML; update the relevant `##` prose section to explain its role.
- **Add a new component** — add to YAML `components:`; describe it under `## Components`.
- **Change a token value** — update YAML; if the change is meaningful (not a typo fix), update the prose rationale too.
- **Add variants** — add sibling entries (`-hover`, `-active`, etc.), never nested keys.

Run `lint` after any edit. Run `diff` to confirm the change is what you intended.

## When the File Doesn't Match the Spec

If a `DESIGN.md` uses a custom property or section not in `references/spec.md`:

- Honor it. The file is the source of truth; the spec is documentation.
- Do not silently delete or rename custom content during edits.
- If the file conflicts with itself (broken token reference, missing required section), surface the conflict to the user instead of guessing.

## Anti-Patterns

- ❌ Inventing token names not in the file
- ❌ Hardcoding values that have tokens (`color: #1A1C1E` instead of the token reference)
- ❌ Ignoring the prose layer — shadows, blurs, transitions disappear
- ❌ Nesting variants instead of suffixing siblings
- ❌ Assuming a fixed spacing schema (`xs/sm/md/lg/xl`) — read what's actually there
- ❌ Editing tokens without updating their rationale prose
- ❌ Skipping verification

## References

- Full schema: [`references/spec.md`](./references/spec.md)
- Upstream quickstart: [`references/upstream-README.md`](./references/upstream-README.md)
- Example design systems: [`references/examples/`](./references/examples)
  - [`atmospheric-glass.md`](./references/examples/atmospheric-glass.md) — glassmorphism dark theme, prose-heavy
  - [`paws-and-paths.md`](./references/examples/paws-and-paths.md) — friendly light theme, balanced
  - [`totality-festival.md`](./references/examples/totality-festival.md) — high-contrast cosmic theme, dual fonts
- Vendored version pin: [`references/VERSION`](./references/VERSION)
- Official format and CLI: https://github.com/google-labs-code/design.md
