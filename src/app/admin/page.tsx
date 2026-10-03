import { redirect } from "next/navigation";
import Link from "next/link";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { listThreads } from "@/server/services/communication";
import { ThreadList } from "@/components/thread-list";
import {
  LogoutButton,
  RefreshMessages,
} from "@/components/communication-forms";
export default async function AdminPage() {
  if (!(await session()).ownerId) redirect("/personel/logowanie");
  const a = await actor();
  if (!a.staff) redirect("/personel/logowanie");
  const items = await listThreads(a);
  const unread = items.reduce((sum, t) => sum + t.unread, 0);
  return (
    <section className="narrow">
      <p className="eyebrow">Panel koordynatora</p>
      <h1>Skrzynka zgłoszeń</h1>
      <p className="lead">
        Wspólna skrzynka upoważnionego personelu. Otwarcie rozmowy oznacza
        widoczne wiadomości jako przeczytane dla zespołu.
      </p>
      <p role="status">
        Nieprzeczytane wiadomości w wyświetlonych rozmowach:{" "}
        <strong>{unread}</strong>
      </p>
      <p className="help">
        Do 200 ostatnio aktualizowanych rozmów. Odśwież skrzynkę, aby sprawdzić
        nowe zgłoszenia.
      </p>
      <div className="actions">
        {a.staff.role === "ADMIN" && (
          <Link className="button secondary" href="/admin/statystyki">
            Statystyki potrzeb
          </Link>
        )}
        {a.staff.role === "ADMIN" && (
          <Link className="button secondary" href="/admin/opinie">
            Moderacja opinii
          </Link>
        )}
        {a.staff.role === "ADMIN" && (
          <Link className="button" href="/admin/katalog">
            Katalog i wiedza
          </Link>
        )}
        <RefreshMessages />
        <LogoutButton />
      </div>
      <ThreadList items={items} />
    </section>
  );
}
