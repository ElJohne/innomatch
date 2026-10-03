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
              <svg viewBox="0 0 48 40" width="45" height="38">
                <path
                  d="M3 33 17 10 30 33M15 33 30 5 45 33"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m21 22 9-17 7 13"
                  fill="none"
                  stroke="#4b9276"
                  strokeWidth="5"
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
            <Link href="/pomysly/nowy">Mam pomysł</Link>
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
          <Link href="/admin">Strefa personelu</Link>
          <a href="https://www.malopolska.pl" target="_blank" rel="noreferrer">
            Małopolska — portal województwa ↗
          </a>
        </footer>
      </body>
    </html>
  );
}
