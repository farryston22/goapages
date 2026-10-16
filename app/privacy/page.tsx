import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };
export default function Page() {
  return (
    <div className="card pad" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Privacy</h1>
      <p>We collect only what we need to run GoaPages: your email address when you sign in, and the details you choose to put in listings and reviews.</p>
      <p>Business contact details you publish are shown publicly so customers can reach you. We never sell your data. We use only essential cookies to keep you signed in.</p>
      <p>To see, change or delete your data, email <a href="mailto:contact@fnunes.co.uk">contact@fnunes.co.uk</a>.</p>
    </div>
  );
}
