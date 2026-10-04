"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Znajdź pomoc", section: "/" },
  { href: "/innowacje", label: "Wiedza i rozwiązania", section: "/innowacje" },
  { href: "/pomysly/nowy", label: "Mam pomysł", section: "/pomysly" },
  {
    href: "/wspolpraca",
    label: "Testowanie i współpraca",
    section: "/wspolpraca",
  },
  { href: "/moje-sprawy", label: "Moje sprawy", section: "/moje-sprawy" },
];

export function MainNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu główne">
      {links.map(({ href, label, section }) => {
        const active =
          pathname === href ||
          (section !== "/" &&
            (pathname === section || pathname.startsWith(`${section}/`))) ||
          (section === "/wspolpraca" && pathname.startsWith("/wiadomosci/")) ||
          (section === "/" &&
            (pathname.startsWith("/potrzeby/") ||
              pathname.startsWith("/adaptacje/")));
        return (
          <Link
            key={href}
            href={href}
            aria-current={
              active ? (pathname === href ? "page" : "location") : undefined
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
