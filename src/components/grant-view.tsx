import {
  costPhases,
  formatPLN,
  grantBudget,
  grantFields,
  grantTemplate,
  applicantFields,
  partyFields,
  declarationChecks,
  grantReadiness,
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
      <h2>Szkic formularza grantowego</h2>
      <GrantSource compact={false} />
      {draft.applicant && (
        <section className="stack">
          <h3>2. Dane pomysłodawcy</h3>
          <p>
            {draft.applicant.kind === "GROUP"
              ? "Grupa nieformalna"
              : draft.applicant.kind === "ENTITY"
                ? "Podmiot"
                : "Osoba fizyczna"}
          </p>
          {draft.applicant.parties.map((party, i) => (
            <div key={i}>
              <h4>
                {draft.applicant?.kind === "GROUP"
                  ? `Partner ${i + 1}`
                  : "Pomysłodawca"}
              </h4>
              <dl>
                {partyFields(party.kind).map((key) => (
                  <div className="canvas-answer" key={key}>
                    <dt>{applicantFields[key]}</dt>
                    <dd>{party.fields[key] || "Nie podano"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {draft.applicant.kind === "GROUP" && (
            <p>
              Reprezentant grupy:{" "}
              {draft.applicant.groupContactName || "Nie podano"};{" "}
              {draft.applicant.groupContactPhone};{" "}
              {draft.applicant.groupContactEmail}
            </p>
          )}
        </section>
      )}
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
      <p>
        Przygotowanie: {draft.schedule?.preparationMonths ?? "Nie podano"} mies.
        (maks. 3). Testowanie: {draft.schedule?.testingMonths ?? "Nie podano"}{" "}
        mies. (maks. 9). Liczba testerów:{" "}
        {draft.schedule?.testers ?? "Nie podano"}.
      </p>
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
      <h3>12. Przegląd oświadczeń przez autora</h3>
      <ul>
        {Object.entries(declarationChecks).map(([key, label]) => (
          <li key={key}>
            {label}:{" "}
            {draft.declarationReview?.[key as keyof typeof declarationChecks]
              ? "oznaczono jako sprawdzone"
              : "do sprawdzenia"}
            .
          </li>
        ))}
      </ul>
      <p className="help">
        Lista odnotowuje przegląd zagadnień. Nie zastępuje pełnych oświadczeń,
        podpisów, klauzul informacyjnych ani załączników w oryginalnym
        formularzu. Limity znaków tekstu są limitami aplikacji.
      </p>
      <h3>Przed wypełnieniem oryginału</h3>
      {grantReadiness(draft).length ? (
        <ul>
          {grantReadiness(draft).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>
          Podstawowe pola uzupełnione. Wymagana pozostaje weryfikacja
          merytoryczna i warunków właściwego naboru.
        </p>
      )}
    </section>
  );
}
