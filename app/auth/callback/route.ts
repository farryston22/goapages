import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const n = url.searchParams.get("next") ?? "/my";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/my";
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const sb = await supabaseServer();
  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (token_hash && type) ok = !(await sb.auth.verifyOtp({ token_hash, type })).error;
  if (ok) {
    const raw = req.cookies.get("gp_pending_review")?.value;
    if (raw) {
      try {
        const p = JSON.parse(raw) as { listing_id: string; rating: number; body: string; name: string | null };
        const { data: u } = await sb.auth.getUser();
        if (u.user && p.listing_id && p.body) {
          const { data: prof } = await sb.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
          await sb.from("reviews").insert({
            listing_id: p.listing_id, author_id: u.user.id, rating: p.rating, body: p.body, status: "pending",
            author_name: p.name || prof?.display_name || "GoaPages member",
          });
        }
      } catch { /* ignore bad cookie */ }
    }
  }
  const res = NextResponse.redirect(new URL(ok ? next : "/login?err=link", url.origin));
  res.cookies.delete("gp_pending_review");
  return res;
}
