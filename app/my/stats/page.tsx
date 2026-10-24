import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { clean } from "@/lib/util";
import StatsView, { RangeTabs, type Stats } from "@/components/StatsView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listing stats", robots: { index: false } };

export default async function ListingStats({ searchParams }: { searchParams: Promise<{ id?: string; days?: string }> }) {
  const { id = "", days: d } = await searchParams;
  const days = [1, 7, 30, 90, 365].includes(Number(d)) ? Number(d) : 30;
  const { sb, user } = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/my/stats?id=${id}`)}`);
  const { data: l } = await sb.from("listings").select("id,title,slug").eq("id", id).maybeSingle();
  if (!l) return <div className="card empty"><h1>Listing not found</h1><Link href="/my" className="btn btn-ghost" style={{ marginTop: 12 }}>← My listings</Link></div>;
  const { data, error } = await sb.rpc("listing_stats", { lid: l.id, days });
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div><h1>{clean(l.title)}: stats</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>How many people looked at your listing, where they came from, and who tapped to contact you.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/listing/${l.slug}`} className="btn btn-ghost">View listing</Link>
          <Link href="/my" className="btn btn-ghost">← My listings</Link>
        </div>
      </div>
      <RangeTabs days={days} href={(n) => `/my/stats?id=${l.id}&days=${n}`} />
      {error || !data
        ? <div className="notice bad">{error?.message?.includes("not your listing") ? "Only the owner of this listing can see its stats." : "Couldn’t load the stats right now."}</div>
        : <StatsView s={data as Stats} listing />}
    </>
  );
}
