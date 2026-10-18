"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Shrink a photo before sending it to the AI (keeps uploads fast on mobile data). */
async function shrink(file: File, max = 1600): Promise<{ b64: string; type: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.85);
  return { b64: url.split(",")[1], type: "image/jpeg" };
}

export default function AutoFill() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    if (!file && text.trim().length < 15) { setErr("Add a photo of your flyer, or paste a few lines about it."); return; }
    setBusy(true); setErr("");
    try {
      let photo = "";
      let image: { b64: string; type: string } | undefined;
      if (file) {
        if (file.size > 12 * 1024 * 1024) throw new Error("Please choose a photo under 12 MB.");
        image = await shrink(file);
        // keep the flyer as the post's photo
        const sb = supabaseBrowser();
        const { data: u } = await sb.auth.getUser();
        if (u.user) {
          const blob = await (await fetch("data:image/jpeg;base64," + image.b64)).blob();
          const path = `${u.user.id}/${Date.now()}-flyer.jpg`;
          const up = await sb.storage.from("listing-images").upload(path, blob, { contentType: "image/jpeg" });
          if (!up.error) photo = sb.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        }
      }
      const r = await fetch("/api/autofill", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text.trim(), image }) });
      const d = await r.json();
      if (!r.ok || !d.kind) throw new Error(d.error || "Sorry, we couldn’t read that. Please choose a type below instead.");
      try { sessionStorage.setItem("gp_prefill", JSON.stringify(d.fields ?? {})); } catch { /* ignore */ }
      router.push(`/post?kind=${d.kind}&prefill=1${photo ? "&photo=" + encodeURIComponent(photo) : ""}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="autofill" aria-labelledby="af-h">
      <div className="af-head">
        <span className="af-badge"><Icon name="spark" size={14} />Quickest way</span>
        <h2 id="af-h">Got a flyer or a message? We’ll fill it in for you</h2>
        <p>Snap or upload a flyer, or paste a WhatsApp message. GoaPages AI works out what it is and fills the form — you just check it.</p>
      </div>
      <div className="af-row">
        <button type="button" className={"af-drop" + (file ? " has" : "")} onClick={() => fileRef.current?.click()}>
          <Icon name={file ? "check" : "camera"} size={22} />
          <span>{file ? file.name.slice(0, 28) : "Add flyer photo"}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(""); }} />
        <label htmlFor="af-text" className="sr">Paste a message</label>
        <textarea id="af-text" value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} maxLength={3000}
          placeholder="…or paste a message, e.g. “Goan Christmas Dance, Sat 20 Dec, 7pm, St Mary’s Hall Hounslow, £25, tickets 07…”" />
      </div>
      {err && <p className="af-err" role="alert">{err}</p>}
      <button type="button" className="btn btn-yellow" onClick={go} disabled={busy}>
        {busy ? "Reading it…" : <><Icon name="spark" size={16} />Fill it in for me</>}
      </button>
    </section>
  );
}
