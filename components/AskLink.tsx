"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

// Small "Ask AI" button in the header. Hidden on the homepage, where the Ask box is already on screen.
export default function AskLink() {
  if (usePathname() === "/") return null;
  return <Link href="/#ask" className="btn btn-ask btn-sm"><Icon name="spark" size={16} />Ask AI</Link>;
}
