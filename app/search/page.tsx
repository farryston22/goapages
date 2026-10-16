import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { supabaseServer } from "@/lib/supabase/server";
import { searchListings, type Hit } from "@/lib/search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw = "" } = await searchParams;
  const q = raw.trim().slice(0, 80);
  let rows: Hit[] = [];
  if (q) {
    const sb = await supabaseServer();
    rows = await searchListings(sb, q);
    if (!rows.length) rows = await searchListings(sb, q, 24, false);
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
        <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} cat={l.cats.split(",")[0] || undefined} />)}</div>
      ) : (
        <div className="card empty">
          <p>No matches for “{q}”. Try a simpler word, like “caterer” or “DJ”.</p>
          <Link href="/directory" className="btn btn-primary" style={{ marginTop: 14 }}>Browse all categories</Link>
        </div>
      ))}
    </>
  );
}
