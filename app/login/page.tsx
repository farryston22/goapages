import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; err?: string }> }) {
  const { next: n, err } = await searchParams;
  const next = n && n.startsWith("/") && !n.startsWith("//") ? n : "/my";
  const { user } = await currentUser();
  if (user) redirect(next);
  return (
    <div className="card pad" style={{ maxWidth: 460, width: "100%", margin: "20px auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h1>Sign in</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>To add a listing, write a review or claim your business.</p></div>
      {err && <div className="notice bad">That link didn’t work or has expired. Please ask for a new one.</div>}
      <LoginForm next={next} />
    </div>
  );
}
