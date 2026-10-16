import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { supabaseServer } from "@/lib/supabase/server";
import { catNames } from "@/lib/data";
import { LIST_FIELDS, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw = "" } = await searchParams;
  const q = raw.trim().slice(0, 80);
  let rows: Listing[] = [];
  let names = new Map<string, string>();
  if (q) {
    const sb = await supabaseServer();
    // words, minus filler; each word must match somewhere (title, tagline, area, description or category)
    const stop = new Set(["a", "an", "the", "in", "near", "for", "of", "and", "to", "goan", "goa", "uk", "best", "me", "find"]);
    const words = q.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !stop.has(w)).slice(0, 5);
    const terms = words.length ? words : [q.replace(/[^\p{L}\p{N}\s]/gu, " ").trim()];
    const { data: cats } = await sb.from("categories").select("id,name,slug");
    const [res, n] = await Promise.all([
      sb.from("listings").select(LIST_FIELDS + ",description").eq("status", "published").limit(400),
      catNames(),
    ]);
    names = n;
    const { data: links } = await sb.from("listing_categories").select("listing_id,category_id");
    const catName = new Map((cats ?? []).map((c: { id: number; name: string; slug: string }) => [c.id, (c.name + " " + c.slug).toLowerCase()]));
    const catText = new Map<string, string>();
    (links ?? []).forEach((r: { listing_id: string; category_id: number }) => catText.set(r.listing_id, (catText.get(r.listing_id) ?? "") + " " + (catName.get(r.category_id) ?? "")));
    const all = (res.data ?? []) as unknown as (Listing & { description: string | null })[];
    const scored = all.map((l) => {
      const title = l.title.toLowerCase(), tag = (l.tagline ?? "").toLowerCase(), area = (l.area ?? "").toLowerCase();
      const desc = (l.description ?? "").toLowerCase(), cat = catText.get(l.id) ?? "";
      let score = 0, hits = 0;
      for (const t of terms) {
        const stem = t.replace(/(ers|er|s)$/,"");
        const has = (s: string) => s.includes(t) || (stem.length > 2 && s.includes(stem));
        let h = 0;
        if (has(title)) h += 6; if (has(cat)) h += 5; if (has(tag)) h += 3; if (has(area)) h += 4; if (has(desc)) h += 1;
        if (h) hits++; score += h;
      }
      return { l, score: hits === terms.length ? score + (l.review_count ?? 0) / 20 : 0 };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    rows = scored.slice(0, 48).map((x) => x.l);
  }
  return (
    <>
      <div>
        <h1>{q ? <>Results for “{q}”</> : "Search GoaPages"}</h1>
        {q && <p style={{ color: "var(--muted)", marginTop: 6 }}>{rows.length} {rows.length === 1 ? "match" : "matches"}</p>}
      </div>
      <form action="/search" role="search" className="card pad" style={{ display: "flex", gap: 8 }}>
        <label htmlFor="q-page" className="sr">Search</label>
        <input id="q-page" className="input" name="q" defaultValue={q} placeholder="Caterer, band, MC, Hounslow, cakes…" />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      {q && (rows.length ? (
        <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} cat={names.get(l.id)} />)}</div>
      ) : (
        <div className="card empty">
          <p>No matches for “{q}”. Try a simpler word, like “caterer” or “DJ”.</p>
          <Link href="/directory" className="btn btn-primary" style={{ marginTop: 14 }}>Browse all categories</Link>
        </div>
      ))}
    </>
  );
}
