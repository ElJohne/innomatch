"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function QuickHelp({
  needId,
  solution,
  existingThread,
}: {
  needId: string;
  solution?: string;
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
          body: solution
            ? `Proszę o pomoc w mojej zapisanej sprawie. Wybrałem rozwiązanie „${solution}”. Proszę o wskazanie, jak mogę z niego skorzystać.`
            : "Proszę o pomoc w mojej zapisanej sprawie. W katalogu nie znalazłem odpowiedniego rozwiązania. Proszę o wskazanie innych możliwości wsparcia.",
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
      {!existingThread && (
        <p className="help">
          {solution
            ? "Wyślesz koordynatorowi swój opis i wybrane rozwiązanie."
            : "Wyślesz koordynatorowi swój opis potrzeby."}
        </p>
      )}
      <button onClick={send} disabled={busy}>
        {busy
          ? "Wysyłamy…"
          : existingThread
            ? "Otwórz moją rozmowę →"
            : "Poproś o pomoc →"}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
