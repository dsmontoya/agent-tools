// Parsing for the .prd.yaml `template:` field.
//
// Accepted forms:
//   builtin/<name>@<version>   — pinned built-in
//   builtin/<name>             — latest built-in
//   custom/<name>              — custom (user-versioned via git)
//
// Versions on custom/ refs are not accepted — custom bundles aren't
// version-managed by the skill (see SKILL_DESIGN.md §17.6, §17.12).

import type { TemplateRef } from "./types.ts";

const PATTERN = /^(builtin|custom)\/([a-z0-9][a-z0-9-]*)(?:@(\d+(?:\.\d+){0,2}))?$/;

export const DEFAULT_TEMPLATE = "builtin/prd";

export function parseTemplateRef(input: string): TemplateRef {
  const match = PATTERN.exec(input.trim());
  if (!match) {
    throw new Error(
      `Invalid template ref "${input}". Expected "builtin/<name>[@<version>]" or "custom/<name>".`,
    );
  }
  const [, scope, name, version] = match;
  if (scope === "custom" && version) {
    throw new Error(
      `Template ref "${input}" pins a version on a custom bundle. Custom bundles aren't version-managed by the skill; remove "@${version}".`,
    );
  }
  return {
    scope: scope as "builtin" | "custom",
    name: name!,
    version: version ?? null,
  };
}

export function formatTemplateRef(ref: TemplateRef): string {
  const base = `${ref.scope}/${ref.name}`;
  return ref.version ? `${base}@${ref.version}` : base;
}
