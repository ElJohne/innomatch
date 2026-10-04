import Link from "next/link";
import { session } from "@/server/auth/session";
import { listNeeds } from "@/server/services/repository";
import { actor } from "@/server/auth/staff";
import { listThreads } from "@/server/services/communication";
import { ThreadList } from "@/components/thread-list";
import styles from "@/components/communication.module.css";
import { listPlans } from "@/server/services/adaptations";
import { listIdeas } from "@/server/services/ideas";
import { listPilotCases } from "@/server/services/pilots";
import { feedbackStatusLabels } from "@/lib/contracts/pilot";

export default async function Cases() {
  const s = await session();
  const a = s.ownerId ? await actor() : null;
  const [records, plans, ideas, threads, pilots] = await Promise.all([
    s.ownerId ? listNeeds(s.ownerId) : [],
    s.ownerId ? listPlans(s.ownerId) : [],
    s.ownerId ? listIdeas(s.ownerId) : [],
    a && !a.staff ? listThreads(a) : [],
    a && !a.staff
      ? listPilotCases(a.ownerId)
      : { participations: [], feedback: [] },
  ]);
  const empty =
    !records.length &&
    !plans.length &&
    !ideas.length &&
    !threads.length &&
    !pilots.participations.length &&
    !pilots.feedback.length;
  return (
    <section className="narrow">
      <div className={styles.heading}>
        <h1>Moje sprawy</h1>
        {!a?.staff && (
          <Link href="/moje-sprawy/dostep">Zachowaj lub przywróć dostęp</Link>
        )}
      </div>
      {a && !a.staff && (
        <p>
          <Link href="/wiadomosci">Wszystkie moje rozmowy →</Link>
        </p>
      )}
      {a?.staff && (
        <p>
          <Link href="/admin">Otwórz skrzynkę personelu →</Link>
        </p>
      )}
      {empty && (
        <div className="card">
          <h2>Zacznij od potrzeby lub pomysłu</h2>
          <p>Tutaj znajdziesz zapisane sprawy i odpowiedzi koordynatora.</p>
          <div className="actions">
            <Link className="button" href="/potrzeby/nowa">
              Znajdź pomoc
            </Link>
            <Link href="/pomysly/nowy">Zapisz pomysł →</Link>
          </div>
        </div>
      )}
      <div className={styles.sections}>
        {threads.length > 0 && (
          <section aria-labelledby="conversations">
            <div className={styles.heading}>
              <h2 id="conversations">Rozmowy</h2>
              <span className="help">{threads.length}</span>
            </div>
            <ThreadList items={threads} />
          </section>
        )}
        {records.length > 0 && (
          <section className={styles.section} aria-labelledby="needs">
            <div className={styles.heading}>
              <h2 id="needs">Znalezione rozwiązania</h2>
              <Link href="/potrzeby/nowa">Nowa potrzeba →</Link>
            </div>
            <ul className={styles.list}>
              {records.map((r) => (
                <li className={styles.row} key={r.id}>
                  <h3>
                    <Link href={`/potrzeby/${r.id}`}>
                      {r.description.slice(0, 100)}
                      {r.description.length > 100 ? "…" : ""}
                    </Link>
                  </h3>
                  <p className="help">
                    {new Date(r.createdAt).toLocaleDateString("pl-PL", {
                      timeZone: "Europe/Warsaw",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {ideas.length > 0 && (
          <section className={styles.section} aria-labelledby="ideas">
            <div className={styles.heading}>
              <h2 id="ideas">Pomysły</h2>
              <Link href="/pomysly/nowy">Nowy pomysł →</Link>
            </div>
            <ul className={styles.links}>
              {ideas.map((i) => (
                <li key={i.id}>
                  <Link href={`/pomysly/${i.id}`}>{i.title}</Link>
                  <small>
                    {i.status === "DRAFT"
                      ? "Szkic prywatny"
                      : "Przekazany do konsultacji"}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}
        {plans.length > 0 && (
          <section className={styles.section} aria-labelledby="plans">
            <h2 id="plans">Plany dla instytucji</h2>
            <ul className={styles.links}>
              {plans.map((p) => (
                <li key={p.id}>
                  <Link href={`/adaptacje/${p.id}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(pilots.participations.length > 0 || pilots.feedback.length > 0) && (
          <section className={styles.section} aria-labelledby="pilots">
            <h2 id="pilots">Testowanie i opinie</h2>
            <ul className={styles.links}>
              {pilots.participations.map((p) => (
                <li key={p.id}>
                  {p.title ? (
                    <Link href={`/wiadomosci/${p.threadId}`}>{p.title}</Link>
                  ) : (
                    "Niedostępna innowacja"
                  )}
                  <small>
                    Zgłoszenie do testowania · ustal szczegóły w rozmowie
                  </small>
                </li>
              ))}
              {pilots.feedback.map((f) => (
                <li key={f.id}>
                  {f.title ? (
                    <Link href={`/innowacje/${f.innovationId}`}>{f.title}</Link>
                  ) : (
                    "Niedostępna innowacja"
                  )}
                  <small>
                    {f.sourceCurrent
                      ? feedbackStatusLabels[f.status]
                      : "Wymaga aktualizacji materiału"}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
