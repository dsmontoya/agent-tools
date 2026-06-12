import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateTemplate } from "../validate-template.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";
import { join } from "node:path";

const PRD_TEMPLATE = [
  "# PRD",
  "",
  "## 2. Problem",
  "",
  "## 3.2 Success",
  "",
  "## 5. Users",
  "",
  "## 6. Capability",
  "",
  "## 8. Constraints",
  "",
  "## 10. Risks",
].join("\n");

const FULL_CONFIG = [
  "name: prd",
  "version: 1.0.0",
  "artifacts:",
  "  prd:",
  "    template: prd.md",
  "    storage: per_instance",
  '    path_pattern: "{slug}.md"',
  "    roles:",
  '      problem: "2. Problem"',
  '      users: "5. Users"',
  '      success: "3.2 Success"',
  '      capability: "6. Capability"',
  "    soft_roles:",
  '      constraints: "8. Constraints"',
  '      risks: "10. Risks"',
  '      boundaries: "Boundaries"',
  "  glossary:",
  "    template: glossary.md",
  "    storage: singleton",
  "    path: glossary.md",
].join("\n");

describe("validateTemplate", () => {
  let root: string;
  let bundleDir: string;
  beforeEach(() => {
    root = makeTempRoot();
    bundleDir = join(root, "templates/builtin/prd/v1");
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("flags a missing bundle directory", () => {
    const result = validateTemplate({ bundleDir: join(root, "nope") });
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe("missing_bundle_dir");
  });

  it("flags a bundle with no config.yaml", () => {
    writeFixtureFile(bundleDir, "prd.md", "# stub");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe("missing_config");
  });

  it("flags malformed config.yaml", () => {
    writeFixtureFile(bundleDir, "config.yaml", ": broken : :\n");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe("malformed_config");
  });

  it("accepts a complete, well-formed bundle", () => {
    writeFixtureFile(bundleDir, "config.yaml", FULL_CONFIG);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("warns when soft roles are missing", () => {
    const config = FULL_CONFIG.split("\n")
      .filter((l) => !l.startsWith("    soft_roles") && !l.includes("constraints") && !l.includes("risks") && !l.includes("boundaries"))
      .join("\n");
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.map((w) => w.code)).toContain("missing_soft_role");
  });

  it("rejects a bundle with no per-instance artifact", () => {
    const config = [
      "name: prd",
      "version: 1.0.0",
      "artifacts:",
      "  glossary:",
      "    template: glossary.md",
      "    storage: singleton",
      "    path: glossary.md",
    ].join("\n");
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("no_prd_artifact");
  });

  it("rejects a bundle with multiple per-instance artifacts that have roles", () => {
    const config = [
      "name: prd",
      "version: 1.0.0",
      "artifacts:",
      "  prd:",
      "    template: prd.md",
      "    storage: per_instance",
      '    path_pattern: "{slug}.md"',
      "    roles:",
      '      problem: "2. Problem"',
      '      users: "5. Users"',
      '      success: "3.2 Success"',
      '      capability: "6. Capability"',
      "  rfc:",
      "    template: rfc.md",
      "    storage: per_instance",
      '    path_pattern: "rfcs/{slug}.md"',
      "    roles:",
      '      problem: "2. Problem"',
      '      users: "5. Users"',
      '      success: "3.2 Success"',
      '      capability: "6. Capability"',
    ].join("\n");
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "rfc.md", PRD_TEMPLATE);
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("multiple_prd_artifacts");
  });

  it("rejects when a required role is missing", () => {
    const config = FULL_CONFIG.replace('      success: "3.2 Success"\n', "");
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    const finding = result.errors.find((e) => e.code === "missing_role");
    expect(finding?.role).toBe("success");
  });

  it("rejects when a role points to a heading absent from the template", () => {
    const config = FULL_CONFIG.replace('"2. Problem"', '"2. Nonexistent"');
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("role_section_missing");
  });

  it("rejects when an artifact's template file is missing", () => {
    writeFixtureFile(bundleDir, "config.yaml", FULL_CONFIG);
    // prd.md intentionally missing
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("artifact_template_missing");
  });

  it("rejects a singleton artifact missing the path field", () => {
    const config = [
      "name: prd",
      "version: 1.0.0",
      "artifacts:",
      "  prd:",
      "    template: prd.md",
      "    storage: per_instance",
      '    path_pattern: "{slug}.md"',
      "    roles:",
      '      problem: "2. Problem"',
      '      users: "5. Users"',
      '      success: "3.2 Success"',
      '      capability: "6. Capability"',
      "  glossary:",
      "    template: glossary.md",
      "    storage: singleton",
    ].join("\n");
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("singleton_missing_path");
  });

  it("rejects a per-instance path_pattern that lacks {slug}", () => {
    const config = FULL_CONFIG.replace('"{slug}.md"', '"static.md"');
    writeFixtureFile(bundleDir, "config.yaml", config);
    writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("per_instance_path_pattern_no_slug");
  });

  it("infers scope=custom when the bundle path is under custom/", () => {
    const customBundle = join(root, "templates/custom/my-prd");
    writeFixtureFile(customBundle, "config.yaml", FULL_CONFIG.replace("name: prd", "name: my-prd"));
    writeFixtureFile(customBundle, "prd.md", PRD_TEMPLATE);
    writeFixtureFile(customBundle, "glossary.md", "# Glossary");
    const result = validateTemplate({ bundleDir: customBundle });
    expect(result.scope).toBe("custom");
  });
});
