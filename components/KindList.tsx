import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import Icon from "@/components/Icon";
import { supabaseServer } from "@/lib/supabase/server";
import { LIST_FIELDS, type Listing } from "@/lib/util";

/** List page for marketplace items, rooms/property and obituaries (published and not expired). */
export default async function KindList({ kinds, icon, title, lead, cta, empty }: {
  kinds: string[]; icon: string; title: string; lead: string; cta: { href: string; label: string }[]; empty: string;
}) {
  const sb = await supabaseServer();
  const { data } = await sb.from("listings").select(LIST_FIELDS).eq("status", "published").in("kind", kinds)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order("created_at", { ascending: false }).limit(60);
  const rows = (data ?? []) as unknown as Listing[];
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name={icon} size={26} />{title}</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>{lead}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cta.map((c, i) => <Link key={c.href} href={c.href} className={"btn " + (i === 0 ? "btn-yellow" : "btn-ghost")}>{c.label}</Link>)}
        </div>
      </div>
      {rows.length ? <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        : <div className="card empty"><p>{empty}</p></div>}
    </>
  );
}
