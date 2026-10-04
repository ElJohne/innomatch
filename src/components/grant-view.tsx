import {
  costPhases,
  formatPLN,
  grantBudget,
  grantFields,
  grantTemplate,
  type GrantDraft,
  type GrantKey,
} from "@/lib/contracts/grant";

export function GrantSource() {
  return (
    <div className="note">
      <p>
        <strong>{grantTemplate.title} — nabór zakończony.</strong> Materiał do
        przygotowania pomysłu na podstawie opublikowanego formularza. To szkic
        merytoryczny, bez złożenia wniosku.
      </p>
      <p className="help">
        Nabór: 13.11–13.12.2024. Status sprawdzony: {grantTemplate.checkedAt}.
        Wersja szablonu: {grantTemplate.version}.
      </p>
      <div className="actions">
        <a href={grantTemplate.sourceUrl} target="_blank" rel="noreferrer">
          Oryginalny formularz ROPS (PDF) ↗
        </a>
        <a href={grantTemplate.callsUrl} target="_blank" rel="noreferrer">
          Sprawdź aktualne nabory ↗
        </a>
      </div>
    </div>
  );
}
export function GrantView({ draft }: { draft: GrantDraft }) {
  const budget = grantBudget(draft.costs);
  return (
    <section className="stack grant-preview">
      <h2>Szkic grantowy — część merytoryczna</h2>
      <GrantSource />
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
