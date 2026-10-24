import Link from "next/link";
import { clean } from "@/lib/util";

// Renders the JSON from site_stats() / listing_stats() (supabase/migrations/20261024213000_analytics.sql).

type KN = { k: string; n: number };
export type Stats = {
  days: number; views: number; visitors: number; clicks: number;
  prev_views: number; prev_visitors: number;
  series: { d: string; views: number; visitors: number }[];
  sources: KN[]; countries: KN[]; cities: KN[]; devices: KN[]; actions: KN[];
  pages?: KN[] | null;
  listings?: { k: string; slug: string; n: number; clicks: number }[] | null;
  ads?: { k: string; placement: string; shown: number; clicks: number }[] | null;
};

const ACTION: Record<string, string> = { call: "Call", whatsapp: "WhatsApp", email: "Email", website: "Website", social: "Social links", directions: "Directions" };
const DEVICE: Record<string, string> = { mobile: "Phone", desktop: "Computer", tablet: "Tablet" };
const PLACEMENT: Record<string, string> = { home_banner: "Homepage top", home_mid: "Homepage middle", directory_banner: "Directory", events_banner: "Events" };
const nf = new Intl.NumberFormat("en-GB");
let regions: Intl.DisplayNames | null = null;
try { regions = new Intl.DisplayNames(["en-GB"], { type: "region" }); } catch { /* old runtime */ }
const countryName = (c: string) => (c === "??" ? "Unknown" : (regions?.of(c) ?? c));

function Change({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="st-chg">{now ? "new" : "–"}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return <span className={"st-chg " + (pct > 0 ? "up" : pct < 0 ? "down" : "")}>{pct > 0 ? "▲" : pct < 0 ? "▼" : ""} {Math.abs(pct)}% on the period before</span>;
}

function Bars({ rows, label = (k: string) => k, empty }: { rows: KN[]; label?: (k: string) => string; empty: string }) {
  if (!rows.length) return <p className="st-empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  const total = rows.reduce((a, r) => a + r.n, 0);
  return (
    <ul className="st-bars">
      {rows.map((r) => (
        <li key={r.k}>
          <span className="st-bar" style={{ width: `${(r.n / max) * 100}%` }} aria-hidden="true" />
          <span className="st-k">{label(r.k)}</span>
          <span className="st-n">{nf.format(r.n)} <small>{Math.round((r.n / total) * 100)}%</small></span>
        </li>
      ))}
    </ul>
  );
}

function Chart({ series }: { series: Stats["series"] }) {
  const W = 720, H = 180, pad = 36;
  const max = Math.max(...series.map((s) => s.views), 4);
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const bw = (W - pad) / series.length;
  const y = (v: number) => H - 22 - (v / top) * (H - 34);
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const every = Math.ceil(series.length / 7);
  return (
    <div className="st-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Page views per day">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={pad} x2={W} y1={y(step * i)} y2={y(step * i)} className="st-grid" />
            <text x={pad - 6} y={y(step * i) + 4} textAnchor="end" className="st-ax">{step * i}</text>
          </g>
        ))}
        {series.map((s, i) => (
          <g key={s.d}>
            <rect x={pad + i * bw + bw * 0.15} y={y(s.views)} width={bw * 0.7} height={Math.max(0, H - 22 - y(s.views))} rx={Math.min(4, bw * 0.2)} className="st-col"><title>{`${fmt(s.d)}: ${s.views} views, ${s.visitors} visitors`}</title></rect>
            <rect x={pad + i * bw + bw * 0.15} y={y(s.visitors)} width={bw * 0.7} height={Math.max(0, H - 22 - y(s.visitors))} rx={Math.min(4, bw * 0.2)} className="st-col2" />
            {i % every === 0 && <text x={pad + i * bw + bw / 2} y={H - 6} textAnchor="middle" className="st-ax">{fmt(s.d)}</text>}
          </g>
        ))}
      </svg>
      <div className="st-legend"><span><i className="st-sw" />Page views</span><span><i className="st-sw v" />Visitors</span></div>
    </div>
  );
}

export function RangeTabs({ days, href }: { days: number; href: (d: number) => string }) {
  return (
    <nav className="filters" aria-label="Time range" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[[1, "Today"], [7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "12 months"]].map(([d, l]) => (
        <Link key={d} href={href(d as number)} className={"chip light" + (days === d ? " on" : "")}>{l}</Link>
      ))}
    </nav>
  );
}

export default function StatsView({ s, listing = false }: { s: Stats; listing?: boolean }) {
  const clicks = s.actions.reduce((a, r) => a + r.n, 0);
  return (
    <>
      <div className="statgrid">
        <div className="card pad"><b>{nf.format(s.views)}</b><span>{listing ? "listing views" : "page views"}</span><Change now={s.views} before={s.prev_views} /></div>
        <div className="card pad"><b>{nf.format(s.visitors)}</b><span>visitors</span><Change now={s.visitors} before={s.prev_visitors} /></div>
        <div className="card pad"><b>{nf.format(clicks)}</b><span>{listing ? "contact clicks" : "contact clicks on listings"}</span></div>
        <div className="card pad"><b>{s.views ? (s.views / Math.max(s.visitors, 1)).toFixed(1) : "–"}</b><span>views per visitor</span></div>
      </div>

      <section className="card pad">
        <h2 style={{ marginBottom: 10 }}>Visits per day</h2>
        <Chart series={s.series} />
      </section>

      <div className="st-grid2">
        <section className="card pad"><h2>Where visitors came from</h2><p className="st-sub">The website or app that sent them</p>
          <Bars rows={s.sources} empty="No visits yet." /></section>
        <section className="card pad"><h2>Towns and cities</h2><p className="st-sub">Approximate, from the visitor’s internet connection</p>
          <Bars rows={s.cities} empty="No visits yet." /></section>
        <section className="card pad"><h2>Countries</h2><p className="st-sub">&nbsp;</p>
          <Bars rows={s.countries} label={countryName} empty="No visits yet." /></section>
        <section className="card pad"><h2>Phone or computer</h2><p className="st-sub">&nbsp;</p>
          <Bars rows={s.devices} label={(k) => DEVICE[k] ?? k} empty="No visits yet." /></section>
        <section className="card pad"><h2>Contact clicks</h2><p className="st-sub">Taps on the contact buttons{listing ? "" : " on any listing"}</p>
          <Bars rows={s.actions} label={(k) => ACTION[k] ?? k} empty="No contact clicks yet." /></section>
        {s.pages && <section className="card pad"><h2>Most visited pages</h2><p className="st-sub">&nbsp;</p>
          <Bars rows={s.pages} label={(k) => (k === "/" ? "Homepage" : k)} empty="No visits yet." /></section>}
      </div>

      {s.listings && (
        <section className="card pad">
          <h2 style={{ marginBottom: 8 }}>Most viewed listings</h2>
          {s.listings.length ? (
            <div className="st-table-wrap"><table className="st-table">
              <thead><tr><th>Listing</th><th>Views</th><th>Contact clicks</th></tr></thead>
              <tbody>{s.listings.map((l) => <tr key={l.slug}><td><Link href={`/listing/${l.slug}`}>{clean(l.k)}</Link></td><td>{nf.format(l.n)}</td><td>{nf.format(l.clicks)}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="st-empty">No listing views yet.</p>}
        </section>
      )}

      {s.ads && (
        <section className="card pad">
          <h2 style={{ marginBottom: 8 }}>Banner ads</h2>
          {s.ads.length ? (
            <div className="st-table-wrap"><table className="st-table">
              <thead><tr><th>Advertiser</th><th>Slot</th><th>Times shown</th><th>Clicks</th><th>Click rate</th></tr></thead>
              <tbody>{s.ads.map((a) => <tr key={a.k + a.placement}><td>{a.k}</td><td>{PLACEMENT[a.placement] ?? a.placement}</td><td>{nf.format(a.shown)}</td><td>{nf.format(a.clicks)}</td><td>{a.shown ? ((a.clicks / a.shown) * 100).toFixed(1) + "%" : "–"}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="st-empty">No ad views yet.</p>}
          <p className="st-sub" style={{ marginTop: 8 }}>Handy to show advertisers what they got for their money.</p>
        </section>
      )}
    </>
  );
}
