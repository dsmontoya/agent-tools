import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { proposalStatus } from "../proposal-status.ts";
import { parseTasks, countTasks } from "../lib/tasks.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile, writeFixtureDir } from "./helpers.ts";
import { join } from "node:path";

describe("parseTasks", () => {
  it("identifies pending, done, and superseded tasks", () => {
    const content = [
      "# Tasks",
      "",
      "- [ ] Pending one",
      "- [x] Done one",
      "- [x] ~~Applied then superseded~~",
      "- [ ] ~~Pre-apply superseded~~",
      "",
      "Some prose",
      "- not a task line",
    ].join("\n");
    const tasks = parseTasks(content);
    expect(tasks.length).toBe(4);
    expect(tasks[0]).toMatchObject({ checked: false, superseded: false, body: "Pending one" });
    expect(tasks[1]).toMatchObject({ checked: true, superseded: false, body: "Done one" });
    expect(tasks[2]).toMatchObject({
      checked: true,
      superseded: true,
      body: "Applied then superseded",
    });
    expect(tasks[3]).toMatchObject({
      checked: false,
      superseded: true,
      body: "Pre-apply superseded",
    });
  });

  it("handles indented and *-bulleted tasks", () => {
    const content = ["  - [ ] indented dash", "* [x] star bullet", "+ [ ] plus bullet"].join("\n");
    const tasks = parseTasks(content);
    expect(tasks.length).toBe(3);
  });

  it("accepts upper-case [X] as checked", () => {
    expect(parseTasks("- [X] done")[0]).toMatchObject({ checked: true });
  });

  it("returns an empty list for content with no task lines", () => {
    expect(parseTasks("# Title\n\nNo tasks here.\n")).toEqual([]);
  });
});

describe("countTasks", () => {
  it("aggregates the four states", () => {
    const tasks = parseTasks(
      [
        "- [ ] a",
        "- [ ] b",
        "- [x] c",
        "- [x] ~~d~~",
        "- [ ] ~~e~~",
      ].join("\n"),
    );
    expect(countTasks(tasks)).toEqual({
      total: 5,
      done: 1,
      pending: 2,
      superseded: 2,
      applied_superseded: 1,
      pending_superseded: 1,
    });
  });

  it("zeros all counts for empty input", () => {
    expect(countTasks([])).toEqual({
      total: 0,
      done: 0,
      pending: 0,
      superseded: 0,
      applied_superseded: 0,
      pending_superseded: 0,
    });
  });
});

describe("proposalStatus", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot();
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("returns counts for a typical proposal", () => {
    writeFixtureFile(
      root,
      "tasks.md",
      ["# Tasks", "- [ ] Pending", "- [x] Done"].join("\n"),
    );
    const result = proposalStatus({ proposalDir: root });
    expect(result.counts.total).toBe(2);
    expect(result.counts.pending).toBe(1);
    expect(result.counts.done).toBe(1);
  });

  it("throws missing_dir when the directory is absent", () => {
    expect(() => proposalStatus({ proposalDir: join(root, "nope") })).toThrowError(/exist/i);
  });

  it("throws missing_tasks when tasks.md is absent", () => {
    writeFixtureDir(root, "changes/foo");
    expect(() => proposalStatus({ proposalDir: join(root, "changes/foo") })).toThrowError(
      /tasks\.md/i,
    );
  });

  it("returns zeros for an empty tasks.md", () => {
    writeFixtureFile(root, "tasks.md", "");
    const result = proposalStatus({ proposalDir: root });
    expect(result.counts.total).toBe(0);
  });
});
