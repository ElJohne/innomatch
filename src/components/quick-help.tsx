"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function QuickHelp({
  needId,
  solution,
  existingThread,
}: {
  needId: string;
  solution: string;
  existingThread?: string;
}) {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send() {
    if (busy) return;
    if (existingThread) {
      router.push(`/wiadomosci/${existingThread}`);
      return;
    }
    setBusy(true);
    setError("");
    key.current ||= crypto.randomUUID();
    try {
      const r = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          needId,
          requestKey: key.current,
          body: `Proszę o pomoc w mojej zapisanej sprawie. Wybrałem rozwiązanie „${solution}”. Proszę o wskazanie, jak mogę z niego skorzystać.`,
        }),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          data.message || "Nie udało się wysłać. Spróbuj ponownie.",
        );
      router.push(`/wiadomosci/${data.id}?sent=1`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Brak połączenia. Spróbuj ponownie.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <button onClick={send} disabled={busy}>
        {busy
          ? "Wysyłamy…"
          : existingThread
            ? "Otwórz moją rozmowę →"
            : "Poproś o pomoc →"}
      </button>
      <p className="help">
        {existingThread
          ? "Odpowiedź znajdziesz w tej rozmowie."
          : "Twój opis i wybrane rozwiązanie trafią do koordynatora."}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
