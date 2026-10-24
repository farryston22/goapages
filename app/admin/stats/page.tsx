import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import StatsView, { RangeTabs, type Stats } from "@/components/StatsView";
import AiQuestions, { type AiStats } from "@/components/AiQuestions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site stats", robots: { index: false } };

export default async function SiteStats({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  const days = [1, 7, 30, 90, 365].includes(Number(d)) ? Number(d) : 30;
  const { sb, user, role } = await currentUser();
  if (!user) redirect("/login?next=/admin/stats");
  if (role !== "admin") return <div className="card empty"><h1>Admins only</h1></div>;
  const [{ data, error }, ai] = await Promise.all([sb.rpc("site_stats", { days }), sb.rpc("ai_query_stats", { days })]);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div><h1>Site stats</h1><p style={{ color: "var(--muted)", marginTop: 6 }}>Who’s visiting GoaPages, where from, and what they tap. Counted without cookies; no IP addresses are kept.</p></div>
        <Link href="/admin" className="btn btn-ghost">← Approvals</Link>
      </div>
      <RangeTabs days={days} href={(n) => `/admin/stats?days=${n}`} />
      {error || !data ? <div className="notice bad">Couldn’t load the stats: {error?.message ?? "no data"}</div> : <StatsView s={data as Stats} />}
      {ai.error || !ai.data
        ? <div className="notice bad">Couldn’t load the AI questions: {ai.error?.message ?? "no data"}</div>
        : <AiQuestions s={ai.data as AiStats} days={days} />}
    </>
  );
}
