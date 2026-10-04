import Link from "next/link";
import type { ThreadSummary } from "@/lib/contracts/communication";
import { contactLabels } from "@/lib/contact-purpose";
import styles from "./communication.module.css";
export function ThreadList({ items }: { items: ThreadSummary[] }) {
  return items.length ? (
    <ul className={styles.list}>
      {[...items]
        .sort(
          (a, b) =>
            Number(b.unread > 0) - Number(a.unread > 0) ||
            b.updatedAt.localeCompare(a.updatedAt),
        )
        .map((t) => (
          <li
            className={`${styles.row} ${t.unread > 0 ? styles.unread : ""}`}
            key={t.id}
          >
            <div className={styles.rowMeta}>
              <span>
                {t.purpose
                  ? contactLabels[t.purpose]
                  : "Rozmowa z koordynatorem"}
              </span>
              <time dateTime={t.updatedAt}>
                {new Date(t.updatedAt).toLocaleDateString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                })}
              </time>
            </div>
            <h3>
              <Link href={`/wiadomosci/${t.id}`}>
                {t.title || "Otwórz rozmowę"}
              </Link>
            </h3>
            {t.unread > 0 && (
              <p className={styles.badge}>Nowe wiadomości: {t.unread}</p>
            )}
          </li>
        ))}
    </ul>
  ) : (
    <p>Nie masz jeszcze rozmów z koordynatorem.</p>
  );
}
