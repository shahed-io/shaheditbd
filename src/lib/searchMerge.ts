// Pure helpers for AI-assisted product search.
// Extracted so they can be unit-tested without React/Supabase.

export interface SearchProduct {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface AiSearchRaw {
  matchedIds?: unknown;
  correctedQuery?: unknown;
  didYouMean?: unknown;
  keywords?: unknown;
}

export interface AiSearchParsed {
  matchedIds: string[];
  correctedQuery: string;
  didYouMean: string;
  keywords: string[];
}

/**
 * Validate & normalize the raw response coming back from the
 * `ai-search-match` edge function. Filters matchedIds to a known
 * catalog and clamps array sizes so the UI can trust the shape.
 */
export function parseAiSearchResponse(
  raw: AiSearchRaw | null | undefined,
  catalogIds: Iterable<string>,
  originalQuery: string,
): AiSearchParsed {
  const validIds = new Set(catalogIds);
  const matchedIds = Array.isArray(raw?.matchedIds)
    ? (raw!.matchedIds as unknown[])
        .filter((id): id is string => typeof id === 'string' && validIds.has(id))
        .slice(0, 16)
    : [];
  const correctedQuery =
    typeof raw?.correctedQuery === 'string' && raw!.correctedQuery
      ? (raw!.correctedQuery as string)
      : originalQuery;
  const didYouMean =
    typeof raw?.didYouMean === 'string' ? (raw!.didYouMean as string) : '';
  const keywords = Array.isArray(raw?.keywords)
    ? (raw!.keywords as unknown[])
        .filter((k): k is string => typeof k === 'string')
        .slice(0, 8)
    : [];
  return { matchedIds, correctedQuery, didYouMean, keywords };
}

/**
 * Re-order AI matched products by the order returned from the AI
 * (which encodes relevance). Items not in the id list fall to the end.
 */
export function orderProductsByIds<T extends SearchProduct>(
  products: T[],
  orderedIds: string[],
): T[] {
  const order = new Map(orderedIds.map((id, i) => [id, i]));
  return [...products].sort(
    (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
  );
}

/**
 * Merge database results with AI fuzzy-match results. DB hits are
 * prioritised (they are exact / lexical matches), AI suggestions are
 * appended without duplicates and the list is clamped to `limit`.
 */
export function mergeSearchResults<T extends SearchProduct>(
  dbResults: T[],
  aiResults: T[],
  limit = 12,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of dbResults) {
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) return out;
  }
  for (const p of aiResults) {
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Decide whether the AI "did you mean" suggestion should be shown.
 * Hides empty strings and echoes of the original query.
 */
export function pickDidYouMean(
  suggestion: string | undefined | null,
  originalQuery: string,
): string {
  if (!suggestion) return '';
  const a = suggestion.trim().toLowerCase();
  const b = originalQuery.trim().toLowerCase();
  if (!a || a === b) return '';
  return suggestion;
}

/**
 * Extract unique product names (case-insensitive) for the
 * "suggestions" dropdown, capped at `limit`.
 */
export function uniqueNameSuggestions<T extends SearchProduct>(
  products: T[],
  limit = 5,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of products) {
    if (!p?.name) continue;
    const key = p.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p.name);
    if (out.length >= limit) break;
  }
  return out;
}
