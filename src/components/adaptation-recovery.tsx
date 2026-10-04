import Link from "next/link";
import { constraintLabels } from "@/lib/contracts/adaptation";
import type { getPlanRecovery } from "@/server/services/adaptations";

export function AdaptationRecovery({
  recovery,
}: {
  recovery: NonNullable<Awaited<ReturnType<typeof getPlanRecovery>>>;
}) {
  const restart = new URLSearchParams({
    needId: recovery.needId,
    fromPlan: recovery.id,
    ...(recovery.innovationId ? { innovationId: recovery.innovationId } : {}),
  });
  return (
    <section className="narrow stack">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <h1>Źródło planu wymaga ponownej weryfikacji</h1>
      <p role="status">
        {recovery.sourceStatus === "changed"
          ? "Materiał źródłowy zmienił się od przygotowania planu."
          : "Materiał źródłowy nie jest obecnie dostępny w katalogu."}{" "}
        Wersja {recovery.revision} i zapisane poprawki pozostają zachowane.
        Starego planu nie można teraz udostępnić. Jego treść będzie dostępna,
        jeśli administrator przywróci tę samą wersję źródła.
      </p>
      <section className="card">
        <h2>Twoje zachowane warunki</h2>
        {Object.entries(constraintLabels).map(([key, label]) => (
          <p key={key}>
            <strong>{label}: </strong>
            {recovery.constraints[key as keyof typeof constraintLabels] ||
              "Nieustalony"}
          </p>
        ))}
      </section>
      <p>
        Nowy plan zachowa te warunki i będzie oddzielnym dokumentem. Nie
        przeniesie automatycznie starej treści o innowacji ani jej ocen.
      </p>
      <Link className="button" href={`/adaptacje/nowa?${restart}`}>
        {recovery.innovationId
          ? "Przygotuj nowy plan z aktualnego źródła →"
          : "Wybierz inne rozwiązanie i zachowaj warunki →"}
      </Link>
      <Link href={`/potrzeby/${recovery.needId}`}>Wróć do swojej potrzeby</Link>
    </section>
  );
}
