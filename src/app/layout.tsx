import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
import { Accessibility } from "@/components/accessibility";
export const metadata: Metadata = {
  title: {
    default: "Pomocny Punkt — od potrzeby do rozwiązania",
    template: "%s | Pomocny Punkt",
  },
  description:
    "Odkrywaj innowacje społeczne odpowiadające na lokalne potrzeby.",
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <a className="skip" href="#main">
          Przejdź do treści
        </a>
        <header className="header">
          <Link
            className="brand"
            href="/"
            aria-label="Pomocny Punkt — strona główna"
          >
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="45" height="44" fill="none">
                <defs>
                  <linearGradient
                    id="help-heart"
                    x1="13"
                    y1="3"
                    x2="35"
                    y2="27"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#174a91" />
                    <stop offset="0.55" stopColor="#087fb3" />
                    <stop offset="1" stopColor="#49b5a1" />
                  </linearGradient>
                </defs>
                <path
                  d="M24 27C20 24 12 18 12 11a7 7 0 0 1 12-5 7 7 0 0 1 12 5c0 7-8 13-12 16Z"
                  fill="url(#help-heart)"
                />
                <path
                  d="M20 45v-7c0-3-2-5-4-7l-5-6c-2-2-4 0-3 2l5 7-2 1-6-9-1-10c0-3-4-3-4 0v13c0 3 1 5 3 7l8 9Z"
                  fill="currentColor"
                  transform="translate(2 0)"
                />
                <path
                  d="M20 45v-7c0-3-2-5-4-7l-5-6c-2-2-4 0-3 2l5 7-2 1-6-9-1-10c0-3-4-3-4 0v13c0 3 1 5 3 7l8 9Z"
                  fill="#4b9276"
                  transform="translate(46 0) scale(-1 1)"
                />
              </svg>
            </span>{" "}
            <span>
              Pomocny Punkt<small>Małopolska. Razem możemy więcej.</small>
            </span>
          </Link>
          <nav aria-label="Menu główne">
            <Link href="/#jak-to-dziala">Jak to działa</Link>
            <Link href="/innowacje">Katalog innowacji</Link>
            <Link href="/wiedza">Wiedza</Link>
            <Link href="/moje-sprawy">Moje sprawy</Link>
            <a
              href="https://www.malopolska.pl"
              target="_blank"
              rel="noreferrer"
            >
              Małopolska ↗
            </a>
          </nav>
          <Accessibility />
        </header>
        <main id="main">{children}</main>
        <footer>
          <Link className="brand" href="/">
            Pomocny Punkt
          </Link>
          <p>Od lokalnej potrzeby do wspólnego działania.</p>
          <a href="https://www.malopolska.pl" target="_blank" rel="noreferrer">
            Małopolska — portal województwa ↗
          </a>
        </footer>
      </body>
    </html>
  );
}
