import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Shared by /api/track and /api/ask. Cookie-free, no IP stored: the visitor is a hash of
// IP + browser + today's date (+ optional STATS_SALT secret). Location comes from Cloudflare.

export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|monitor/i;

export function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

export async function visitorId(ip: string, ua: string, salt: string) {
  const day = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}|${day}|${ip}|${ua}`));
  return Array.from(new Uint8Array(bytes).slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function visitorInfo(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  let country: string | null = req.headers.get("cf-ipcountry"), city: string | null = null, salt = "goapages";
  try {
    const { cf, env } = await getCloudflareContext({ async: true });
    country = (cf?.country as string | undefined) ?? country;
    city = (cf?.city as string | undefined) ?? null;
    salt = (env as unknown as Record<string, string | undefined>).STATS_SALT ?? salt;
  } catch { /* not on Cloudflare (local dev) */ }
  if (country === "XX" || country === "T1") country = null;
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return { ua, bot: !ua || BOT.test(ua), country, city, device: device(ua), visitor: await visitorId(ip, ua, salt) };
}
