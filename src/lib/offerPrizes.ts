// Shared utilities for the multi-prize editor used in Offer admin + public page.
// Stored on `offers.prize_details` as markdown-like text so existing AI prompts,
// CSV exports and the legacy parser keep working.

export interface PrizeItem {
  title: string;
  description: string;
}

const BULLET_RE = /^[-*•]\s+|^\d+[\.\)]\s+/;

const stripStars = (s: string) => s.replace(/\*+/g, '').trim();

const cleanTitle = (s: string) =>
  stripStars(s)
    .replace(/[\s:：]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const cleanDescription = (s: string) =>
  stripStars(s)
    .replace(/^[:：\s]+/g, '')
    .trim();

/**
 * Parse a free-form `prize_details` string into structured prize items.
 * Accepts the markdown format produced by `serializePrizeItems`, plain "title: desc"
 * lines, AI-generated bullet lists, and ignores intro/outro prose.
 */
export function parsePrizeItems(text: string | null | undefined): PrizeItem[] {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasBullets = lines.some((l) => BULLET_RE.test(l));
  const source: string[] = [];

  if (hasBullets) {
    let current = '';
    for (const line of lines) {
      if (BULLET_RE.test(line)) {
        if (current) source.push(current);
        current = line;
      } else if (current) {
        // Preserve custom multi-line descriptions typed inside a prize box.
        current += `\n${line}`;
      }
    }
    if (current) source.push(current);
  } else {
    source.push(...lines);
  }

  const items: PrizeItem[] = [];
  for (const raw of source) {
    const [firstLine, ...continuationLines] = raw.split('\n');
    const s = firstLine.replace(BULLET_RE, '');
    const continuation = continuationLines.join('\n').trim();
    // **Title:** Description, **Title**: Description, or **Title** Description.
    // Older stored rows used **Title:** which could make the colon part of the
    // parsed title. cleanTitle() strips those trailing separators so editing one
    // prize never keeps appending extra colons on the next render.
    const bold = s.match(/^\*\*(.+?)\*\*\s*[:：]?\s*(.*)$/);
    let title = '';
    let description = '';
    if (bold) {
      title = cleanTitle(bold[1]);
      description = [cleanDescription(bold[2]), continuation].filter(Boolean).join('\n');
    } else {
      const idx = s.search(/[:：]/);
      if (idx > 0) {
        title = cleanTitle(s.slice(0, idx));
        description = [cleanDescription(s.slice(idx + 1)), continuation].filter(Boolean).join('\n');
      } else {
        title = cleanTitle(s);
        description = continuation;
      }
    }
    if (title || description) items.push({ title, description });
  }
  return items;
}

/** Convert structured prize items back into the stored markdown string. */
export function serializePrizeItems(items: PrizeItem[]): string {
  return items
    .map((i) => ({ title: cleanTitle(i.title), description: cleanDescription(i.description) }))
    .filter((i) => i.title || i.description)
    .map((i) => {
      if (i.title && i.description) return `* **${i.title}**: ${i.description}`;
      if (i.title) return `* **${i.title}**`;
      return `* ${i.description}`;
    })
    .join('\n');
}
