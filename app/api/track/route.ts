import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/server";

// Visitor stats collector (components/Tracker.tsx posts here). Cookie-free and no IP is stored:
// the visitor is a hash of IP + browser + today's date (+ optional STATS_SALT secret), so one person
// counts once per day and can't be followed from one day to the next. Location comes from Cloudflare.

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|monitor/i;
const TYPES = new Set(["view", "click", "ad_view", "ad_click"]);

function source(ref: string, utm: string | null): { source: string; referrer: string | null } {
  if (utm) return { source: utm.slice(0, 40), referrer: null };
  if (!ref) return { source: "Direct", referrer: null };
  let host = "";
  try { host = new URL(ref).hostname.toLowerCase(); } catch { return { source: "Direct", referrer: null }; }
  if (!host || host.endsWith("goapages.com")) return { source: "Direct", referrer: null };
  const h = host.replace(/^(www|m|l|lm|out)\./, "");
  const known: [RegExp, string][] = [
    [/(^|\.)google\./, "Google"], [/bing\.com$/, "Bing"], [/duckduckgo\.com$/, "DuckDuckGo"], [/yahoo\./, "Yahoo"],
    [/instagram\.com$/, "Instagram"], [/facebook\.com$|fb\.com$|fb\.me$/, "Facebook"], [/whatsapp\.(com|net)$|wa\.me$/, "WhatsApp"],
    [/youtube\.com$|youtu\.be$/, "YouTube"], [/tiktok\.com$/, "TikTok"], [/t\.co$|twitter\.com$|x\.com$/, "X (Twitter)"],
    [/linkedin\.com$|lnkd\.in$/, "LinkedIn"], [/chatgpt\.com$|openai\.com$|claude\.ai$|perplexity\.ai$/, "AI assistants"],
    [/fotoboothrental\.uk$/, "fotoboothrental.uk"],
  ];
  for (const [re, name] of known) if (re.test(h)) return { source: name, referrer: host };
  return { source: h, referrer: host };
}

function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

async function visitorId(ip: string, ua: string, salt: string) {
  const day = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}|${day}|${ip}|${ua}`));
  return Array.from(new Uint8Array(bytes).slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type In = { type?: string; path?: string; ref?: string; utm?: string | null; action?: string; ad?: number | string };

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let body: { events?: In[] };
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  const events = (Array.isArray(body.events) ? body.events : []).filter((e) => TYPES.has(String(e.type))).slice(0, 12);
  if (!events.length) return new NextResponse(null, { status: 204 });

  let country: string | null = req.headers.get("cf-ipcountry"), city: string | null = null, salt = "goapages";
  try {
    const { cf, env } = await getCloudflareContext({ async: true });
    country = (cf?.country as string | undefined) ?? country;
    city = (cf?.city as string | undefined) ?? null;
    salt = (env as unknown as Record<string, string | undefined>).STATS_SALT ?? salt;
  } catch { /* not on Cloudflare (local dev) */ }
  if (country === "XX" || country === "T1") country = null;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const visitor = await visitorId(ip, ua, salt);
  const dev = device(ua);
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  await Promise.all(events.map((e) => {
    const path = String(e.path ?? "").slice(0, 300);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return null;
    const src = e.type === "view" ? source(String(e.ref ?? ""), e.utm ? String(e.utm) : null) : { source: null, referrer: null };
    return sb.rpc("track_event", { e: {
      type: e.type, path, action: e.action ? String(e.action).slice(0, 20) : null, ad: e.ad ?? null,
      source: src.source, referrer: src.referrer, country, city, device: dev, visitor,
    } });
  }));
  return new NextResponse(null, { status: 204 });
}
