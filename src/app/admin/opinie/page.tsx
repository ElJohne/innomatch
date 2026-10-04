import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { moderationFeedback } from "@/server/services/pilots";
import { FeedbackReview } from "@/components/pilot-forms";
import { experienceLabels, feedbackStatusLabels } from "@/lib/contracts/pilot";
import { AdminNavigation } from "../admin-navigation";
import styles from "../admin.module.css";
export default async function FeedbackModeration({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const items = await moderationFeedback(await adminPage());
  const { status } = await searchParams;
  const selected =
    status && status in feedbackStatusLabels ? status : "IN_REVIEW";
  const visible =
    status === "all" ? items : items.filter((item) => item.status === selected);
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
          Do sprawdzenia (
          {items.filter((item) => item.status === "IN_REVIEW").length})
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
      {items.length === 200 && (
        <p className="help">
          Widok obejmuje 200 ostatnio aktualizowanych opinii.
        </p>
      )}
    </section>
  );
}
