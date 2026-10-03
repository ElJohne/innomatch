import Link from "next/link";
import { adminPage } from "@/server/auth/admin-page";
import { moderationFeedback } from "@/server/services/pilots";
import { FeedbackReview } from "@/components/pilot-forms";
import { experienceLabels, feedbackStatusLabels } from "@/lib/contracts/pilot";
export default async function FeedbackModeration() {
  const items = await moderationFeedback(await adminPage());
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
        Do 200 ostatnio aktualizowanych opinii. Oczekujących w tym zestawie:{" "}
        {items.filter((item) => item.status === "IN_REVIEW").length}.
      </p>
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
    </section>
  );
}
