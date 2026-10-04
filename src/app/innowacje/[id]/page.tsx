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
import styles from "../discovery.module.css";

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
  return (
    <section className="section">
      <Link className="text-link" href="/innowacje">
        ← Katalog innowacji
      </Link>
      <p className="eyebrow detail-label">{r.categories.join(" · ")}</p>
      <h1>{r.title}</h1>
      <div className="tags">
        {r.targetGroups.map((g) => (
          <span key={g}>{g}</span>
        ))}
        <span>
          Etap:{" "}
          {
            {
              CONCEPT: "koncepcja",
              PILOT: "pilotaż",
              TESTED: "przetestowane",
              UNKNOWN: "nieustalony",
            }[r.maturity]
          }
        </span>
      </div>
      {r.origin === "SYNTHETIC" && (
        <p className="help">Przykład syntetyczny — dane demonstracyjne.</p>
      )}
      <div className={styles.detailLayout}>
        <div>
          <p className="lead">{r.solution}</p>
          <section className={styles.section}>
            <h2>Na jaką potrzebę odpowiada?</h2>
            <p>{r.problem}</p>
          </section>
          {r.requirements.length > 0 && (
            <section className={styles.section}>
              <h2>Przed wdrożeniem</h2>
              <ul>
                {r.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </section>
          )}
          <section className={styles.section}>
            <h2>Materiały źródłowe</h2>
            <ul className={styles.sources}>
              {r.sources.map((source) => (
                <li key={source.id}>
                  {source.sourceUrl ? (
                    <a href={source.sourceUrl} rel="noreferrer" target="_blank">
                      {source.sourceTitle}{" "}
                      <span className="help">(nowa karta) ↗</span>
                    </a>
                  ) : (
                    <span>
                      {source.sourceTitle} · {source.sourceRef}
                    </span>
                  )}
                  {source.sourceDate && (
                    <span className="help"> · {source.sourceDate}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className={styles.actions}>
          <h2>Skorzystaj z rozwiązania</h2>
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
          <Link href={`/adaptacje/nowa?innovationId=${r.id}`}>
            Dostosuj do mojej instytucji →
          </Link>
          <a href="#testowanie">Testowanie i opinia ↓</a>
        </aside>
      </div>
      <section
        id="testowanie"
        className={styles.section}
        aria-label="Testowanie i Twoja opinia"
      >
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
      </section>
      <section className={styles.section} id="opinie">
        <h2>Opinie użytkowników ({opinionPage.total})</h2>
        {!opinions.length && <p>Nie ma jeszcze opinii.</p>}
        {opinions.map((opinion) => (
          <article className="card" key={opinion.id}>
            <h3>Ocena {opinion.rating}/5</h3>
            <p className="help">{experienceLabels[opinion.experience]}</p>
            {opinion.origin === "SYNTHETIC" && (
              <p className="help">Opinia syntetyczna — dane demonstracyjne.</p>
            )}
            <p className="message-body">{opinion.comment}</p>
            {opinion.improvements && (
              <>
                <h4>Propozycje ulepszeń</h4>
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
      </section>
    </section>
  );
}
