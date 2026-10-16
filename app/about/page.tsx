import type { Metadata } from "next";
export const metadata: Metadata = { title: "About & contact" };
export default function Page() {
  return (
    <div className="card pad" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>About GoaPages</h1>
      <p>GoaPages is the directory for the Goan community in the UK — a place to find trusted Goan businesses and services, read real reviews, and buy, sell and rent within the community.</p>
      <p>Every new listing and review is checked by a person before it goes live.</p>
      <h2 style={{ marginTop: 8 }}>Contact</h2>
      <p>Email <a href="mailto:contact@fnunes.co.uk">contact@fnunes.co.uk</a></p>
    </div>
  );
}
