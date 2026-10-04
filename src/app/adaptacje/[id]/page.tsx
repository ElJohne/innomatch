import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getPlan, getPlanRecovery } from "@/server/services/adaptations";
import { AdaptationRecovery } from "@/components/adaptation-recovery";
import { listInnovations } from "@/server/services/repository";
import { AdaptationView } from "@/components/adaptation-view";
import { AdaptationHelp } from "@/components/adaptation-help";
import { listThreads } from "@/server/services/communication";
import styles from "@/components/adaptation.module.css";
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
    <section className={`narrow stack ${styles.page}`}>
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <header className={styles.heading}>
        <p className="eyebrow detail-label">{plan.constraints.institution}</p>
        <h1>Twój plan działania</h1>
        <p>
          {innovation.title} · Wersja {plan.revision}
        </p>
        <p className="help">
          Propozycja do weryfikacji, bez zatwierdzenia ROPS.
        </p>
        {innovation.origin === "SYNTHETIC" && (
          <p className="help">
            Dane syntetyczne
            {plan.mode === "mock"
              ? " · plan demonstracyjny bez wywołania AI"
              : ""}
            .
          </p>
        )}
      </header>
      <div className="actions">
        <Link href={`/adaptacje/${plan.id}/edycja`}>Edytuj plan</Link>
        <Link href={`/adaptacje/${plan.id}/podglad`}>Pełny plan i PDF</Link>
      </div>
      <AdaptationView
        plan={plan}
        expanded={false}
        showMode={innovation.origin !== "SYNTHETIC"}
      />
      <AdaptationHelp
        planId={plan.id}
        revision={plan.revision}
        conversationId={conversation?.id}
      />
      {conversation && conversation.unread > 0 && (
        <p role="status">Nowe wiadomości: {conversation.unread}</p>
      )}
      <Link href={`/potrzeby/${plan.needId}`}>Wróć do potrzeby</Link>
    </section>
  );
}
