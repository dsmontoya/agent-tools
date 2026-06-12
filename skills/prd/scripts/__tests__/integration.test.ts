// Cross-script integration tests — exercise the scripts in sequence
// against fixture corpora, plus a lifecycle simulation that walks the
// propose → apply → archive transitions via filesystem operations.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { renameSync, readFileSync, writeFileSync } from "node:fs";
import { listCorpus } from "../list-corpus.ts";
import { resolveXref } from "../resolve-xref.ts";
import { validateTemplate } from "../validate-template.ts";
import { listProposals } from "../list-proposals.ts";
import { proposalStatus } from "../proposal-status.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(TESTS_DIR, "fixtures");
const BUNDLE_DIR = resolve(TESTS_DIR, "../../references/templates/builtin/prd/v1");

const CORPUS_GOOD = join(FIXTURES_DIR, "corpus-good");
const CORPUS_BROKEN_XREF = join(FIXTURES_DIR, "corpus-broken-xref");

describe("builtin bundle", () => {
  it("validates clean", () => {
    const result = validateTemplate({ bundleDir: BUNDLE_DIR });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("corpus-good", () => {
  it("enumerates two PRDs and two singletons", () => {
    const result = listCorpus({ corpusRoot: CORPUS_GOOD, bundleDir: BUNDLE_DIR });
    const prds = result.entries.filter((e) => e.artifact_id === "prd");
    const glossary = result.entries.find((e) => e.artifact_id === "glossary");
    const personas = result.entries.find((e) => e.artifact_id === "personas");

    expect(prds.map((p) => p.slug).sort()).toEqual(["billing", "onboarding"]);
    expect(glossary?.present).toBe(true);
    expect(personas?.present).toBe(true);
  });

  it("resolves the cross-reference from onboarding.md to billing.md", () => {
    const result = resolveXref({ source: join(CORPUS_GOOD, "onboarding.md") });
    const refs = result.references.filter((r) => !r.external);
    expect(refs.length).toBe(1);
    expect(refs[0]!.ok).toBe(true);
    expect(refs[0]!.anchor_exists).toBe(true);
    expect(refs[0]!.anchor).toBe("3-goals-and-objectives");
  });

  it("billing.md has no outbound references", () => {
    const result = resolveXref({ source: join(CORPUS_GOOD, "billing.md") });
    expect(result.references).toEqual([]);
  });
});

describe("corpus-broken-xref", () => {
  it("enumerates the same shape as corpus-good — corpus shape is not xref-aware", () => {
    const result = listCorpus({ corpusRoot: CORPUS_BROKEN_XREF, bundleDir: BUNDLE_DIR });
    const prds = result.entries.filter((e) => e.artifact_id === "prd");
    expect(prds.map((p) => p.slug).sort()).toEqual(["billing", "onboarding"]);
  });

  it("flags the broken anchor in onboarding.md", () => {
    const result = resolveXref({ source: join(CORPUS_BROKEN_XREF, "onboarding.md") });
    const refs = result.references.filter((r) => !r.external);
    expect(refs.length).toBe(1);
    expect(refs[0]!.file_exists).toBe(true);
    expect(refs[0]!.anchor_exists).toBe(false);
    expect(refs[0]!.ok).toBe(false);
    expect(refs[0]!.anchor).toBe("nonexistent-section");
  });
});

describe("lifecycle simulation: propose → apply → archive", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot("prd-lifecycle-");
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("walks an active proposal through the three states", () => {
    const slug = "session-timeout";
    const proposalDir = join(root, "changes", slug);
    const tasksPath = join(proposalDir, "tasks.md");
    writeFixtureFile(proposalDir, "intent.md", "# Intent\n\nLengthen session timeout.\n");
    writeFixtureFile(
      proposalDir,
      "tasks.md",
      [
        "# Tasks",
        "",
        "- [ ] Section 7.2: change session timeout from 30min to 60min",
        "- [ ] Section 7.2: add note about idle vs absolute timeout",
        "",
      ].join("\n"),
    );

    // State 1 — draft
    {
      const listing = listProposals({ root });
      expect(listing.active.map((p) => p.slug)).toEqual([slug]);
      expect(listing.archived).toEqual([]);
      const status = proposalStatus({ proposalDir });
      expect(status.counts.total).toBe(2);
      expect(status.counts.done).toBe(0);
      expect(status.counts.pending).toBe(2);
    }

    // Simulate apply marking the first task done.
    writeFileSync(
      tasksPath,
      readFileSync(tasksPath, "utf8").replace(
        "- [ ] Section 7.2: change session timeout from 30min to 60min",
        "- [x] Section 7.2: change session timeout from 30min to 60min",
      ),
      "utf8",
    );

    // State 2 — partially applied
    {
      const status = proposalStatus({ proposalDir });
      expect(status.counts.done).toBe(1);
      expect(status.counts.pending).toBe(1);
    }

    // Simulate apply marking the second task done — fully applied.
    writeFileSync(
      tasksPath,
      readFileSync(tasksPath, "utf8").replace(
        "- [ ] Section 7.2: add note about idle vs absolute timeout",
        "- [x] Section 7.2: add note about idle vs absolute timeout",
      ),
      "utf8",
    );

    // State 3 — fully applied, still active (archive hasn't run yet)
    {
      const status = proposalStatus({ proposalDir });
      expect(status.counts.pending).toBe(0);
      expect(status.counts.done).toBe(2);
      const listing = listProposals({ root });
      expect(listing.active.map((p) => p.slug)).toEqual([slug]);
    }

    // Simulate archive — folder move.
    const archiveDate = "2026-06-11";
    const archived = join(root, "changes", "archive", `${archiveDate}-${slug}`);
    writeFixtureFile(join(root, "changes", "archive"), ".keep", "");
    renameSync(proposalDir, archived);

    // State 4 — archived
    {
      const listing = listProposals({ root });
      expect(listing.active).toEqual([]);
      expect(listing.archived.map((p) => p.slug)).toEqual([slug]);
      expect(listing.archived[0]!.archived_date).toBe(archiveDate);
    }
  });

  it("idempotent apply: re-running on an unchanged proposal is a no-op", () => {
    const slug = "rename-button";
    const proposalDir = join(root, "changes", slug);
    writeFixtureFile(proposalDir, "intent.md", "# Intent\n\nRename Save → Submit.\n");
    writeFixtureFile(
      proposalDir,
      "tasks.md",
      ["# Tasks", "", "- [x] Section 6.1: rename button label Save → Submit", ""].join("\n"),
    );

    const before = proposalStatus({ proposalDir });
    expect(before.counts.pending).toBe(0);
    expect(before.counts.done).toBe(1);

    // Re-reading produces the same counts — there's nothing for apply to do.
    const after = proposalStatus({ proposalDir });
    expect(after.counts).toEqual(before.counts);
  });

  it("strikethrough rule: superseded tasks are counted separately from pending", () => {
    const slug = "timeout-revision";
    const proposalDir = join(root, "changes", slug);
    writeFixtureFile(proposalDir, "intent.md", "# Intent\n");
    writeFixtureFile(
      proposalDir,
      "tasks.md",
      [
        "# Tasks",
        "",
        "- [x] ~~Section 7.2: change session timeout from 30min to 45min~~",
        "- [ ] Section 7.2: change session timeout from 30min to 60min",
        "",
      ].join("\n"),
    );

    const status = proposalStatus({ proposalDir });
    expect(status.counts.applied_superseded).toBe(1);
    expect(status.counts.pending).toBe(1);
  });
});
