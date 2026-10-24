import Link from "next/link";
import Icon from "./Icon";

// Scrolling "Advertise here" strip under the top bar on every page (layout.tsx).
// Pure CSS animation (.ticker in globals.css); stops moving for visitors who ask for reduced motion.
const MESSAGES = [
  "Your business could be here",
  "Get seen by the UK Goan community",
  "Featured spots from £15 a month",
  "Homepage banners from £40 a month",
  "Caterers, bands, DJs, cakes, decor: advertise with GoaPages",
  "Free listing for every Goan business",
];

function Run({ hidden }: { hidden?: boolean }) {
  return (
    <span className="ticker-run" aria-hidden={hidden || undefined}>
      {MESSAGES.map((m) => (
        <span key={m} className="ticker-item">
          <span className="ticker-dot" aria-hidden="true">★</span>{m}
        </span>
      ))}
    </span>
  );
}

export default function AdTicker() {
  return (
    <Link href="/advertise" className="ticker" aria-label="Advertise on GoaPages: featured spots from £15, homepage banners from £40">
      <span className="ticker-badge"><Icon name="megaphone" size={16} />ADVERTISE HERE</span>
      <span className="ticker-track">
        <span className="ticker-move"><Run /><Run hidden /></span>
      </span>
      <span className="ticker-cta">Advertise now →</span>
    </Link>
  );
}
