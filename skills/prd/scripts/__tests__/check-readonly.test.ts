import { describe, it, expect } from "vitest";
import { checkReadonly } from "../check-readonly.ts";

describe("checkReadonly", () => {
  const corpusRoot = "/repo/docs/prds";

  it("returns read_only=false when no patterns are provided", () => {
    const result = checkReadonly({ corpusRoot, prdPath: "onboarding.md", patterns: [] });
    expect(result.read_only).toBe(false);
    expect(result.matched_pattern).toBeNull();
  });

  it("matches a file pattern exactly", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "old-auth.md",
      patterns: ["old-auth.md"],
    });
    expect(result.read_only).toBe(true);
    expect(result.matched_pattern).toBe("old-auth.md");
  });

  it("does not match a different file with the same suffix", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "new-auth.md",
      patterns: ["old-auth.md"],
    });
    expect(result.read_only).toBe(false);
  });

  it("matches everything under a directory pattern", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy/old.md",
      patterns: ["legacy/"],
    });
    expect(result.read_only).toBe(true);
    expect(result.matched_pattern).toBe("legacy/");
  });

  it("matches nested files under a directory pattern", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy/sub/deep.md",
      patterns: ["legacy/"],
    });
    expect(result.read_only).toBe(true);
  });

  it("treats a bare directory name as if it had a trailing slash", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy/old.md",
      patterns: ["legacy"],
    });
    expect(result.read_only).toBe(true);
  });

  it("matches the directory itself when pattern omits trailing slash", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy",
      patterns: ["legacy"],
    });
    expect(result.read_only).toBe(true);
  });

  it("accepts absolute prd-path inputs", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "/repo/docs/prds/legacy/old.md",
      patterns: ["legacy/"],
    });
    expect(result.read_only).toBe(true);
  });

  it("throws path_outside_root when prd-path escapes the corpus root", () => {
    expect(() =>
      checkReadonly({ corpusRoot, prdPath: "../outside.md", patterns: [] }),
    ).toThrowError(/outside/i);
  });

  it("normalizes patterns with leading ./ and duplicate slashes", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy/old.md",
      patterns: ["./legacy//"],
    });
    expect(result.read_only).toBe(true);
  });

  it("skips empty patterns", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "onboarding.md",
      patterns: ["", "   "],
    });
    expect(result.read_only).toBe(false);
  });

  it("reports the first matching pattern when several apply", () => {
    const result = checkReadonly({
      corpusRoot,
      prdPath: "legacy/old.md",
      patterns: ["legacy/old.md", "legacy/"],
    });
    expect(result.matched_pattern).toBe("legacy/old.md");
  });
});
