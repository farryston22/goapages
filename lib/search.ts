import type { SupabaseClient } from "@supabase/supabase-js";
import { LIST_FIELDS, type Listing } from "./util";

export type Hit = Listing & { description: string | null; cats: string };

const STOP = new Set(["a", "an", "the", "in", "near", "for", "of", "and", "to", "goan", "goa", "uk", "best", "me", "find", "i", "need", "want", "who", "is", "are", "any", "can", "you", "recommend", "good", "looking", "with", "my", "our", "what", "where", "some", "please", "around", "london"]);

const SYN: Record<string, string[]> = {
  mc: ["emcee", "compere", "host", "anchor"], emcee: ["mc", "compere", "host", "anchor"], host: ["emcee", "mc"],
  dj: ["deejay", "disc jockey", "music & dj"], band: ["music bands", "live band", "musician"], music: ["band", "dj", "singer"],
  singer: ["vocalist", "band", "choir"], cake: ["cakes", "baker", "bakes"], cakes: ["cake", "baker", "bakes"], sweets: ["cakes", "bakes", "baker", "dessert"],
  caterer: ["catering", "caterers", "food"], catering: ["caterer", "caterers"], food: ["caterer", "restaurant", "dining", "cuisine"],
  photographer: ["photography", "photographers", "photo"], photos: ["photography", "photographer"], video: ["videographer", "videography", "film"],
  decor: ["decorator", "decorators", "decoration", "balloon"], decorations: ["decor", "decorators"], makeup: ["beauty", "make-up", "bridal", "hair"],
  restaurant: ["food & dining", "cafe", "dining"], venue: ["hall", "venue"], wedding: ["wedding", "bridal", "reception"], christening: ["baptism", "christening"],
  baptism: ["christening", "baptism"], mortgage: ["mortgages", "financial"], lawyer: ["legal", "solicitor"], taxi: ["cab", "chauffeur", "car"],
};

/** Simple scored search over published listings (titles, categories, tagline, area, description). */
export async function searchListings(sb: SupabaseClient, raw: string, limit = 48, requireAll = true): Promise<Hit[]> {
  const q = raw.trim().slice(0, 200);
  if (!q) return [];
  const words = q.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).slice(0, 6);
  const terms = words.length ? words : [q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").trim()];
  // each term may match any of its synonyms
  const alts = terms.map((t) => [t, ...(SYN[t] ?? [])]);
  const [{ data: cats }, { data: links }, { data: rows }] = await Promise.all([
    sb.from("categories").select("id,name,slug"),
    sb.from("listing_categories").select("listing_id,category_id"),
    sb.from("listings").select(LIST_FIELDS + ",description,phone,whatsapp,email,website").eq("status", "published").limit(1000),
  ]);
  const catName = new Map((cats ?? []).map((c: { id: number; name: string; slug: string }) => [c.id, c.name]));
  const catText = new Map<string, string>();
  (links ?? []).forEach((r: { listing_id: string; category_id: number }) => {
    const n = catName.get(r.category_id); if (n) catText.set(r.listing_id, (catText.get(r.listing_id) ? catText.get(r.listing_id) + ", " : "") + n);
  });
  const all = (rows ?? []) as unknown as Hit[];
  const scored = all.map((l) => {
    l.cats = catText.get(l.id) ?? "";
    const title = l.title.toLowerCase(), tag = (l.tagline ?? "").toLowerCase(), area = (l.area ?? "").toLowerCase();
    const desc = (l.description ?? "").toLowerCase(), cat = l.cats.toLowerCase();
    let score = 0, hits = 0;
    for (const group of alts) {
      const has = (s: string) => group.some((t) => {
        const stem = t.replace(/(ers|er|s|ing)$/, "");
        return t.length <= 3 ? new RegExp(`\\b${t}\\b`).test(s) : s.includes(t) || (stem.length > 3 && s.includes(stem));
      });
      let h = 0;
      if (has(title)) h += 6; if (has(cat)) h += 5; if (has(tag)) h += 3; if (has(area)) h += 4; if (has(desc)) h += 1;
      if (h) hits++; score += h;
    }
    const ok = requireAll ? hits === terms.length : hits > 0;
    return { l, score: ok ? score + hits * 3 + Math.min(l.review_count ?? 0, 60) / 6 : 0 };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.l);
}
