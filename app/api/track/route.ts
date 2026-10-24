import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/server";
import { visitorInfo } from "@/lib/visitor";

// Visitor stats collector (components/Tracker.tsx posts here). Cookie-free and no IP is stored:
// the visitor is a hash of IP + browser + today's date (+ optional STATS_SALT secret), so one person
// counts once per day and can't be followed from one day to the next. Location comes from Cloudflare.

export const dynamic = "force-dynamic";

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

type In = { type?: string; path?: string; ref?: string; utm?: string | null; action?: string; ad?: number | string };

export async function POST(req: NextRequest) {
  const v = await visitorInfo(req);
  if (v.bot) return new NextResponse(null, { status: 204 });

  let body: { events?: In[] };
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  const events = (Array.isArray(body.events) ? body.events : []).filter((e) => TYPES.has(String(e.type))).slice(0, 12);
  if (!events.length) return new NextResponse(null, { status: 204 });

  const { country, city, device: dev, visitor } = v;
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
