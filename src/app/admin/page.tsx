import { redirect } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { listThreads } from "@/server/services/communication";
import { ThreadList } from "@/components/thread-list";
import { RefreshMessages } from "@/components/communication-forms";
import { AdminNavigation } from "./admin-navigation";
import styles from "./admin.module.css";
export default async function AdminPage() {
  if (!(await session()).ownerId) redirect("/personel/logowanie");
  const a = await actor();
  if (!a.staff) redirect("/personel/logowanie");
  const items = await listThreads(a);
  const unread = items.reduce((sum, t) => sum + t.unread, 0);
  return (
    <section className={styles.page}>
      <AdminNavigation active="inbox" isAdmin={a.staff.role === "ADMIN"} />
      <header className={styles.heading}>
        <h1>Skrzynka zgłoszeń</h1>
        <RefreshMessages />
      </header>
      <div className={styles.toolbar}>
        <p role="status">
          <strong>{unread}</strong> nieprzeczytanych wiadomości · {items.length}{" "}
          rozmów
        </p>
        <p className="help">
          Otwarcie rozmowy oznacza ją jako przeczytaną dla zespołu.
        </p>
      </div>
      <ThreadList items={items} />
      {items.length === 200 && (
        <p className="help">Wyświetlono 200 ostatnio aktualizowanych rozmów.</p>
      )}
    </section>
  );
}
