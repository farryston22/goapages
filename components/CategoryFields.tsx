"use client";
import { useEffect } from "react";

/**
 * Shows only the form boxes that fit the chosen category. Boxes are wrapped in
 * <fieldset class="catdep" data-cats="slug slug">; a disabled fieldset is hidden (CSS) and its inputs aren't sent.
 * A section with data-catsection hides when none of its boxes are on.
 */
export default function CategoryFields() {
  useEffect(() => {
    const sel = document.getElementById("category_id") as HTMLSelectElement | null;
    if (!sel) return;
    const apply = () => {
      const slug = sel.selectedOptions[0]?.dataset.slug ?? "";
      document.querySelectorAll<HTMLFieldSetElement>("fieldset.catdep").forEach((f) => {
        f.disabled = !(f.dataset.cats ?? "").split(" ").includes(slug);
      });
      document.querySelectorAll<HTMLElement>("[data-catsection]").forEach((s) => {
        s.hidden = !s.querySelector("fieldset.catdep:not([disabled]), .always");
      });
    };
    sel.addEventListener("change", apply);
    apply();
    return () => sel.removeEventListener("change", apply);
  }, []);
  return null;
}
