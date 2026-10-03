import {
  draftLabels,
  pilotLabels,
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
    </div>
  );
}
