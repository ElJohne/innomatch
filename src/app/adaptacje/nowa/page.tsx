import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { listInnovations, listNeeds } from "@/server/services/repository";
import { AdaptationForm } from "@/components/adaptation-form";
import styles from "@/components/adaptation.module.css";

export default async function NewPlan({
  searchParams,
}: {
  searchParams: Promise<{ innovationId?: string; needId?: string }>;
}) {
  const query = await searchParams;
  const innovation = (await listInnovations()).find(
    (r) => r.id === query.innovationId,
  );
  if (!innovation) notFound();
  const s = await session(),
    needs = s.ownerId ? await listNeeds(s.ownerId) : [];
  if (query.needId && !needs.some((n) => n.id === query.needId)) notFound();
  return (
    <section className="narrow stack">
      <Link
        href={
          query.needId
            ? `/potrzeby/${query.needId}`
            : `/innowacje/${innovation.id}`
        }
      >
        {query.needId ? "← Wróć do propozycji" : "← Wróć do innowacji"}
      </Link>
      <header className={styles.heading}>
        <h1>Dostosuj rozwiązanie do siebie</h1>
        <p className="lead">{innovation.title}</p>
      </header>
      {innovation.origin === "SYNTHETIC" && (
        <p className="notice">Przykład demonstracyjny — dane syntetyczne.</p>
      )}
      {needs.length ? (
        <AdaptationForm
          innovationId={innovation.id}
          needs={needs}
          selectedNeedId={query.needId}
        />
      ) : (
        <div className="card">
          <h2>Najpierw opisz swoją potrzebę</h2>
          <Link className="button" href="/potrzeby/nowa">
            Opisz potrzebę
          </Link>
        </div>
      )}
    </section>
  );
}
