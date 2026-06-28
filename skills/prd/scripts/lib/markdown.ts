// Lightweight markdown utilities shared by xref resolution and validation.

const HEADING_LINE = /^(#{1,6})\s+(.+?)\s*$/;

export interface Heading {
  level: number;
  text: string;
  slug: string;
  line: number;
}

// GitHub-flavored slug. Lowercase, replace non-word chars with "-",
// collapse runs of dashes, trim leading/trailing dashes.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractHeadings(content: string): Heading[] {
  const out: Heading[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_LINE.exec(lines[i]!);
    if (!m) continue;
    const text = m[2]!.trim();
    out.push({
      level: m[1]!.length,
      text,
      slug: slugify(text),
      line: i + 1,
    });
  }
  return out;
}

// Match inline markdown links: [text](url "optional title").
// Reference-style links ([text][ref]) are not handled in v1.
const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export interface InlineLink {
  text: string;
  url: string;
  line: number;
  column: number;
}

export function extractInlineLinks(content: string): InlineLink[] {
  const out: InlineLink[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    INLINE_LINK.lastIndex = 0;
    let m: RegExpExecArray | null;
    const line = lines[i]!;
    while ((m = INLINE_LINK.exec(line)) !== null) {
      out.push({
        text: m[1]!,
        url: m[2]!,
        line: i + 1,
        column: m.index + 1,
      });
    }
  }
  return out;
}

// Extract the body under a heading identified by its GitHub-flavored slug.
// The body runs from the line *after* the heading up to (but not including)
// the next heading at the same or higher level. Used by apply for Shape B
// transclusion and by verify to confirm Shape B anchors resolve.
//
// Returns null when the slug doesn't match any heading in the document.

export interface SectionBody {
  heading: Heading;
  body: string;
  startLine: number;
  endLine: number;
}

export function extractSectionBody(
  content: string,
  slug: string,
): SectionBody | null {
  const lines = content.split(/\r?\n/);
  const headings = extractHeadings(content);
  const target = headings.find((h) => h.slug === slug);
  if (!target) return null;

  // The body starts on the line after the heading. It ends at the next
  // heading at the same or higher level (i.e., level <= target.level), or
  // at end-of-file. Heading line numbers are 1-based.
  const startLine = target.line + 1;
  let endLine = lines.length;
  for (const h of headings) {
    if (h.line <= target.line) continue;
    if (h.level <= target.level) {
      endLine = h.line - 1;
      break;
    }
  }
  // Slice the body and trim leading + trailing blank lines for stable output.
  const bodyLines = lines.slice(startLine - 1, endLine);
  let leadingTrim = 0;
  while (leadingTrim < bodyLines.length && bodyLines[leadingTrim]!.trim() === "") {
    leadingTrim++;
  }
  let trailingTrim = 0;
  while (
    trailingTrim < bodyLines.length - leadingTrim &&
    bodyLines[bodyLines.length - 1 - trailingTrim]!.trim() === ""
  ) {
    trailingTrim++;
  }
  const trimmed = bodyLines.slice(leadingTrim, bodyLines.length - trailingTrim);
  return {
    heading: target,
    body: trimmed.join("\n"),
    startLine: startLine + leadingTrim,
    endLine: startLine + leadingTrim + trimmed.length - 1,
  };
}
