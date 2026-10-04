import {
  draftLabels,
  pilotLabels,
  firstStepFor,
  firstStepLabels,
  type AdaptationPlan,
} from "@/lib/contracts/adaptation";
export function AdaptationView({ plan }: { plan: AdaptationPlan }) {
  const show = (value: string | string[]) =>
    Array.isArray(value) ? (
      <ul>
        {value.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    ) : (
      <p className="message-body">{value}</p>
    );
  return (
    <div className="stack">
      <p className="notice">
        {plan.mode === "mock"
          ? "Szkic demonstracyjny — bez wywołania AI. "
          : "Szkic wygenerowany przez AI — wymaga oceny. "}
        Wersja {plan.revision}
        {plan.editedByOwner ? ", zmieniona przez autora" : ""}. Propozycje i
        założenia poniżej nie są faktami potwierdzonymi przez źródła ani
        zatwierdzeniem ROPS.
      </p>
      <section className="card" aria-label="Pierwszy krok planu">
        <p className="eyebrow">Od czego zacząć</p>
        <h2>Twój pierwszy krok</h2>
        <dl className="first-step-grid">
          {Object.entries(firstStepLabels).map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {firstStepFor(plan.draft)[key as keyof typeof firstStepLabels]}
              </dd>
            </div>
          ))}
          <div>
            <dt>Budżet podany przez Ciebie</dt>
            <dd>
              {plan.constraints.budget ||
                "Nieustalony — przed działaniem trzeba oszacować koszty."}
            </dd>
          </div>
          <div>
            <dt>Termin podany przez Ciebie</dt>
            <dd>
              {plan.constraints.timeline || "Nieustalony — do uzgodnienia."}
            </dd>
          </div>
        </dl>
      </section>
      <details className="plan-details">
        <summary>Pełny szkic: uzasadnienie, zasoby, ryzyka i pilotaż</summary>
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
