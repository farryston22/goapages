import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { supabaseServer } from "@/lib/supabase/server";
import { eventDate, ukToday, upcomingEvents } from "@/lib/events";
import { clean } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Goan events in the UK" };

type SP = { when?: string; area?: string; type?: string };

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

export default async function Events({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sb = await supabaseServer();
  const all = await upcomingEvents(sb, 200);

  // event types (categories of kind "event", e.g. Tiatr)
  const { data: lcs } = all.length
    ? await sb.from("listing_categories").select("listing_id, categories!inner(slug,name,kind)").in("listing_id", all.map((l) => l.id)).eq("categories.kind", "event")
    : { data: [] as unknown[] };
  const typesOf = new Map<string, Set<string>>();
  const typeNames = new Map<string, string>();
  for (const r of (lcs ?? []) as unknown as { listing_id: string; categories: { slug: string; name: string } | null }[]) {
    if (!r.categories) continue;
    typeNames.set(r.categories.slug, clean(r.categories.name));
    if (!typesOf.has(r.listing_id)) typesOf.set(r.listing_id, new Set());
    typesOf.get(r.listing_id)!.add(r.categories.slug);
  }
  const types = Array.from(typeNames.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const today = ukToday();

  // date filter options: this week, this month, then each month that has events
  const monthKey = (d: string) => d.slice(0, 7);
  const months = Array.from(new Set(all.map(eventDate).filter(Boolean).map((d) => monthKey(d!)))).sort();
  const monthLabel = (m: string) => new Date(m + "-15T12:00:00").toLocaleDateString("en-GB", { month: "long", year: m.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" });
  const inRange = (d: string | null) => {
    if (!sp.when) return true;
    if (!d) return false;
    if (sp.when === "week") return d <= addDays(today, 7);
    if (sp.when === "weekend") {
      const dow = new Date(today + "T12:00:00Z").getUTCDay(); // 0 Sun … 6 Sat
      const fri = addDays(today, dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow);
      return d >= (dow === 0 || dow === 6 ? today : fri) && d <= addDays(fri, 2);
    }
    if (/^\d{4}-\d{2}$/.test(sp.when)) return monthKey(d) === sp.when;
    return true;
  };

  const areaOf = (a: string | null) => clean(a ?? "").trim();
  const areas = Array.from(new Set(all.map((l) => areaOf(l.area)).filter(Boolean))).sort();
  const rows = all.filter((l) => inRange(eventDate(l))
    && (!sp.area || areaOf(l.area).toLowerCase() === sp.area.toLowerCase())
    && (!sp.type || typesOf.get(l.id)?.has(sp.type)));

  const href = (p: SP) => {
    const q = new URLSearchParams();
    const next = { ...sp, ...p };
    if (next.when) q.set("when", next.when);
    if (next.area) q.set("area", next.area);
    if (next.type) q.set("type", next.type);
    const s = q.toString();
    return "/events" + (s ? "?" + s : "");
  };
  const chip = (label: string, on: boolean, to: string) => <Link key={label} href={to} className={"chip light" + (on ? " on" : "")} scroll={false}>{label}</Link>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div><h1>Events</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Dances, feasts, tours and get-togethers for the UK Goan community.</p></div>
        <Link href="/post?kind=event" className="btn btn-yellow">Add an event</Link>
      </div>

      <div className="filters" aria-label="Filter events">
        <span className="lbl">When</span>
        <div className="chips">
          {chip("All upcoming", !sp.when, href({ when: undefined }))}
          {chip("This weekend", sp.when === "weekend", href({ when: "weekend" }))}
          {chip("Next 7 days", sp.when === "week", href({ when: "week" }))}
          {months.map((m) => chip(monthLabel(m), sp.when === m, href({ when: m })))}
        </div>
        {types.length > 0 && (
          <>
            <span className="lbl">Type</span>
            <div className="chips">
              {chip("All types", !sp.type, href({ type: undefined }))}
              {types.map(([slug, name]) => chip(name, sp.type === slug, href({ type: slug })))}
            </div>
          </>
        )}
        {areas.length > 1 && (
          <>
            <span className="lbl">Where</span>
            <div className="chips">
              {chip("Anywhere", !sp.area, href({ area: undefined }))}
              {areas.map((a) => chip(a, sp.area?.toLowerCase() === a.toLowerCase(), href({ area: a })))}
            </div>
          </>
        )}
      </div>

      {rows.length ? <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        : <div className="card empty"><p>{all.length ? "No events match those filters." : "No upcoming events listed right now."}</p>{all.length > 0 && <Link href="/events" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>Show all events</Link>}</div>}

      <div className="card pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div><h3>Running a Goan event?</h3><p style={{ color: "var(--muted)" }}>List it free — snap your flyer and we’ll fill in the details.</p></div>
        <Link href="/post?kind=event" className="btn btn-yellow">Add an event</Link>
      </div>
    </>
  );
}
