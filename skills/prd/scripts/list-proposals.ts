#!/usr/bin/env tsx
// list-proposals.ts
//
// Lists active and archived proposals under <root>/changes/.
//   Active:   <root>/changes/<slug>/
//   Archived: <root>/changes/archive/<YYYY-MM-DD>-<slug>/
//
// Usage:
//   npx tsx list-proposals.ts <root>
//
// <root> is the corpus root (default `docs/prds`; see resolve-config.ts).
//
// Output: ok with { active: ProposalSummary[], archived: ProposalSummary[] }.
// Each summary includes the artifact-present flags so callers don't have
// to re-stat the directory.

import { resolve, join, basename } from "node:path";
import { emit, failWith } from "./lib/cli.ts";
import { dirExists, fileExists, listDirs, lastMtimeIso } from "./lib/fs.ts";
import { parseTasks, countTasks } from "./lib/tasks.ts";
import { readFileSync } from "node:fs";
import type { ProposalSummary, TaskCounts } from "./lib/types.ts";

const ARCHIVE_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

export interface ListProposalsOptions {
  root: string;
}

export interface ListProposalsResult {
  root: string;
  changes_dir: string;
  archive_dir: string;
  active: ProposalSummary[];
  archived: ProposalSummary[];
}

export function listProposals(opts: ListProposalsOptions): ListProposalsResult {
  if (!dirExists(opts.root)) {
    throw Object.assign(new Error(`Corpus root does not exist: ${opts.root}`), {
      code: "missing_root",
    });
  }

  const changesDir = join(opts.root, "changes");
  const archiveDir = join(changesDir, "archive");

  const active: ProposalSummary[] = [];
  const archived: ProposalSummary[] = [];

  if (dirExists(changesDir)) {
    for (const dirName of listDirs(changesDir)) {
      if (dirName === "archive") continue;
      const proposalDir = join(changesDir, dirName);
      active.push(summarize(proposalDir, dirName, false, null));
    }
  }

  if (dirExists(archiveDir)) {
    for (const dirName of listDirs(archiveDir)) {
      const proposalDir = join(archiveDir, dirName);
      const m = ARCHIVE_DATE_PATTERN.exec(dirName);
      if (m) {
        archived.push(summarize(proposalDir, m[2]!, true, m[1]!));
      } else {
        // Unrecognized archive folder name — still listed, with null date.
        archived.push(summarize(proposalDir, dirName, true, null));
      }
    }
  }

  active.sort(byLastTouchedDesc);
  archived.sort(byArchivedDateDesc);

  return {
    root: opts.root,
    changes_dir: changesDir,
    archive_dir: archiveDir,
    active,
    archived,
  };
}

function summarize(
  dir: string,
  slug: string,
  isArchived: boolean,
  archivedDate: string | null,
): ProposalSummary {
  const tasksPath = join(dir, "tasks.md");
  const intentPath = join(dir, "intent.md");
  const researchPath = join(dir, "research.md");
  const tasksPresent = fileExists(tasksPath);
  const counts: TaskCounts = tasksPresent
    ? countTasks(parseTasks(readFileSync(tasksPath, "utf8")))
    : {
        total: 0,
        done: 0,
        pending: 0,
        superseded: 0,
        applied_superseded: 0,
        pending_superseded: 0,
      };
  return {
    slug,
    path: dir,
    archived: isArchived,
    archived_date: archivedDate,
    last_touched: lastMtimeIso(dir),
    intent_present: fileExists(intentPath),
    tasks_present: tasksPresent,
    research_present: fileExists(researchPath),
    counts,
  };
}

function byLastTouchedDesc(a: ProposalSummary, b: ProposalSummary): number {
  return b.last_touched.localeCompare(a.last_touched);
}

function byArchivedDateDesc(a: ProposalSummary, b: ProposalSummary): number {
  const ad = a.archived_date ?? "";
  const bd = b.archived_date ?? "";
  if (ad !== bd) return bd.localeCompare(ad);
  return b.slug.localeCompare(a.slug);
}

function main(argv: string[]): void {
  const input = argv[2];
  if (!input) failWith("usage", "Usage: list-proposals.ts <root>");
  try {
    emit(listProposals({ root: resolve(input) }));
  } catch (e) {
    const err = e as Error & { code?: string };
    failWith(err.code ?? "unknown", err.message);
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv);

// Re-export for callers that want to compose without spawning a subprocess.
export { basename };
