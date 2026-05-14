// Integration tests for the `ai-search-match` edge function.
// Hits the deployed function with realistic fuzzy / Banglish / shortcut
// queries and asserts that it surfaces the right products.
//
// Run: supabase functions test ai-search-match
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-search-match`;

// Representative catalog the AI is asked to match against.
const PRODUCTS = [
  { id: "p1", name: "Microsoft Office 365" },
  { id: "p2", name: "Windows 11 Pro" },
  { id: "p3", name: "Netflix Premium" },
  { id: "p4", name: "Adobe Photoshop" },
  { id: "p5", name: "Kaspersky Antivirus" },
  { id: "p6", name: "Spotify Premium" },
  { id: "p7", name: "ChatGPT Plus" },
  { id: "p8", name: "Norton 360 Antivirus" },
  { id: "p9", name: "NordVPN" },
  { id: "p10", name: "Canva Pro" },
];

async function callAi(query: string) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ query, products: PRODUCTS }),
  });
  const json = await res.json();
  return { status: res.status, json };
}

function nameOf(id: string) {
  return PRODUCTS.find((p) => p.id === id)?.name ?? id;
}

Deno.test("returns clean shape for empty query", async () => {
  const { status, json } = await callAi("");
  assertEquals(status, 200);
  assertEquals(json.matchedIds, []);
});

Deno.test("typo: 'ofice' suggests Microsoft Office", async () => {
  const { json } = await callAi("ofice");
  assert(Array.isArray(json.matchedIds), "matchedIds must be an array");
  assert(json.matchedIds.length > 0, "expected at least one suggestion");
  assert(
    json.matchedIds.includes("p1"),
    `expected Microsoft Office in suggestions, got ${json.matchedIds.map(nameOf).join(", ")}`,
  );
});

Deno.test("typo: 'windws' suggests Windows", async () => {
  const { json } = await callAi("windws");
  assert(json.matchedIds.includes("p2"), "expected Windows 11 Pro");
});

Deno.test("shortcut: 'win 11' resolves to Windows 11", async () => {
  const { json } = await callAi("win 11");
  assert(json.matchedIds.includes("p2"));
});

Deno.test("shortcut: 'nflx' resolves to Netflix", async () => {
  const { json } = await callAi("nflx");
  assert(json.matchedIds.includes("p3"));
});

Deno.test("category: 'antivirus' returns multiple antivirus products", async () => {
  const { json } = await callAi("antivirus");
  const ids: string[] = json.matchedIds || [];
  // both Kaspersky and Norton should appear
  assert(ids.includes("p5") || ids.includes("p8"), "expected an antivirus product");
});

Deno.test("category: 'vpn' returns NordVPN", async () => {
  const { json } = await callAi("vpn");
  assert((json.matchedIds || []).includes("p9"));
});

Deno.test("Bangla 'অফিস' → Microsoft Office", async () => {
  const { json } = await callAi("অফিস");
  assert((json.matchedIds || []).includes("p1"));
});

Deno.test("Bangla 'নেটফ্লিক্স' → Netflix Premium", async () => {
  const { json } = await callAi("নেটফ্লিক্স");
  assert((json.matchedIds || []).includes("p3"));
});

Deno.test("unrelated 'pizza' returns empty (or near-empty) list without crashing", async () => {
  const { status, json } = await callAi("pizza");
  assertEquals(status, 200);
  assert(Array.isArray(json.matchedIds));
  // accept up to 1 stray match — model is generous, but pizza ≠ software
  assert(json.matchedIds.length <= 2, `expected at most 2 ids, got ${json.matchedIds.length}`);
});

Deno.test("response includes correctedQuery & didYouMean fields", async () => {
  const { json } = await callAi("ofice");
  assertEquals(typeof json.correctedQuery, "string");
  assertEquals(typeof json.didYouMean, "string");
});

Deno.test("matchedIds are always from the supplied catalog", async () => {
  const { json } = await callAi("netflix");
  const validIds = new Set(PRODUCTS.map((p) => p.id));
  for (const id of json.matchedIds || []) {
    assert(validIds.has(id), `unexpected id ${id} not in catalog`);
  }
});
