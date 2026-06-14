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

### PRD Skill Family

A family of skills for capturing, refining, applying, and inspecting Product Requirements Documents through an explicit propose → apply → archive lifecycle. Proposals live under `<root>/changes/<slug>/` as `intent.md` + `tasks.md` (+ optional `research.md`) so every change to the PRD corpus has an audit-and-redirect step before anything is written.

#### [prd](./skills/prd)

Umbrella entry point and routing skill. Does no work itself — when the user mentions PRDs without naming a concrete action ("tell me about your PRD workflow", "I want to work on a PRD"), it routes to the right sibling. Also hosts shared references (template bundles, writing principles, validation rules) and deterministic TypeScript scripts consumed by every action skill.

**Use when:**

- The user mentions PRDs or product requirements without specifying an action
- You need to surface active proposals and ask what to continue
- An action skill needs the shared templates, references, or scripts

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd
```

#### [prd-explore](./skills/prd-explore)

Pre-proposal exploration. Open, read-only conversation about a product problem — compare approaches, weigh tradeoffs, scope the space — before committing to a PRD proposal. No artifacts, no interview machinery, no implementation-language guards. Hands off to `prd-propose` when the idea crystallizes.

**Use when:**

- "What should we do about X?"
- "Let me think out loud"
- The user is comparing options or weighing tradeoffs

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-explore
```

#### [prd-propose](./skills/prd-propose)

Interview-driven proposal authoring. Runs a conversational interview in the user's own product language (problem → users → success → capability → boundaries → constraints → phases → risks → context), pushes back on load-bearing answers, translates implementation language to product language, then writes `intent.md` + `tasks.md` (+ `research.md` if external data was consulted) under `<root>/changes/<slug>/`. Never touches the PRD itself.

**Use when:**

- "Let's write a PRD for X"
- "Update the onboarding PRD — change the timeout rule"
- The user describes a feature/change with audience and intent in mind

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-propose
```

#### [prd-clarify](./skills/prd-clarify)

Second-pass refinement on an active proposal. Rewrites `intent.md` as understanding improves, applies the strikethrough rule to `tasks.md` (unchecked tasks edit freely; checked tasks get struck through with a replacement added beneath), appends new findings to `research.md`. Writes stay inside the proposal folder; the PRD itself is untouched.

**Use when:**

- "I forgot to mention X"
- "Actually the success metric should be Y"
- `prd-verify` surfaced gaps to address before archive

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-clarify
```

#### [prd-apply](./skills/prd-apply)

Executes unchecked tasks in a proposal's `tasks.md` against the PRD corpus. Idempotent — only processes `- [ ]` tasks; `- [x]` and struck-through tasks are skipped. Re-reads each affected PRD section before writing and surfaces discrepancies if the corpus has drifted. Never auto-triggers from natural language alone.

**Use when:**

- A proposal is ready and the user wants to write to the PRD
- `/prd-apply` or "apply the proposal"

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-apply
```

#### [prd-verify](./skills/prd-verify)

Read-only inspection of a single PRD or proposal — completeness, correctness, coherence, and (for proposal-driven verifies) alignment with `tasks.md`. Produces a tiered CRITICAL / WARNING / SUGGESTION report in conversation; never writes findings to disk. Also auto-runs as `prd-archive`'s pre-flight check.

**Use when:**

- "Verify the onboarding PRD"
- "Does the PRD have any issues?"
- Checking whether a proposal is ready for apply

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-verify
```

#### [prd-audit](./skills/prd-audit)

Read-only inspection *across* the PRD corpus — terminology drift, persona alignment, capability overlap, broken cross-references, contradictions between PRDs. Sibling to `prd-verify`; verify is intra-doc, audit is inter-doc. Produces a tiered conversational report; never modifies any PRD.

**Use when:**

- The user wants a cross-PRD consistency check
- After a multi-PRD apply or a brand-new PRD lands
- Glossary or personas may have drifted

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-audit
```

#### [prd-archive](./skills/prd-archive)

Closes a fully-applied proposal by moving its folder to `<root>/changes/archive/<YYYY-MM-DD>-<slug>/`. Auto-runs `prd-verify` as a pre-flight check; CRITICAL findings (unchecked tasks, broken cross-refs, missing required sections) block by default. Use `--abandon` for intentional abandonment.

**Use when:**

- All tasks are checked or struck and the user wants to close
- Intentionally abandoning an unfinished proposal (`--abandon`)

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-archive
```

#### [prd-convert](./skills/prd-convert)

Brings an existing legacy PRD into template-shaped form. Two flavors: **reformat** (default — map content into template sections, preserve prose) and **rewrite** (opt-in — archive original as legacy, run full propose interview). Produces a standard proposal; the normal `prd-apply` / `prd-archive` lifecycle takes over from there.

**Use when:**

- A pre-existing PRD doesn't match the template and needs migration
- `/prd-convert <path>` or "migrate the legacy auth doc"

**Install:**

```bash
npx skills add dsmontoya/agent-tools@prd-convert
```

## Adding a New Skill

See [AGENTS.md](./AGENTS.md) for the directory layout and SKILL.md format used in this repo.

## License

Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for attribution of any vendored third-party content.
