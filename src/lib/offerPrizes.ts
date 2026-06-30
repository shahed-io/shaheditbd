// Shared utilities for the multi-prize editor used in Offer admin + public page.
// Stored on `offers.prize_details` as markdown-like text so existing AI prompts,
// CSV exports and the legacy parser keep working.

export interface PrizeItem {
  title: string;
  description: string;
}

const BULLET_RE = /^[-*•]\s+|^\d+[\.\)]\s+/;

const stripStars = (s: string) => s.replace(/\*+/g, '').trim();

/**
 * Parse a free-form `prize_details` string into structured prize items.
 * Accepts the markdown format produced by `serializePrizeItems`, plain "title: desc"
 * lines, AI-generated bullet lists, and ignores intro/outro prose.
 */
export function parsePrizeItems(text: string | null | undefined): PrizeItem[] {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => BULLET_RE.test(l));
  const source = bulletLines.length > 0 ? bulletLines : lines;

  const items: PrizeItem[] = [];
  for (const raw of source) {
    const s = raw.replace(BULLET_RE, '');
    // **Title:** Description  or  **Title** Description
    const bold = s.match(/^\*\*(.+?)\*\*\s*[:：]?\s*(.*)$/);
    let title = '';
    let description = '';
    if (bold) {
      title = stripStars(bold[1]);
      description = stripStars(bold[2]);
    } else {
      const idx = s.search(/[:：]/);
      if (idx > 0) {
        title = stripStars(s.slice(0, idx));
        description = stripStars(s.slice(idx + 1));
      } else {
        title = stripStars(s);
      }
    }
    if (title || description) items.push({ title, description });
  }
  return items;
}

/** Convert structured prize items back into the stored markdown string. */
export function serializePrizeItems(items: PrizeItem[]): string {
  return items
    .map((i) => ({ title: i.title.trim(), description: i.description.trim() }))
    .filter((i) => i.title || i.description)
    .map((i) => {
      if (i.title && i.description) return `* **${i.title}:** ${i.description}`;
      if (i.title) return `* **${i.title}**`;
      return `* ${i.description}`;
    })
    .join('\n');
}
