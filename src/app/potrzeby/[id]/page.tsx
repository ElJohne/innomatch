import { notFound } from "next/navigation";
import Link from "next/link";
import { session } from "@/server/auth/session";
import {
  getNeed,
  listInnovations,
  listKnowledge,
} from "@/server/services/repository";
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
        resources={await listKnowledge()}
      />
      <aside className="note">
        <h2>Potrzebujesz wsparcia?</h2>
        <p>
          Zapytaj o dobór rozwiązania lub współpracę. Koordynator otrzyma opis
          tej potrzeby i Twoją wiadomość.
        </p>
        <Link className="button" href={`/wiadomosci/nowa?needId=${need.id}`}>
          Zapytaj koordynatora
        </Link>
      </aside>
    </section>
  );
}
