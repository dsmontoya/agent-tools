import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listCorpus } from "../list-corpus.ts";
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

describe("listCorpus", () => {
  let root: string;
  let bundleDir: string;
  beforeEach(() => {
    root = makeTempRoot();
    bundleDir = setupBundle(root);
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("throws missing_root when corpus root is absent", () => {
    expect(() => listCorpus({ corpusRoot: join(root, "nope"), bundleDir })).toThrowError(/exist/i);
  });

  it("throws bundle_invalid when the bundle cannot load", () => {
    expect(() =>
      listCorpus({ corpusRoot: root, bundleDir: join(root, "missing-bundle") }),
    ).toThrowError();
  });

  it("reports singletons as not-present when missing", () => {
    writeFixtureFile(root, "docs/prds/.keep", "");
    const result = listCorpus({ corpusRoot: join(root, "docs/prds"), bundleDir });
    const glossary = result.entries.find((e) => e.artifact_id === "glossary")!;
    expect(glossary.present).toBe(false);
    expect(glossary.slug).toBeNull();
  });

  it("reports singletons as present when their file exists", () => {
    writeFixtureFile(root, "docs/prds/glossary.md", "# Glossary");
    writeFixtureFile(root, "docs/prds/personas.md", "# Personas");
    const result = listCorpus({ corpusRoot: join(root, "docs/prds"), bundleDir });
    expect(result.entries.find((e) => e.artifact_id === "glossary")!.present).toBe(true);
    expect(result.entries.find((e) => e.artifact_id === "personas")!.present).toBe(true);
  });

  it("lists per-instance PRDs by their slug", () => {
    writeFixtureFile(root, "docs/prds/onboarding.md", "# PRD");
    writeFixtureFile(root, "docs/prds/billing.md", "# PRD");
    writeFixtureFile(root, "docs/prds/glossary.md", "# Glossary");
    const result = listCorpus({ corpusRoot: join(root, "docs/prds"), bundleDir });
    const prds = result.entries.filter((e) => e.artifact_id === "prd");
    expect(prds.map((p) => p.slug).sort()).toEqual(["billing", "onboarding"]);
  });

  it("ignores singleton files as PRD per-instance matches", () => {
    writeFixtureFile(root, "docs/prds/onboarding.md", "# PRD");
    writeFixtureFile(root, "docs/prds/glossary.md", "# Glossary");
    writeFixtureFile(root, "docs/prds/personas.md", "# Personas");
    const result = listCorpus({ corpusRoot: join(root, "docs/prds"), bundleDir });
    const prdSlugs = result.entries
      .filter((e) => e.artifact_id === "prd")
      .map((p) => p.slug)
      .sort();
    expect(prdSlugs).toEqual(["onboarding"]);
    expect(result.entries.find((e) => e.artifact_id === "glossary")!.present).toBe(true);
    expect(result.entries.find((e) => e.artifact_id === "personas")!.present).toBe(true);
  });

  it("skips the changes/ directory when scanning per-instance artifacts", () => {
    writeFixtureFile(root, "docs/prds/onboarding.md", "# PRD");
    writeFixtureFile(root, "docs/prds/changes/inflight/intent.md", "# intent");
    writeFixtureFile(root, "docs/prds/changes/inflight/tasks.md", "- [ ] t");
    const result = listCorpus({ corpusRoot: join(root, "docs/prds"), bundleDir });
    const prds = result.entries.filter((e) => e.artifact_id === "prd").map((p) => p.slug);
    expect(prds).toContain("onboarding");
    expect(prds).not.toContain("inflight");
  });

  it("supports nested path_patterns", () => {
    const nestedConfig = BUNDLE_CONFIG.replace('"{slug}.md"', '"prds/{slug}.md"');
    writeFixtureFile(bundleDir, "config.yaml", nestedConfig);
    writeFixtureFile(root, "docs/area/prds/onboarding.md", "# PRD");
    writeFixtureFile(root, "docs/area/glossary.md", "# Glossary");
    const result = listCorpus({ corpusRoot: join(root, "docs/area"), bundleDir });
    const prds = result.entries.filter((e) => e.artifact_id === "prd");
    expect(prds.length).toBe(1);
    expect(prds[0]!.slug).toBe("onboarding");
  });
});
