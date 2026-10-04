import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { moderationFeedbackQueue } from "@/server/services/pilots";
import { FeedbackReview } from "@/components/pilot-forms";
import {
  experienceLabels,
  feedbackStatusLabels,
  feedbackQueueQuery,
} from "@/lib/contracts/pilot";
import { AdminNavigation } from "../admin-navigation";
import styles from "../admin.module.css";
export default async function FeedbackModeration({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const raw = await searchParams;
  const parsed = feedbackQueueQuery.safeParse({
    ...raw,
    status: raw.status === "all" ? "ALL" : (raw.status ?? "IN_REVIEW"),
  });
  const query = parsed.success
    ? parsed.data
    : { page: 1, status: "IN_REVIEW" as const };
  const result = await moderationFeedbackQueue(await adminPage(), query);
  const visible = result.items;
  const selected = query.status;
  const status = selected === "ALL" ? "all" : selected;
  return (
    <section className={styles.page}>
      <AdminNavigation active="feedback" />
      <header className={styles.heading}>
        <h1>Opinie o innowacjach</h1>
      </header>
      <nav className={styles.tabs} aria-label="Status opinii">
        <Link
          href="/admin/opinie"
          aria-current={
            status !== "all" && selected === "IN_REVIEW" ? "page" : undefined
          }
        >
          Do sprawdzenia ({result.pending})
        </Link>
        <Link
          href="/admin/opinie?status=PUBLISHED"
          aria-current={selected === "PUBLISHED" ? "page" : undefined}
        >
          Opublikowane
        </Link>
        <Link
          href="/admin/opinie?status=all"
          aria-current={status === "all" ? "page" : undefined}
        >
          Wszystkie
        </Link>
      </nav>
      <p className="help">Przed publikacją sprawdź treść i dane osobowe.</p>
      <p className="help">
        Opinie w tym widoku: {result.total}. Strona {result.page}.
      </p>
      {!visible.length && (
        <p className={styles.empty}>
          {selected === "IN_REVIEW" && status !== "all"
            ? "Nie ma opinii oczekujących na sprawdzenie."
            : "Brak opinii w tym widoku."}
        </p>
      )}
      <div className="stack">
        {visible.map((item) => (
          <article className="card" key={`${item.id}:${item.revision}`}>
            <h2>
              {item.title ? (
                <Link href={`/innowacje/${item.innovationId}`}>
                  {item.title}
                </Link>
              ) : (
                "Niedostępna innowacja"
              )}
            </h2>
            <p>
              {feedbackStatusLabels[item.status]} · ocena {item.rating}/5
            </p>
            <p className="help">{experienceLabels[item.experience]}</p>
            {item.origin === "SYNTHETIC" && (
              <p className="notice">Dane demonstracyjne</p>
            )}
            <p className="message-body">{item.comment}</p>
            {item.improvements && (
              <>
                <h3>Propozycje ulepszeń</h3>
                <p className="message-body">{item.improvements}</p>
              </>
            )}
            <FeedbackReview
              id={item.id}
              revision={item.revision}
              sourceCurrent={item.sourceCurrent}
              status={item.status}
            />
          </article>
        ))}
      </div>
      <nav className="actions" aria-label="Strony opinii">
        {result.page > 1 && (
          <Link
            href={`/admin/opinie?page=${result.page - 1}&status=${query.status}`}
          >
            ← Poprzednia strona
          </Link>
        )}
        {result.hasNext && (
          <Link
            href={`/admin/opinie?page=${result.page + 1}&status=${query.status}`}
          >
            Następna strona →
          </Link>
        )}
      </nav>
    </section>
  );
}
