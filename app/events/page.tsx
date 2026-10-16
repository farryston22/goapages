import type { Metadata } from "next";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { LIST_FIELDS, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Goan events in the UK" };

export default async function Events() {
  const sb = await supabaseServer();
  const { data } = await sb.from("listings").select(LIST_FIELDS).eq("status", "published").eq("kind", "event").order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Listing[];
  return (
    <>
      <div><h1>Events</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Dances, feasts, tours and get-togethers for the UK Goan community.</p></div>
      {rows.length ? <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        : <div className="card empty"><p>No events listed right now.</p></div>}
      <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div><h3>Running a Goan event?</h3><p style={{ color: "var(--muted)" }}>List it free — we check every post before it goes live.</p></div>
        <Link href="/post?kind=event" className="btn btn-yellow">Add an event</Link>
      </div>
    </>
  );
}
