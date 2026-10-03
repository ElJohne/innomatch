import Link from "next/link";
import type { ThreadSummary } from "@/lib/contracts/communication";
export function ThreadList({ items }: { items: ThreadSummary[] }) {
  return (
    <div className="stack">
      {items.length === 0 && <p>Nie ma jeszcze rozmów.</p>}
      {items.map((t) => (
        <article className="card" key={t.id}>
          <p className="help">
            {new Date(t.updatedAt).toLocaleString("pl-PL", {
              timeZone: "Europe/Warsaw",
            })}
          </p>
          <h2>
            <Link href={`/wiadomosci/${t.id}`}>
              {t.ideaId
                ? "Rozmowa o pomyśle"
                : t.adaptationId
                  ? "Rozmowa o adaptacji"
                  : t.needId
                    ? "Rozmowa o potrzebie"
                    : "Rozmowa o innowacji"}{" "}
              · {t.id.slice(0, 8)}
            </Link>
          </h2>
          {t.unread > 0 ? (
            <p>
              <strong>Nowe wiadomości: {t.unread}</strong>
            </p>
          ) : (
            <p className="help">Brak nieprzeczytanych wiadomości</p>
          )}
        </article>
      ))}
    </div>
  );
}
