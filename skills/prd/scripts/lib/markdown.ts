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
