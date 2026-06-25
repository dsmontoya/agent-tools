import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { comparePrdStructure } from "../compare-prd-structure.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";

const PRD_TEMPLATE = [
  "# PRD",
  "",
  "## 1. Context",
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
  "",
  "## 12. Appendices",
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
].join("\n");

function writeBundle(bundleDir: string, opts?: { template?: string; config?: string }) {
  writeFixtureFile(bundleDir, "config.yaml", opts?.config ?? FULL_CONFIG);
  writeFixtureFile(bundleDir, "prd.md", opts?.template ?? PRD_TEMPLATE);
}

function prd(sections: string[]): string {
  return ["# Feature PRD", "", ...sections].join("\n");
}

describe("comparePrdStructure", () => {
  let root: string;
  let bundleDir: string;
  let prdPath: string;
  beforeEach(() => {
    root = makeTempRoot();
    bundleDir = join(root, "bundle");
    prdPath = join(root, "feature.md");
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  describe("preconditions", () => {
    it("throws prd_not_found when the PRD path doesn't exist", () => {
      writeBundle(bundleDir);
      expect(() => comparePrdStructure({ prdPath, bundleDir })).toThrowError(
        /PRD file does not exist/,
      );
    });

    it("throws bundle_not_found when the bundle directory doesn't exist", () => {
      writeFixtureFile(root, "feature.md", prd(["## 2. Problem"]));
      expect(() =>
        comparePrdStructure({ prdPath, bundleDir: join(root, "no-bundle") }),
      ).toThrowError(/Bundle directory does not exist/);
    });

    it("throws bundle_unloadable when config.yaml is missing", () => {
      writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
      writeFixtureFile(root, "feature.md", prd(["## 2. Problem"]));
      expect(() => comparePrdStructure({ prdPath, bundleDir })).toThrowError(
        /config\.yaml not found/,
      );
    });

    it("throws no_prd_artifact when the bundle has no per_instance artifact with roles", () => {
      writeFixtureFile(
        bundleDir,
        "config.yaml",
        ["name: prd", "version: 1.0.0", "artifacts:", "  glossary:", "    template: g.md", "    storage: singleton", "    path: g.md"].join("\n"),
      );
      writeFixtureFile(bundleDir, "g.md", "# G");
      writeFixtureFile(root, "feature.md", prd(["## 2. Problem"]));
      try {
        comparePrdStructure({ prdPath, bundleDir });
        expect.fail("expected throw");
      } catch (e) {
        expect((e as Error & { code: string }).code).toBe("no_prd_artifact");
      }
    });

    it("throws template_missing when the PRD artifact's template file is absent", () => {
      writeFixtureFile(bundleDir, "config.yaml", FULL_CONFIG);
      writeFixtureFile(root, "feature.md", prd(["## 2. Problem"]));
      try {
        comparePrdStructure({ prdPath, bundleDir });
        expect.fail("expected throw");
      } catch (e) {
        expect((e as Error & { code: string }).code).toBe("template_missing");
      }
    });
  });

  describe("required-section findings", () => {
    it("flags a missing required (load-bearing) section as CRITICAL", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 1. Context",
          "Background.",
          "## 2. Problem",
          "Pain.",
          "## 3.2 Success",
          "Metric.",
          // 5. Users omitted
          "## 6. Capability",
          "Cap.",
          "## 8. Constraints",
          "C.",
          "## 10. Risks",
          "R.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const critical = result.findings.filter((f) => f.tier === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0]!.code).toBe("required_section_missing");
      expect(critical[0]!.role).toBe("users");
    });

    it("flags an N/A required section as WARNING", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "Pain.",
          "## 3.2 Success",
          "Metric.",
          "## 5. Users",
          "N/A — single internal user only",
          "## 6. Capability",
          "Cap.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const warning = result.findings.find(
        (f) => f.code === "required_section_na" && f.role === "users",
      );
      expect(warning?.tier).toBe("warning");
    });

    it("flags a TODO required section as WARNING", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "Pain.",
          "## 3.2 Success",
          "TODO — needs metric definition",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const warning = result.findings.find(
        (f) => f.code === "required_section_todo" && f.role === "success",
      );
      expect(warning?.tier).toBe("warning");
    });

    it("does not flag a required section that has real content", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "Specific user pain described in detail.",
          "## 3.2 Success",
          "Specific metric.",
          "## 5. Users",
          "Specific persona.",
          "## 6. Capability",
          "Specific capability.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const aboutRequired = result.findings.filter(
        (f) => f.code?.startsWith("required_section_"),
      );
      expect(aboutRequired).toEqual([]);
    });
  });

  describe("soft-role findings", () => {
    it("flags a missing soft-role section as WARNING", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "P.",
          "## 3.2 Success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          // 8. Constraints + 10. Risks both missing
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const softMissing = result.findings.filter((f) => f.code === "soft_section_missing");
      expect(softMissing.map((f) => f.role).sort()).toEqual(["constraints", "risks"]);
      expect(softMissing.every((f) => f.tier === "warning")).toBe(true);
    });

    it("downgrades N/A soft-role section to SUGGESTION", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "P.",
          "## 3.2 Success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          "## 8. Constraints",
          "N/A — no known constraints",
          "## 10. Risks",
          "Risks listed here.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const finding = result.findings.find(
        (f) => f.code === "soft_section_na" && f.role === "constraints",
      );
      expect(finding?.tier).toBe("suggestion");
    });
  });

  describe("optional and unknown sections", () => {
    it("flags optional template sections missing from the PRD as SUGGESTION", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "P.",
          "## 3.2 Success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          "## 8. Constraints",
          "Some.",
          "## 10. Risks",
          "Some.",
          // 1. Context + 12. Appendices both omitted
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const optionalMissing = result.findings.filter(
        (f) => f.code === "optional_section_missing",
      );
      const sections = optionalMissing.map((f) => f.section);
      expect(sections).toContain("1. Context");
      expect(sections).toContain("12. Appendices");
      expect(optionalMissing.every((f) => f.tier === "suggestion")).toBe(true);
    });

    it("flags PRD sections with no counterpart in the template as SUGGESTION", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2. Problem",
          "P.",
          "## 3.2 Success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          "## 8. Constraints",
          "C.",
          "## 10. Risks",
          "R.",
          "## 99. Legacy Notes",
          "Old prose.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const unknown = result.findings.find(
        (f) => f.code === "prd_section_unknown_to_template" && f.section === "99. Legacy Notes",
      );
      expect(unknown?.tier).toBe("suggestion");
    });
  });

  describe("metadata and matching", () => {
    it("reports bundle name and version from config.yaml", () => {
      writeBundle(bundleDir);
      writeFixtureFile(root, "feature.md", prd(["## 2. Problem", "P."]));
      const result = comparePrdStructure({ prdPath, bundleDir });
      expect(result.bundle).toBe("prd");
      expect(result.bundle_version).toBe("1.0.0");
    });

    it("matches headings case-insensitively and tolerates whitespace differences", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 2.   PROBLEM",
          "P.",
          "## 3.2 success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          "## 8. Constraints",
          "C.",
          "## 10. Risks",
          "R.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      const requiredFindings = result.findings.filter((f) =>
        f.code?.startsWith("required_section_"),
      );
      expect(requiredFindings).toEqual([]);
    });

    it("returns no critical findings when the PRD matches the template exactly", () => {
      writeBundle(bundleDir);
      writeFixtureFile(
        root,
        "feature.md",
        prd([
          "## 1. Context",
          "C.",
          "## 2. Problem",
          "P.",
          "## 3.2 Success",
          "S.",
          "## 5. Users",
          "U.",
          "## 6. Capability",
          "C.",
          "## 8. Constraints",
          "C.",
          "## 10. Risks",
          "R.",
          "## 12. Appendices",
          "A.",
        ]),
      );
      const result = comparePrdStructure({ prdPath, bundleDir });
      expect(result.findings.filter((f) => f.tier === "critical")).toEqual([]);
      expect(result.findings.filter((f) => f.tier === "warning")).toEqual([]);
    });
  });
});
