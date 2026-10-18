import Link from "next/link";
import Icon, { catIcon } from "@/components/Icon";
import ListingCard from "@/components/ListingCard";
import AskBox from "@/components/AskBox";
import { upcomingEvents } from "@/lib/events";
import Follow from "@/components/Follow";
import { supabaseServer } from "@/lib/supabase/server";
import { categories, categoryCounts, catNames } from "@/lib/data";
import { LIST_FIELDS, clean, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";

type Ad = { id: number; placement: string; advertiser: string | null; title: string; body: string | null; link_url: string | null; image_url: string | null };

export default async function Home() {
  const sb = await supabaseServer();
  const [loved, fresh, events, cats, counts, names, totals, ads] = await Promise.all([
    sb.from("listings").select(LIST_FIELDS).eq("status", "published").eq("kind", "business").order("review_count", { ascending: false }).order("avg_rating", { ascending: false }).limit(6),
    sb.from("listings").select(LIST_FIELDS).eq("status", "published").eq("kind", "business").order("created_at", { ascending: false }).limit(6),
    upcomingEvents(sb, 3),
    categories(),
    categoryCounts(),
    catNames(),
    sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("ads").select("*").in("placement", ["home_banner", "home_card"]),
  ]);
  const topCats = cats.filter((c) => (counts.get(c.id) ?? 0) > 0).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)).slice(0, 6);
  const banner = ((ads.data ?? []) as Ad[]).find((a) => a.placement === "home_banner");
  const L = (x: { data: unknown }) => (x.data ?? []) as Listing[];

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="badge">UK GOAN COMMUNITY</span>
          <h1 id="hero-h" style={{ marginTop: 14 }}>Ask anything <em>Goan</em>.</h1>
          <p className="lead">GoaPages AI searches everything for you.</p>
          <AskBox />
        </div>
        <div className="stats" aria-label="GoaPages in numbers">
          <div className="stat"><b>{totals.count ?? "—"}</b><span>Goan businesses listed</span></div>
          <div className="stat"><b>{topCats.length ? cats.filter((c) => (counts.get(c.id) ?? 0) > 0).length : "—"}</b><span>categories</span></div>
        </div>
      </section>

      {banner ? (
        <aside className="adstrip" aria-label="Sponsored">
          <div>
            <div className="k">SPONSORED{banner.advertiser ? ` · ${banner.advertiser}` : ""}</div>
            <h3>{banner.title}</h3>
            {banner.body && <p>{banner.body}</p>}
          </div>
          {banner.link_url && <a className="btn btn-primary" href={banner.link_url} rel="sponsored noopener" target="_blank">Find out more</a>}
        </aside>
      ) : null}

      <section aria-labelledby="cats-h">
        <div className="sec-head">
          <div><h2 id="cats-h">Browse by category</h2><p>Everything for Goan weddings, parties and everyday life.</p></div>
          <Link href="/directory">All categories →</Link>
        </div>
        <div className="grid4 cats">
          {topCats.map((c) => (
            <Link key={c.id} href={`/directory?cat=${c.slug}`} className="card cat">
              <span className="tile"><Icon name={catIcon(c.slug)} /></span>
              <span>{clean(c.name)}<small>{counts.get(c.id)} listings</small></span>
            </Link>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section aria-labelledby="ev-h">
          <div className="sec-head"><div><h2 id="ev-h">Events</h2><p>What’s on for the Goan community.</p></div><Link href="/events">All events →</Link></div>
          <div className="grid3">{events.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        </section>
      )}

      <section aria-labelledby="loved-h">
        <div className="sec-head">
          <div><h2 id="loved-h">Most loved</h2><p>The businesses with the most community reviews.</p></div>
          <Link href="/directory?sort=reviews">See all →</Link>
        </div>
        <div className="grid3">{L(loved).map((l) => <ListingCard key={l.id} l={l} cat={names.get(l.id)} />)}</div>
      </section>

      <Follow />

      <section className="split" aria-label="Marketplace and property">
        <div className="soon">
          <span className="badge" style={{ alignSelf: "flex-start" }}>NEW · COMING SOON</span>
          <h2 style={{ color: "#fff" }}>Goan Marketplace</h2>
          <p>Buy and sell within the community — clothes, furniture, baby things, home-made sweets and event tickets.</p>
          <Link href="/marketplace" className="btn btn-yellow" style={{ alignSelf: "flex-start" }}><Icon name="shop" />Take a look</Link>
        </div>
        <div className="soon" style={{ background: "#fff", color: "var(--navy)", border: "1px solid var(--line-2)" }}>
          <span className="badge navy" style={{ alignSelf: "flex-start" }}>NEW · COMING SOON</span>
          <h2>Property & rooms</h2>
          <p style={{ color: "var(--muted)" }}>Rooms to rent, flats to let and homes for sale — from Goans, for Goans.</p>
          <Link href="/homes" className="btn btn-primary" style={{ alignSelf: "flex-start" }}><Icon name="key" />Take a look</Link>
        </div>
      </section>

      <section aria-labelledby="new-h">
        <div className="sec-head">
          <div><h2 id="new-h">Recently added</h2><p>New to GoaPages.</p></div>
          <Link href="/directory?sort=new">See all →</Link>
        </div>
        <div className="grid3">{L(fresh).map((l) => <ListingCard key={l.id} l={l} cat={names.get(l.id)} />)}</div>
      </section>

      <aside className="adstrip" aria-label="Advertise with GoaPages">
        <div>
          <div className="k">FOR GOAN BUSINESSES</div>
          <h3>Get your business in front of the UK Goan community</h3>
          <p>Free listing. Featured spots and homepage banners available.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/post">Add your business</Link>
          <Link className="btn btn-ghost" style={{ borderColor: "var(--navy)" }} href="/advertise">Advertise</Link>
        </div>
      </aside>
    </>
  );
}

