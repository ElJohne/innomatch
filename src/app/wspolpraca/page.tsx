import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Testowanie i współpraca" };
const support = [
  {
    purpose: "CONSULTATION",
    title: "Mam pytanie do koordynatora",
    description:
      "Omów zastosowanie rozwiązania lub następny krok swojego działania.",
  },
  {
    purpose: "MENTORSHIP",
    title: "Potrzebuję mentora",
    description: "Opisz, w czym potrzebujesz doświadczenia i wsparcia mentora.",
  },
  {
    purpose: "PARTNERSHIP",
    title: "Szukam partnera do działania",
    description: "Napisz, kogo szukasz i co możesz zaproponować we współpracy.",
  },
];

export default function Cooperation() {
  return (
    <section className="section cooperation-page">
      <p className="eyebrow">Od rozwiązania do wspólnego działania</p>
      <h1>Testowanie i współpraca</h1>
      <p className="lead">
        Sprawdź rozwiązanie w praktyce albo poproś o wsparcie w kolejnym kroku.
      </p>
      <section id="testowanie" className="cooperation-testing">
        <div>
          <h2>Dołącz do testowania</h2>
          <p>
            Wybierz rozwiązanie z katalogu. Na jego stronie zgłosisz chęć
            testowania lub dodasz opinię o swoim doświadczeniu.
          </p>
        </div>
        <Link className="button" href="/innowacje">
          Wybierz rozwiązanie do testowania →
        </Link>
      </section>
      <section id="wsparcie">
        <h2>Znajdź wsparcie lub partnera</h2>
        <p>
          Twoja wiadomość trafi do koordynatora. Sprawdzi możliwości wsparcia;
          samo zgłoszenie nie oznacza przydzielenia mentora ani znalezienia
          partnera.
        </p>
        <div className="support-entry-grid">
          {support.map(({ purpose, title, description }) => (
            <article className="card stack" key={purpose}>
              <h3>
                <Link
                  className="text-link"
                  href={`/wiadomosci/nowa?purpose=${purpose}`}
                >
                  {title} →
                </Link>
              </h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <p className="help">
          Odpowiedzi i zapisane rozmowy znajdziesz w{" "}
          <Link href="/moje-sprawy">Moich sprawach</Link>.
        </p>
      </section>
    </section>
  );
}
