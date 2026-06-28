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
//
// Tasks come in two shapes (SKILL_DESIGN.md §7.3):
//   Shape A — Inline:     "<...>: write: <content>"   (or any non-transclude body)
//   Shape B — Transclude: "<...>: transclude <ref>#<anchor>"
//                         "<...>: re-transclude <ref>#<anchor>"
// classifyTaskShape() inspects a parsed body and returns the shape kind
// plus, for Shape B, the resolved source file and anchor.

import type { TaskCounts } from "./types.ts";

const TASK_LINE = /^[ \t]*[-*+] \[([ xX])\] (.+)$/;
const STRIKETHROUGH = /^~~(.+)~~$/;

// Matches: "transclude intent.md#anchor" or "re-transclude intent.md#anchor"
// anywhere in the task body. Captures the source path and anchor slug.
// The why-note (em dash + reason) is allowed after the reference and is
// captured separately when present.
const TRANSCLUDE_REF = /\b((?:re-?)?transclude)\s+([^\s#]+)#([^\s—]+)/i;
const WHY_NOTE = /—\s*(.+?)$/;

export interface ParsedTask {
  raw: string;
  body: string;
  checked: boolean;
  superseded: boolean;
}

export type TaskShape =
  | { kind: "inline"; whyNote?: string }
  | {
      kind: "transclude";
      source: string;
      anchor: string;
      reTransclude: boolean;
      whyNote?: string;
    };

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

// Inspect a task's body text and classify it as Shape A inline or
// Shape B transclude. The body is the value of ParsedTask.body — i.e.,
// already trimmed and with the strikethrough markers (if any) stripped.
export function classifyTaskShape(body: string): TaskShape {
  const transcludeMatch = TRANSCLUDE_REF.exec(body);
  if (transcludeMatch) {
    const [, verb, source, anchor] = transcludeMatch;
    const tail = body.slice(transcludeMatch.index + transcludeMatch[0]!.length);
    const whyMatch = WHY_NOTE.exec(tail);
    return {
      kind: "transclude",
      source: source!,
      anchor: anchor!,
      reTransclude: /^re/i.test(verb!),
      whyNote: whyMatch ? whyMatch[1]!.trim() : undefined,
    };
  }
  const whyMatch = WHY_NOTE.exec(body);
  return {
    kind: "inline",
    whyNote: whyMatch ? whyMatch[1]!.trim() : undefined,
  };
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
