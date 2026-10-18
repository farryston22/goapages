import type { Metadata } from "next";
import KindList from "@/components/KindList";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Property & rooms" };
export default function Page() {
  return <KindList kinds={["room", "property"]} icon="key" title="Property & rooms" lead="Rooms to rent, flats to let and homes for sale — from Goans, for Goans, across the UK."
    cta={[{ href: "/post?kind=room", label: "List a room" }, { href: "/post?kind=property", label: "List a property" }]} empty="No rooms or properties listed yet — be the first." />;
}
