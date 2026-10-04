import { redirect } from "next/navigation";
import Link from "next/link";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { threadQueue } from "@/server/services/communication";
import { queueQuery } from "@/lib/contracts/communication";
import { ThreadList } from "@/components/thread-list";
import { RefreshMessages } from "@/components/communication-forms";
import { AdminNavigation } from "./admin-navigation";
import styles from "./admin.module.css";
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
    <section className={styles.page}>
      <AdminNavigation active="inbox" isAdmin={a.staff.role === "ADMIN"} />
      <header className={styles.heading}>
        <h1>Skrzynka zgłoszeń</h1>
        <RefreshMessages />
      </header>
      <div className={styles.toolbar}>
        <p role="status">
          <strong>{unread}</strong> nieprzeczytanych wiadomości · {result.total}{" "}
          rozmów
        </p>
        <p className="help">
          Otwarcie rozmowy oznacza ją jako przeczytaną dla zespołu.
        </p>
      </div>
      <nav className={styles.tabs} aria-label="Filtr rozmów">
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
