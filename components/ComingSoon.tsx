import Link from "next/link";
import Icon from "./Icon";

export default function ComingSoon({ icon, title, lead, points, cats }: { icon: string; title: string; lead: string; points: string[]; cats: string[] }) {
  return (
    <>
      <section className="hero" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="badge">COMING SOON</span>
          <h1 style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}><Icon name={icon} size={30} />{title}</h1>
          <p className="lead">{lead}</p>
          <div className="chips">{cats.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        </div>
      </section>
      <div className="grid3">
        {points.map((p, i) => (
          <div key={i} className="card pad" style={{ display: "flex", gap: 12 }}>
            <span className="badge navy" style={{ height: 26 }}>{i + 1}</span><p>{p}</p>
          </div>
        ))}
      </div>
      <div className="card pad" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div><h3>Want to be first?</h3><p style={{ color: "var(--muted)" }}>Sign in now and you’ll be ready to post the day it opens.</p></div>
        <Link href="/login" className="btn btn-yellow">Sign in</Link>
      </div>
    </>
  );
}
