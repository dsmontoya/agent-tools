import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveConfig, DEFAULT_ROOT } from "../resolve-config.ts";
import { parseTemplateRef, formatTemplateRef } from "../lib/template-ref.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";

describe("resolveConfig", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot();
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("returns defaults when .prd.yaml is absent", () => {
    const result = resolveConfig({ repoRoot: root });
    expect(result.defaulted).toBe(true);
    expect(result.config_present).toBe(false);
    expect(result.root).toBe(DEFAULT_ROOT);
    expect(result.read_only).toEqual([]);
    expect(formatTemplateRef(result.template)).toBe("builtin/prd");
  });

  it("treats an empty .prd.yaml as defaulted but config_present", () => {
    writeFixtureFile(root, ".prd.yaml", "");
    const result = resolveConfig({ repoRoot: root });
    expect(result.defaulted).toBe(true);
    expect(result.config_present).toBe(true);
  });

  it("parses a full .prd.yaml", () => {
    writeFixtureFile(
      root,
      ".prd.yaml",
      [
        "root: product/prds",
        "template: builtin/prd@1",
        "read_only:",
        "  - legacy/",
        "  - old-auth.md",
      ].join("\n"),
    );
    const result = resolveConfig({ repoRoot: root });
    expect(result.defaulted).toBe(false);
    expect(result.root).toBe("product/prds");
    expect(result.template).toEqual({ scope: "builtin", name: "prd", version: "1" });
    expect(result.read_only).toEqual(["legacy/", "old-auth.md"]);
  });

  it("fills missing fields with defaults", () => {
    writeFixtureFile(root, ".prd.yaml", "root: custom/path\n");
    const result = resolveConfig({ repoRoot: root });
    expect(result.root).toBe("custom/path");
    expect(formatTemplateRef(result.template)).toBe("builtin/prd");
    expect(result.read_only).toEqual([]);
  });

  it("trims whitespace in root, template, and read_only entries", () => {
    writeFixtureFile(
      root,
      ".prd.yaml",
      ["root: '  spaced/path  '", "template: '  builtin/prd  '", "read_only:", "  - '  a/  '"].join(
        "\n",
      ),
    );
    const result = resolveConfig({ repoRoot: root });
    expect(result.root).toBe("spaced/path");
    expect(result.template.name).toBe("prd");
    expect(result.read_only).toEqual(["a/"]);
  });

  it("throws config_malformed on invalid YAML", () => {
    writeFixtureFile(root, ".prd.yaml", "root: : :\n  - broken\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/parse/i);
  });

  it("throws config_malformed when the top level is not a mapping", () => {
    writeFixtureFile(root, ".prd.yaml", "- list\n- not\n- map\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/mapping/i);
  });

  it("throws config_malformed when root is not a string", () => {
    writeFixtureFile(root, ".prd.yaml", "root: 42\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/root/);
  });

  it("throws config_malformed when read_only is not a list", () => {
    writeFixtureFile(root, ".prd.yaml", "read_only: 'legacy/'\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/read_only/);
  });

  it("throws config_malformed when a read_only entry is not a string", () => {
    writeFixtureFile(root, ".prd.yaml", "read_only:\n  - 42\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/read_only/);
  });

  it("throws template_ref_invalid on an unparseable template", () => {
    writeFixtureFile(root, ".prd.yaml", "template: not-namespaced\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/template ref/i);
  });

  it("rejects @version on a custom template", () => {
    writeFixtureFile(root, ".prd.yaml", "template: custom/mine@2\n");
    expect(() => resolveConfig({ repoRoot: root })).toThrowError(/custom/i);
  });
});

describe("parseTemplateRef", () => {
  it("parses builtin with version", () => {
    expect(parseTemplateRef("builtin/prd@1")).toEqual({
      scope: "builtin",
      name: "prd",
      version: "1",
    });
  });

  it("parses builtin without version", () => {
    expect(parseTemplateRef("builtin/prd")).toEqual({
      scope: "builtin",
      name: "prd",
      version: null,
    });
  });

  it("parses custom without version", () => {
    expect(parseTemplateRef("custom/my-bundle")).toEqual({
      scope: "custom",
      name: "my-bundle",
      version: null,
    });
  });

  it("accepts multi-segment semver", () => {
    expect(parseTemplateRef("builtin/prd@1.2.3").version).toBe("1.2.3");
  });

  it("rejects unknown scopes", () => {
    expect(() => parseTemplateRef("vendor/prd")).toThrow();
  });

  it("rejects bare names", () => {
    expect(() => parseTemplateRef("prd")).toThrow();
  });

  it("rejects empty input", () => {
    expect(() => parseTemplateRef("")).toThrow();
  });

  it("rejects custom with version", () => {
    expect(() => parseTemplateRef("custom/foo@1")).toThrow(/custom/i);
  });
});

describe("formatTemplateRef", () => {
  it("round-trips a parsed builtin ref", () => {
    const ref = parseTemplateRef("builtin/prd@2");
    expect(formatTemplateRef(ref)).toBe("builtin/prd@2");
  });

  it("omits the version when null", () => {
    const ref = parseTemplateRef("builtin/prd");
    expect(formatTemplateRef(ref)).toBe("builtin/prd");
  });
});
