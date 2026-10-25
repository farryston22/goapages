"use client";
import { useEffect } from "react";

// Banner videos are muted autoplay, but iPhones in Low Power Mode (and some data-saver modes) block autoplay
// and would show a native play button over the ad. We hide that button in CSS (.adslot-media video) and start
// the videos on the visitor's first touch or click anywhere, which those modes allow.
export default function AdVideoKick() {
  useEffect(() => {
    const play = () => document.querySelectorAll<HTMLVideoElement>(".adslot-media video").forEach((v) => {
      if (v.paused && v.offsetParent !== null) v.play().catch(() => {});
    });
    play();
    const once = () => { play(); window.removeEventListener("touchstart", once); window.removeEventListener("pointerdown", once); };
    window.addEventListener("touchstart", once, { passive: true });
    window.addEventListener("pointerdown", once, { passive: true });
    return () => { window.removeEventListener("touchstart", once); window.removeEventListener("pointerdown", once); };
  }, []);
  return null;
}
