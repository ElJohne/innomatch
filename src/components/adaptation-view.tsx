import {
  draftLabels,
  pilotLabels,
  firstStepFor,
  firstStepLabels,
  type AdaptationPlan,
} from "@/lib/contracts/adaptation";
export function AdaptationView({
  plan,
  expanded = false,
}: {
  plan: AdaptationPlan;
  expanded?: boolean;
}) {
  const first = firstStepFor(plan.draft);
  const show = (value: string | string[]) =>
    Array.isArray(value) ? (
      <ul>
        {value.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="message-body">{value}</p>
    );
  return (
    <div className="stack">
      {plan.mode === "mock" && (
        <p className="help">Plan demonstracyjny — bez wywołania AI.</p>
      )}
      <section className="card" aria-label="Pierwszy krok planu">
        <p className="eyebrow">Co zrobić teraz</p>
        <h2>Twój pierwszy krok</h2>
        <p className="message-body">{first.action}</p>
        <details open={expanded}>
          <summary>Kto, z czym i jaki efekt?</summary>
          <dl className="first-step-grid">
            {Object.entries(firstStepLabels)
              .filter(([key]) => key !== "action")
              .map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{first[key as keyof typeof firstStepLabels]}</dd>
                </div>
              ))}
            {plan.constraints.budget && (
              <div>
                <dt>Twój budżet</dt>
                <dd>{plan.constraints.budget}</dd>
              </div>
            )}
            {plan.constraints.timeline && (
              <div>
                <dt>Twój termin</dt>
                <dd>{plan.constraints.timeline}</dd>
              </div>
            )}
          </dl>
        </details>
      </section>
      <details className="plan-details" open={expanded}>
        <summary>Pełny plan: kroki, zasoby i pilotaż</summary>
        <p className="help">
          Prywatny plan roboczy · wersja {plan.revision}
          {plan.editedByOwner ? " · zmieniona przez autora" : ""}.
        </p>
        {Object.entries(draftLabels).map(([key, label]) => (
          <section className="card" key={key}>
            <h2>{label}</h2>
            {show(plan.draft[key as keyof typeof draftLabels])}
          </section>
        ))}
        <section className="card">
          <h2>Propozycja pilotażu</h2>
          {Object.entries(pilotLabels).map(([key, label]) => (
            <div key={key}>
              <h3>{label}</h3>
              {show(plan.draft.pilot[key as keyof typeof pilotLabels])}
            </div>
          ))}
        </section>
      </details>
    </div>
  );
}
