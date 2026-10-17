export type Listing = {
  id: string; kind: string; status: string; title: string; slug: string; tagline: string | null;
  description: string | null; category_id: number | null; price_pence: number | null; price_period: string | null;
  area: string | null; address: string | null; lat: number | null; lng: number | null; country: string | null;
  phone: string | null; email: string | null; whatsapp: string | null; website: string | null; video_url: string | null;
  socials: unknown; work_hours: Record<string, string> | null; attributes: Record<string, unknown> | null;
  logo_url: string | null; cover_url: string | null; featured_until: string | null; claimed: boolean;
  avg_rating: number | null; review_count: number; created_at: string; owner_id: string | null;
};
export type Category = { id: number; kind: string; slug: string; name: string; sort: number };
export type Review = { id: string; author_name: string | null; rating: number | null; body: string | null; created_at: string; status: string };

export const LIST_FIELDS =
  "id,kind,status,title,slug,tagline,area,logo_url,cover_url,avg_rating,review_count,category_id,price_pence,price_period,featured_until,created_at";

const ENT: Record<string, string> = { "&amp;": "&", "&#039;": "'", "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&rsquo;": "’", "&lsquo;": "‘", "&ndash;": "–", "&mdash;": "—" };
export function clean(s: string | null | undefined): string {
  if (!s) return "";
  let out = s;
  for (let i = 0; i < 2; i++) out = out.replace(/&(amp|#0?39|quot|lt|gt|nbsp|rsquo|lsquo|ndash|mdash);/g, (m) => ENT[m] ?? m);
  return out;
}

/** Plain text from legacy WordPress HTML (descriptions). */
export function plain(html: string | null | undefined): string {
  if (!html) return "";
  return clean(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/\[[^\]]+\]/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 'wp:2021/05/x.jpg' → '/img/2021/05/x.webp' (photos moved off WordPress). */
// photos referenced by old listings but missing from the WordPress backup
const MISSING = new Set(["2024/02/MelissaDiasStudio_Logo.jpeg", "2024/02/SerafinoStudioz_logo.jpeg", "2024/02/Viky_Taxi-4.webp", "2024/02/NFCreates_logo.png", "2024/02/Ziabakes-36.webp", "2024/02/Cross_Cross_Cake_6.webp", "2024/02/Viky_Taxi-12.webp", "2024/02/DreamCatchers_logo.jpeg", "2024/02/RoyalMusic_2.png", "2024/02/Cross_Cross_Cake_27.webp", "listing-uploads/cover/2024/02/DjPlacide2.png", "listing-uploads/cover/2024/08/IMG_7043.jpeg", "listing-uploads/logo/2024/02/274986663_669952224457132_2292381209686937716_n-2.webp", "listing-uploads/logo/2024/08/IMG_1582.jpeg"]);

export function img(u: string | null | undefined): string | null {
  if (!u) return null;
  if (u.startsWith("wp:") && MISSING.has(u.slice(3))) return null;
  if (u.startsWith("wp:")) return encodeURI("/img/" + u.slice(3).replace(/\.(jpe?g|png|gif|webp|jfif)$/i, ".webp"));
  return u;
}

export function initials(t: string) {
  return t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export function price(p: number | null, period?: string | null) {
  if (p == null) return "";
  const v = "£" + (p / 100).toLocaleString("en-GB", { maximumFractionDigits: p % 100 ? 2 : 0 });
  return period && period !== "once" ? `${v} / ${period}` : v;
}

export function telHref(p: string) { return "tel:" + p.replace(/[^\d+]/g, ""); }
export function waHref(p: string) {
  let d = p.replace(/\D/g, "");
  if (d.startsWith("0")) d = "44" + d.slice(1);
  return "https://wa.me/" + d;
}
export function siteHref(u: string) { return /^https?:\/\//i.test(u) ? u : "https://" + u; }
export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70);
}
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function hoursText(v: string) {
  if (v === "open") return "Open 24 hours";
  if (v === "closed") return "Closed";
  if (v === "by") return "By appointment";
  return v.replace("-", " – ");
}

export type Social = { network: string; url: string };
/** socials are stored as [{network,url}] (older rows may be {network:url}) */
export function socialsList(x: unknown): Social[] {
  if (Array.isArray(x)) return x.filter((s) => s && typeof s.url === "string" && s.url).map((s) => ({ network: String(s.network || "Link"), url: s.url }));
  if (x && typeof x === "object") return Object.entries(x as Record<string, string>).filter(([, v]) => typeof v === "string" && v).map(([k, v]) => ({ network: k[0].toUpperCase() + k.slice(1), url: v }));
  return [];
}
