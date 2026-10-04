import { redirect } from "next/navigation";
import Link from "next/link";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { threadQueue } from "@/server/services/communication";
import { queueQuery } from "@/lib/contracts/communication";
import { ThreadList } from "@/components/thread-list";
import {
  LogoutButton,
  RefreshMessages,
} from "@/components/communication-forms";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unread?: string }>;
}) {
  if (!(await session()).ownerId) redirect("/personel/logowanie");
  const a = await actor();
  if (!a.staff) redirect("/personel/logowanie");
  const parsed = queueQuery.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : { page: 1, unread: "0" };
  const result = await threadQueue(a, {
    page: query.page,
    unread: query.unread === "1",
  });
  const { items, unreadMessages: unread } = result;
  return (
    <section className="narrow">
      <p className="eyebrow">Panel koordynatora</p>
      <h1>Skrzynka zgłoszeń</h1>
      <p className="lead">
        Wspólna skrzynka upoważnionego personelu. Otwarcie rozmowy oznacza
        widoczne wiadomości jako przeczytane dla zespołu.
      </p>
      <p role="status">
        Nieprzeczytane wiadomości we wszystkich rozmowach:{" "}
        <strong>{unread}</strong>
      </p>
      <p className="help">
        Rozmowy: {result.total}. Strona {result.page}. Odśwież skrzynkę, aby
        sprawdzić nowe zgłoszenia.
      </p>
      <nav className="actions" aria-label="Filtr rozmów">
        <Link
          href="/admin"
          aria-current={query.unread === "0" ? "page" : undefined}
        >
          Wszystkie rozmowy
        </Link>
        <Link
          href="/admin?unread=1"
          aria-current={query.unread === "1" ? "page" : undefined}
        >
          Tylko nieprzeczytane
        </Link>
      </nav>
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
      <nav className="actions" aria-label="Strony rozmów">
        {result.page > 1 && (
          <Link href={`/admin?page=${result.page - 1}&unread=${query.unread}`}>
            ← Poprzednia strona
          </Link>
        )}
        {result.hasNext && (
          <Link href={`/admin?page=${result.page + 1}&unread=${query.unread}`}>
            Następna strona →
          </Link>
        )}
      </nav>
    </section>
  );
}
