export function UrgentHelp({ prominent = false }: { prominent?: boolean }) {
  const content = (
    <>
      <p>
        Jeśli zagrożone jest życie, zdrowie lub bezpieczeństwo, zadzwoń pod{" "}
        <strong>112</strong>. W nagłym zagrożeniu medycznym możesz zadzwonić pod{" "}
        <strong>999</strong>.
      </p>
      <p>
        Operator numeru 112 kieruje zgłoszenie do odpowiedniej służby: policji,
        straży pożarnej lub ratownictwa medycznego.
      </p>
      <div className="actions">
        <a className="button" href="tel:112">
          Zadzwoń 112 — służby ratunkowe
        </a>
        <a className="button secondary" href="tel:999">
          Zadzwoń 999 — pogotowie
        </a>
      </div>
      <p>
        Nie czekaj na wyniki wyszukiwania ani odpowiedź koordynatora. Ta
        aplikacja nie wzywa służb ratunkowych.
      </p>
      <p className="help">
        Numery alarmowe służą nagłym zagrożeniom, nie informacjom ogólnym.
        Źródła:{" "}
        <a href="https://www.gov.pl/web/numer-alarmowy-112/co-zglaszac">
          MSWiA
        </a>
        , <a href="https://pacjent.gov.pl/na-ratunek">Pacjent.gov.pl</a>.
        Sprawdzono: 03.10.2026.
      </p>
    </>
  );
  return prominent ? (
    <section className="card urgent-help" aria-label="Pilna pomoc" role="alert">
      <h2>Możesz potrzebować pilnej pomocy</h2>
      {content}
    </section>
  ) : (
    <details className="note urgent-help">
      <summary>Potrzebuję pilnej pomocy — numery alarmowe</summary>
      {content}
    </details>
  );
}
