import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { listInnovations, listNeeds } from "@/server/services/repository";
import { AdaptationForm } from "@/components/adaptation-form";
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
    <section className="narrow">
      <Link href={`/innowacje/${innovation.id}`}>← Innowacja</Link>
      <p className="eyebrow detail-label">Middleman Innowacji</p>
      <h1>Dostosuj do mojej instytucji</h1>
      <p className="lead">{innovation.title}</p>
      {innovation.origin === "SYNTHETIC" && (
        <p className="notice">
          Przykład syntetyczny, nie innowacja z portfolio ROPS.
        </p>
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
          <p>
            Plan będzie powiązany z Twoją prywatną sprawą. Po zapisaniu potrzeby
            wybierz innowację i wróć do adaptacji.
          </p>
          <Link className="button" href="/potrzeby/nowa">
            Opisz potrzebę
          </Link>
        </div>
      )}
    </section>
  );
}
