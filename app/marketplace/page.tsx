import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
export const metadata: Metadata = { title: "Goan Marketplace" };
export default function Page() {
  return <ComingSoon icon="shop" title="Goan Marketplace" lead="Buy and sell within the UK Goan community — like Facebook Marketplace, but just for us, and checked for scams."
    cats={["Clothes & jewellery", "Home & furniture", "Baby & kids", "Electronics", "Cars", "Home-made sweets", "Event tickets", "Free to a good home"]}
    points={["Post an item in a minute from your phone, with photos and a price.", "Message sellers safely without sharing your number.", "Every new post is checked before it goes live, so no spam or scams."]} />;
}
