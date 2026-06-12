import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveXref } from "../resolve-xref.ts";
import { slugify, extractInlineLinks, extractHeadings } from "../lib/markdown.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";
import { join } from "node:path";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation", () => {
    expect(slugify("7.2 Session Rules")).toBe("72-session-rules");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("Foo --- Bar")).toBe("foo-bar");
  });

  it("returns empty string for purely punctuation input", () => {
    expect(slugify("...")).toBe("");
  });
});

describe("extractHeadings", () => {
  it("captures ## and ### headings with slugs", () => {
    const headings = extractHeadings("# Title\n\n## Foo Bar\n\n### Baz");
    expect(headings.map((h) => h.slug)).toEqual(["title", "foo-bar", "baz"]);
    expect(headings.map((h) => h.level)).toEqual([1, 2, 3]);
  });
});

describe("extractInlineLinks", () => {
  it("captures multiple inline links on the same line", () => {
    const links = extractInlineLinks("see [A](a.md) and [B](b.md#anchor)");
    expect(links).toEqual([
      { text: "A", url: "a.md", line: 1, column: 5 },
      { text: "B", url: "b.md#anchor", line: 1, column: 19 },
    ]);
  });

  it("skips reference-style links", () => {
    const links = extractInlineLinks("[ref-style][r]\n\n[r]: foo.md");
    expect(links).toEqual([]);
  });
});

describe("resolveXref", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot();
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("throws missing_source when the source file does not exist", () => {
    expect(() => resolveXref({ source: join(root, "nope.md") })).toThrowError(/exist/i);
  });

  it("marks an external URL as external and ok", () => {
    writeFixtureFile(root, "src.md", "See [docs](https://example.com).");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]).toMatchObject({ external: true, ok: true });
  });

  it("flags a relative file that does not exist", () => {
    writeFixtureFile(root, "src.md", "See [other](./missing.md).");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.file_exists).toBe(false);
    expect(result.references[0]!.ok).toBe(false);
  });

  it("accepts a relative file with no anchor", () => {
    writeFixtureFile(root, "src.md", "See [other](./other.md).");
    writeFixtureFile(root, "other.md", "# Other");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.ok).toBe(true);
    expect(result.references[0]!.anchor).toBeNull();
  });

  it("resolves an anchor against a target file's headings", () => {
    writeFixtureFile(root, "src.md", "See [section](./other.md#foo-bar).");
    writeFixtureFile(root, "other.md", "# Title\n\n## Foo Bar\n");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.anchor_exists).toBe(true);
    expect(result.references[0]!.ok).toBe(true);
  });

  it("flags an anchor that does not match any heading in the target", () => {
    writeFixtureFile(root, "src.md", "See [section](./other.md#nonexistent).");
    writeFixtureFile(root, "other.md", "# Title\n\n## Foo Bar\n");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.anchor_exists).toBe(false);
    expect(result.references[0]!.ok).toBe(false);
  });

  it("resolves same-file anchors", () => {
    writeFixtureFile(root, "src.md", "# Title\n\n## Foo\n\nSee [me](#foo).");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.ok).toBe(true);
  });

  it("flags broken same-file anchors", () => {
    writeFixtureFile(root, "src.md", "# Title\n\nSee [me](#missing).");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.ok).toBe(false);
  });

  it("treats mailto: as external", () => {
    writeFixtureFile(root, "src.md", "Reach [us](mailto:a@b.com).");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.external).toBe(true);
    expect(result.references[0]!.ok).toBe(true);
  });

  it("reports line and column for each link", () => {
    writeFixtureFile(root, "src.md", "first line\nsee [x](x.md)");
    const result = resolveXref({ source: join(root, "src.md") });
    expect(result.references[0]!.line).toBe(2);
    expect(result.references[0]!.column).toBe(5);
  });
});
