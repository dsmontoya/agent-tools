// Shared CLI helpers — JSON output envelope, exit codes, stderr logging.
// Scripts use these so callers get a uniform shape regardless of which
// script was invoked. See lib/types.ts for ScriptResult.

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import type { ScriptResult, ScriptError } from "./types.ts";

export function emit<T>(data: T): void {
  const result: ScriptResult<T> = { ok: true, data };
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(0);
}

export function fail(error: ScriptError): never {
  const result: ScriptResult<never> = { ok: false, error };
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(1);
}

export function failWith(code: string, message: string, detail?: unknown): never {
  fail({ code, message, detail });
}

// Build a ScriptResult without writing or exiting — for use in tests and
// for scripts that want to compose results before emitting.
export function ok<T>(data: T): ScriptResult<T> {
  return { ok: true, data };
}

export function err(error: ScriptError): ScriptResult<never> {
  return { ok: false, error };
}

/**
 * True when this module is the process entry point, false when imported.
 *
 * Every script ends with `if (isMain(import.meta.url)) main(process.argv)`
 * so tests can import its exported function without running the CLI.
 *
 * Both paths must be resolved before they are compared. `import.meta.url` is
 * always the *real* path, while `process.argv[1]` is the path as the caller
 * typed it — and these skills are installed behind a symlink
 * (`.claude/skills/prd -> ../../.agents/skills/prd`), so the two spellings
 * differ on every real invocation. Comparing them unresolved made every script
 * a silent no-op: `main()` never ran, nothing reached stdout, and the process
 * still exited 0 — which reads as success to any caller.
 *
 * `pathToFileURL` rather than a `file://` template literal because
 * `import.meta.url` percent-encodes: a path holding a space or any non-ASCII
 * character would never match a hand-built string, and the template form is
 * wrong outright on Windows.
 */
export function isMain(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return moduleUrl === pathToFileURL(realpathSync(entry)).href;
  } catch {
    // argv[1] names something unreadable or gone; it cannot be this module.
    return false;
  }
}
