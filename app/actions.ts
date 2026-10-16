"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/supabase/server";
import { slugify } from "@/lib/util";

const s = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max) || null;

export async function addReview(form: FormData) {
  const slug = String(form.get("slug"));
  const { sb, user } = await currentUser();
  if (!user) redirect(`/login?next=/listing/${slug}`);
  const rating = Math.min(5, Math.max(1, Number(form.get("rating")) || 5));
  const body = s(form, "body", 3000);
  if (!body || body.length < 10) redirect(`/listing/${slug}?review=short#reviews`);
  const { data: prof } = await sb.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const { error } = await sb.from("reviews").insert({
    listing_id: String(form.get("listing_id")), author_id: user.id, rating, body, status: "pending",
    author_name: s(form, "name", 60) ?? prof?.display_name ?? "GoaPages member",
  });
  redirect(`/listing/${slug}?review=${error ? "error" : "sent"}#reviews`);
}

export async function requestClaim(form: FormData) {
  const slug = String(form.get("slug"));
  const { sb, user } = await currentUser();
  if (!user) redirect(`/login?next=/listing/${slug}`);
  const { error } = await sb.from("claim_requests").insert({ listing_id: String(form.get("listing_id")), user_id: user.id, note: s(form, "note", 500) });
  redirect(`/listing/${slug}?claim=${error ? (error.code === "23505" ? "dup" : "error") : "sent"}`);
}

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function saveListing(form: FormData) {
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=/post");
  const id = s(form, "id");
  const title = s(form, "title", 120);
  if (!title) redirect(`/post?err=title${id ? "&id=" + id : ""}`);
  const kind = (s(form, "kind") ?? "business") as string;
  const priceRaw = s(form, "price", 12);
  const hours: Record<string, string> = {};
  DAY.forEach((d) => {
    const v = s(form, "h_" + d, 20);
    if (v) hours[d] = v;
  });
  const row: Record<string, unknown> = {
    kind, title,
    tagline: s(form, "tagline", 160),
    description: s(form, "description", 8000),
    area: s(form, "area", 80),
    address: s(form, "address", 200),
    phone: s(form, "phone", 30),
    whatsapp: s(form, "whatsapp", 30),
    email: s(form, "email", 120),
    website: s(form, "website", 200),
    video_url: s(form, "video_url", 300),
    socials: ["Facebook", "Instagram", "TikTok", "YouTube"].map((n) => ({ network: n, url: s(form, n.toLowerCase(), 200) })).filter((x) => x.url),
    work_hours: Object.keys(hours).length ? hours : null,
    price_pence: priceRaw ? Math.round(parseFloat(priceRaw.replace(/[£,]/g, "")) * 100) || null : null,
    price_period: s(form, "price_period", 20),
    logo_url: s(form, "logo_url", 500),
    cover_url: s(form, "cover_url", 500),
  };
  const catId = Number(form.get("category_id")) || null;
  let listingId = id;
  if (id) {
    const { error } = await sb.from("listings").update(row).eq("id", id);
    if (error) redirect(`/post?id=${id}&err=save`);
  } else {
    row.slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    row.status = role === "admin" ? "published" : "pending";
    row.owner_id = user.id;
    const { data, error } = await sb.from("listings").insert(row).select("id").single();
    if (error || !data) redirect("/post?err=save");
    listingId = data.id;
  }
  if (catId && listingId) {
    await sb.from("listing_categories").delete().eq("listing_id", listingId);
    await sb.from("listing_categories").insert({ listing_id: listingId, category_id: catId });
  }
  revalidatePath("/my");
  redirect(id ? "/my?saved=1" : "/my?posted=1");
}

export async function setListingStatus(form: FormData) {
  const { sb, user } = await currentUser();
  if (!user) redirect("/login");
  const status = String(form.get("status"));
  if (!["sold", "hidden"].includes(status)) return;
  await sb.from("listings").update({ status }).eq("id", String(form.get("id")));
  revalidatePath("/my");
}

export async function signOut() {
  const { sb } = await currentUser();
  await sb.auth.signOut();
  redirect("/");
}
