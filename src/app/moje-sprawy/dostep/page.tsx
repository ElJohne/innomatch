import Link from "next/link";
import { session } from "@/server/auth/session";
import { actor } from "@/server/auth/staff";
import { RecoveryPanel } from "@/components/recovery-panel";
export default async function AccessPage() {
  const s = await session();
  const a = s.ownerId ? await actor() : null;
  return (
    <section className="narrow">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <h1>Dostęp do moich spraw</h1>
      {a?.staff ? (
        <p>
          Kod nie przywraca dostępu personelu.{" "}
          <Link href="/admin">Otwórz skrzynkę personelu</Link>
        </p>
      ) : (
        <RecoveryPanel canIssue={Boolean(s.ownerId)} />
      )}
    </section>
  );
}
