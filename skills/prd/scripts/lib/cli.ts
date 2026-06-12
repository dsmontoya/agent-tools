// Shared CLI helpers — JSON output envelope, exit codes, stderr logging.
// Scripts use these so callers get a uniform shape regardless of which
// script was invoked. See lib/types.ts for ScriptResult.

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
