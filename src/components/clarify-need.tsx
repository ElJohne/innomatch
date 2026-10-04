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
  const keyMode = useRef(false);
  const shown =
    input.skipClarification || input.clarifications?.length
      ? []
      : questions.slice(0, 1);
  if (!shown.length) return null;
  async function submit(skip = false) {
    if (busy) return;
    const extra = shown
      .map((question, i) => ({ question, answer: answers[i]?.trim() ?? "" }))
      .filter((x) => x.answer);
    if (!extra.length && !skip) {
      setError("Wpisz odpowiedź lub wybierz „Pomiń pytanie”.");
      return;
    }
    setBusy(true);
    setError("");
    if (keyMode.current !== skip) key.current = "";
    keyMode.current = skip;
    key.current ||= crypto.randomUUID();
    try {
      const body = needInput.parse({
        ...input,
        skipClarification: skip,
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
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {shown.map((q, i) => (
        <div key={q}>
          <label htmlFor={`answer-${i}`}>{q}</label>
          <textarea
            id={`answer-${i}`}
            maxLength={500}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? "clarification-error" : undefined}
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
        <p id="clarification-error" role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={busy}>{busy ? "Szukamy…" : "Szukaj →"}</button>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => void submit(true)}
      >
        Pomiń pytanie
      </button>
    </form>
  );
}
