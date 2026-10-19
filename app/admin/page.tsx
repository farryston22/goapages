import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { moderateClaim, moderateListing, moderateReview } from "./actions";
import { currentUser } from "@/lib/supabase/server";
import { clean, plain } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function Btns({ action, id, yes = "published", yesLabel = "Approve", no = "rejected", reason = false }: { action: (f: FormData) => Promise<void>; id: string | number; yes?: string; yesLabel?: string; no?: string; reason?: boolean }) {
  return (
    <div className="acts">
      <form action={action}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={yes} /><button className="btn btn-ok btn-sm" type="submit">✓ {yesLabel}</button></form>
      <form action={action} className="reject-form"><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={no} />{reason && <input name="reason" maxLength={500} placeholder="Reason (optional, emailed to them)" aria-label="Reason for rejecting (optional, emailed to them)" />}<button className="btn btn-bad btn-sm" type="submit">✕ Reject</button></form>
    </div>
  );
}

export default async function Admin() {
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (role !== "admin") return <div className="card empty"><h1>Admins only</h1><p style={{ marginTop: 8 }}>You’re signed in as {user.email}, which isn’t an admin account.</p></div>;
  const [pl, pr, pc, cPub, cRev, cUsers, hidden] = await Promise.all([
    sb.from("listings").select("id,title,slug,kind,tagline,description,phone,email,website,area,created_at,owner_id").eq("status", "pending").order("created_at"),
    sb.from("reviews").select("id,author_name,rating,body,created_at,listings(title,slug)").eq("status", "pending").order("created_at"),
    sb.from("claim_requests").select("id,note,created_at,user_id,listings(title,slug)").eq("status", "pending").order("created_at"),
    sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("listings").select("id,title,slug,status").in("status", ["hidden", "rejected"]).order("title").limit(100),
  ]);
  type R = { id: number; author_name: string | null; rating: number | null; body: string | null; listings: { title: string; slug: string } | null; note?: string | null };
  const listings = pl.data ?? [];
  const reviews = (pr.data ?? []) as unknown as R[];
  const claims = (pc.data ?? []) as unknown as R[];
  const owners = new Map<string, string>();
  const ids = [...new Set([...listings.map((l) => l.owner_id), ...((pc.data ?? []) as { user_id: string }[]).map((c) => c.user_id)].filter(Boolean))] as string[];
  if (ids.length) {
    const { data } = await sb.from("profiles").select("id,email").in("id", ids);
    (data ?? []).forEach((p: { id: string; email: string }) => owners.set(p.id, p.email));
  }
  return (
    <>
      <div><h1>Approvals</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Nothing new goes live until you approve it.</p></div>
      <div className="statgrid">
        <div className="card pad"><b>{listings.length + reviews.length + claims.length}</b><span>waiting for you</span></div>
        <div className="card pad"><b>{cPub.count ?? 0}</b><span>live listings</span></div>
        <div className="card pad"><b>{cRev.count ?? 0}</b><span>live reviews</span></div>
        <div className="card pad"><b>{cUsers.count ?? 0}</b><span>members</span></div>
      </div>

      <section className="card pad" aria-labelledby="pl-h">
        <h2 id="pl-h">New listings ({listings.length})</h2>
        {listings.length === 0 && <p style={{ color: "var(--muted)", paddingTop: 8 }}>All clear.</p>}
        {listings.map((l) => (
          <div className="qitem" key={l.id}>
            <div className="info">
              <Link href={`/listing/${l.slug}`} style={{ fontWeight: 700 }}>{clean(l.title)}</Link>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{l.kind} · {l.area || "no area"} · {l.phone || l.email || l.website || "no contact"}{l.owner_id && owners.get(l.owner_id) ? ` · by ${owners.get(l.owner_id)}` : ""}</span>
              <p>{clean(l.tagline) || plain(l.description).slice(0, 220)}</p>
            </div>
            <Btns action={moderateListing} id={l.id} reason />
          </div>
        ))}
      </section>

      <section className="card pad" aria-labelledby="pr-h">
        <h2 id="pr-h">New reviews ({reviews.length})</h2>
        {reviews.length === 0 && <p style={{ color: "var(--muted)", paddingTop: 8 }}>All clear.</p>}
        {reviews.map((r) => (
          <div className="qitem" key={r.id}>
            <div className="info">
              <span style={{ fontWeight: 700 }}>{clean(r.author_name) || "Member"} {r.rating != null ? <span className="stars">★ {r.rating}</span> : <span className="badge soft">no rating</span>} on {r.listings ? <Link href={`/listing/${r.listings.slug}`}>{clean(r.listings.title)}</Link> : "?"}</span>
              <p>{plain(r.body).slice(0, 600)}</p>
            </div>
            <Btns action={moderateReview} id={r.id} />
          </div>
        ))}
      </section>

      <section className="card pad" aria-labelledby="pc-h">
        <h2 id="pc-h">Claim requests ({claims.length})</h2>
        {claims.length === 0 && <p style={{ color: "var(--muted)", paddingTop: 8 }}>All clear.</p>}
        {claims.map((c) => (
          <div className="qitem" key={c.id}>
            <div className="info">
              <span style={{ fontWeight: 700 }}>{owners.get((c as unknown as { user_id: string }).user_id) ?? "Member"} wants {c.listings ? <Link href={`/listing/${c.listings.slug}`}>{clean(c.listings.title)}</Link> : "?"}</span>
              {c.note && <p>“{c.note}”</p>}
            </div>
            <Btns action={moderateClaim} id={c.id} yes="approved" yesLabel="Give them the listing" reason />
          </div>
        ))}
      </section>

      <details className="card pad">
        <summary style={{ fontWeight: 700, cursor: "pointer" }}>Hidden & rejected listings ({(hidden.data ?? []).length})</summary>
        {(hidden.data ?? []).map((l) => (
          <div className="qitem" key={l.id}>
            <div className="info"><Link href={`/listing/${l.slug}`}>{clean(l.title)}</Link><span className="badge soft" style={{ alignSelf: "flex-start" }}>{l.status}</span></div>
            <form action={moderateListing}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="published" /><button className="btn btn-ghost btn-sm" type="submit">Put live</button></form>
          </div>
        ))}
      </details>
    </>
  );
}
