# AGENTS.md

Guidance for AI coding agents working in this repository.

## Repository Overview

This is a multi-skill repo following the [Agent Skills](https://agentskills.io/) format. Each subdirectory under `skills/` is an independently-installable skill.

## Adding a New Skill

Create a new directory under `skills/` using kebab-case:

```
skills/<skill-name>/
  SKILL.md         # required: skill definition with frontmatter
  README.md        # optional: human-facing docs
  metadata.json    # optional: structured skill metadata
  references/      # optional: supporting docs and vendored content
  scripts/         # optional: executable scripts
```

### SKILL.md Frontmatter

```yaml
---
name: <skill-name>          # kebab-case, matches directory
description: |
  One paragraph that includes trigger phrases and explains
  when the skill should activate. The agent loads this skill
  based on the description, so be specific.
license: Apache-2.0
metadata:
  author: <author>
  version: <semver>
---
```

### Best Practices

- Keep `SKILL.md` under 500 lines. Move deep reference material into `references/`.
- Write specific descriptions covering trigger phrases.
- Reference supporting files at most one level deep from `SKILL.md`.
- Use `kebab-case` for directories, files, and skill names.
- `SKILL.md` filename must be uppercase.

## Vendored Content

When a skill vendors third-party content:

- Track the upstream version in `references/VERSION`.
- Preserve original copyright notices and generated-file headers.
- Add an entry to the repo-level [`NOTICE`](./NOTICE) describing the upstream source and license.
- Do not modify vendored files. If changes are necessary, document them in `references/VERSION` per Apache 2.0 §4(b).

## License Compatibility

This repo is Apache 2.0. Skills that vendor non-Apache 2.0 content should:

- Add a per-skill `LICENSE` file if the license differs.
- Update the repo `NOTICE` with attribution.
- Use a compatible license (MIT, BSD, Apache 2.0).
