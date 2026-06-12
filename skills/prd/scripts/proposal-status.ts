#!/usr/bin/env tsx
// proposal-status.ts
//
// Reads `<proposal-dir>/tasks.md` and reports task-state counts:
//   - total, done, pending, superseded (and the two superseded sub-counts).
//
// Usage:
//   npx tsx proposal-status.ts <proposal-dir>
//
// Errors:
//   missing_dir       — proposal directory does not exist
//   missing_tasks     — proposal directory exists but has no tasks.md

import { resolve, join } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, fileExists, readTextFile } from "./lib/fs.ts";
import { parseTasks, countTasks } from "./lib/tasks.ts";
import type { TaskCounts } from "./lib/types.ts";

export interface ProposalStatusOptions {
  proposalDir: string;
}

export interface ProposalStatusResult {
  proposal_dir: string;
  counts: TaskCounts;
}

export function proposalStatus(opts: ProposalStatusOptions): ProposalStatusResult {
  const dir = opts.proposalDir;
  if (!dirExists(dir)) {
    throw Object.assign(new Error(`Proposal directory does not exist: ${dir}`), {
      code: "missing_dir",
    });
  }
  const tasksPath = join(dir, "tasks.md");
  if (!fileExists(tasksPath)) {
    throw Object.assign(new Error(`Proposal has no tasks.md: ${tasksPath}`), {
      code: "missing_tasks",
    });
  }
  const tasks = parseTasks(readTextFile(tasksPath));
  return {
    proposal_dir: dir,
    counts: countTasks(tasks),
  };
}

function main(argv: string[]): void {
  const input = argv[2];
  if (!input) {
    failWith("usage", "Usage: proposal-status.ts <proposal-dir>");
  }
  try {
    emit(proposalStatus({ proposalDir: resolve(input) }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);
