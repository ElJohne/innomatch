import {
  draftLabels,
  pilotLabels,
  firstStepFor,
  firstStepLabels,
  type AdaptationPlan,
} from "@/lib/contracts/adaptation";
import styles from "./adaptation.module.css";
export function AdaptationView({
  plan,
  expanded = true,
  showMode = true,
}: {
  plan: AdaptationPlan;
  expanded?: boolean;
  showMode?: boolean;
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
    <div className={`stack ${styles.body}`}>
      {showMode && plan.mode === "mock" && (
        <p className="help">Plan demonstracyjny — bez wywołania AI.</p>
      )}
      {!expanded && (
        <section>
          <h2>Propozycja usługi</h2>
          <p className="message-body">{plan.draft.serviceDescription}</p>
        </section>
      )}
      <section
        className={`card ${styles.step}`}
        aria-label="Pierwszy krok planu"
      >
        <h2>Twój pierwszy krok</h2>
        <p className="message-body">{first.action}</p>
        <dl className={styles.facts}>
          {Object.entries(firstStepLabels)
            .filter(([key]) => key !== "action")
            .map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{first[key as keyof typeof firstStepLabels]}</dd>
              </div>
            ))}
        </dl>
      </section>
      {expanded && (
        <div>
          {Object.entries(draftLabels).map(([key, label]) => (
            <section className={styles.section} key={key}>
              <h2>{label}</h2>
              {show(plan.draft[key as keyof typeof draftLabels])}
            </section>
          ))}
          <section className={styles.section}>
            <h2>Propozycja pilotażu</h2>
            {Object.entries(pilotLabels).map(([key, label]) => (
              <div key={key}>
                <h3>{label}</h3>
                {show(plan.draft.pilot[key as keyof typeof pilotLabels])}
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
