import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getPlan } from "@/server/services/adaptations";
import { listInnovations } from "@/server/services/repository";
import { AdaptationView } from "@/components/adaptation-view";
import { AdaptationEditor } from "@/components/adaptation-editor";
import { FlowSteps } from "@/components/flow-steps";
import { listThreads } from "@/server/services/communication";
export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const plan = await getPlan((await params).id, s.ownerId);
  if (!plan) notFound();
  const innovation = (await listInnovations()).find(
    (r) => r.id === plan.innovationId,
  );
  if (!innovation) notFound();
  const conversation = (await listThreads({ ownerId: s.ownerId })).find(
    (t) => t.adaptationId === plan.id,
  );
  return (
    <section className="narrow">
      <FlowSteps current={4} />
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <p className="eyebrow detail-label">Prywatna adaptacja</p>
      <h1>Twój szkic usługi</h1>
      <p className="lead">{innovation.title}</p>
      <p>
        <Link href={`/adaptacje/${plan.id}/podglad`}>
          Przejrzyj cały plan i zapisz PDF →
        </Link>
      </p>
      <p>
        <Link href={`/potrzeby/${plan.needId}`}>
          Potrzeba, dla której powstał plan
        </Link>
      </p>
      <details className="card">
        <summary>Warunki podane przez autora</summary>
        {Object.entries({
          Instytucja: plan.constraints.institution,
          Zasoby: plan.constraints.resources,
          Zasięg: plan.constraints.scope,
          Termin: plan.constraints.timeline || "Nieustalony",
          Budżet: plan.constraints.budget || "Nieustalony",
        }).map(([k, v]) => (
          <p key={k}>
            <strong>{k}:</strong> {v}
          </p>
        ))}
      </details>
      <AdaptationView plan={plan} />
      <aside className="note">
        <h2>
          {conversation
            ? "Rozmowa o tym planie"
            : "Omów pierwszy krok z koordynatorem"}
        </h2>
        <p>
          {conversation
            ? "W rozmowie znajdziesz przekazaną wersję i odpowiedź koordynatora. Późniejsze poprawki pozostają prywatne. Nową wersję możesz udostępnić w tej samej rozmowie."
            : "Plan pozostaje prywatny. Na kolejnym ekranie przejrzysz i zmienisz pytanie przed wysłaniem. Dopiero wysłanie udostępni personelowi plan i potrzebę."}
        </p>
        {conversation && conversation.unread > 0 && (
          <p role="status">Nowe wiadomości: {conversation.unread}</p>
        )}
        <Link
          className="button"
          href={
            conversation
              ? `/wiadomosci/${conversation.id}`
              : `/wiadomosci/nowa?adaptationId=${plan.id}`
          }
        >
          {conversation ? "Wróć do rozmowy" : "Zapytaj koordynatora"}
        </Link>
        <p className="help">
          Plan i odpowiedzi znajdziesz w{" "}
          <Link href="/moje-sprawy">Moich sprawach</Link>. Zapisz tam prywatny
          kod powrotu. Wysłanie pytania nie oznacza zatwierdzenia planu.
        </p>
      </aside>
      <section className="card">
        <h2>Materiał źródłowy — oddzielony od propozycji</h2>
        {innovation.origin === "SYNTHETIC" && (
          <p className="notice">
            Źródła syntetyczne, bez potwierdzenia skuteczności.
          </p>
        )}
        {innovation.sources
          .filter((s) => plan.draft.sourceIds.includes(s.id))
          .map((s) => (
            <div className="source" key={s.id}>
              <h3>{s.sourceTitle}</h3>
              {s.evidenceExcerpt && (
                <blockquote>{s.evidenceExcerpt}</blockquote>
              )}
              <p>{s.sourceRef}</p>
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                  Otwórz źródło ↗
                </a>
              )}
            </div>
          ))}
      </section>
      <AdaptationEditor initial={plan} sources={innovation.sources} />
    </section>
  );
}
