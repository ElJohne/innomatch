import {
  costPhases,
  formatPLN,
  grantBudget,
  grantFields,
  grantTemplate,
  type GrantDraft,
  type GrantKey,
} from "@/lib/contracts/grant";

export function GrantSource({ compact = true }: { compact?: boolean }) {
  return (
    <div className="note">
      <p>
        <strong>{grantTemplate.title} — nabór zakończony.</strong>
      </p>
      <details open={!compact}>
        <summary>Formularz i aktualne nabory</summary>
        <p className="help">
          Szablon archiwalny: 13.11–13.12.2024. Wersja {grantTemplate.version}.
          Zapis szkicu nie jest złożeniem wniosku.
        </p>
        <div className="actions">
          <a href={grantTemplate.sourceUrl} target="_blank" rel="noreferrer">
            Formularz ROPS (PDF) ↗
          </a>
          <a href={grantTemplate.callsUrl} target="_blank" rel="noreferrer">
            Aktualne nabory ↗
          </a>
        </div>
      </details>
    </div>
  );
}
export function GrantView({ draft }: { draft: GrantDraft }) {
  const budget = grantBudget(draft.costs);
  return (
    <section className="stack grant-preview">
      <h2>Szkic grantowy — część merytoryczna</h2>
      <GrantSource compact={false} />
      <dl>
        {Object.entries(grantFields)
          .filter(([key]) => key !== "team")
          .map(([key, field]) => (
            <div className="canvas-answer" key={key}>
              <dt>{field.label}</dt>
              <dd className="message-body">
                {draft.sections[key as GrantKey] ||
                  "Do uzupełnienia przez autora."}
              </dd>
            </div>
          ))}
      </dl>
      <h3>9. Plan działania i koszty</h3>
      <ol className="stack">
        {draft.costs.map((cost, i) => (
          <li key={i} className="note">
            <strong>
              {costPhases[cost.phase]}:{" "}
              {cost.action || "Działanie do ustalenia"}
            </strong>
            <p>
              Termin: {cost.timing || "Do ustalenia"}. Koszt:{" "}
              {cost.amountPLN === null
                ? "Do wyceny"
                : formatPLN(cost.amountPLN)}
              .
            </p>
          </li>
        ))}
      </ol>
      <h3>10. Wnioskowana kwota grantu</h3>
      <p>
        {budget.complete
          ? `Suma kosztów wpisanych przez autora: ${formatPLN(budget.total)}.`
          : `Kwota nieustalona. Suma dotychczas wycenionych działań: ${formatPLN(budget.total)}; zestawienie wymaga uzupełnienia.`}
      </p>
      <div className="canvas-answer">
        <h3>{grantFields.team.label}</h3>
        <p className="message-body">
          {draft.sections.team || "Do uzupełnienia przez autora."}
        </p>
      </div>
      <p className="help">
        Dane pomysłodawcy (część 2), oświadczenia (część 12), wymagane
        załączniki i zgodność z warunkami właściwego naboru trzeba sprawdzić
        oraz uzupełnić w oryginalnym formularzu organizatora. Nie są zastępowane
        przez ten szkic.
      </p>
    </section>
  );
}
