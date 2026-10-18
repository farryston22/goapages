"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

type Item = { href: string; label: string; icon: string };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Discover", items: [
    { href: "/", label: "Home", icon: "home" },
    { href: "/directory", label: "Directory", icon: "dir" },
    { href: "/search", label: "Search", icon: "search" },
    { href: "/events", label: "Events", icon: "cal" },
    { href: "/obituaries", label: "Obituaries", icon: "heart" },
  ] },
  { title: "Buy, sell & rent", items: [
    { href: "/marketplace", label: "Marketplace", icon: "shop" },
    { href: "/homes", label: "Property & rooms", icon: "key" },
  ] },
  { title: "You", items: [
    { href: "/post", label: "Add a listing", icon: "plus" },
    { href: "/my", label: "My listings", icon: "user" },
    { href: "/advertise", label: "Advertise", icon: "megaphone" },
  ] },
];

function on(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname() || "/";
  const groups = isAdmin
    ? [...GROUPS, { title: "Admin", items: [{ href: "/admin", label: "Approvals", icon: "shield" }] }]
    : GROUPS;
  return (
    <aside className="side" aria-label="Main">
      <Link href="/" className="logo" aria-label="GoaPages home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="GoaPages" width={190} height={60} />
      </Link>
      {groups.map((g) => (
        <nav className="group" key={g.title} aria-label={g.title}>
          <div className="group-title">{g.title}</div>
          {g.items.map((i) => (
            <Link key={i.href} href={i.href} className={"nav" + (on(path, i.href) ? " on" : "")} aria-current={on(path, i.href) ? "page" : undefined}>
              <span className="tile"><Icon name={i.icon} size={16} /></span>
              {i.label}
            </Link>
          ))}
        </nav>
      ))}
      <div className="promo">
        <strong>Grow your Goan business</strong>
        <span>Get seen by the UK Goan community. Free listing, featured spots from £15.</span>
        <Link href="/advertise" className="btn btn-yellow btn-sm">Advertise</Link>
      </div>
    </aside>
  );
}

export function TabBar() {
  const path = usePathname() || "/";
  const tabs: Item[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/directory", label: "Directory", icon: "dir" },
    { href: "/post", label: "Add", icon: "plus" },
    { href: "/marketplace", label: "Market", icon: "shop" },
    { href: "/my", label: "Me", icon: "user" },
  ];
  return (
    <nav className="tabbar" aria-label="App">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={(t.href === "/post" ? "post " : "") + (on(path, t.href) ? "on" : "")}>
          <span><Icon name={t.icon} size={t.href === "/post" ? 22 : 20} /></span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
