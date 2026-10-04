import Link from "next/link";
import { redirect } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { queueQuery } from "@/lib/contracts/communication";
import { threadQueue } from "@/server/services/communication";
import { ThreadList } from "@/components/thread-list";
import { RefreshMessages } from "@/components/communication-forms";

export default async function Conversations({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unread?: string }>;
}) {
  if (!(await session()).ownerId) redirect("/moje-sprawy");
  const a = await actor();
  if (a.staff) redirect("/admin");
  const parsed = queueQuery.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : { page: 1, unread: "0" };
  const result = await threadQueue(a, {
    page: query.page,
    unread: query.unread === "1",
  });
  return (
    <section className="narrow">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <h1>Moje rozmowy</h1>
      <p role="status">
        Nowe wiadomości: {result.unreadMessages}. Rozmowy w wybranym filtrze:{" "}
        {result.total}.
      </p>
      <nav className="actions" aria-label="Filtr rozmów">
        <Link
          href="/wiadomosci"
          aria-current={query.unread === "0" ? "page" : undefined}
        >
          Wszystkie rozmowy
        </Link>
        <Link
          href="/wiadomosci?unread=1"
          aria-current={query.unread === "1" ? "page" : undefined}
        >
          Tylko nieprzeczytane
        </Link>
        <RefreshMessages />
      </nav>
      <ThreadList items={result.items} />
      <nav className="actions" aria-label="Strony rozmów">
        {result.page > 1 && (
          <Link
            href={`/wiadomosci?page=${result.page - 1}&unread=${query.unread}`}
          >
            ← Poprzednia strona
          </Link>
        )}
        {result.hasNext && (
          <Link
            href={`/wiadomosci?page=${result.page + 1}&unread=${query.unread}`}
          >
            Następna strona →
          </Link>
        )}
      </nav>
    </section>
  );
}
