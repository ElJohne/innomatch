import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getPlan } from "@/server/services/adaptations";
import { listInnovations } from "@/server/services/repository";
import { AdaptationView } from "@/components/adaptation-view";
import { AdaptationEditor } from "@/components/adaptation-editor";
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
  return (
    <section className="narrow">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <p className="eyebrow detail-label">Prywatna adaptacja</p>
      <h1>Twój szkic usługi</h1>
      <p className="lead">{innovation.title}</p>
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
      <aside className="note">
        <h2>Omów plan z koordynatorem</h2>
        <p>
          Plan jest prywatny. Na kolejnym ekranie możesz napisać pytanie i
          świadomie udostępnić zapisany plan oraz potrzebę personelowi.
        </p>
        <Link
          className="button"
          href={`/wiadomosci/nowa?adaptationId=${plan.id}`}
        >
          Zapytaj koordynatora
        </Link>
      </aside>
    </section>
  );
}
