// The CLI entry guard — the one line that decides whether a script does
// anything at all when run as a process.
//
// Every other test in this directory imports a script's exported function, so
// none of them execute `main()`. That left `isMain()` untested, and it shipped
// broken: the guard compared `import.meta.url` (always the real path) against
// an unresolved `process.argv[1]` (the path as typed). Because the skill family
// installs behind a symlink — `.claude/skills/prd -> ../../.agents/skills/prd`
// — those never matched, so every script exited 0 having written nothing. A
// caller reading the exit code saw success.
//
// So these tests run the scripts the way a caller does: as a subprocess, by a
// path that is not the file's real path.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const SCRIPTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// A repo with no .prd.yaml: resolve-config answers from its defaults, so the
// test asserts the entry guard rather than any particular configuration.
let repoRoot: string;
let linkRoot: string;

beforeAll(() => {
  repoRoot = mkdtempSync(join(tmpdir(), "prd-entry-repo-"));
  linkRoot = mkdtempSync(join(tmpdir(), "prd-entry-link-"));
  symlinkSync(SCRIPTS_DIR, join(linkRoot, "scripts"), "dir");
});

afterAll(() => {
  rmSync(repoRoot, { recursive: true, force: true });
  rmSync(linkRoot, { recursive: true, force: true });
});

// Returns stdout regardless of exit code. The entry guard decides whether
// main() runs at all, not whether it succeeds — a script that ran and then
// reported a usage error still proves the guard let it through, and emits the
// same { ok: false } envelope through fail(). Asserting on exit status here
// would test each script subject rather than the guard.
function run(scriptPath: string, args: string[] = []): string {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return result.stdout;
}

// main() ran and wrote an envelope — the guard is open. Either ok value counts.
function expectEnvelope(stdout: string): void {
  expect(stdout.trim()).not.toBe("");
  expect(typeof JSON.parse(stdout).ok).toBe("boolean");
}

describe("script entry guard", () => {
  it("runs main() when invoked by the file's real path", () => {
    const stdout = run(join(SCRIPTS_DIR, "resolve-config.ts"), [repoRoot]);
    expect(stdout.trim()).not.toBe("");
    expect(JSON.parse(stdout).ok).toBe(true);
  });

  // The regression test. Before isMain() resolved both sides, this produced
  // zero bytes on stdout and exit 0 — a silent no-op indistinguishable from
  // success.
  it("runs main() when invoked through a symlinked directory", () => {
    const stdout = run(join(linkRoot, "scripts", "resolve-config.ts"), [repoRoot]);
    expect(stdout.trim()).not.toBe("");
    expect(JSON.parse(stdout).ok).toBe(true);
  });

  it("emits the same payload by either path", () => {
    const direct = run(join(SCRIPTS_DIR, "resolve-config.ts"), [repoRoot]);
    const linked = run(join(linkRoot, "scripts", "resolve-config.ts"), [repoRoot]);
    expect(JSON.parse(linked)).toEqual(JSON.parse(direct));
  });

  // Guards the whole family rather than one member: the idiom was copied into
  // every script, so a reintroduction anywhere should fail here.
  it.each([
    ["list-proposals.ts"],
    ["list-corpus.ts"],
    ["proposal-status.ts"],
  ])("%s produces output through a symlinked path", (script) => {
    expectEnvelope(run(join(linkRoot, "scripts", script), [repoRoot]));
  });
});

describe("isMain", () => {
  it("is false when the module is imported rather than executed", async () => {
    // Importing a script must not run its main(); if it did, emit() would
    // call process.exit(0) and take the test runner down with it.
    const mod = await import("../resolve-config.ts");
    expect(typeof mod.resolveConfig).toBe("function");
  });

  it("is false when argv[1] names a path that does not exist", () => {
    const probe = join(repoRoot, "probe.mjs");
    writeFileSync(
      probe,
      [
        `import { isMain } from ${JSON.stringify(join(SCRIPTS_DIR, "lib/cli.ts"))};`,
        `process.argv[1] = ${JSON.stringify(join(repoRoot, "gone", "missing.mjs"))};`,
        `console.log(isMain(import.meta.url) ? "true" : "false");`,
      ].join("\n"),
    );
    expect(run(probe).trim()).toBe("false");
  });
});
