"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/supabase/server";
import { emailClaimApproved, emailClaimRejected, emailListingApproved, emailListingRejected, emailNewReviewForOwner, emailReviewApproved, emailReviewRejected } from "@/lib/email";

async function admin() {
  const ctx = await currentUser();
  if (!ctx.user || ctx.role !== "admin") redirect("/login?next=/admin");
  return ctx;
}

type Sb = Awaited<ReturnType<typeof admin>>["sb"];
async function emailOf(sb: Sb, userId: string | null | undefined) {
  if (!userId) return null;
  const { data } = await sb.from("profiles").select("email").eq("id", userId).maybeSingle();
  return (data?.email as string | undefined) ?? null;
}

export async function moderateListing(form: FormData) {
  const { sb, user } = await admin();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["published", "rejected", "hidden"].includes(status)) return;
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500) || null;
  const { data: before } = await sb.from("listings").select("status,title,slug,owner_id").eq("id", id).maybeSingle();
  await sb.from("listings").update({ status }).eq("id", id);
  await sb.from("moderation_log").insert({ listing_id: id, action: status, actor: user!.email, reason });
  // Tell the member only when a listing they submitted is decided (not when the admin hides/unhides one).
  if (before && before.status === "pending" && before.owner_id !== user!.id) {
    const to = await emailOf(sb, before.owner_id);
    if (to && status === "published") await emailListingApproved(to, before);
    if (to && status === "rejected") await emailListingRejected(to, before, reason);
  }
  revalidatePath("/admin");
}

export async function moderateReview(form: FormData) {
  const { sb, user } = await admin();
  const status = String(form.get("status"));
  if (!["published", "rejected"].includes(status)) return;
  const id = Number(form.get("id"));
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500) || null;
  const { data: r } = await sb.from("reviews").select("status,author_id,rating,listing_id,listings(title,slug,owner_id)").eq("id", id).maybeSingle();
  await sb.from("reviews").update({ status }).eq("id", id);
  if (r?.listing_id) await sb.from("moderation_log").insert({ listing_id: r.listing_id, action: `review_${status}`, actor: user!.email, reason });
  const l = r?.listings as unknown as { title: string; slug: string; owner_id: string | null } | null;
  // Tell the reviewer (and, when it goes live, the listing's owner) only when a pending review is decided.
  if (r && l && r.status === "pending") {
    if (r.author_id && r.author_id !== user!.id) {
      const to = await emailOf(sb, r.author_id);
      if (to && status === "published") await emailReviewApproved(to, l);
      if (to && status === "rejected") await emailReviewRejected(to, l, reason);
    }
    if (status === "published" && l.owner_id && l.owner_id !== r.author_id && l.owner_id !== user!.id) {
      const owner = await emailOf(sb, l.owner_id);
      if (owner) await emailNewReviewForOwner(owner, l, r.rating as number | null);
    }
  }
  revalidatePath("/admin");
}

export async function moderateClaim(form: FormData) {
  const { sb } = await admin();
  const id = Number(form.get("id"));
  const approve = form.get("status") === "approved";
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500) || null;
  const { data: c } = await sb.from("claim_requests").select("listing_id,user_id,status,listings(title,slug)").eq("id", id).single();
  if (!c) return;
  if (approve) await sb.from("listings").update({ owner_id: c.user_id, claimed: true }).eq("id", c.listing_id);
  await sb.from("claim_requests").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
  const l = c.listings as unknown as { title: string; slug: string } | null;
  if (c.status === "pending" && l) {
    const to = await emailOf(sb, c.user_id);
    if (to) await (approve ? emailClaimApproved(to, l) : emailClaimRejected(to, l, reason));
  }
  revalidatePath("/admin");
}
