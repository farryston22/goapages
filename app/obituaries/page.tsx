import type { Metadata } from "next";
import KindList from "@/components/KindList";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Obituaries" };
export default function Page() {
  return <KindList kinds={["obituary"]} icon="heart" title="Obituaries" lead="Remembering members of the UK Goan community. May they rest in peace."
    cta={[{ href: "/post?kind=obituary", label: "Share an obituary" }]} empty="No obituaries have been shared." />;
}
