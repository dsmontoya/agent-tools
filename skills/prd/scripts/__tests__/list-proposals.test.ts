import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listProposals } from "../list-proposals.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile, writeFixtureDir } from "./helpers.ts";
import { join } from "node:path";

describe("listProposals", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot();
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("returns empty arrays when changes/ does not exist", () => {
    writeFixtureDir(root, "docs/prds");
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.active).toEqual([]);
    expect(result.archived).toEqual([]);
  });

  it("throws missing_root when the corpus root is absent", () => {
    expect(() => listProposals({ root: join(root, "nope") })).toThrowError(/exist/i);
  });

  it("lists active proposals with task counts and presence flags", () => {
    writeFixtureFile(
      root,
      "docs/prds/changes/one/intent.md",
      "# Intent\n\nBecause reasons.\n",
    );
    writeFixtureFile(
      root,
      "docs/prds/changes/one/tasks.md",
      "- [ ] Pending\n- [x] Done\n",
    );
    writeFixtureFile(root, "docs/prds/changes/two/tasks.md", "- [ ] solo task\n");
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.active.length).toBe(2);
    const one = result.active.find((p) => p.slug === "one")!;
    expect(one.intent_present).toBe(true);
    expect(one.tasks_present).toBe(true);
    expect(one.research_present).toBe(false);
    expect(one.counts.pending).toBe(1);
    expect(one.counts.done).toBe(1);
    expect(one.archived).toBe(false);
    expect(one.archived_date).toBeNull();
  });

  it("skips the archive/ directory when listing active proposals", () => {
    writeFixtureFile(root, "docs/prds/changes/active/tasks.md", "- [ ] one\n");
    writeFixtureFile(
      root,
      "docs/prds/changes/archive/2026-06-01-old/tasks.md",
      "- [x] done\n",
    );
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.active.map((p) => p.slug)).toEqual(["active"]);
  });

  it("parses archive folder names into slug + date", () => {
    writeFixtureFile(
      root,
      "docs/prds/changes/archive/2026-06-04-user-onboarding/tasks.md",
      "- [x] done\n",
    );
    writeFixtureFile(
      root,
      "docs/prds/changes/archive/2026-05-12-billing-v2/intent.md",
      "# intent",
    );
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.archived.length).toBe(2);
    expect(result.archived[0]!.slug).toBe("user-onboarding");
    expect(result.archived[0]!.archived_date).toBe("2026-06-04");
    expect(result.archived[1]!.slug).toBe("billing-v2");
    expect(result.archived[1]!.archived_date).toBe("2026-05-12");
  });

  it("still lists archive folders that don't match the date pattern, with null date", () => {
    writeFixtureFile(root, "docs/prds/changes/archive/weird-name/intent.md", "# intent");
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.archived.length).toBe(1);
    expect(result.archived[0]!.slug).toBe("weird-name");
    expect(result.archived[0]!.archived_date).toBeNull();
  });

  it("includes a proposal with no tasks.md but reports zero counts and tasks_present=false", () => {
    writeFixtureFile(root, "docs/prds/changes/half/intent.md", "# intent");
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.active.length).toBe(1);
    expect(result.active[0]!.tasks_present).toBe(false);
    expect(result.active[0]!.counts.total).toBe(0);
  });

  it("sorts archived proposals by date descending", () => {
    writeFixtureFile(root, "docs/prds/changes/archive/2026-01-01-a/tasks.md", "");
    writeFixtureFile(root, "docs/prds/changes/archive/2026-03-15-b/tasks.md", "");
    writeFixtureFile(root, "docs/prds/changes/archive/2026-02-10-c/tasks.md", "");
    const result = listProposals({ root: join(root, "docs/prds") });
    expect(result.archived.map((p) => p.archived_date)).toEqual([
      "2026-03-15",
      "2026-02-10",
      "2026-01-01",
    ]);
  });
});
