import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Sidebar, TabBar } from "@/components/Nav";
import Icon from "@/components/Icon";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://goapages.com"),
  title: { default: "GoaPages — the UK Goan community directory", template: "%s · GoaPages" },
  description: "Find Goan businesses, caterers, bands, MCs, photographers and more across the UK. Buy, sell and rent within the Goan community.",
  openGraph: { siteName: "GoaPages", type: "website", locale: "en_GB" },
};
export const viewport: Viewport = { themeColor: "#242C41", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false, signedIn = false;
  try {
    const { user, role } = await currentUser();
    signedIn = !!user; isAdmin = role === "admin";
  } catch { /* auth unavailable: render signed-out */ }
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main" className="sr">Skip to content</a>
        <div className="shell">
          <Sidebar isAdmin={isAdmin} />
          <div className="main">
            <header className="top">
              <Link href="/" className="mlogo" aria-label="GoaPages home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="GoaPages" width={150} height={47} />
              </Link>
              <form action="/search" role="search">
                <Icon name="search" />
                <label htmlFor="q-top" className="sr">Search GoaPages</label>
                <input id="q-top" name="q" type="search" placeholder="Search caterers, bands, MCs, areas…" />
                <button className="btn btn-primary btn-sm" type="submit">Search</button>
              </form>
              <div className="right">
                {isAdmin && <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
                {signedIn
                  ? <Link href="/my" className="btn btn-ghost btn-sm">My account</Link>
                  : <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>}
                <Link href="/post" className="btn btn-yellow btn-sm"><Icon name="plus" size={16} />Add listing</Link>
              </div>
            </header>
            <main id="main" className="content">{children}</main>
            <footer className="foot">
              <span>© {new Date().getFullYear()} GoaPages UK</span>
              <Link href="/directory">Directory</Link>
              <Link href="/advertise">Advertise</Link>
              <Link href="/about">About & contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </footer>
          </div>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
