import Link from "next/link";
import { session } from "@/server/auth/session";
import { listNeeds } from "@/server/services/repository";
import { actor } from "@/server/auth/staff";
import { listThreads } from "@/server/services/communication";
import { ThreadList } from "@/components/thread-list";
import { RecoveryPanel } from "@/components/recovery-panel";
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
  const otherThreads = threads.filter(
    (t) => !t.needId || t.adaptationId || t.ideaId,
  );
  return (
    <section className="narrow">
      <h1>Moje sprawy</h1>
      <p className="lead">Tutaj wrócisz do pomocy i odpowiedzi koordynatora.</p>
      {a?.staff && (
        <p>
          <Link href="/admin">Otwórz skrzynkę personelu →</Link>
        </p>
      )}
      <div className="stack">
        {records.map((r) => {
          const conversation = threads.find(
            (t) => t.needId === r.id && !t.adaptationId,
          );
          return (
            <article className="card" key={r.id}>
              <p className="help">
                {new Date(r.createdAt).toLocaleDateString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                })}
              </p>
              <h2>
                {r.description.slice(0, 100)}
                {r.description.length > 100 ? "…" : ""}
              </h2>
              <p>
                {conversation ? (
                  conversation.unread > 0 ? (
                    <strong>Nowa odpowiedź ({conversation.unread})</strong>
                  ) : (
                    "Prośba wysłana do koordynatora"
                  )
                ) : (
                  "Możesz wybrać pomoc dla siebie"
                )}
              </p>
              <Link
                className="button"
                href={
                  conversation
                    ? `/wiadomosci/${conversation.id}`
                    : `/potrzeby/${r.id}`
                }
              >
                {conversation ? "Otwórz rozmowę →" : "Wybierz pomoc →"}
              </Link>
              {conversation && (
                <p>
                  <Link href={`/potrzeby/${r.id}`}>
                    Zobacz znalezione rozwiązania
                  </Link>
                </p>
              )}
            </article>
          );
        })}
      </div>
      {!records.length && <p>Nie masz jeszcze zapisanych potrzeb.</p>}
      <Link className="button detail-label" href="/potrzeby/nowa">
        Znajdź nową pomoc →
      </Link>
      {otherThreads.length > 0 && (
        <section className="stack detail-label">
          <h2>Pozostałe rozmowy</h2>
          <ThreadList items={otherThreads} />
        </section>
      )}
      <details className="card detail-label">
        <summary>Plany dla instytucji ({plans.length})</summary>
        {plans.length ? (
          plans.map((p) => (
            <p key={p.id}>
              <Link href={`/adaptacje/${p.id}`}>{p.title}</Link>
            </p>
          ))
        ) : (
          <p>Nie masz jeszcze dostępnych planów.</p>
        )}
      </details>
      <details className="card detail-label">
        <summary>Pomysły ({ideas.length})</summary>
        {ideas.map((i) => (
          <p key={i.id}>
            <Link href={`/pomysly/${i.id}`}>{i.title}</Link> —{" "}
            {i.status === "DRAFT"
              ? "szkic prywatny"
              : "przekazany do konsultacji"}
          </p>
        ))}
        <Link className="text-link" href="/pomysly/nowy">
          Zapisz nowy pomysł →
        </Link>
      </details>
      <details className="card detail-label">
        <summary>
          Testowanie i opinie (
          {pilots.participations.length + pilots.feedback.length})
        </summary>
        <h3>Testowanie</h3>
        {!pilots.participations.length && <p>Nie masz jeszcze zgłoszeń.</p>}
        {pilots.participations.map((p) => (
          <p key={p.id}>
            {p.title ?? "Niedostępna innowacja"}
            {p.title && (
              <>
                {" "}
                ·{" "}
                <Link href={`/wiadomosci/${p.threadId}`}>Otwórz rozmowę →</Link>
              </>
            )}
          </p>
        ))}
        <h3>Opinie</h3>
        {!pilots.feedback.length && <p>Nie masz jeszcze opinii.</p>}
        {pilots.feedback.map((f) => (
          <p key={f.id}>
            {f.title ? (
              <Link href={`/innowacje/${f.innovationId}`}>{f.title}</Link>
            ) : (
              "Niedostępna innowacja"
            )}{" "}
            —{" "}
            {f.sourceCurrent
              ? feedbackStatusLabels[f.status]
              : "Wymaga aktualizacji materiału"}
          </p>
        ))}
      </details>
      {!a?.staff && (
        <div className="detail-label">
          <RecoveryPanel canIssue={Boolean(s.ownerId)} />
        </div>
      )}
    </section>
  );
}
