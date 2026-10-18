"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

/** Share buttons: phone share sheet when available, plus WhatsApp, Facebook and copy link. */
export default function Share({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = "https://goapages.com" + path;
  const text = `${title} — on GoaPages`;
  async function native() {
    try { await navigator.share({ title, text, url }); } catch { /* cancelled */ }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }
  const [canNative, setCanNative] = useState(false);
  useEffect(() => setCanNative("share" in navigator), []);
  return (
    <span className="share">
      {canNative && <button type="button" className="btn btn-ghost" onClick={native}><Icon name="arrow" />Share</button>}
      <a className="btn btn-ghost share-wa" href={`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp"><Icon name="chat" /><span>WhatsApp</span></a>
      <a className="btn btn-ghost share-fb" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener" aria-label="Share on Facebook"><Icon name="globe" /><span>Facebook</span></a>
      <button type="button" className="btn btn-ghost" onClick={copy} aria-live="polite"><Icon name={copied ? "check" : "list"} />{copied ? "Copied" : "Copy link"}</button>
    </span>
  );
}
