import Link from "next/link";
import { listInnovations } from "@/server/services/repository";
import { InnovationCard } from "@/components/innovation-card";
export default async function Home() {
  const records = await listInnovations();
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Małopolska · Innowacje społeczne</p>
          <h1>
            Duża zmiana zaczyna się od <em>lokalnej potrzeby.</em>
          </h1>
          <p className="lead">
            Opisz wyzwanie swojej społeczności. Znajdź inspirację w katalogu i
            sprawdź, co może zadziałać u Was.
          </p>
          <div className="actions">
            <Link className="button" href="/potrzeby/nowa">
              Znajdź rozwiązanie <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" href="/innowacje">
              Przeglądaj katalog
            </Link>
          </div>
          <p className="muted">
            Bez konta. Własnymi słowami. Z jawnymi źródłami.
          </p>
        </div>
        <aside className="journey">
          <span className="eyebrow">Droga do zmiany</span>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Twoja potrzeba</strong>
                <p>Co chcesz zmienić i dla kogo?</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Pasujące rozwiązania</strong>
                <p>Propozycje, źródła i ograniczenia.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Świadomy kolejny krok</strong>
                <p>Poznaj warunki zastosowania.</p>
              </div>
            </li>
          </ol>
          <div className="journey-note">Nie musisz zaczynać od zera.</div>
        </aside>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">Biblioteka inspiracji</p>
            <h2>Różne potrzeby. Wspólna sprawa.</h2>
          </div>
          <Link className="text-link" href="/innowacje">
            Cały katalog →
          </Link>
        </div>
        <div className="grid">
          {records.slice(0, 3).map((item) => (
            <InnovationCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      <section className="note">
        <h2>Masz własny pomysł?</h2>
        <p>
          Kreator pomysłów jest w przygotowaniu. Obecnie możesz opisać potrzebę
          i sprawdzić dostępne propozycje.
        </p>
        <Link href="/potrzeby/nowa">Opisz potrzebę →</Link>
      </section>
    </>
  );
}
