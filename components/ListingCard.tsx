import Link from "next/link";
import { clean, img, initials, price, type Listing } from "@/lib/util";

export default function ListingCard({ l, cat }: { l: Partial<Listing> & { title: string; slug: string }; cat?: string }) {
  const cover = img(l.cover_url);
  const logo = img(l.logo_url);
  const title = clean(l.title);
  const featured = l.featured_until && new Date(l.featured_until) > new Date();
  // events: show a calendar tile (e.g. NOV 28) instead of initials, and the day + time in the details
  const a = (l.attributes ?? {}) as Record<string, string>;
  const ev = l.kind === "event" && /^\d{4}-\d{2}-\d{2}$/.test(a.date ?? "") ? new Date(a.date + "T12:00:00") : null;
  const when = ev ? ev.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (a.start_time ? " · " + a.start_time.replace(/^(\d\d):(\d\d)$/, (_m, h, m) => `${+h % 12 || 12}${m === "00" ? "" : ":" + m}${+h < 12 ? "am" : "pm"}`) : "") : null;
  return (
    <Link href={`/listing/${l.slug}`} className="card lcard">
      <div className="cover" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
        {!cover && <span className="ph" aria-hidden="true">{initials(title)}</span>}
        {featured && <span className="badge">FEATURED</span>}
      </div>
      <div className="body">
        {ev ? (
          <div className="logo cal" aria-hidden="true"><small>{ev.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</small><b>{ev.getDate()}</b></div>
        ) : (
          <div className="logo" style={logo ? { backgroundImage: `url("${logo}")` } : undefined} aria-hidden="true">{!logo && initials(title)}</div>
        )}
        <div className="meta">
          <strong>{title}</strong>
          {l.tagline ? <span>{clean(l.tagline)}</span> : null}
          {when && <span className="when">{when}</span>}
          <div className="row" style={{ fontSize: 13, color: "var(--muted)" }}>
            {l.review_count ? <span className="stars">★ {Number(l.avg_rating ?? 0).toFixed(1)} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({l.review_count})</span></span> : null}
            {cat ? <span className="badge soft">{cat}</span> : null}
            {l.price_pence != null && l.kind !== "business" ? <b>{price(l.price_pence, l.price_period)}</b> : null}
            {l.area ? <span>{clean(l.area)}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
