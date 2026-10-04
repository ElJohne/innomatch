import Link from "next/link";
import { notFound } from "next/navigation";
import { AdaptationEditor } from "@/components/adaptation-editor";
import { session } from "@/server/auth/session";
import { getPlan } from "@/server/services/adaptations";
import { listInnovations } from "@/server/services/repository";

export default async function EditPlan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await session();
  if (!owner.ownerId) notFound();
  const plan = await getPlan((await params).id, owner.ownerId);
  if (!plan) notFound();
  const innovation = (await listInnovations()).find(
    (record) => record.id === plan.innovationId,
  );
  if (!innovation) notFound();
  return (
    <section className="narrow stack">
      <Link href={`/adaptacje/${plan.id}`}>← Wróć do planu</Link>
      <header>
        <h1>Edytuj plan</h1>
        <p>{innovation.title}</p>
        <p className="help">
          Poprawki pozostają prywatne. Nową wersję udostępnisz w rozmowie.
        </p>
        {plan.mode === "mock" && (
          <p className="help">Plan demonstracyjny — bez wywołania AI.</p>
        )}
      </header>
      <AdaptationEditor initial={plan} sources={innovation.sources} />
    </section>
  );
}
