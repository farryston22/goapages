"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setState("error"); setMsg(error.message); } else setState("sent");
  }
  if (state === "sent") return (
    <div className="notice ok" role="status">
      <b>Check your email.</b> We’ve sent a sign-in link to {email}. Open it on this device to finish signing in.
    </div>
  );
  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <label htmlFor="email">Your email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <span className="hint">No password needed — we’ll email you a link.</span>
      </div>
      {state === "error" && <div className="notice bad" role="alert">{msg || "Something went wrong. Please try again."}</div>}
      <button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
    </form>
  );
}
