import type { Metadata } from "next";
import KindList from "@/components/KindList";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Goan Marketplace" };
export default function Page() {
  return <KindList kinds={["item"]} icon="shop" title="Goan Marketplace" lead="Buy, sell and give away within the UK Goan community. Every post is checked before it goes live."
    cta={[{ href: "/post?kind=item", label: "Sell something" }]} empty="Nothing for sale yet — be the first to post an item." />;
}
