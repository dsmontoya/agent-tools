import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { resolveAnchor } from "../resolve-anchor.ts";
import { extractSectionBody } from "../lib/markdown.ts";
import { makeTempRoot, cleanupTempRoot, writeFixtureFile } from "./helpers.ts";

const INTENT_FIXTURE = [
  "# Intent — todo lists",
  "",
  "## Target users",
  "",
  "### Short-sitting list-keeper",
  "Someone with a TODO need bounded to one sitting.",
  "Likes: low friction.",
  "",
  "### Secondary user",
  "Already uses a heavy task manager for long-lived work.",
  "",
  "## Risks",
  "",
  "### Data-loss surprise",
  "User invests effort and is surprised when the list disappears.",
  "",
  "### Misuse for sensitive data",
  "Anonymous + no-signup creates a false sense of privacy.",
  "",
].join("\n");

describe("extractSectionBody", () => {
  it("returns the body under a heading by slug", () => {
    const result = extractSectionBody(INTENT_FIXTURE, "short-sitting-list-keeper");
    expect(result).not.toBeNull();
    expect(result!.heading.text).toBe("Short-sitting list-keeper");
    expect(result!.heading.level).toBe(3);
    expect(result!.body).toBe(
      "Someone with a TODO need bounded to one sitting.\nLikes: low friction.",
    );
  });

  it("stops at the next heading of the same level", () => {
    const result = extractSectionBody(INTENT_FIXTURE, "data-loss-surprise");
    expect(result).not.toBeNull();
    expect(result!.body).toBe(
      "User invests effort and is surprised when the list disappears.",
    );
  });

  it("stops at a higher-level heading even if subheadings come first", () => {
    // "## Target users" has two ### sub-headings, then "## Risks" closes it.
    const result = extractSectionBody(INTENT_FIXTURE, "target-users");
    expect(result).not.toBeNull();
    // The body should include the ### sub-headings (they are deeper, so they
    // belong inside Target users), but stop before "## Risks".
    expect(result!.body).toContain("### Short-sitting list-keeper");
    expect(result!.body).toContain("### Secondary user");
    expect(result!.body).not.toContain("## Risks");
  });

  it("returns null when the slug doesn't match any heading", () => {
    const result = extractSectionBody(INTENT_FIXTURE, "no-such-anchor");
    expect(result).toBeNull();
  });

  it("trims trailing blank lines from the body", () => {
    const content = ["## Foo", "", "bar", "", "", ""].join("\n");
    const result = extractSectionBody(content, "foo");
    expect(result).not.toBeNull();
    expect(result!.body).toBe("bar");
  });
});

describe("resolveAnchor", () => {
  let root: string;
  beforeEach(() => {
    root = makeTempRoot("prd-resolve-anchor-");
  });
  afterEach(() => {
    cleanupTempRoot(root);
  });

  it("returns the body and heading metadata when the anchor exists", () => {
    const path = writeFixtureFile(root, "intent.md", INTENT_FIXTURE);
    const result = resolveAnchor({ source: path, slug: "short-sitting-list-keeper" });
    expect(result.exists).toBe(true);
    if (result.exists) {
      expect(result.heading_text).toBe("Short-sitting list-keeper");
      expect(result.heading_level).toBe(3);
      expect(result.body).toContain("low friction");
    }
  });

  it("returns exists:false when the anchor doesn't exist", () => {
    const path = writeFixtureFile(root, "intent.md", INTENT_FIXTURE);
    const result = resolveAnchor({ source: path, slug: "made-up-anchor" });
    expect(result.exists).toBe(false);
  });

  it("throws missing_file when the source file doesn't exist", () => {
    expect(() =>
      resolveAnchor({ source: join(root, "no-such-intent.md"), slug: "x" }),
    ).toThrowError(/exist/i);
  });
});
