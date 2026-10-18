import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { addReview, requestClaim, reviewWithEmail } from "@/app/actions";
import { kindConfig } from "@/lib/kinds";
import { DAYS, clean, hoursText, img, initials, plain, price, siteHref, socialsList, telHref, waHref, type Listing, type Review } from "@/lib/util";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ review?: string; claim?: string }> };

async function load(slug: string) {
  const sb = await supabaseServer();
  const { data } = await sb.from("listings").select("*").eq("slug", decodeURIComponent(slug)).maybeSingle();
  return data as Listing | null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = await load((await params).slug);
  if (!l) return { title: "Not found" };
  const d = clean(l.tagline) || plain(l.description).slice(0, 155);
  const cover = img(l.cover_url) || img(l.logo_url);
  return { title: clean(l.title), description: d, openGraph: { title: clean(l.title), description: d, images: cover ? [cover] : undefined } };
}

function ytEmbed(u: string | null) {
  if (!u) return null;
  const m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function ReviewItem({ r }: { r: Review }) {
  const n = r.rating != null ? Math.round(Number(r.rating)) : null;
  return (
    <article className="review">
      <div className="who"><span className="av" aria-hidden="true">{initials(clean(r.author_name) || "G")}</span>{clean(r.author_name) || "GoaPages member"}
        {n != null && <span className="stars" style={{ marginLeft: "auto" }} aria-label={`${r.rating} out of 5`}>{"★".repeat(n)}<span style={{ color: "#D6DAE3" }}>{"★".repeat(5 - n)}</span></span>}
      </div>
      {r.body && <p>{plain(r.body)}</p>}
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
    </article>
  );
}

export default async function ListingPage({ params, searchParams }: P) {
  const { slug } = await params;
  const sp = await searchParams;
  const l = await load(slug);
  if (!l) notFound();
  const { sb, user, role } = await currentUser();
  const [{ data: rv }, { data: ph }, { data: lc }] = await Promise.all([
    sb.from("reviews").select("id,author_name,rating,body,created_at,status").eq("listing_id", l.id).eq("status", "published").order("created_at", { ascending: false }),
    sb.from("listing_photos").select("url,position").eq("listing_id", l.id).order("position"),
    sb.from("listing_categories").select("categories(name,slug)").eq("listing_id", l.id),
  ]);
  const reviews = (rv ?? []) as Review[];
  const photos = (ph ?? []).map((p: { url: string }) => img(p.url)).filter(Boolean) as string[];
  const cats = (lc ?? []).map((r) => (r as unknown as { categories: { name: string; slug: string } | null }).categories).filter(Boolean) as { name: string; slug: string }[];
  const title = clean(l.title);
  const cover = img(l.cover_url), logo = img(l.logo_url);
  const desc = plain(l.description);
  const yt = ytEmbed(l.video_url);
  const socials = socialsList(l.socials);
  const hours = l.work_hours ?? {};
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const isOwner = user && l.owner_id === user.id;
  const canEdit = isOwner || role === "admin";
  const cfg = kindConfig(l.kind);
  const isBiz = l.kind === "business";
  const isObit = l.kind === "obituary";
  const attrs = (l.attributes ?? {}) as Record<string, unknown>;
  const fmt = (t: string | undefined, v: string) => t === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? new Date(v + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : v;
  const details = (cfg?.fields ?? []).filter((f) => attrs[f.key] != null && String(attrs[f.key]).trim())
    .map((f) => ({ label: f.label.replace(/ \(venues\)$/, ""), value: fmt(f.type, String(attrs[f.key])), url: f.type === "url" }));

  const jsonLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: title, description: clean(l.tagline) || undefined,
    telephone: l.phone || undefined, email: l.email || undefined, url: l.website ? siteHref(l.website) : undefined,
    address: l.address ? { "@type": "PostalAddress", streetAddress: l.address, addressCountry: "GB" } : undefined,
    aggregateRating: l.review_count ? { "@type": "AggregateRating", ratingValue: Number(l.avg_rating ?? 0).toFixed(1), reviewCount: l.review_count } : undefined,
  };

  return (
    <>
      {isBiz && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {l.status !== "published" && (
        <div className="notice">This listing is <b>{l.status}</b> — only you{role === "admin" ? " (admin)" : ""} can see it.{l.status === "pending" ? " It goes live once it’s approved." : ""}</div>
      )}
      <div>
        <div className="ld-cover" style={cover ? { backgroundImage: `url("${cover}")` } : undefined} />
        <div className="ld-head">
          <div className="ld-logo" style={logo ? { backgroundImage: `url("${logo}")` } : undefined} aria-hidden="true">{!logo && initials(title)}</div>
          <div className="ld-title">
            <h1>{title}</h1>
            {isObit && <p style={{ color: "var(--muted-2)" }}>In loving memory{attrs.born || attrs.died ? " · " + [attrs.born, attrs.died].map((d) => d ? String(d).slice(0, 4) : "").join(" – ") : ""}{attrs.from ? " · " + String(attrs.from) : ""}</p>}
            {l.tagline && <p style={{ color: "var(--muted-2)" }}>{clean(l.tagline)}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {l.review_count > 0 && <span className="stars">★ {Number(l.avg_rating ?? 0).toFixed(1)} <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {l.review_count} reviews</span></span>}
              {cats.map((c) => <Link key={c.slug} href={`/directory?cat=${c.slug}`} className="badge soft" style={{ textDecoration: "none" }}>{clean(c.name)}</Link>)}
              {l.claimed && <span className="badge ok"><Icon name="check" size={12} />Owner-managed</span>}
              {l.price_pence != null && <span className="badge navy">{price(l.price_pence, l.price_period)}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="ld-actions">
        {l.phone && <a className="btn btn-primary" href={telHref(l.phone)}><Icon name="phone" />Call</a>}
        {(l.whatsapp || l.phone) && <a className="btn btn-yellow" href={waHref(l.whatsapp || l.phone!)} target="_blank" rel="noopener"><Icon name="chat" />WhatsApp</a>}
        {l.email && <a className="btn btn-ghost" href={`mailto:${l.email}`}><Icon name="mail" />Email</a>}
        {l.website && <a className="btn btn-ghost" href={siteHref(l.website)} target="_blank" rel="noopener"><Icon name="globe" />Website</a>}
        {canEdit && <Link className="btn btn-ghost" href={`/post?id=${l.id}`}>Edit listing</Link>}
      </div>

      <div className="ld-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {desc && <section className="card pad" aria-labelledby="about-h"><h2 id="about-h" style={{ marginBottom: 10 }}>About</h2><p className="desc">{desc}</p></section>}
          {details.length > 0 && (
            <section className="card pad" aria-labelledby="det-h">
              <h2 id="det-h" style={{ marginBottom: 10 }}>{isObit ? "Funeral and family" : "Details"}</h2>
              <dl className="details">
                {details.map((d) => (
                  <div key={d.label}><dt>{d.label}</dt><dd>{d.url ? <a href={siteHref(d.value)} target="_blank" rel="noopener">Open link</a> : d.value}</dd></div>
                ))}
              </dl>
            </section>
          )}
          {yt && <section className="card pad"><h2 style={{ marginBottom: 10 }}>Video</h2><div style={{ aspectRatio: "16/9", borderRadius: 14, overflow: "hidden" }}><iframe src={yt} title={`${title} video`} style={{ width: "100%", height: "100%", border: 0 }} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div></section>}
          {photos.length > 0 && <section className="card pad"><h2 style={{ marginBottom: 10 }}>Photos</h2><div className="gallery">{photos.map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={p} src={p} alt="" loading="lazy" />)}</div></section>}

          {isBiz && <section className="card pad" id="reviews" aria-labelledby="rev-h">
            <div className="sec-head" style={{ marginBottom: 4 }}><h2 id="rev-h">Reviews {reviews.length ? `(${reviews.length})` : ""}</h2></div>
            {sp.review === "sent" && <div className="notice ok">Thanks! Your review will appear once it’s been checked.</div>}
            {sp.review === "short" && <div className="notice bad">Please write a little more (at least 10 characters).</div>}
            {sp.review === "error" && <div className="notice bad">Sorry, that didn’t save. Please try again.</div>}
            {sp.review === "email" && <div className="notice bad">Please enter a valid email address.</div>}
            {sp.review === "check" && <div className="notice ok"><b>Nearly done — check your email.</b> Tap the link we sent you to confirm it’s really you. Your review is then sent for approval.</div>}
            {reviews.length === 0 && <p style={{ color: "var(--muted)", padding: "10px 0" }}>No reviews yet — be the first.</p>}
            {reviews.slice(0, 8).map((r) => <ReviewItem key={r.id} r={r} />)}
            {reviews.length > 8 && (
              <details>
                <summary className="btn btn-ghost btn-sm" style={{ display: "inline-flex", listStyle: "none", margin: "10px 0" }}>Show all {reviews.length} reviews</summary>
                {reviews.slice(8).map((r) => <ReviewItem key={r.id} r={r} />)}
              </details>
            )}
            <details style={{ marginTop: 14 }}>
              <summary className="btn btn-primary" style={{ display: "inline-flex", listStyle: "none" }}>Write a review</summary>
              {user ? (
                <form action={addReview} className="form" style={{ marginTop: 14 }}>
                  <input type="hidden" name="listing_id" value={l.id} />
                  <input type="hidden" name="slug" value={l.slug} />
                  <div className="row2">
                    <div className="field"><label htmlFor="rv-name">Your name</label><input id="rv-name" name="name" maxLength={60} placeholder="As you’d like it shown" /></div>
                    <div className="field"><label htmlFor="rv-rating">Rating</label>
                      <select id="rv-rating" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}</select></div>
                  </div>
                  <div className="field"><label htmlFor="rv-body">Your review</label><textarea id="rv-body" name="body" required minLength={10} maxLength={3000} placeholder="What was it like?" /></div>
                  <button className="btn btn-yellow" type="submit" style={{ alignSelf: "flex-start" }}>Send review</button>
                </form>
              ) : (
                <form action={reviewWithEmail} className="form" style={{ marginTop: 14 }}>
                  <input type="hidden" name="listing_id" value={l.id} />
                  <input type="hidden" name="slug" value={l.slug} />
                  <div className="row2">
                    <div className="field"><label htmlFor="rv-name2">Your name</label><input id="rv-name2" name="name" maxLength={60} placeholder="As you’d like it shown" required /></div>
                    <div className="field"><label htmlFor="rv-email">Your email</label><input id="rv-email" name="email" type="email" required autoComplete="email" placeholder="Never shown publicly" /></div>
                  </div>
                  <div className="field"><label htmlFor="rv-rating2">Rating</label>
                    <select id="rv-rating2" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}</select></div>
                  <div className="field"><label htmlFor="rv-body2">Your review</label><textarea id="rv-body2" name="body" required minLength={10} maxLength={2000} placeholder="What was it like?" /></div>
                  <p className="hint" style={{ fontSize: 13, color: "var(--muted)" }}>We’ll email you a link to confirm it’s you — no password needed. Every review is checked before it appears.</p>
                  <button className="btn btn-yellow" type="submit" style={{ alignSelf: "flex-start" }}>Send review</button>
                </form>
              )}
            </details>
          </section>}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="card pad contact" aria-labelledby="ct-h">
            <h2 id="ct-h" style={{ marginBottom: 6 }}>Contact</h2>
            {l.phone && <a href={telHref(l.phone)}><span className="tile"><Icon name="phone" size={16} /></span>{l.phone}</a>}
            {l.whatsapp && <a href={waHref(l.whatsapp)} target="_blank" rel="noopener"><span className="tile"><Icon name="chat" size={16} /></span>WhatsApp {l.whatsapp}</a>}
            {l.email && <a href={`mailto:${l.email}`}><span className="tile"><Icon name="mail" size={16} /></span>{l.email}</a>}
            {l.website && <a href={siteHref(l.website)} target="_blank" rel="noopener"><span className="tile"><Icon name="globe" size={16} /></span>{l.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>}
            {(l.address || l.area) && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address || l.area || "")}`} target="_blank" rel="noopener"><span className="tile"><Icon name="pin" size={16} /></span>{clean(l.address || l.area)}</a>}
            {socials.map((x) => <a key={x.url} href={siteHref(x.url)} target="_blank" rel="noopener"><span className="tile"><Icon name="heart" size={16} /></span>{x.network}</a>)}
            {!l.phone && !l.email && !l.website && !l.whatsapp && <p style={{ color: "var(--muted)", fontSize: 14 }}>No contact details yet.</p>}
          </section>

          {Object.keys(hours).length > 0 && (
            <section className="card pad" aria-labelledby="hr-h">
              <h2 id="hr-h" style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}><Icon name="clock" />Opening hours</h2>
              <div className="kv">{DAYS.filter((d) => hours[d]).map((d) => <div key={d} className={d === today ? "today" : ""}><span>{d}{d === today ? " (today)" : ""}</span>{hoursText(hours[d])}</div>)}</div>
            </section>
          )}

          {isBiz && !l.claimed && !isOwner && (
            <section className="card pad">
              <h3>Is this your business?</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "6px 0 12px" }}>Claim it to update details, add photos and reply to customers. Free.</p>
              {sp.claim === "sent" ? <div className="notice ok">Request sent — we’ll be in touch.</div>
                : sp.claim === "dup" ? <div className="notice">You’ve already asked to claim this one.</div>
                : user ? (
                  <form action={requestClaim} className="form">
                    <input type="hidden" name="listing_id" value={l.id} /><input type="hidden" name="slug" value={l.slug} />
                    <div className="field"><label htmlFor="cl-note">How can we confirm it’s yours?</label><input id="cl-note" name="note" placeholder="e.g. I’m the owner, my number is…" /></div>
                    <button className="btn btn-primary" type="submit">Claim this listing</button>
                  </form>
                ) : <Link className="btn btn-primary" href={`/login?next=/listing/${l.slug}`}>Sign in to claim</Link>}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
