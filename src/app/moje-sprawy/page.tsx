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
  const records = s.ownerId ? await listNeeds(s.ownerId) : [];
  const plans = s.ownerId ? await listPlans(s.ownerId) : [];
  const ideas = s.ownerId ? await listIdeas(s.ownerId) : [];
  const a = s.ownerId ? await actor() : null;
  const threads = a && !a.staff ? await listThreads(a) : [];
  const pilots =
    a && !a.staff
      ? await listPilotCases(a.ownerId)
      : { participations: [], feedback: [] };
  return (
    <section className="narrow">
      <p className="eyebrow">Twoja przestrzeń</p>
      <h1>Moje sprawy</h1>
      <p className="lead">
        Twoje potrzeby, plany adaptacji i odpowiedzi koordynatora. Zachowaj
        prywatny kod dostępu, aby wrócić do spraw także z innej przeglądarki.
      </p>
      {!a?.staff && <RecoveryPanel canIssue={Boolean(s.ownerId)} />}
      <h2>Rozmowy z koordynatorem</h2>
      {a?.staff ? (
        <p>
          <Link href="/admin">Otwórz skrzynkę personelu</Link>
        </p>
      ) : (
        <ThreadList items={threads} />
      )}
      <details className="card">
        <summary>Twoje szkice adaptacji ({plans.length})</summary>
        {plans.length ? (
          plans.map((p) => (
            <p key={p.id}>
              <Link href={`/adaptacje/${p.id}`}>
                {p.title} — wersja {p.revision}
              </Link>
            </p>
          ))
        ) : (
          <p>
            Nie masz dostępnych planów. Rozpocznij od wybranej innowacji. Plany
            oparte na zmienionych lub ukrytych materiałach nie są wyświetlane.
          </p>
        )}
      </details>
      <details className="card">
        <summary>Twoje pomysły ({ideas.length})</summary>
        {ideas.map((i) => (
          <p key={i.id}>
            <Link href={`/pomysly/${i.id}`}>{i.title}</Link> —{" "}
            {i.status === "DRAFT"
              ? "szkic prywatny"
              : "przekazany do konsultacji"}
            , wersja {i.revision}
          </p>
        ))}
        <Link className="text-link" href="/pomysly/nowy">
          Zapisz nowy pomysł →
        </Link>
      </details>
      <details className="card">
        <summary>
          Testowanie i opinie (
          {pilots.participations.length + pilots.feedback.length})
        </summary>
        <h3>Zgłoszone zainteresowanie testowaniem</h3>
        {!pilots.participations.length && (
          <p>Nie zgłoszono jeszcze zainteresowania.</p>
        )}
        {pilots.participations.map((p) => (
          <p key={p.id}>
            {p.title ?? "Niedostępna innowacja"} — zgłoszono zainteresowanie.{" "}
            {p.title && (
              <Link href={`/wiadomosci/${p.threadId}`}>
                Uzgodnij warunki z koordynatorem →
              </Link>
            )}
          </p>
        ))}
        <h3>Twoje opinie</h3>
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
      <h2 className="detail-label">Twoje potrzeby</h2>
      <div className="stack">
        {records.map((r) => (
          <article className="card" key={r.id}>
            <p className="help">
              {new Date(r.createdAt).toLocaleDateString("pl-PL", {
                timeZone: "Europe/Warsaw",
              })}
            </p>
            <h2>
              <Link href={`/potrzeby/${r.id}`}>
                {r.description.slice(0, 100)}
                {r.description.length > 100 ? "…" : ""}
              </Link>
            </h2>
          </article>
        ))}
      </div>
      {!records.length && <p>Nie masz jeszcze zgłoszeń w tej sesji.</p>}
      <Link className="button" href="/potrzeby/nowa">
        Opisz nową potrzebę →
      </Link>
    </section>
  );
}
