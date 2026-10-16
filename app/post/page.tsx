import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { saveListing } from "@/app/actions";
import { currentUser } from "@/lib/supabase/server";
import { categories } from "@/lib/data";
import { DAYS, clean, plain, socialsList, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a listing" };

export default async function Post({ searchParams }: { searchParams: Promise<{ id?: string; err?: string; kind?: string }> }) {
  const sp = await searchParams;
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/post" + (sp.id ? "?id=" + sp.id : "")));
  let l: Partial<Listing> = { kind: sp.kind === "event" ? "event" : "business" };
  let catId: number | null = null;
  if (sp.id) {
    const { data } = await sb.from("listings").select("*").eq("id", sp.id).maybeSingle();
    if (!data || (data.owner_id !== user.id && role !== "admin")) redirect("/my");
    l = data as Listing;
    const { data: lc } = await sb.from("listing_categories").select("category_id").eq("listing_id", sp.id).limit(1);
    catId = lc?.[0]?.category_id ?? null;
  }
  const cats = await categories("business");
  const h = (l.work_hours ?? {}) as Record<string, string>;
  const so = Object.fromEntries(socialsList(l.socials).map((x) => [x.network.toLowerCase(), x.url]));
  return (
    <div style={{ maxWidth: 860, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1>{sp.id ? "Edit listing" : "Add a listing"}</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{sp.id ? "Changes show straight away." : role === "admin" ? "As admin, your listing goes live straight away." : "Free. We check every new listing — it usually goes live within a day."}</p>
      </div>
      {sp.err === "title" && <div className="notice bad">Please give your listing a name.</div>}
      {sp.err === "save" && <div className="notice bad">Sorry, that didn’t save. Please try again.</div>}
      <form action={saveListing} className="form">
        {sp.id && <input type="hidden" name="id" value={sp.id} />}
        <section className="card pad form">
          <h2>The basics</h2>
          <div className="row2">
            <div className="field"><label htmlFor="kind">Type</label>
              <select id="kind" name="kind" defaultValue={l.kind}><option value="business">Business or service</option><option value="event">Event</option></select></div>
            <div className="field"><label htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" defaultValue={catId ?? ""}><option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.id}>{clean(c.name)}</option>)}</select></div>
          </div>
          <div className="field"><label htmlFor="title">Name *</label><input id="title" name="title" required maxLength={120} defaultValue={clean(l.title)} placeholder="e.g. Rosario’s Goan Catering" /></div>
          <div className="field"><label htmlFor="tagline">Short description</label><input id="tagline" name="tagline" maxLength={160} defaultValue={clean(l.tagline)} placeholder="One line — what you do" /></div>
          <div className="field"><label htmlFor="description">About</label><textarea id="description" name="description" maxLength={8000} defaultValue={plain(l.description)} placeholder="Tell people about your business, experience, what’s included…" /></div>
        </section>
        <section className="card pad form">
          <h2>Photos</h2>
          <div className="row2">
            <ImageUpload name="logo_url" label="Logo or profile photo" initial={l.logo_url} userId={user.id} />
            <ImageUpload name="cover_url" label="Cover photo" initial={l.cover_url} userId={user.id} wide />
          </div>
        </section>
        <section className="card pad form">
          <h2>Contact</h2>
          <div className="row2">
            <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={l.phone ?? ""} /></div>
            <div className="field"><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={l.whatsapp ?? ""} placeholder="If different from phone" /></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={l.email ?? ""} /></div>
            <div className="field"><label htmlFor="website">Website</label><input id="website" name="website" defaultValue={l.website ?? ""} placeholder="www.example.co.uk" /></div>
            <div className="field"><label htmlFor="area">Town / area</label><input id="area" name="area" defaultValue={l.area ?? ""} placeholder="e.g. Hounslow" /></div>
            <div className="field"><label htmlFor="address">Address (optional)</label><input id="address" name="address" defaultValue={l.address ?? ""} /></div>
          </div>
        </section>
        <details className="card pad">
          <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 30 }}>More: social links, video, hours, price</summary>
          <div className="form" style={{ marginTop: 14 }}>
            <div className="row2">
              {["facebook", "instagram", "tiktok", "youtube"].map((k) => (
                <div className="field" key={k}><label htmlFor={k}>{k[0].toUpperCase() + k.slice(1)}</label><input id={k} name={k} defaultValue={so[k] ?? ""} placeholder="Link" /></div>
              ))}
            </div>
            <div className="field"><label htmlFor="video_url">YouTube video link</label><input id="video_url" name="video_url" defaultValue={l.video_url ?? ""} /></div>
            <div className="row2">
              <div className="field"><label htmlFor="price">Starting price (£)</label><input id="price" name="price" inputMode="decimal" defaultValue={l.price_pence != null ? (l.price_pence / 100).toString() : ""} /></div>
              <div className="field"><label htmlFor="price_period">Per</label>
                <select id="price_period" name="price_period" defaultValue={l.price_period ?? ""}><option value="">—</option><option value="once">One-off</option><option value="hour">Hour</option><option value="event">Event</option><option value="person">Person</option><option value="week">Week</option><option value="month">Month</option></select></div>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Opening hours <span className="hint" style={{ fontWeight: 400 }}>— e.g. 09:00-17:00, closed, open (24h) or by (appointment)</span></legend>
              <div className="grid4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {DAYS.map((d) => <div className="field" key={d}><label htmlFor={"h_" + d}>{d}</label><input id={"h_" + d} name={"h_" + d} defaultValue={h[d] ?? ""} /></div>)}
              </div>
            </fieldset>
          </div>
        </details>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-yellow" type="submit">{sp.id ? "Save changes" : "Submit listing"}</button>
          <Link className="btn btn-ghost" href="/my">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
