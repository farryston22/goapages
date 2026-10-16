import Link from "next/link";
export default function NotFound() {
  return (
    <div className="card empty">
      <h1>Page not found</h1>
      <p style={{ marginTop: 8 }}>It may have moved when we rebuilt the site.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        <Link href="/" className="btn btn-primary">Home</Link><Link href="/directory" className="btn btn-ghost">Directory</Link>
      </div>
    </div>
  );
}
