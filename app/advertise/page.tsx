import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
export const metadata: Metadata = { title: "Advertise on GoaPages" };
const plans = [
  { name: "Free listing", price: "£0", pts: ["Your business in the directory", "Reviews from the community", "Contact buttons: call, WhatsApp, email"], cta: "Add your business", href: "/post" },
  { name: "Featured", price: "from £15/mo", pts: ["Top of your category", "Featured badge", "Shown in “Most loved” rotations"], cta: "Ask about Featured", href: "mailto:contact@fnunes.co.uk?subject=Featured%20listing%20on%20GoaPages" },
  { name: "Homepage banner", price: "from £40/mo", pts: ["Banner on the homepage", "Seen by every visitor", "Great for events and launches"], cta: "Ask about banners", href: "mailto:contact@fnunes.co.uk?subject=Homepage%20banner%20on%20GoaPages" },
];
export default function Page() {
  return (
    <>
      <div><h1>Advertise with GoaPages</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Reach the UK Goan community where they look for weddings, parties, food and services.</p></div>
      <div className="grid3">
        {plans.map((p, i) => (
          <div key={p.name} className="card pad" style={{ display: "flex", flexDirection: "column", gap: 12, ...(i === 1 ? { background: "var(--navy)", color: "#fff" } : {}) }}>
            <h2 style={i === 1 ? { color: "#fff" } : undefined}>{p.name}</h2>
            <b style={{ fontFamily: "var(--font-head)", fontSize: 26, color: i === 1 ? "var(--yellow)" : undefined }}>{p.price}</b>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {p.pts.map((x) => <li key={x} style={{ display: "flex", gap: 8 }}><Icon name="check" size={16} />{x}</li>)}
            </ul>
            {p.href.startsWith("/") ? <Link href={p.href} className={"btn " + (i === 1 ? "btn-yellow" : "btn-primary")} style={{ marginTop: "auto" }}>{p.cta}</Link>
              : <a href={p.href} className={"btn " + (i === 1 ? "btn-yellow" : "btn-primary")} style={{ marginTop: "auto" }}>{p.cta}</a>}
          </div>
        ))}
      </div>
    </>
  );
}
