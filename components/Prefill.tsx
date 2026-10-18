"use client";
import { useEffect } from "react";

/** Fills the "Add a listing" form with what auto-fill found (kept in sessionStorage by AutoFill). */
export default function Prefill() {
  useEffect(() => {
    let data: Record<string, string> = {};
    try { data = JSON.parse(sessionStorage.getItem("gp_prefill") || "{}"); } catch { return; }
    try { sessionStorage.removeItem("gp_prefill"); } catch { /* ignore */ }
    const form = document.querySelector<HTMLFormElement>("form.form");
    if (!form) return;
    for (const [name, raw] of Object.entries(data)) {
      const value = String(raw ?? "").trim();
      if (!value) continue;
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!el || (el as HTMLInputElement).type === "hidden" || "length" in el && !(el instanceof HTMLSelectElement)) continue;
      if (el instanceof HTMLSelectElement) {
        const v = value.toLowerCase();
        const opt = Array.from(el.options).find((o) => o.value && (o.value.toLowerCase() === v || o.text.toLowerCase() === v))
          ?? Array.from(el.options).find((o) => o.value && (o.text.toLowerCase().includes(v) || v.includes(o.text.toLowerCase())));
        if (opt) el.value = opt.value;
      } else if (!el.value) {
        el.value = value;
      }
    }
  }, []);
  return null;
}
