import Link from "next/link";
import { clean, img, initials, price, type Listing } from "@/lib/util";

export default function ListingCard({ l, cat }: { l: Partial<Listing> & { title: string; slug: string }; cat?: string }) {
  const cover = img(l.cover_url);
  const logo = img(l.logo_url);
  const title = clean(l.title);
  const featured = l.featured_until && new Date(l.featured_until) > new Date();
  return (
    <Link href={`/listing/${l.slug}`} className="card lcard">
      <div className="cover" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
        {!cover && <span className="ph" aria-hidden="true">{initials(title)}</span>}
        {featured && <span className="badge">FEATURED</span>}
      </div>
      <div className="body">
        <div className="logo" style={logo ? { backgroundImage: `url("${logo}")` } : undefined} aria-hidden="true">{!logo && initials(title)}</div>
        <div className="meta">
          <strong>{title}</strong>
          {l.tagline ? <span>{clean(l.tagline)}</span> : null}
          <div className="row" style={{ fontSize: 13, color: "var(--muted)" }}>
            {l.review_count ? <span className="stars">★ {Number(l.avg_rating ?? 0).toFixed(1)} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({l.review_count})</span></span> : null}
            {cat ? <span className="badge soft">{cat}</span> : null}
            {l.price_pence != null ? <b>{price(l.price_pence, l.price_period)}</b> : null}
            {l.area ? <span>{clean(l.area)}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
