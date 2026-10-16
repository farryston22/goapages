"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const toUrl = (u: string) => (u.startsWith("wp:") ? "/img/" + u.slice(3).replace(/\.(jpe?g|png|gif|webp|jfif)$/i, ".webp") : u);

export default function ImageUpload({ name, label, initial, userId, wide }: { name: string; label: string; initial?: string | null; userId: string; wide?: boolean }) {
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr("Please choose a photo under 5 MB."); return; }
    setBusy(true); setErr("");
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z]/g, "");
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const sb = supabaseBrowser();
    const { error } = await sb.storage.from("listing-images").upload(path, f, { contentType: f.type, upsert: false });
    if (error) setErr("Upload failed — please try again.");
    else setValue(sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }
  const id = "up-" + name;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input type="hidden" name={name} value={value} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: wide ? 180 : 80, height: 80, borderRadius: 12, border: "1px dashed #CDD3E0", background: value ? `#fff center/cover no-repeat url("${toUrl(value)}")` : "var(--bg)", flex: "none" }} aria-hidden="true" />
        <input id={id} type="file" accept="image/*" onChange={pick} disabled={busy} style={{ minHeight: 0, border: 0, padding: 0, width: "auto" }} />
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setValue("")}>Remove</button>}
      </div>
      {busy && <span className="hint">Uploading…</span>}
      {err && <span className="hint" style={{ color: "var(--bad)" }}>{err}</span>}
    </div>
  );
}
