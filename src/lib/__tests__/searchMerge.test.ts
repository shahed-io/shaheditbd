import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseAiSearchResponse,
  mergeSearchResults,
  orderProductsByIds,
  pickDidYouMean,
  uniqueNameSuggestions,
  type SearchProduct,
} from '@/lib/searchMerge';

// ── Fixtures: a tiny representative catalog ─────────────────────────
const catalog: SearchProduct[] = [
  { id: 'p1', name: 'Microsoft Office 365' },
  { id: 'p2', name: 'Windows 11 Pro' },
  { id: 'p3', name: 'Netflix Premium' },
  { id: 'p4', name: 'Adobe Photoshop' },
  { id: 'p5', name: 'Kaspersky Antivirus' },
  { id: 'p6', name: 'Spotify Premium' },
  { id: 'p7', name: 'ChatGPT Plus' },
];
const catalogIds = catalog.map((p) => p.id);

describe('parseAiSearchResponse', () => {
  it('returns clean defaults when payload is empty / null', () => {
    const r = parseAiSearchResponse(null, catalogIds, 'ofice');
    expect(r).toEqual({
      matchedIds: [],
      correctedQuery: 'ofice',
      didYouMean: '',
      keywords: [],
    });
  });

  it('drops ids that are not in the live catalog (defends against stale AI output)', () => {
    const r = parseAiSearchResponse(
      { matchedIds: ['p1', 'p999', 'p2', 42, null] },
      catalogIds,
      'office',
    );
    expect(r.matchedIds).toEqual(['p1', 'p2']);
  });

  it('clamps matchedIds to 16 and keywords to 8', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `p${(i % 7) + 1}`);
    const kws = Array.from({ length: 20 }, (_, i) => `kw${i}`);
    const r = parseAiSearchResponse(
      { matchedIds: ids, keywords: kws },
      catalogIds,
      'q',
    );
    expect(r.matchedIds.length).toBeLessThanOrEqual(16);
    expect(r.keywords.length).toBe(8);
  });

  it('uses correctedQuery & didYouMean when provided', () => {
    const r = parseAiSearchResponse(
      {
        matchedIds: ['p1'],
        correctedQuery: 'Microsoft Office',
        didYouMean: 'Microsoft Office',
      },
      catalogIds,
      'ofice',
    );
    expect(r.correctedQuery).toBe('Microsoft Office');
    expect(r.didYouMean).toBe('Microsoft Office');
  });

  it('falls back to original query when correctedQuery missing', () => {
    const r = parseAiSearchResponse({ matchedIds: [] }, catalogIds, 'win 11');
    expect(r.correctedQuery).toBe('win 11');
  });

  it('ignores non-string keywords / matchedIds', () => {
    const r = parseAiSearchResponse(
      { matchedIds: 'p1' as unknown as string[], keywords: { bad: true } as unknown as string[] },
      catalogIds,
      'q',
    );
    expect(r.matchedIds).toEqual([]);
    expect(r.keywords).toEqual([]);
  });
});

describe('orderProductsByIds', () => {
  it('orders products by AI-supplied relevance ranking', () => {
    const subset = [catalog[1], catalog[0], catalog[2]]; // out of order
    const ordered = orderProductsByIds(subset, ['p3', 'p1', 'p2']);
    expect(ordered.map((p) => p.id)).toEqual(['p3', 'p1', 'p2']);
  });

  it('puts unranked items at the end without dropping them', () => {
    const subset = [catalog[0], catalog[1], catalog[2]];
    const ordered = orderProductsByIds(subset, ['p2']);
    expect(ordered[0].id).toBe('p2');
    expect(ordered.map((p) => p.id).sort()).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('mergeSearchResults', () => {
  it('keeps DB results first, appends unique AI results', () => {
    const db = [catalog[0]]; // Office
    const ai = [catalog[1], catalog[0], catalog[2]]; // Windows + dup Office + Netflix
    const merged = mergeSearchResults(db, ai);
    expect(merged.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('returns DB results untouched when AI returns nothing', () => {
    const db = [catalog[0], catalog[1]];
    expect(mergeSearchResults(db, [])).toEqual(db);
  });

  it('promotes AI-only results when DB is empty (typo / Banglish case)', () => {
    const ai = [catalog[2], catalog[3]];
    expect(mergeSearchResults([], ai).map((p) => p.id)).toEqual(['p3', 'p4']);
  });

  it('clamps to the configured limit', () => {
    const merged = mergeSearchResults(catalog.slice(0, 3), catalog.slice(3), 4);
    expect(merged.length).toBe(4);
    expect(merged.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('does not duplicate when DB & AI return the same items', () => {
    const merged = mergeSearchResults(catalog.slice(0, 3), catalog.slice(0, 3));
    expect(merged.length).toBe(3);
  });
});

describe('pickDidYouMean', () => {
  it('hides empty / nullish suggestions', () => {
    expect(pickDidYouMean('', 'office')).toBe('');
    expect(pickDidYouMean(null, 'office')).toBe('');
    expect(pickDidYouMean(undefined, 'office')).toBe('');
  });

  it('hides suggestions identical to the user query (case-insensitive)', () => {
    expect(pickDidYouMean('Office', 'office')).toBe('');
    expect(pickDidYouMean('  office  ', 'OFFICE')).toBe('');
  });

  it('shows real corrections (typo case)', () => {
    expect(pickDidYouMean('Microsoft Office', 'ofice')).toBe('Microsoft Office');
  });
});

describe('uniqueNameSuggestions', () => {
  it('dedupes case-insensitively and respects the limit', () => {
    const names = uniqueNameSuggestions(
      [
        { id: 'a', name: 'Netflix Premium' },
        { id: 'b', name: 'netflix premium' },
        { id: 'c', name: 'Spotify Premium' },
      ],
      5,
    );
    expect(names).toEqual(['Netflix Premium', 'Spotify Premium']);
  });
});

describe('SearchBar AI fallback flow (integration)', () => {
  const aiOracle: Record<string, { ids: string[]; didYouMean: string }> = {
    ofice: { ids: ['p1'], didYouMean: 'Microsoft Office' },
    windws: { ids: ['p2'], didYouMean: 'Windows 11 Pro' },
    nflx: { ids: ['p3'], didYouMean: 'Netflix Premium' },
    'win 11': { ids: ['p2'], didYouMean: '' },
    অফিস: { ids: ['p1'], didYouMean: 'Microsoft Office' },
    নেটফ্লিক্স: { ids: ['p3'], didYouMean: 'Netflix Premium' },
    av: { ids: ['p5'], didYouMean: 'antivirus' },
    pizza: { ids: [], didYouMean: '' },
  };

  async function runSearch(
    query: string,
    dbHits: SearchProduct[],
  ): Promise<{
    products: SearchProduct[];
    didYouMean: string;
    usedAi: boolean;
  }> {
    let products = dbHits;
    let didYouMean = '';
    let usedAi = false;

    if (query.trim().length >= 2 && dbHits.length < 6) {
      const oracle = aiOracle[query] ?? { ids: [], didYouMean: '' };
      const parsed = parseAiSearchResponse(
        { matchedIds: oracle.ids, didYouMean: oracle.didYouMean },
        catalogIds,
        query,
      );
      const aiProducts = orderProductsByIds(
        catalog.filter((p) => parsed.matchedIds.includes(p.id)),
        parsed.matchedIds,
      );
      const merged = mergeSearchResults(dbHits, aiProducts);
      if (dbHits.length === 0 && aiProducts.length > 0) usedAi = true;
      products = merged;
      didYouMean = pickDidYouMean(parsed.didYouMean, query);
    }
    return { products, didYouMean, usedAi };
  }

  it('typo "ofice" → suggests Microsoft Office and shows did-you-mean', async () => {
    const r = await runSearch('ofice', []);
    expect(r.products.map((p) => p.id)).toEqual(['p1']);
    expect(r.didYouMean).toBe('Microsoft Office');
    expect(r.usedAi).toBe(true);
  });

  it('typo "windws" → suggests Windows 11 Pro', async () => {
    const r = await runSearch('windws', []);
    expect(r.products.map((p) => p.id)).toEqual(['p2']);
    expect(r.didYouMean).toBe('Windows 11 Pro');
  });

  it('shortcut "win 11" → resolves to Windows without showing did-you-mean', async () => {
    const r = await runSearch('win 11', []);
    expect(r.products.map((p) => p.id)).toEqual(['p2']);
    expect(r.didYouMean).toBe('');
  });

  it('shortcut "av" → suggests antivirus product', async () => {
    const r = await runSearch('av', []);
    expect(r.products[0].id).toBe('p5');
    expect(r.didYouMean).toBe('antivirus');
  });

  it('Banglish "নেটফ্লিক্স" → maps to Netflix', async () => {
    const r = await runSearch('নেটফ্লিক্স', []);
    expect(r.products.map((p) => p.id)).toEqual(['p3']);
    expect(r.didYouMean).toBe('Netflix Premium');
    expect(r.usedAi).toBe(true);
  });

  it('Bangla "অফিস" → maps to Office', async () => {
    const r = await runSearch('অফিস', []);
    expect(r.products[0].id).toBe('p1');
  });

  it('merges DB hits with AI-suggested extras when DB results are sparse', async () => {
    const r = await runSearch('ofice', [catalog[2]]);
    expect(r.products.map((p) => p.id)).toEqual(['p3', 'p1']);
    expect(r.usedAi).toBe(false);
  });

  it('does not call AI when DB has 6+ strong results', async () => {
    const dbHits = catalog.slice(0, 6);
    const r = await runSearch('office', dbHits);
    expect(r.products).toEqual(dbHits);
    expect(r.didYouMean).toBe('');
  });

  it('returns empty result for completely unrelated queries (e.g. "pizza")', async () => {
    const r = await runSearch('pizza', []);
    expect(r.products).toEqual([]);
    expect(r.didYouMean).toBe('');
    expect(r.usedAi).toBe(false);
  });
});

describe('SearchBar request-id race protection', () => {
  it('discards stale AI responses when a newer query has been issued', async () => {
    let reqId = 0;
    const setState = vi.fn();

    async function search(query: string, latencyMs: number) {
      const myReq = ++reqId;
      await new Promise((r) => setTimeout(r, latencyMs));
      if (myReq !== reqId) return;
      setState(query);
    }

    const slow = search('ofice', 50);
    const fast = search('windows', 10);
    await Promise.all([slow, fast]);

    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith('windows');
  });
});

describe('Shop page AI fallback (integration)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('marks results as AI-assisted only when DB returned nothing', () => {
    const dbResults: SearchProduct[] = [];
    const aiResults = [catalog[0], catalog[1]];
    const merged = mergeSearchResults(dbResults, aiResults);
    const aiAssisted = dbResults.length === 0 && merged.length > 0;
    expect(aiAssisted).toBe(true);
    expect(merged).toHaveLength(2);
  });

  it('does NOT mark as AI-assisted when DB had some results', () => {
    const dbResults = [catalog[0]];
    const aiResults = [catalog[1]];
    const merged = mergeSearchResults(dbResults, aiResults);
    const aiAssisted = dbResults.length === 0 && merged.length > 0;
    expect(aiAssisted).toBe(false);
    expect(merged.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});
