"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/supabase/server";

async function admin() {
  const ctx = await currentUser();
  if (!ctx.user || ctx.role !== "admin") redirect("/login?next=/admin");
  return ctx;
}

export async function moderateListing(form: FormData) {
  const { sb, user } = await admin();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["published", "rejected", "hidden"].includes(status)) return;
  await sb.from("listings").update({ status }).eq("id", id);
  await sb.from("moderation_log").insert({ listing_id: id, action: status, actor: user!.email, reason: String(form.get("reason") ?? "") || null });
  revalidatePath("/admin");
}

export async function moderateReview(form: FormData) {
  const { sb } = await admin();
  const status = String(form.get("status"));
  if (!["published", "rejected"].includes(status)) return;
  await sb.from("reviews").update({ status }).eq("id", Number(form.get("id")));
  revalidatePath("/admin");
}

export async function moderateClaim(form: FormData) {
  const { sb } = await admin();
  const id = Number(form.get("id"));
  const approve = form.get("status") === "approved";
  const { data: c } = await sb.from("claim_requests").select("listing_id,user_id").eq("id", id).single();
  if (!c) return;
  if (approve) await sb.from("listings").update({ owner_id: c.user_id, claimed: true }).eq("id", c.listing_id);
  await sb.from("claim_requests").update({ status: approve ? "approved" : "rejected" }).eq("id", id);
  revalidatePath("/admin");
}
