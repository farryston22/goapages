import type { Metadata } from "next";
import Link from "next/link";
import Icon, { catIcon } from "@/components/Icon";
import ListingCard from "@/components/ListingCard";
import { supabaseServer } from "@/lib/supabase/server";
import { categories, categoryCounts, catNames } from "@/lib/data";
import { LIST_FIELDS, clean, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
const PER = 24;

type SP = Promise<{ cat?: string; sort?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { cat } = await searchParams;
  if (!cat) return { title: "Goan business directory" };
  const c = (await categories()).find((x) => x.slug === cat);
  return { title: c ? `${clean(c.name)} — Goan businesses in the UK` : "Goan business directory" };
}

export default async function Directory({ searchParams }: { searchParams: SP }) {
  const { cat, sort = "reviews", page = "1" } = await searchParams;
  const p = Math.max(1, parseInt(page) || 1);
  const sb = await supabaseServer();
  const [cats, counts, names] = await Promise.all([categories(), categoryCounts(), catNames()]);
  const current = cat ? cats.find((c) => c.slug === cat) : undefined;

  let q = sb.from("listings")
    .select(current ? LIST_FIELDS + ",listing_categories!inner(category_id)" : LIST_FIELDS, { count: "exact" })
    .eq("status", "published").eq("kind", "business");
  if (current) q = q.eq("listing_categories.category_id", current.id);
  if (sort === "new") q = q.order("created_at", { ascending: false });
  else if (sort === "az") q = q.order("title");
  else if (sort === "rating") q = q.order("avg_rating", { ascending: false, nullsFirst: false }).order("review_count", { ascending: false });
  else q = q.order("review_count", { ascending: false }).order("title");
  const { data, count } = await q.range((p - 1) * PER, p * PER - 1);
  const rows = (data ?? []) as unknown as Listing[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  const link = (o: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    const m = { cat, sort, ...o };
    Object.entries(m).forEach(([k, v]) => v && !(k === "sort" && v === "reviews") && !(k === "page" && v === "1") && s.set(k, v));
    const str = s.toString();
    return "/directory" + (str ? "?" + str : "");
  };
  const visible = cats.filter((c) => (counts.get(c.id) ?? 0) > 0);

  return (
    <>
      <div>
        <h1>{current ? clean(current.name) : "Goan business directory"}</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{count ?? 0} {current ? "listings in this category" : "Goan businesses across the UK"}</p>
      </div>

      <nav className="filters" aria-label="Categories">
        <Link href={link({ cat: undefined, page: undefined })} className={"chip light" + (!current ? " on" : "")}>All</Link>
        {visible.map((c) => (
          <Link key={c.id} href={link({ cat: c.slug, page: undefined })} className={"chip light" + (current?.id === c.id ? " on" : "")}>
            {clean(c.name)} <span style={{ opacity: .6, marginLeft: 4 }}>{counts.get(c.id)}</span>
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>Sort:</span>
        {[["reviews", "Most reviewed"], ["rating", "Top rated"], ["new", "Newest"], ["az", "A–Z"]].map(([k, v]) => (
          <Link key={k} href={link({ sort: k, page: undefined })} className={"chip light" + (sort === k ? " on" : "")}>{v}</Link>
        ))}
      </div>

      {rows.length ? (
        <div className="grid3">{rows.map((l) => <ListingCard key={l.id} l={l} cat={current ? undefined : names.get(l.id)} />)}</div>
      ) : (
        <div className="card empty">
          <Icon name={current ? catIcon(current.slug) : "dir"} size={30} />
          <p style={{ marginTop: 10 }}>Nothing here yet. Know a Goan business that belongs here?</p>
          <Link href="/post" className="btn btn-yellow" style={{ marginTop: 14 }}>Add a listing</Link>
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Pages">
          {p > 1 && <Link className="btn btn-ghost btn-sm" href={link({ page: String(p - 1) })}>← Previous</Link>}
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Page {p} of {pages}</span>
          {p < pages && <Link className="btn btn-ghost btn-sm" href={link({ page: String(p + 1) })}>Next →</Link>}
        </nav>
      )}
    </>
  );
}
