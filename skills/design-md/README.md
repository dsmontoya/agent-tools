# design-md

An unofficial Claude Code skill for working with [DESIGN.md](https://github.com/google-labs-code/design.md) — Google Labs' open-source format for design systems.

This skill teaches AI agents to:

- Discover and read `DESIGN.md` files in any project
- Parse the YAML token frontmatter and markdown prose layer
- Apply the design system when generating UI code in any framework
- Validate edits with the official linter

## Installation

```bash
npx skills add dsmontoya/agent-tools@design-md
```

Or manually:

```bash
cp -r skills/design-md ~/.claude/skills/
```

## What It Does

Loaded on demand when an agent is doing UI, theme, or component work in a project that contains a `DESIGN.md`. The skill explains:

- The two-layer model (YAML tokens + markdown prose)
- Token reference syntax (`{colors.primary}`)
- The component schema and variant-naming convention
- Prose-only properties (shadows, blurs, gradients) that don't fit in tokens
- How to discover the right `DESIGN.md` when a project has more than one
- Verification using `@google/design.md lint`

The skill is stack-agnostic. It doesn't assume React, Tailwind, or any specific framework — it explains the format and lets the agent map tokens onto whatever conventions the host project already uses.

## What It Doesn't Do

- It doesn't generate a `DESIGN.md` from a vibe prompt — that's the LLM's job. This skill teaches the format the LLM should produce.
- It doesn't reverse-engineer existing CSS into a `DESIGN.md`. For that, use [Google's `extract-design-md` skill](https://skills.sh/google-labs-code/stitch-skills/extract-design-md).
- It doesn't replace design tools like Figma or Stitch.

## Format Version

This skill is pinned to the DESIGN.md format at upstream tag `v0.1.1`. See [`references/VERSION`](./references/VERSION) for details on what is vendored.

## License

Apache License 2.0. The skill itself is original work; the files in `references/` are vendored unmodified from `google-labs-code/design.md` at tag `0.1.1` and are also Apache 2.0. See the repo-level [`NOTICE`](../../NOTICE) for attribution.

This skill is unofficial. It is not affiliated with or endorsed by Google.
