import Link from "next/link";
import { notFound } from "next/navigation";
import { listInnovations } from "@/server/services/repository";
import { session } from "@/server/auth/session";
import { actor } from "@/server/auth/staff";
import {
  getParticipation,
  getOwnFeedback,
  publicFeedbackPage,
} from "@/server/services/pilots";
import { listThreads } from "@/server/services/communication";
import { PilotForms } from "@/components/pilot-forms";
import { CatalogHelp } from "@/components/catalog-help";
import { experienceLabels, feedbackQueueQuery } from "@/lib/contracts/pilot";
import { catalogVersion } from "@/server/services/catalog";

export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ feedbackPage?: string }>;
}) {
  const { id } = await params;
  const r = (await listInnovations()).find((r) => r.id === id);
  if (!r) notFound();
  const s = await session();
  const a = s.ownerId ? await actor() : null;
  const query = feedbackQueueQuery.safeParse({
    page: (await searchParams).feedbackPage,
  });
  const [participation, feedback, opinionPage, threads] = await Promise.all([
    a && !a.staff ? getParticipation(id, a.ownerId) : null,
    a && !a.staff ? getOwnFeedback(id, a.ownerId) : null,
    publicFeedbackPage(id, query.success ? query.data.page : 1),
    a && !a.staff ? listThreads(a) : [],
  ]);
  const opinions = opinionPage.items;
  const existing = threads.find(
    (t) => t.innovationId === id && !t.needId && !t.adaptationId && !t.ideaId,
  );
  const first =
    r.solution.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || r.solution;
  const summary =
    first.length > 220
      ? `${first.slice(0, 219).replace(/\s+\S*$/, "")}…`
      : first;
  return (
    <section className="narrow">
      <Link className="text-link" href="/innowacje">
        ← Katalog innowacji
      </Link>
      <p className="eyebrow detail-label">{r.categories.join(" · ")}</p>
      <h1>{r.title}</h1>
      <p className="lead">{summary}</p>
      <div className="tags">
        {r.targetGroups.map((g) => (
          <span key={g}>{g}</span>
        ))}
      </div>
      {r.origin === "SYNTHETIC" && (
        <p className="help">Przykład syntetyczny — dane demonstracyjne.</p>
      )}
      <aside className="note">
        <h2>Co zrobić teraz?</h2>
        {a?.staff ? (
          <Link className="button" href="/admin">
            Otwórz skrzynkę koordynatora →
          </Link>
        ) : (
          <CatalogHelp
            innovationId={id}
            title={r.title}
            existingThread={existing?.id}
          />
        )}
      </aside>
      <details className="card detail-label">
        <summary>Opis, warunki i źródła</summary>
        <div className="detail">
          <h2>Na jaką potrzebę odpowiada?</h2>
          <p>{r.problem}</p>
          <h2>Na czym polega rozwiązanie?</h2>
          <p>{r.solution}</p>
          <h2>Warunki zastosowania</h2>
          <ul>
            {r.requirements.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="help">
            Etap:{" "}
            {
              {
                CONCEPT: "koncepcja",
                PILOT: "pilotaż",
                TESTED: "przetestowane",
                UNKNOWN: "nieustalony",
              }[r.maturity]
            }
          </p>
          <h2>Źródła</h2>
          {r.sources.map((source) => (
            <div className="source" key={source.id}>
              <h3>{source.sourceTitle}</h3>
              {source.evidenceExcerpt && (
                <blockquote>{source.evidenceExcerpt}</blockquote>
              )}
              <p className="help">Odniesienie: {source.sourceRef}</p>
              {source.sourceUrl && (
                <a href={source.sourceUrl} rel="noreferrer" target="_blank">
                  Otwórz źródło (nowa karta) ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </details>
      <details className="card detail-label">
        <summary>Dla instytucji: przygotuj plan wdrożenia</summary>
        <p>Dostosuj rozwiązanie do potrzeb swojej instytucji.</p>
        <Link
          className="button secondary"
          href={`/adaptacje/nowa?innovationId=${r.id}`}
        >
          Dostosuj do mojej instytucji →
        </Link>
      </details>
      <details className="card detail-label">
        <summary>Testowanie i Twoja opinia</summary>
        {a?.staff ? (
          <p>
            Wyloguj konto personelu, aby dodać własne zgłoszenie lub opinię.
          </p>
        ) : (
          <PilotForms
            innovationId={id}
            initialParticipation={participation}
            initialFeedback={feedback}
            sourceCurrent={
              !feedback || feedback.sourceVersion === catalogVersion(r)
            }
          />
        )}
      </details>
      <details
        className="card detail-label"
        id="opinie"
        open={opinionPage.page > 1}
      >
        <summary>Opinie użytkowników ({opinionPage.total})</summary>
        <p className="help">
          Opublikowane po moderacji, dotyczą aktualnej wersji materiału.
        </p>
        {!opinions.length && (
          <p>
            {opinionPage.total
              ? "Brak opinii na tej stronie."
              : "Nie ma jeszcze opinii."}
          </p>
        )}
        {opinions.map((opinion) => (
          <article className="card" key={opinion.id}>
            <h2>Ocena {opinion.rating}/5</h2>
            <p className="help">{experienceLabels[opinion.experience]}</p>
            {opinion.origin === "SYNTHETIC" && (
              <p className="help">Opinia syntetyczna — dane demonstracyjne.</p>
            )}
            <p className="message-body">{opinion.comment}</p>
            {opinion.improvements && (
              <>
                <h3>Propozycje ulepszeń</h3>
                <p className="message-body">{opinion.improvements}</p>
              </>
            )}
          </article>
        ))}
        <nav className="actions" aria-label="Strony opinii użytkowników">
          {opinionPage.page > 1 && (
            <Link
              href={`/innowacje/${id}?feedbackPage=${opinionPage.page - 1}#opinie`}
            >
              ← Nowsze opinie
            </Link>
          )}
          {opinionPage.hasNext && (
            <Link
              href={`/innowacje/${id}?feedbackPage=${opinionPage.page + 1}#opinie`}
            >
              Starsze opinie →
            </Link>
          )}
        </nav>
      </details>
    </section>
  );
}
