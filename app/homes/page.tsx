import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
export const metadata: Metadata = { title: "Property & rooms" };
export default function Page() {
  return <ComingSoon icon="key" title="Property & rooms" lead="Rooms to rent, flats to let and homes for sale — from Goans, for Goans, across the UK."
    cats={["Room to rent", "To let", "For sale", "Hounslow", "Swindon", "Wembley", "Southall", "Hayes"]}
    points={["Landlords and sellers list for free, with photos, rent and area.", "Search by town, price and bills included.", "Every listing is checked by us before it goes live."]} />;
}
