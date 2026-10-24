// "What people asked" on /admin/stats — renders ai_query_stats() (supabase/migrations/20261025000000_ai_queries.sql).

export type AiStats = {
  total: number; failed: number; no_results: number;
  top: { question: string; n: number }[];
  recent: { at: string; question: string; outcome: "answered" | "fallback" | "error"; results: number | null; city: string | null; device: string | null }[];
};

const nf = new Intl.NumberFormat("en-GB");
const OUTCOME: Record<string, string> = { answered: "Answered", fallback: "No AI (search only)", error: "AI failed" };
const when = (at: string) => new Date(at).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AiQuestions({ s, days }: { s: AiStats; days: number }) {
  const period = days === 1 ? "today" : `in the last ${days} days`;
  return (
    <section className="card pad" id="ai-questions">
      <h2>What people asked GoaPages AI</h2>
      <p className="st-sub">{nf.format(s.total)} questions {period}. Questions are kept for 90 days.</p>

      {s.failed > 0 && (
        <div className="notice bad" style={{ margin: "10px 0" }}>
          {nf.format(s.failed)} question{s.failed === 1 ? "" : "s"} {period} didn’t get an AI answer — people saw “the assistant is busy”.
          Check the Anthropic key and credit, and Workers logs (“anthropic error”).
        </div>
      )}
      {s.no_results > 0 && (
        <p className="st-sub" style={{ marginTop: 6 }}>
          {nf.format(s.no_results)} found no matching listing — look for “No listing” below for businesses worth adding.
        </p>
      )}

      {s.top.some((t) => t.n > 1) && (
        <>
          <h3 style={{ margin: "14px 0 6px", fontSize: 15 }}>Asked most often</h3>
          <ul className="st-bars">
            {s.top.filter((t) => t.n > 1).map((t) => {
              const max = Math.max(...s.top.map((x) => x.n), 1);
              return (
                <li key={t.question}>
                  <span className="st-bar" style={{ width: `${(t.n / max) * 100}%` }} aria-hidden="true" />
                  <span className="st-k">{t.question}</span>
                  <span className="st-n">{nf.format(t.n)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h3 style={{ margin: "14px 0 6px", fontSize: 15 }}>Latest questions</h3>
      {s.recent.length ? (
        <div className="st-table-wrap"><table className="st-table">
          <thead><tr><th>When</th><th>Question</th><th>Result</th><th>Where</th></tr></thead>
          <tbody>{s.recent.map((r, i) => (
            <tr key={r.at + i}>
              <td style={{ whiteSpace: "nowrap", fontWeight: 400 }}>{when(r.at)}</td>
              <td style={{ fontWeight: 400 }}>{r.question}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <span className={"ai-tag " + r.outcome}>{OUTCOME[r.outcome] ?? r.outcome}</span>
                {r.results === 0 && <span className="ai-tag none">No listing</span>}
              </td>
              <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{[r.city, r.device].filter(Boolean).join(" · ") || "–"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="st-empty">No questions yet. They’ll appear here as people use the Ask box.</p>}
    </section>
  );
}
