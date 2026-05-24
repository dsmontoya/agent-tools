# Agent Tools

A collection of [Claude Code](https://claude.com/claude-code) skills, following the [Agent Skills](https://agentskills.io/) format and installable via the [skills CLI](https://skills.sh/).

## Available Skills

### [design-md](./skills/design-md)

Stack-agnostic skill for working with [DESIGN.md](https://github.com/google-labs-code/design.md), Google Labs' open-source design-system format. Teaches agents to read the YAML token frontmatter and markdown prose, then apply the system when generating UI in any framework (React, Vue, Svelte, plain CSS, mobile).

**Use when:**

- A project contains a `DESIGN.md` file
- Editing UI, themes, or components
- Working with design tokens
- Asked to "match the design" or "make it look like X"

**Install:**

```bash
npx skills add dsmontoya/agent-tools@design-md
```

## Adding a New Skill

See [AGENTS.md](./AGENTS.md) for the directory layout and SKILL.md format used in this repo.

## License

Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for attribution of any vendored third-party content.
