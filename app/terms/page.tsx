import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms" };
export default function Page() {
  return (
    <div className="card pad" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Terms of use</h1>
      <p>Listings and reviews must be honest and about real Goan businesses, services, items or homes. No spam, scams, hate, or misleading content.</p>
      <p>We check posts before they go live and may edit or remove anything that breaks these rules. Deals between buyers and sellers are between them — always meet safely and never pay in advance to strangers.</p>
    </div>
  );
}
