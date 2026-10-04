import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { listInnovations, listNeeds } from "@/server/services/repository";
import { AdaptationForm } from "@/components/adaptation-form";
import { getPlanRecovery } from "@/server/services/adaptations";

export default async function NewPlan({
  searchParams,
}: {
  searchParams: Promise<{
    innovationId?: string;
    needId?: string;
    fromPlan?: string;
  }>;
}) {
  const query = await searchParams;
  const s = await session(),
    needs = s.ownerId ? await listNeeds(s.ownerId) : [];
  const recovery =
    query.fromPlan && s.ownerId
      ? await getPlanRecovery(query.fromPlan, s.ownerId)
      : null;
  if (query.fromPlan && !recovery) notFound();
  const needId = recovery?.needId ?? query.needId;
  if (needId && !needs.some((n) => n.id === needId)) notFound();
  const innovations = await listInnovations();
  const innovation = innovations.find((r) => r.id === query.innovationId);
  if (recovery && !query.innovationId)
    return (
      <section className="narrow stack">
        <Link href={`/adaptacje/${recovery.id}`}>← Zachowany plan</Link>
        <h1>Wybierz rozwiązanie do nowego planu</h1>
        <p>
          Twoje warunki instytucji zostaną przeniesione. Wybierz opublikowaną
          innowację i sprawdź, czy odpowiada potrzebie.
        </p>
        {innovations.length ? (
          <form className="form card stack" method="get">
            <input type="hidden" name="fromPlan" value={recovery.id} />
            <input type="hidden" name="needId" value={recovery.needId} />
            <label htmlFor="replacement-innovation">
              Opublikowane rozwiązanie
            </label>
            <select
              id="replacement-innovation"
              name="innovationId"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Wybierz rozwiązanie
              </option>
              {innovations.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.title}
                </option>
              ))}
            </select>
            <button>Dalej — sprawdź warunki →</button>
          </form>
        ) : (
          <p>
            Nie ma teraz opublikowanych rozwiązań. Twój plan i warunki pozostają
            zachowane.
          </p>
        )}
        <Link href={`/potrzeby/${recovery.needId}`}>
          Wróć do potrzeby i kontaktu z koordynatorem
        </Link>
      </section>
    );
  if (!innovation) notFound();
  return (
    <section className="narrow">
      {query.needId && (
        <p>
          <Link href={`/potrzeby/${query.needId}`}>← Wróć do propozycji</Link>
        </p>
      )}
      <Link href={`/innowacje/${innovation.id}`}>← Innowacja</Link>
      <p className="eyebrow detail-label">Plan dla instytucji</p>
      <h1>Przygotuj plan działania</h1>
      <p className="lead">{innovation.title}</p>
      <p>Podaj typ instytucji. Resztę możesz doprecyzować później.</p>
      {innovation.origin === "SYNTHETIC" && (
        <p className="notice">Przykład demonstracyjny — dane syntetyczne.</p>
      )}
      {needs.length ? (
        <AdaptationForm
          innovationId={innovation.id}
          needs={needs}
          selectedNeedId={needId}
          initialConstraints={recovery?.constraints}
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
