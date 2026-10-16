import { supabaseServer } from "./supabase/server";
import { LIST_FIELDS, type Category, type Listing } from "./util";

export async function categories(kind = "business") {
  const sb = await supabaseServer();
  const { data } = await sb.from("categories").select("*").eq("kind", kind).order("sort").order("name");
  return (data ?? []) as Category[];
}

/** category counts for published listings */
export async function categoryCounts() {
  const sb = await supabaseServer();
  const { data } = await sb.from("listing_categories").select("category_id, listings!inner(status)").eq("listings.status", "published");
  const m = new Map<number, number>();
  (data ?? []).forEach((r: { category_id: number }) => m.set(r.category_id, (m.get(r.category_id) ?? 0) + 1));
  return m;
}

export async function catNames() {
  const sb = await supabaseServer();
  const [{ data: cats }, { data: links }] = await Promise.all([
    sb.from("categories").select("id,name"),
    sb.from("listing_categories").select("listing_id,category_id"),
  ]);
  const name = new Map<number, string>((cats ?? []).map((c: { id: number; name: string }) => [c.id, c.name]));
  const byListing = new Map<string, string>();
  (links ?? []).forEach((r: { listing_id: string; category_id: number }) => {
    if (!byListing.has(r.listing_id)) byListing.set(r.listing_id, name.get(r.category_id) ?? "");
  });
  return byListing;
}

export type Card = Pick<Listing, "id" | "kind" | "status" | "title" | "slug" | "tagline" | "area" | "logo_url" | "cover_url" | "avg_rating" | "review_count" | "category_id" | "price_pence" | "price_period" | "featured_until" | "created_at">;
export { LIST_FIELDS };
