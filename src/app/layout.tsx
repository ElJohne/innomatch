import Link from "next/link";
import type { Metadata } from "next";
import { config } from "@/server/config";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "MI Connect — od potrzeby do rozwiązania",
    template: "%s | MI Connect",
  },
  description:
    "Odkrywaj innowacje społeczne odpowiadające na lokalne potrzeby.",
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const c = config();
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
            aria-label="MI Connect — strona główna"
          >
            <span className="brand-mark" aria-hidden="true">
              mi
            </span>{" "}
            MI Connect
          </Link>
          <nav aria-label="Menu główne">
            <Link href="/innowacje">Katalog innowacji</Link>
            <Link href="/wiedza">Wiedza</Link>
            <Link href="/pomysly/nowy">Mam pomysł</Link>
            <Link href="/moje-sprawy">Moje sprawy</Link>
          </nav>
          <Link className="button small" href="/potrzeby/nowa">
            Opisz potrzebę <span aria-hidden="true">↗</span>
          </Link>
        </header>
        {(c.DATA_PROVIDER === "fixtures" ||
          c.AI_PROVIDER === "mock" ||
          c.DEMO_DATA_ENABLED === "true") && (
          <aside className="demo" aria-label="Tryb demonstracyjny">
            <strong>Wersja demonstracyjna</strong> ·{" "}
            {c.DATA_PROVIDER === "fixtures"
              ? "Dane syntetyczne. Zgłoszenia są tymczasowe i znikają po restarcie serwera."
              : "Katalog może zawierać oznaczone dane syntetyczne."}{" "}
            {c.AI_PROVIDER === "mock" &&
              "AI: tryb testowy, bez połączenia z dostawcą AI."}
          </aside>
        )}
        <main id="main">{children}</main>
        <footer>
          <Link className="brand" href="/">
            MI Connect
          </Link>
          <p>Od lokalnej potrzeby do wspólnego działania.</p>
          <span>Prototyp na wyzwanie HubMI · 2026</span>
          <Link href="/admin">Strefa personelu</Link>
        </footer>
      </body>
    </html>
  );
}
