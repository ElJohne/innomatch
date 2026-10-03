import Link from "next/link";
import { notFound } from "next/navigation";
import { listInnovations } from "@/server/services/repository";
import { session } from "@/server/auth/session";
import { actor } from "@/server/auth/staff";
import {
  getParticipation,
  getOwnFeedback,
  publicFeedback,
} from "@/server/services/pilots";
import { PilotForms } from "@/components/pilot-forms";
import { experienceLabels } from "@/lib/contracts/pilot";
import { catalogVersion } from "@/server/services/catalog";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = (await listInnovations()).find((r) => r.id === id);
  if (!r) notFound();
  const s = await session();
  const a = s.ownerId ? await actor() : null;
  const [participation, feedback, opinions] = await Promise.all([
    a && !a.staff ? getParticipation(id, a.ownerId) : null,
    a && !a.staff ? getOwnFeedback(id, a.ownerId) : null,
    publicFeedback(id),
  ]);
  return (
    <section className="narrow">
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
        <p className="notice">
          Przykład syntetyczny do testów. Nie jest innowacją z portfolio ROPS.
          Brak dowodów skuteczności.
        </p>
      )}
      <div className="card detail">
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
        <h2>Źródła i pochodzenie</h2>
        {r.sources.map((s) => (
          <div className="source" key={s.id}>
            <h3>{s.sourceTitle}</h3>
            {s.evidenceExcerpt && <blockquote>{s.evidenceExcerpt}</blockquote>}
            <p className="help">Odniesienie: {s.sourceRef}</p>
            {s.sourceUrl && (
              <a href={s.sourceUrl} rel="noreferrer" target="_blank">
                Otwórz źródło (nowa karta) ↗
              </a>
            )}
          </div>
        ))}
      </div>
      <aside className="note">
        <h2>Co dalej?</h2>
        <p>
          Zapytaj koordynatora o zastosowanie innowacji lub możliwość współpracy
          albo przygotuj prywatny szkic usługi dla swojej instytucji.
        </p>
        <div className="actions">
          <Link
            className="button"
            href={`/adaptacje/nowa?innovationId=${r.id}`}
          >
            Dostosuj do mojej instytucji
          </Link>
          <Link
            className="button secondary"
            href={`/wiadomosci/nowa?innovationId=${r.id}`}
          >
            Zapytaj koordynatora
          </Link>
        </div>
      </aside>
      <section className="stack detail-label">
        <h2>Opublikowane opinie</h2>
        <p className="help">
          Opinie użytkowników po moderacji. Deklarowane użycie nie jest
          potwierdzeniem przeprowadzenia pilotażu ani dowodem skuteczności. Do
          50 najnowszych opinii zgodnych z aktualną wersją materiału.
        </p>
        {!opinions.length && (
          <p>
            Nie ma jeszcze opublikowanych opinii do aktualnej wersji tej
            innowacji.
          </p>
        )}
        {opinions.map((opinion) => (
          <article className="card" key={opinion.id}>
            <h3>Ocena {opinion.rating}/5</h3>
            <p className="help">{experienceLabels[opinion.experience]}</p>
            {opinion.origin === "SYNTHETIC" && (
              <p className="notice">
                Opinia syntetyczna — dane demonstracyjne.
              </p>
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
      </section>
      {a?.staff ? (
        <p className="note">
          Korzystasz z konta personelu. Wyloguj się, aby zgłosić własne
          zainteresowanie lub opinię.
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
  );
}
