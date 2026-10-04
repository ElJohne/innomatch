import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getPlan, getPlanRecovery } from "@/server/services/adaptations";
import { AdaptationRecovery } from "@/components/adaptation-recovery";
import { listInnovations } from "@/server/services/repository";
import { AdaptationView } from "@/components/adaptation-view";
import { AdaptationEditor } from "@/components/adaptation-editor";
import { AdaptationHelp } from "@/components/adaptation-help";
import { listThreads } from "@/server/services/communication";
export default async function PlanPage({
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
    (record) => record.id === plan.innovationId,
  );
  if (!innovation) notFound();
  const conversation = (await listThreads({ ownerId: owner.ownerId })).find(
    (thread) => thread.adaptationId === plan.id,
  );
  return (
    <section className="narrow stack">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <header>
        <p className="eyebrow detail-label">Plan dla instytucji</p>
        <h1>Możesz zacząć działać</h1>
        <p className="lead">{innovation.title}</p>
      </header>
      <AdaptationView plan={plan} />
      <AdaptationHelp
        planId={plan.id}
        revision={plan.revision}
        conversationId={conversation?.id}
      />
      {conversation && conversation.unread > 0 && (
        <p role="status">Nowe wiadomości: {conversation.unread}</p>
      )}
      <div className="actions">
        <Link href={`/adaptacje/${plan.id}/podglad`}>Cały plan i PDF →</Link>
        <Link href={`/potrzeby/${plan.needId}`}>Wróć do wybranej potrzeby</Link>
      </div>
      <details className="card">
        <summary>Warunki i źródła</summary>
        {Object.entries({
          Instytucja: plan.constraints.institution,
          Zasoby: plan.constraints.resources,
          Zasięg: plan.constraints.scope,
          Termin: plan.constraints.timeline,
          Budżet: plan.constraints.budget,
        })
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <p key={label}>
              <strong>{label}:</strong> {value}
            </p>
          ))}
        <h2>Materiały źródłowe</h2>
        {innovation.origin === "SYNTHETIC" && (
          <p className="help">Źródła demonstracyjne — dane syntetyczne.</p>
        )}
        {innovation.sources
          .filter((source) => plan.draft.sourceIds.includes(source.id))
          .map((source) => (
            <div className="source" key={source.id}>
              <h3>{source.sourceTitle}</h3>
              {source.evidenceExcerpt && (
                <blockquote>{source.evidenceExcerpt}</blockquote>
              )}
              <p>{source.sourceRef}</p>
              {source.sourceUrl && (
                <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                  Otwórz źródło ↗
                </a>
              )}
            </div>
          ))}
      </details>
      <AdaptationEditor initial={plan} sources={innovation.sources} />
    </section>
  );
}
