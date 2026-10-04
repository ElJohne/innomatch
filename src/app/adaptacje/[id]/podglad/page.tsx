import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getPlan, getPlanRecovery } from "@/server/services/adaptations";
import { AdaptationRecovery } from "@/components/adaptation-recovery";
import { listInnovations } from "@/server/services/repository";
import { AdaptationView } from "@/components/adaptation-view";
import { PrintButton } from "@/components/print-button";

export default async function PlanPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await session();
  if (!owner.ownerId) notFound();
  const { id } = await params;
  const plan = await getPlan(id, owner.ownerId);
  if (!plan) {
    const recovery = await getPlanRecovery(id, owner.ownerId);
    if (!recovery) notFound();
    return <AdaptationRecovery recovery={recovery} />;
  }
  const innovation = (await listInnovations()).find(
    (r) => r.id === plan.innovationId,
  );
  if (!innovation) notFound();
  return (
    <article className="narrow idea-preview stack">
      <div className="actions print-controls">
        <Link href={`/adaptacje/${plan.id}`}>← Wróć do planu</Link>
        <PrintButton />
      </div>
      <header>
        <p className="eyebrow">Pomocny Punkt · Plan adaptacji</p>
        <h1>{innovation.title}</h1>
        <p>Wersja {plan.revision} · zapisana wersja autora</p>
        <p className="help">
          Materiał roboczy do rozmowy o wdrożeniu. Nie potwierdza dostępności
          usługi ani zatwierdzenia przez ROPS. W rozmowie koordynator może mieć
          wcześniejszą udostępnioną wersję.
        </p>
      </header>
      <section className="card">
        <h2>Warunki podane przez autora</h2>
        {Object.entries({
          Instytucja: plan.constraints.institution,
          Zasoby: plan.constraints.resources,
          Zasięg: plan.constraints.scope,
          Termin: plan.constraints.timeline || "Nieustalony",
          Budżet: plan.constraints.budget || "Nieustalony",
        }).map(([label, value]) => (
          <p key={label}>
            <strong>{label}: </strong>
            {value}
          </p>
        ))}
      </section>
      <AdaptationView plan={plan} expanded />
      <section className="card">
        <h2>Materiały źródłowe</h2>
        {innovation.origin === "SYNTHETIC" && (
          <p className="notice">Źródła demonstracyjne — dane syntetyczne.</p>
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
                <p>
                  <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                    {s.sourceUrl}
                  </a>
                </p>
              )}
            </div>
          ))}
      </section>
    </article>
  );
}
