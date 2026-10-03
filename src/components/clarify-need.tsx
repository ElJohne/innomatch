"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { needInput, type NeedInput } from "@/lib/contracts";
import { urgentSignal } from "@/lib/need-guidance";
import { UrgentHelp } from "./urgent-help";
export function ClarifyNeed({
  input,
  questions,
}: {
  input: NeedInput;
  questions: string[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef("");
  const remaining = 6 - (input.clarifications?.length ?? 0);
  const shown = questions.slice(0, Math.min(2, remaining));
  if (!shown.length) return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const extra = shown
      .map((question, i) => ({ question, answer: answers[i]?.trim() ?? "" }))
      .filter((x) => x.answer);
    if (!extra.length) {
      setError("Odpowiedz na przynajmniej jedno pytanie.");
      return;
    }
    setBusy(true);
    setError("");
    key.current ||= crypto.randomUUID();
    try {
      const body = needInput.parse({
        ...input,
        clarifications: [...(input.clarifications ?? []), ...extra],
      });
      const r = await fetch("/api/needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(result.message || "Nie udało się zapisać odpowiedzi.");
      router.push(`/potrzeby/${result.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nie udało się zapisać odpowiedzi.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="card form" onSubmit={submit}>
      <h2>Doprecyzujmy razem</h2>
      <p>
        Odpowiedz własnymi słowami. Zachowamy Twój pierwotny opis i wcześniejsze
        odpowiedzi. Nie wpisuj danych osobowych.
      </p>
      <details>
        <summary>Twój dotychczasowy opis</summary>
        <p>{input.description}</p>
        {input.clarifications?.map((x, i) => (
          <p key={i}>
            {x.question} {x.answer}
          </p>
        ))}
      </details>
      {shown.map((q, i) => (
        <div key={q}>
          <label htmlFor={`answer-${i}`}>{q}</label>
          <textarea
            id={`answer-${i}`}
            maxLength={500}
            value={answers[i] ?? ""}
            onChange={(e) => {
              setAnswers((a) => {
                const next = [...a];
                next[i] = e.target.value;
                return next;
              });
              key.current = "";
            }}
          />
        </div>
      ))}
      {urgentSignal(answers.join("\n")) && <UrgentHelp prominent />}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={busy}>
        {busy ? "Zapisujemy odpowiedź…" : "Uwzględnij odpowiedź i szukaj"}
      </button>
    </form>
  );
}
