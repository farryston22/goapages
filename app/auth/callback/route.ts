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
  return NextResponse.redirect(new URL(ok ? next : "/login?err=link", url.origin));
}
