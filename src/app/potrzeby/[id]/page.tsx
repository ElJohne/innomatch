import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { MatchResults } from "@/components/match-results";
export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const need = await getNeed((await params).id, s.ownerId);
  if (!need) notFound();
  return (
    <section className="narrow wide">
      <p className="eyebrow">02 / Od potrzeby do rozwiązania</p>
      <h1>Twoja potrzeba. Możliwe kierunki.</h1>
      <details className="card need-summary">
        <summary>Twój opis potrzeby · prywatny</summary>
        <p>{need.description}</p>
        {need.constraints && (
          <p>
            <strong>Ograniczenia:</strong> {need.constraints}
          </p>
        )}
      </details>
      <MatchResults
        id={need.id}
        initial={need.match ? await visibleMatch(need.match) : null}
        records={await listInnovations()}
      />
    </section>
  );
}
