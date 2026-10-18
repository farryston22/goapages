import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import AutoFill from "@/components/AutoFill";
import Prefill from "@/components/Prefill";
import Icon from "@/components/Icon";
import { saveListing } from "@/app/actions";
import { currentUser, SUPABASE_URL } from "@/lib/supabase/server";
import { categories } from "@/lib/data";
import { KINDS, kindConfig, type Field, type KindConfig } from "@/lib/kinds";
import { DAYS, clean, plain, socialsList, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a listing" };

const PERIOD: Record<string, string> = { once: "One-off", hour: "Hour", event: "Event", person: "Person", week: "Week", month: "Month" };

function FieldInput({ f, value }: { f: Field; value: string }) {
  const id = "a_" + f.key;
  return (
    <div className="field" style={f.type === "textarea" ? { gridColumn: "1 / -1" } : undefined}>
      <label htmlFor={id}>{f.label}</label>
      {f.type === "select" ? (
        <select id={id} name={id} defaultValue={value}><option value="">Choose…</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
      ) : f.type === "textarea" ? (
        <textarea id={id} name={id} defaultValue={value} placeholder={f.placeholder} maxLength={2000} style={{ minHeight: 90 }} />
      ) : (
        <input id={id} name={id} type={f.type ?? "text"} inputMode={f.type === "number" ? "numeric" : undefined} defaultValue={value} placeholder={f.placeholder} maxLength={300} />
      )}
    </div>
  );
}

function Picker({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div style={{ maxWidth: 860, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1>What are you posting?</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{isAdmin ? "As admin, your post goes live straight away." : "Free. We check every post — it usually goes live within a day."}</p>
      </div>
      <AutoFill />
      <div className="or-line"><span>or choose a type</span></div>
      <div className="kind-grid">
        {KINDS.map((k) => (
          <Link key={k.kind} href={`/post?kind=${k.kind}`} className="kind-tile">
            <span className="kind-icon"><Icon name={k.icon} size={22} /></span>
            <span><b>{k.label}</b><small>{k.blurb}</small></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function Post({ searchParams }: { searchParams: Promise<{ id?: string; err?: string; kind?: string; prefill?: string; photo?: string }> }) {
  const sp = await searchParams;
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/post" + (sp.id ? "?id=" + sp.id : sp.kind ? "?kind=" + sp.kind : "")));

  let l: Partial<Listing> = {};
  let catId: number | null = null;
  if (sp.id) {
    const { data } = await sb.from("listings").select("*").eq("id", sp.id).maybeSingle();
    if (!data || (data.owner_id !== user.id && role !== "admin")) redirect("/my");
    l = data as Listing;
    const { data: lc } = await sb.from("listing_categories").select("category_id").eq("listing_id", sp.id).limit(1);
    catId = lc?.[0]?.category_id ?? null;
  }
  const cfg: KindConfig | undefined = kindConfig(sp.id ? l.kind : sp.kind);
  if (!cfg) return <Picker isAdmin={role === "admin"} />;

  const cats = cfg.categoryKind ? await categories(cfg.categoryKind) : [];
  const attrs = (l.attributes ?? {}) as Record<string, unknown>;
  const h = (l.work_hours ?? {}) as Record<string, string>;
  const so = Object.fromEntries(socialsList(l.socials).map((x) => [x.network.toLowerCase(), x.url]));
  const isObit = cfg.kind === "obituary";
  // flyer photo uploaded by auto-fill (only accept our own storage)
  const photo = sp.photo && sp.photo.startsWith(SUPABASE_URL + "/storage/") ? sp.photo : null;
  if (photo && !sp.id) { if (cfg.kind === "event" || cfg.kind === "business") l.cover_url = photo; else l.logo_url = photo; }
  const business = cfg.kind === "business" || cfg.kind === "event";

  return (
    <div style={{ maxWidth: 860, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="kind-chip"><Icon name={cfg.icon} size={16} />{cfg.label}{!sp.id && <Link href="/post">Change</Link>}</div>
        <h1 style={{ marginTop: 10 }}>{sp.id ? "Edit" : isObit ? "Share an obituary" : "Add " + cfg.label.toLowerCase()}</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{sp.id ? "Changes show straight away." : role === "admin" ? "As admin, this goes live straight away." : "We check every post before it goes live — usually within a day."}</p>
      </div>
      {sp.prefill && <div className="notice ok">We’ve filled in what we could from your flyer or message. Please check it and fix anything that’s wrong.</div>}
      {sp.err === "title" && <div className="notice bad">Please fill in the {cfg.titleLabel.toLowerCase()}.</div>}
      {sp.err === "save" && <div className="notice bad">Sorry, that didn’t save. Please try again.</div>}
      <form action={saveListing} className="form">
        {sp.prefill && <Prefill />}
        {sp.id && <input type="hidden" name="id" value={sp.id} />}
        <input type="hidden" name="kind" value={cfg.kind} />
        <section className="card pad form">
          <h2>The basics</h2>
          {cats.length > 0 && (
            <div className="field"><label htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" defaultValue={catId ?? ""}><option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.id}>{clean(c.name)}</option>)}</select></div>
          )}
          <div className="field"><label htmlFor="title">{cfg.titleLabel} *</label><input id="title" name="title" required maxLength={120} defaultValue={clean(l.title)} placeholder={cfg.titlePlaceholder} /></div>
          {business && <div className="field"><label htmlFor="tagline">Short description</label><input id="tagline" name="tagline" maxLength={160} defaultValue={clean(l.tagline)} placeholder="One line — what it is" /></div>}
          <div className="field"><label htmlFor="description">{cfg.aboutLabel}</label><textarea id="description" name="description" maxLength={8000} defaultValue={plain(l.description)} placeholder={cfg.aboutPlaceholder} /></div>
        </section>

        {(cfg.fields.length > 0 || cfg.price) && (
          <section className="card pad form">
            <h2>Details</h2>
            <div className="row2">
              {cfg.price && (
                <div className="field"><label htmlFor="price">{cfg.price.label}</label><input id="price" name="price" inputMode="decimal" defaultValue={l.price_pence != null ? (l.price_pence / 100).toString() : ""} placeholder="0 = free" /></div>
              )}
              {cfg.price?.periods && (
                <div className="field"><label htmlFor="price_period">Per</label>
                  <select id="price_period" name="price_period" defaultValue={l.price_period ?? ""}><option value="">—</option>{cfg.price.periods.map((p) => <option key={p} value={p}>{PERIOD[p]}</option>)}</select></div>
              )}
              {cfg.kind === "room" && <input type="hidden" name="price_period" value="month" />}
              {cfg.fields.map((f) => <FieldInput key={f.key} f={f} value={attrs[f.key] != null ? String(attrs[f.key]) : ""} />)}
            </div>
          </section>
        )}

        <section className="card pad form">
          <h2>{isObit ? "Photo" : "Photos"}</h2>
          <div className="row2">
            <ImageUpload name="logo_url" label={isObit ? "Photo of your loved one" : business ? "Logo or profile photo" : "Main photo"} initial={l.logo_url} userId={user.id} />
            {!isObit && <ImageUpload name="cover_url" label={cfg.kind === "event" ? "Event flyer" : business ? "Cover photo" : "Second photo"} initial={l.cover_url} userId={user.id} wide />}
          </div>
        </section>

        <section className="card pad form">
          <h2>{isObit ? "Where" : "Contact"}</h2>
          <div className="row2">
            {!isObit && <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={l.phone ?? ""} /></div>}
            {!isObit && <div className="field"><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={l.whatsapp ?? ""} placeholder="If different from phone" /></div>}
            {!isObit && <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={l.email ?? ""} /></div>}
            {business && <div className="field"><label htmlFor="website">Website</label><input id="website" name="website" defaultValue={l.website ?? ""} placeholder="www.example.co.uk" /></div>}
            <div className="field"><label htmlFor="area">Town / area</label><input id="area" name="area" defaultValue={l.area ?? ""} placeholder="e.g. Hounslow" /></div>
            {business && <div className="field"><label htmlFor="address">Address (optional)</label><input id="address" name="address" defaultValue={l.address ?? ""} /></div>}
          </div>
        </section>

        {(cfg.socials || cfg.hours) && (
          <details className="card pad">
            <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 30 }}>More (optional): {cfg.hours ? "social links, video, opening hours" : "social links, video"}</summary>
            <div className="form" style={{ marginTop: 14 }}>
              <div className="row2">
                {["facebook", "instagram", "tiktok", "youtube"].map((k) => (
                  <div className="field" key={k}><label htmlFor={k}>{k[0].toUpperCase() + k.slice(1)}</label><input id={k} name={k} defaultValue={so[k] ?? ""} placeholder="Link" /></div>
                ))}
              </div>
              <div className="field"><label htmlFor="video_url">YouTube video link</label><input id="video_url" name="video_url" defaultValue={l.video_url ?? ""} /></div>
              {cfg.hours && (
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Opening hours <span className="hint" style={{ fontWeight: 400 }}>— e.g. 09:00-17:00, closed, open (24h) or by (appointment)</span></legend>
                  <div className="grid4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                    {DAYS.map((d) => <div className="field" key={d}><label htmlFor={"h_" + d}>{d}</label><input id={"h_" + d} name={"h_" + d} defaultValue={h[d] ?? ""} /></div>)}
                  </div>
                </fieldset>
              )}
            </div>
          </details>
        )}

        {cfg.expiresDays && !sp.id && <p className="hint">Your post stays up for {cfg.expiresDays} days. You can renew or mark it sold from My listings.</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-yellow" type="submit">{sp.id ? "Save changes" : isObit ? "Submit for approval" : "Submit"}</button>
          <Link className="btn btn-ghost" href={sp.id ? "/my" : "/post"}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
