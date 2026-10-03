"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Feedback,
  type Participation,
  feedbackStatusLabels,
  experienceLabels,
} from "@/lib/contracts/pilot";

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
  const [message, setMessage] = useState("");
  async function interest() {
    setBusy("interest");
    setMessage("");
    try {
      setParticipation(
        await send(
          `/api/innovations/${innovationId}/test-interest`,
          "POST",
          {},
        ),
      );
      setMessage(
        "Zapisano zgłoszenie i wiadomość do koordynatora. Uzgodnij z nim dalsze kroki w rozmowie.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nie udało się zapisać.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="stack">
      <section className="card">
        <h2>Chcę testować innowację</h2>
        <p>
          Zgłoszenie jest prywatne. Wyślemy koordynatorowi wiadomość z
          kontekstem tej innowacji. Warunki, dostępność i udział wymagają
          osobnego uzgodnienia.
        </p>
        {participation ? (
          <p>
            Zgłoszono zainteresowanie.{" "}
            <Link href={`/wiadomosci/${participation.threadId}`}>
              Otwórz rozmowę z koordynatorem →
            </Link>
          </p>
        ) : (
          <button type="button" disabled={Boolean(busy)} onClick={interest}>
            {busy === "interest" ? "Zapisuję…" : "Zgłoś chęć udziału"}
          </button>
        )}
        <p className="help">
          Zgłoszenie nie potwierdza przeprowadzenia pilotażu ani skuteczności
          rozwiązania.
        </p>
      </section>
      <section className="card">
        <h2>{feedback ? "Twoja opinia" : "Oceń i podziel się opinią"}</h2>
        {feedback && (
          <p>
            Status:{" "}
            <strong>
              {sourceCurrent
                ? feedbackStatusLabels[feedback.status]
                : "Wymaga aktualizacji materiału"}
            </strong>{" "}
            · wersja {feedback.revision}
          </p>
        )}
        {!sourceCurrent && (
          <p className="notice">
            Materiał o innowacji zmienił się. Twoja opinia nie jest publiczna.
            Sprawdź aktualny opis i zapisz opinię ponownie do moderacji.
          </p>
        )}
        <p>
          Opinia pojawi się publicznie po moderacji. Zmiana treści wycofa
          dotychczasową publikację do ponownego sprawdzenia. Nie podawaj danych
          osobowych ani poufnych informacji o uczestnikach.
        </p>
        <form
          className="form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            setBusy("feedback");
            setMessage("");
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
              setMessage(
                saved.status === "IN_REVIEW"
                  ? "Zapisano opinię do moderacji. Nie jest jeszcze publiczna."
                  : "Opinia nie zmieniła się; zachowano jej dotychczasowy status.",
              );
              router.refresh();
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Nie udało się zapisać.",
              );
            } finally {
              setBusy(null);
            }
          }}
        >
          <label>
            Podstawa opinii
            <select
              name="experience"
              defaultValue={initialFeedback?.experience ?? "DESCRIPTION"}
            >
              {Object.entries(experienceLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ocena (1 — najniższa, 5 — najwyższa)
            <select
              name="rating"
              required
              defaultValue={initialFeedback?.rating ?? ""}
            >
              <option value="" disabled>
                Wybierz ocenę
              </option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Twoja opinia
            <textarea
              name="comment"
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              defaultValue={initialFeedback?.comment ?? ""}
            />
          </label>
          <label>
            Propozycje ulepszeń (opcjonalnie)
            <textarea
              name="improvements"
              maxLength={1500}
              rows={3}
              defaultValue={initialFeedback?.improvements ?? ""}
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="consent" required /> Zgadzam się na
            publiczne pokazanie oceny i treści opinii po moderacji, bez
            identyfikatora mojej sesji.
          </label>
          <button disabled={Boolean(busy)}>
            {busy === "feedback" ? "Zapisuję…" : "Zapisz opinię do moderacji"}
          </button>
        </form>
      </section>
      <p role="status" aria-live="polite">
        {message}
      </p>
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
