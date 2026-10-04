import Link from "next/link";
import type { ThreadSummary } from "@/lib/contracts/communication";
import { contactLabels } from "@/lib/contact-purpose";
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
              {t.title ||
                (t.purpose
                  ? contactLabels[t.purpose]
                  : "Rozmowa z koordynatorem")}
            </Link>
          </h2>
          <p className="help">
            {t.purpose && <strong>{contactLabels[t.purpose]} · </strong>}
            {t.ideaId
              ? "Rozmowa o pomyśle"
              : t.adaptationId
                ? "Rozmowa o adaptacji"
                : t.needId
                  ? "Rozmowa o potrzebie"
                  : "Rozmowa o innowacji"}{" "}
            · {t.id.slice(0, 8)}
          </p>
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
