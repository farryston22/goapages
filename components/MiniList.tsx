import Link from "next/link";
import { clean, img, initials, price, type Listing } from "@/lib/util";

/** Compact list of the latest posts, used inside the homepage Marketplace / Property cards. */
export default function MiniList({ rows, dark }: { rows: Listing[]; dark?: boolean }) {
  if (!rows.length) return null;
  return (
    <ul className={"mini" + (dark ? " dark" : "")}>
      {rows.map((l) => {
        const cover = img(l.cover_url) || img(l.logo_url);
        const title = clean(l.title);
        const p = l.price_pence != null ? price(l.price_pence, l.price_period) : null;
        return (
          <li key={l.id}>
            <Link href={`/listing/${l.slug}`}>
              <span className="thumb" style={cover ? { backgroundImage: `url("${cover}")` } : undefined} aria-hidden="true">{!cover && initials(title)}</span>
              <span className="txt">
                <strong>{title}</strong>
                <span>{[p, clean(l.area ?? "")].filter(Boolean).join(" · ")}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
