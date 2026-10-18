import type { SupabaseClient } from "@supabase/supabase-js";
import { LIST_FIELDS, type Listing } from "./util";

// Events keep their date/time/venue in listings.attributes (see lib/kinds.ts).
export const EVENT_FIELDS = LIST_FIELDS + ",attributes";

/** Today's date in the UK as YYYY-MM-DD. */
export function ukToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

export const eventDate = (l: Partial<Listing>) => {
  const d = (l.attributes as Record<string, unknown> | null)?.date;
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
};

/** Published events that haven't happened yet, soonest first (undated ones last). */
export async function upcomingEvents(sb: SupabaseClient, limit = 60) {
  const { data } = await sb.from("listings").select(EVENT_FIELDS).eq("status", "published").eq("kind", "event").limit(200);
  const today = ukToday();
  return ((data ?? []) as unknown as Listing[])
    .filter((l) => { const d = eventDate(l); return !d || d >= today; })
    .sort((a, b) => (eventDate(a) ?? "9999").localeCompare(eventDate(b) ?? "9999"))
    .slice(0, limit);
}
