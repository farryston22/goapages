"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sends page views, ad impressions and contact/ad clicks to /api/track (see that file for privacy notes).
// No cookies, nothing stored in the browser.

type Ev = { type: string; path: string; ref?: string; utm?: string | null; action?: string; ad?: string };

function send(events: Ev[]) {
  if (!events.length) return;
  const body = JSON.stringify({ events });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* fall through */ }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

function clickAction(href: string): string | null {
  if (href.startsWith("tel:")) return "call";
  if (href.startsWith("mailto:")) return "email";
  if (/wa\.me|whatsapp\.com/i.test(href)) return "whatsapp";
  if (/google\.[^/]+\/maps|maps\.apple|goo\.gl\/maps/i.test(href)) return "directions";
  if (/instagram\.com|facebook\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com/i.test(href)) return "social";
  if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?goapages\.com/i.test(href)) return "website";
  return null;
}

let firstView = true;

export default function Tracker() {
  const path = usePathname() || "/";

  useEffect(() => {
    const search = window.location.search;
    const utm = new URLSearchParams(search).get("utm_source");
    // Only the first page of a visit has a meaningful referrer; later pages are inside GoaPages.
    const ref = firstView ? document.referrer : "";
    firstView = false;
    const t = setTimeout(() => {
      const ads = Array.from(new Set(Array.from(document.querySelectorAll<HTMLElement>("[data-ad-id]")).map((el) => el.dataset.adId!)));
      send([{ type: "view", path: path + search, ref, utm }, ...ads.map((ad) => ({ type: "ad_view", path, ad }))]);
    }, 300);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const here = window.location.pathname;
      const ad = a.closest<HTMLElement>("[data-ad-id]")?.dataset.adId;
      if (ad) return send([{ type: "ad_click", path: here, ad }]);
      if (!here.startsWith("/listing/")) return;
      const action = clickAction(a.getAttribute("href") ?? "");
      if (action) send([{ type: "click", path: here, action }]);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
