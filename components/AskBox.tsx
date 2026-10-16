"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import ListingCard from "./ListingCard";

type Card = { id: string; title: string; slug: string; tagline: string | null; area: string | null; logo_url: string | null; cover_url: string | null; avg_rating: number | null; review_count: number; cat: string };
type Turn = { q: string; answer?: string; listings?: Card[]; error?: string };


/** Renders plain text with [label](/path) links and line breaks, safely. */
function Answer({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index));
    if (m[3]) parts.push(<b key={k++}>{m[3]}</b>);
    else {
      const href = m[2];
      if (href.startsWith("/")) parts.push(<Link key={k++} href={href}>{m[1]}</Link>);
      else if (/^https?:\/\//.test(href)) parts.push(<a key={k++} href={href} target="_blank" rel="noopener nofollow">{m[1]}</a>);
      else parts.push(m[1]);
    }
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <p style={{ whiteSpace: "pre-line" }}>{parts}</p>;
}

export default function AskBox() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const out = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true); setQ("");
    const history = turns.filter((t) => t.answer).flatMap((t) => [{ role: "user", content: t.q }, { role: "assistant", content: t.answer! }]);
    setTurns((ts) => [...ts, { q: text }]);
    setTimeout(() => out.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: text, history }) });
      const d = await r.json();
      setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, answer: d.answer, listings: d.listings, error: d.error } : t)));
    } catch {
      setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, error: "Sorry, something went wrong. Please try again." } : t)));
    }
    setBusy(false);
  }

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} role="search">
        <label htmlFor="q-hero" className="sr">Ask GoaPages</label>
        <input id="q-hero" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="Ask GoaPages AI…" autoComplete="off" />
        <button className="btn btn-yellow" type="submit" aria-label="Ask" disabled={busy}>{busy ? "…" : <Icon name="arrow" />}</button>
      </form>
      {turns.length > 0 && (
        <div ref={out} className="ask-out" aria-live="polite">
          {turns.map((t, i) => (
            <div key={i} className="ask-turn">
              <div className="ask-q"><Icon name="user" size={14} />{t.q}</div>
              <div className="ask-a">
                <span className="ask-badge"><Icon name="spark" size={14} />GoaPages AI</span>
                {t.error ? <p>{t.error}</p> : t.answer ? <Answer text={t.answer} /> : <p className="ask-dots">Looking through GoaPages<span>.</span><span>.</span><span>.</span></p>}
                {t.listings && t.listings.length > 0 && (
                  <div className="ask-cards">{t.listings.map((l) => <ListingCard key={l.id} l={l} cat={l.cat || undefined} />)}</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="chip" onClick={() => setTurns([])}>Start again</button>
            <Link className="chip" href={`/search?q=${encodeURIComponent(turns[turns.length - 1].q)}`}>See all results</Link>
          </div>
        </div>
      )}
    </>
  );
}
