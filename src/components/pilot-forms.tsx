"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Feedback,
  type Participation,
  feedbackStatusLabels,
} from "@/lib/contracts/pilot";
import styles from "./pilot-forms.module.css";

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message ?? "Nie udało się zapisać. Spróbuj ponownie.");
  return data;
}
export function PilotForms({
  innovationId,
  initialParticipation,
  initialFeedback,
  sourceCurrent,
}: {
  innovationId: string;
  initialParticipation: Participation | null;
  initialFeedback: Feedback | null;
  sourceCurrent: boolean;
}) {
  const router = useRouter();
  const [participation, setParticipation] = useState(initialParticipation);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [busy, setBusy] = useState<"interest" | "feedback" | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [failed, setFailed] = useState<"interest" | "feedback" | null>(null);
  async function interest() {
    if (busy || participation) return;
    setBusy("interest");
    setInterestMessage("");
    setFailed(null);
    try {
      setParticipation(
        await send(
          `/api/innovations/${innovationId}/test-interest`,
          "POST",
          {},
        ),
      );
      setInterestMessage("Zgłoszenie wysłane. Ustal szczegóły w rozmowie.");
      router.refresh();
    } catch (error) {
      setFailed("interest");
      setInterestMessage(
        error instanceof Error ? error.message : "Nie udało się zapisać.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className={styles.pilot}>
      <section
        className={`card ${styles.interest}`}
        aria-labelledby="pilot-interest-heading"
      >
        <div>
          <h2 id="pilot-interest-heading">
            {participation
              ? "Twoje zgłoszenie do testów"
              : "Chcę testować innowację"}
          </h2>
          <p>Udział i warunki ustalisz z koordynatorem w prywatnej rozmowie.</p>
        </div>
        {participation ? (
          <Link
            className="button secondary"
            href={`/wiadomosci/${participation.threadId}`}
          >
            Otwórz rozmowę z koordynatorem →
          </Link>
        ) : (
          <button type="button" disabled={Boolean(busy)} onClick={interest}>
            {busy === "interest" ? "Zapisuję…" : "Zgłoś chęć udziału"}
          </button>
        )}
        {interestMessage && (
          <p
            className={styles.message}
            role={failed === "interest" ? "alert" : "status"}
          >
            {interestMessage}
          </p>
        )}
      </section>
      <section className={`card ${styles.feedback}`}>
        <h2>{feedback ? "Twoja opinia" : "Oceń i podziel się opinią"}</h2>
        {feedback && (
          <p>
            <strong>
              {sourceCurrent
                ? feedbackStatusLabels[feedback.status]
                : "Zaktualizuj opinię"}
            </strong>
          </p>
        )}
        {!sourceCurrent && (
          <p className="notice">
            Opis innowacji zmienił się. Przeczytaj go i zaktualizuj opinię, aby
            mogła wrócić do publikacji.
          </p>
        )}
        {feedback?.status === "PUBLISHED" && sourceCurrent && (
          <p className="help">
            Po zmianie opinii ponownie sprawdzimy ją przed publikacją.
          </p>
        )}
        <form
          className={`form ${styles.form}`}
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = event.currentTarget;
            const values = new FormData(form);
            setBusy("feedback");
            setFeedbackMessage("");
            setFailed(null);
            try {
              const saved: Feedback = await send(
                `/api/innovations/${innovationId}/feedback`,
                "POST",
                {
                  rating: Number(values.get("rating")),
                  comment: values.get("comment"),
                  improvements: values.get("improvements"),
                  experience: values.get("experience"),
                  consentToPublish: values.get("consent") === "on",
                  expectedRevision: feedback?.revision ?? null,
                },
              );
              setFeedback(saved);
              setFeedbackMessage(
                saved.status === "IN_REVIEW"
                  ? "Opinia zapisana. Czeka na moderację."
                  : "Brak zmian. Twoja opinia jest już zapisana.",
              );
              router.refresh();
            } catch (error) {
              setFailed("feedback");
              setFeedbackMessage(
                error instanceof Error
                  ? error.message
                  : "Nie udało się zapisać.",
              );
            } finally {
              setBusy(null);
            }
          }}
        >
          <div className={styles.formRow}>
            <label>
              Skąd znasz rozwiązanie?
              <select
                name="experience"
                defaultValue={initialFeedback?.experience ?? "DESCRIPTION"}
              >
                <option value="DESCRIPTION">Z opisu</option>
                <option value="USED">Z własnego doświadczenia</option>
              </select>
            </label>
            <fieldset
              className={styles.rating}
              aria-describedby="pilot-rating-hint"
            >
              <legend>Twoja ocena</legend>
              <div className={styles.ratingOptions}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      required
                      defaultChecked={initialFeedback?.rating === value}
                      aria-label={`${value} z 5`}
                    />
                    {value}
                  </label>
                ))}
              </div>
              <p id="pilot-rating-hint" className="help">
                1 — najniższa, 5 — najwyższa
              </p>
            </fieldset>
          </div>
          <label>
            Twoja opinia
            <textarea
              name="comment"
              required
              minLength={20}
              maxLength={2000}
              rows={3}
              placeholder="Co działa dobrze, a co sprawia trudność?"
              aria-describedby="pilot-comment-hint"
              defaultValue={initialFeedback?.comment ?? ""}
            />
          </label>
          <p className="help" id="pilot-comment-hint">
            Minimum 20 znaków. Bez danych osobowych uczestników.
          </p>
          <label>
            Propozycje ulepszeń (opcjonalnie)
            <textarea
              name="improvements"
              maxLength={1500}
              rows={2}
              defaultValue={initialFeedback?.improvements ?? ""}
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="consent" required /> Zgadzam się na
            publikację mojej oceny, opinii i propozycji ulepszeń po moderacji.
          </label>
          <button disabled={Boolean(busy)}>
            {busy === "feedback" ? "Zapisuję…" : "Zapisz opinię do moderacji"}
          </button>
          {feedbackMessage && (
            <p
              className={styles.message}
              role={failed === "feedback" ? "alert" : "status"}
            >
              {feedbackMessage}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}

export function FeedbackReview({
  id,
  revision,
  sourceCurrent,
  status,
}: {
  id: string;
  revision: number;
  sourceCurrent: boolean;
  status: Feedback["status"];
}) {
  const router = useRouter();
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update(next: "PUBLISHED" | "ARCHIVED") {
    setBusy(true);
    setMessage("");
    try {
      await send(`/api/admin/feedback/${id}`, "PATCH", {
        status: next,
        expectedRevision: revision,
        reviewed,
      });
      setReviewed(false);
      setMessage("Zapisano decyzję moderacji.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nie udało się zapisać.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form">
      {!sourceCurrent && (
        <p className="notice">
          Innowacja jest niedostępna lub zmieniona. Publikacja wymaga ponownego
          zapisania opinii przez autora na podstawie aktualnego materiału.
        </p>
      )}
      {status !== "PUBLISHED" && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
          />{" "}
          Sprawdzono treść, dane osobowe i zgodność z kontekstem. Publikacja nie
          potwierdza deklarowanego użycia ani skuteczności.
        </label>
      )}
      <div className="actions">
        {status !== "PUBLISHED" && (
          <button
            disabled={busy || !reviewed || !sourceCurrent}
            onClick={() => update("PUBLISHED")}
          >
            Opublikuj opinię
          </button>
        )}
        {status !== "ARCHIVED" && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => update("ARCHIVED")}
          >
            Ukryj opinię
          </button>
        )}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
