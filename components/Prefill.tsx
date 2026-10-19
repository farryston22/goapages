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
    // Category first: it decides which boxes are switched on (components/CategoryFields).
    const entries = Object.entries(data).sort(([a], [b]) => (b === "category_id" ? 1 : 0) - (a === "category_id" ? 1 : 0));
    for (const [name, raw] of entries) {
      const value = String(raw ?? "").trim();
      if (!value) continue;
      let el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | RadioNodeList | null;
      // same name in several category-only boxes (e.g. price): use the one that's switched on
      if (el instanceof RadioNodeList) el = (Array.from(el) as HTMLInputElement[]).find((x) => !x.disabled) ?? null;
      if (!el || (el as HTMLInputElement).disabled || (el as HTMLInputElement).type === "hidden") continue;
      if (el instanceof HTMLSelectElement) {
        const v = value.toLowerCase();
        const opt = Array.from(el.options).find((o) => o.value && (o.value.toLowerCase() === v || o.text.toLowerCase() === v))
          ?? Array.from(el.options).find((o) => o.value && (o.text.toLowerCase().includes(v) || v.includes(o.text.toLowerCase())));
        if (opt) { el.value = opt.value; el.dispatchEvent(new Event("change", { bubbles: true })); }
      } else if (!el.value) {
        el.value = value;
      }
    }
  }, []);
  return null;
}
