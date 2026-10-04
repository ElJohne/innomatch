import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { moderationFeedbackQueue } from "@/server/services/pilots";
import { FeedbackReview } from "@/components/pilot-forms";
import {
  experienceLabels,
  feedbackStatusLabels,
  feedbackQueueQuery,
} from "@/lib/contracts/pilot";
export default async function FeedbackModeration({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const a = await adminPage();
  const parsed = feedbackQueueQuery.safeParse(await searchParams);
  const query = parsed.success
    ? parsed.data
    : { page: 1, status: "ALL" as const };
  const result = await moderationFeedbackQueue(a, query);
  const { items } = result;
  return (
    <section className="narrow">
      <Link href="/admin">← Skrzynka zgłoszeń</Link>
      <p className="eyebrow">Moderacja</p>
      <h1>Opinie o innowacjach</h1>
      <p className="lead">
        Sprawdź treść przed publikacją. Oceny są opiniami użytkowników, a opis
        użycia jest ich deklaracją.
      </p>
      <p className="help">
        Oczekujących na moderację: {result.pending}. Opinie w wybranym filtrze:{" "}
        {result.total}. Strona {result.page}.
      </p>
      <nav className="actions" aria-label="Filtr opinii">
        <Link
          href="/admin/opinie"
          aria-current={query.status === "ALL" ? "page" : undefined}
        >
          Wszystkie
        </Link>
        {Object.entries(feedbackStatusLabels).map(([status, label]) => (
          <Link
            key={status}
            href={`/admin/opinie?status=${status}`}
            aria-current={query.status === status ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!items.length && <p>Brak opinii do wyświetlenia.</p>}
      <div className="stack">
        {items.map((item) => (
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
              {feedbackStatusLabels[item.status]} · wersja {item.revision} ·
              ocena {item.rating}/5
            </p>
            <p className="help">{experienceLabels[item.experience]}</p>
            {item.origin === "SYNTHETIC" && (
              <p className="notice">
                Opinia syntetyczna — dane demonstracyjne.
              </p>
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
