import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/components/Icon";
import { setListingStatus, signOut } from "@/app/actions";
import { currentUser } from "@/lib/supabase/server";
import { clean, type Listing } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My listings" };

const badge: Record<string, string> = { published: "ok", pending: "", rejected: "bad", hidden: "soft", sold: "soft", expired: "soft" };

export default async function My({ searchParams }: { searchParams: Promise<{ posted?: string; saved?: string }> }) {
  const sp = await searchParams;
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=/my");
  const [{ data: ls }, { data: claims }, { data: revs }] = await Promise.all([
    sb.from("listings").select("id,title,slug,status,kind,review_count,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }),
    sb.from("claim_requests").select("id,status,created_at,listings(title,slug)").eq("user_id", user.id),
    sb.from("reviews").select("id,status,rating,created_at,listings(title,slug)").eq("author_id", user.id).order("created_at", { ascending: false }),
  ]);
  const listings = (ls ?? []) as unknown as Listing[];
  type J = { id: number; status: string; listings: { title: string; slug: string } | null };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div><h1>My listings</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Signed in as {user.email}{role === "admin" ? " · admin" : ""}</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/post" className="btn btn-yellow"><Icon name="plus" />Add a listing</Link>
          <form action={signOut}><button className="btn btn-ghost" type="submit"><Icon name="logout" />Sign out</button></form>
        </div>
      </div>
      {sp.posted && <div className="notice ok">Thanks! Your listing has been sent for checking. It goes live once it’s approved.</div>}
      {sp.saved && <div className="notice ok">Changes saved.</div>}
      <section className="card pad">
        {listings.length === 0 ? (
          <div className="empty"><p>You don’t have any listings yet.</p><p style={{ fontSize: 14, marginTop: 6 }}>Already on GoaPages? Open your listing and press “Claim this listing”.</p></div>
        ) : listings.map((l) => (
          <div className="qitem" key={l.id}>
            <div className="info">
              <Link href={`/listing/${l.slug}`} style={{ fontWeight: 700 }}>{clean(l.title)}</Link>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><span className={"badge " + (badge[l.status] ?? "soft")}>{l.status.toUpperCase()}</span>{l.review_count > 0 && <span className="badge soft">{l.review_count} reviews</span>}</div>
            </div>
            <div className="acts">
              <Link className="btn btn-ghost btn-sm" href={`/post?id=${l.id}`}>Edit</Link>
              {l.status === "published" && (
                <form action={setListingStatus}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="hidden" /><button className="btn btn-ghost btn-sm" type="submit">Hide</button></form>
              )}
            </div>
          </div>
        ))}
      </section>
      {((claims ?? []).length > 0 || (revs ?? []).length > 0) && (
        <div className="split">
          <section className="card pad"><h2 style={{ marginBottom: 8 }}>Claim requests</h2>
            {((claims ?? []) as unknown as J[]).map((c) => <div className="qitem" key={c.id}><div className="info">{c.listings?.title ? clean(c.listings.title) : "Listing"}</div><span className={"badge " + (c.status === "approved" ? "ok" : c.status === "rejected" ? "bad" : "")}>{c.status.toUpperCase()}</span></div>)}
            {(claims ?? []).length === 0 && <p style={{ color: "var(--muted)" }}>None.</p>}
          </section>
          <section className="card pad"><h2 style={{ marginBottom: 8 }}>My reviews</h2>
            {((revs ?? []) as unknown as J[]).map((r) => <div className="qitem" key={r.id}><div className="info">{r.listings ? <Link href={`/listing/${r.listings.slug}`}>{clean(r.listings.title)}</Link> : "Listing"}</div><span className={"badge " + (r.status === "published" ? "ok" : r.status === "rejected" ? "bad" : "")}>{r.status.toUpperCase()}</span></div>)}
            {(revs ?? []).length === 0 && <p style={{ color: "var(--muted)" }}>None.</p>}
          </section>
        </div>
      )}
    </>
  );
}
