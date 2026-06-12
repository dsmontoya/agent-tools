// Parsing for tasks.md task lines.
//
// Recognized syntax (markdown checkbox lists):
//   - [ ] body      → pending (apply targets these)
//   - [x] body      → done
//   - [ ] ~~body~~  → pending-superseded
//   - [x] ~~body~~  → applied-superseded
//
// Indentation and "*" / "-" / "+" bullets are accepted; the checkbox part
// is what matters. Non-task lines are ignored.

import type { TaskCounts } from "./types.ts";

const TASK_LINE = /^[ \t]*[-*+] \[([ xX])\] (.+)$/;
const STRIKETHROUGH = /^~~(.+)~~$/;

export interface ParsedTask {
  raw: string;
  body: string;
  checked: boolean;
  superseded: boolean;
}

export function parseTasks(content: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  for (const line of content.split(/\r?\n/)) {
    const match = TASK_LINE.exec(line);
    if (!match) continue;
    const [, box, body] = match;
    const trimmedBody = body!.trim();
    const struck = STRIKETHROUGH.exec(trimmedBody);
    tasks.push({
      raw: line,
      body: struck ? struck[1]!.trim() : trimmedBody,
      checked: box === "x" || box === "X",
      superseded: Boolean(struck),
    });
  }
  return tasks;
}

export function countTasks(tasks: ParsedTask[]): TaskCounts {
  let done = 0;
  let pending = 0;
  let appliedSuperseded = 0;
  let pendingSuperseded = 0;
  for (const t of tasks) {
    if (t.superseded) {
      if (t.checked) appliedSuperseded++;
      else pendingSuperseded++;
    } else {
      if (t.checked) done++;
      else pending++;
    }
  }
  return {
    total: tasks.length,
    done,
    pending,
    superseded: appliedSuperseded + pendingSuperseded,
    applied_superseded: appliedSuperseded,
    pending_superseded: pendingSuperseded,
  };
}
