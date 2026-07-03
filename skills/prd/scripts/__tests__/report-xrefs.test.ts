import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { reportXrefs } from "../report-xrefs.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";
import { join } from "node:path";

const BUNDLE_CONFIG = [
  "name: prd",
  "version: 1.0.0",
  "artifacts:",
  "  prd:",
  "    template: prd.md",
  "    storage: per_instance",
  '    path_pattern: "{slug}.md"',
  "    roles:",
  '      problem: "P"',
  '      users: "U"',
  '      success: "S"',
  '      capability: "C"',
  "  glossary:",
  "    template: glossary.md",
  "    storage: singleton",
  "    path: glossary.md",
  "  personas:",
  "    template: personas.md",
  "    storage: singleton",
  "    path: personas.md",
].join("\n");

const PRD_TEMPLATE = "# PRD\n\n## P\n## U\n## S\n## C\n";

function setupBundle(root: string): string {
  const bundleDir = join(root, "templates/builtin/prd/v1");
  writeFixtureFile(bundleDir, "config.yaml", BUNDLE_CONFIG);
  writeFixtureFile(bundleDir, "prd.md", PRD_TEMPLATE);
  writeFixtureFile(bundleDir, "glossary.md", "# Glossary");
  writeFixtureFile(bundleDir, "personas.md", "# Personas");
  return bundleDir;
}

describe("reportXrefs", () => {
  let root: string;
  let bundleDir: string;
  let corpusRoot: string;
  beforeEach(() => {
    root = makeTempRoot();
    bundleDir = setupBundle(root);
    corpusRoot = join(root, "docs/prds");
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("throws missing_root when corpus root does not exist", () => {
    expect(() =>
      reportXrefs({ corpusRoot: join(root, "no-such-dir"), bundleDir }),
    ).toThrowError(/exist/i);
  });

  it("throws bundle_invalid when the bundle cannot load", () => {
    writeFixtureFile(root, "docs/prds/.keep", "");
    expect(() =>
      reportXrefs({ corpusRoot, bundleDir: join(root, "missing-bundle") }),
    ).toThrowError();
  });

  it("reports zero broken on a clean corpus", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\n## Users\n\nSee [glossary](./glossary.md) and [personas](./personas.md).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_broken).toBe(0);
    expect(result.broken).toEqual([]);
    expect(result.files_scanned).toBe(3);
    expect(result.files_missing).toEqual([]);
    expect(result.total_refs).toBe(2);
  });

  it("flags a missing file with reason file_missing", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\nSee [billing](./billing.md).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_broken).toBe(1);
    expect(result.broken[0]).toMatchObject({
      source: "auth.md",
      reason: "file_missing",
      url: "./billing.md",
    });
  });

  it("flags a bad anchor with reason anchor_missing", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary\n\n## Term A");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\nSee [term](./glossary.md#nonexistent).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_broken).toBe(1);
    expect(result.broken[0]).toMatchObject({
      source: "auth.md",
      reason: "anchor_missing",
      url: "./glossary.md#nonexistent",
    });
  });

  it("skips external links entirely (not counted in refs or broken)", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\nSee [docs](https://example.com) and [mail](mailto:a@b.com).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_refs).toBe(0);
    expect(result.total_broken).toBe(0);
    const authRow = result.per_file.find((f) => f.path === "auth.md")!;
    expect(authRow.refs).toBe(0);
  });

  it("lists absent singletons in files_missing and does not scan them", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    // personas.md intentionally absent
    writeFixtureFile(corpusRoot, "auth.md", "# Auth\n\nSee [glossary](./glossary.md).");
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.files_missing).toEqual(["personas.md"]);
    expect(result.files_scanned).toBe(2);
    expect(result.total_broken).toBe(0);
  });

  it("reports zero-scan on an empty corpus (both singletons absent, no PRDs)", () => {
    writeFixtureFile(corpusRoot, ".keep", "");
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.files_scanned).toBe(0);
    expect(result.files_missing.sort()).toEqual(["glossary.md", "personas.md"]);
    expect(result.total_refs).toBe(0);
    expect(result.total_broken).toBe(0);
    expect(result.broken).toEqual([]);
  });

  it("reports the same broken target once per source occurrence", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\nSee [x](./missing.md) then [x again](./missing.md).",
    );
    writeFixtureFile(
      corpusRoot,
      "billing.md",
      "# Billing\n\nAlso [x](./missing.md).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_broken).toBe(3);
    const sources = result.broken.map((b) => b.source).sort();
    expect(sources).toEqual(["auth.md", "auth.md", "billing.md"]);
  });

  it("flags a broken same-file anchor", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "auth.md",
      "# Auth\n\n## Users\n\nSee [nope](#does-not-exist).",
    );
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.total_broken).toBe(1);
    expect(result.broken[0]).toMatchObject({
      source: "auth.md",
      reason: "anchor_missing",
      url: "#does-not-exist",
    });
  });

  it("sorts broken entries by source then line", () => {
    writeFixtureFile(corpusRoot, "glossary.md", "# Glossary");
    writeFixtureFile(corpusRoot, "personas.md", "# Personas");
    writeFixtureFile(
      corpusRoot,
      "billing.md",
      "line1\nline2 [x](./missing.md)\nline3 [y](./missing.md)",
    );
    writeFixtureFile(corpusRoot, "auth.md", "# Auth\n[z](./missing.md)\n");
    const result = reportXrefs({ corpusRoot, bundleDir });
    expect(result.broken.map((b) => `${b.source}:${b.line}`)).toEqual([
      "auth.md:2",
      "billing.md:2",
      "billing.md:3",
    ]);
  });
});
