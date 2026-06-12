import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listTemplates } from "../list-templates.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";
import { join } from "node:path";

const MINIMAL_CONFIG = (name: string) =>
  [
    `name: ${name}`,
    "version: 1.0.0",
    "artifacts:",
    "  prd:",
    "    template: prd.md",
    "    storage: per_instance",
    '    path_pattern: "{slug}.md"',
    "    roles:",
    '      problem: "Problem"',
    '      users: "Users"',
    '      success: "Success"',
    '      capability: "Capability"',
  ].join("\n");

describe("listTemplates", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot();
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("throws usage when no sources are given", () => {
    expect(() => listTemplates({ sources: [] })).toThrowError(/templates root/i);
  });

  it("returns an empty list when sources do not exist", () => {
    const result = listTemplates({ sources: [join(root, "nope")] });
    expect(result.templates).toEqual([]);
  });

  it("lists a single builtin template", () => {
    writeFixtureFile(root, "templates/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates.length).toBe(1);
    expect(result.templates[0]).toMatchObject({
      scope: "builtin",
      name: "prd",
      version: "1",
      ref: "builtin/prd@1",
      loaded: true,
      artifacts: ["prd"],
    });
  });

  it("lists multiple builtin versions of the same name", () => {
    writeFixtureFile(root, "templates/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    writeFixtureFile(root, "templates/builtin/prd/v2/config.yaml", MINIMAL_CONFIG("prd"));
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates.map((t) => t.ref)).toEqual(["builtin/prd@2", "builtin/prd@1"]);
  });

  it("lists custom templates without version", () => {
    writeFixtureFile(root, "templates/custom/my-prd/config.yaml", MINIMAL_CONFIG("my-prd"));
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates[0]).toMatchObject({
      scope: "custom",
      name: "my-prd",
      version: null,
      ref: "custom/my-prd",
    });
  });

  it("ignores version folders that do not match v<digits>", () => {
    writeFixtureFile(root, "templates/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    writeFixtureFile(root, "templates/builtin/prd/draft/config.yaml", MINIMAL_CONFIG("prd"));
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates.map((t) => t.version)).toEqual(["1"]);
  });

  it("lets a later source override an earlier one on collision", () => {
    writeFixtureFile(root, "user/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    writeFixtureFile(root, "project/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    const result = listTemplates({
      sources: [join(root, "user"), join(root, "project")],
    });
    expect(result.templates.length).toBe(1);
    expect(result.templates[0]!.bundle_dir).toContain("project");
  });

  it("treats different versions as separate entries", () => {
    writeFixtureFile(root, "user/builtin/prd/v1/config.yaml", MINIMAL_CONFIG("prd"));
    writeFixtureFile(root, "project/builtin/prd/v2/config.yaml", MINIMAL_CONFIG("prd"));
    const result = listTemplates({
      sources: [join(root, "user"), join(root, "project")],
    });
    expect(result.templates.length).toBe(2);
  });

  it("reports parse_error and loaded=false for a malformed config", () => {
    writeFixtureFile(root, "templates/builtin/prd/v1/config.yaml", ":\n  - broken\n");
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates[0]!.loaded).toBe(false);
    expect(result.templates[0]!.parse_error).not.toBeNull();
  });

  it("reports config.yaml missing as parse_error", () => {
    writeFixtureFile(root, "templates/builtin/prd/v1/prd.md", "# Stub\n");
    const result = listTemplates({ sources: [join(root, "templates")] });
    expect(result.templates[0]!.loaded).toBe(false);
    expect(result.templates[0]!.parse_error).toMatch(/config\.yaml/);
  });
});
