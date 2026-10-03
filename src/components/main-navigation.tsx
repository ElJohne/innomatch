"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Strona główna", section: "/" },
  { href: "/innowacje", label: "Katalog innowacji", section: "/innowacje" },
  { href: "/pomysly/nowy", label: "Mam pomysł", section: "/pomysly" },
  { href: "/moje-sprawy", label: "Moje sprawy", section: "/moje-sprawy" },
  { href: "/pilna-pomoc", label: "Pilna pomoc", section: "/pilna-pomoc" },
];

export function MainNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu główne">
      {links.map(({ href, label, section }) => {
        const active = pathname === href ||
          (section !== "/" && (pathname === section || pathname.startsWith(`${section}/`)));
        return (
          <Link key={href} href={href} aria-current={active ? (pathname === href ? "page" : "location") : undefined}>
            {label}
          </Link>
        );
      })}
      <a href="https://www.malopolska.pl" target="_blank" rel="noreferrer">
        Małopolska ↗
      </a>
    </nav>
  );
}
