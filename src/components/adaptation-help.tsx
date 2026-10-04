"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function AdaptationHelp({
  planId,
  revision,
  conversationId,
}: {
  planId: string;
  revision: number;
  conversationId?: string;
}) {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="stack">
      <button
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          if (conversationId) {
            router.push(`/wiadomosci/${conversationId}`);
            return;
          }
          key.current ||= crypto.randomUUID();
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/threads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                adaptationId: planId,
                adaptationRevision: revision,
                requestKey: key.current,
                body: "Proszę o pomoc w rozpoczęciu działań z załączonego planu. Jaki pierwszy krok powinniśmy podjąć w naszej instytucji?",
              }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            router.push(`/wiadomosci/${data.id}?sent=1`);
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Nie udało się wysłać prośby.",
            );
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Wysyłanie…"
          : conversationId
            ? "Otwórz rozmowę →"
            : "Poproś koordynatora o pomoc →"}
      </button>
      <p className="help">
        {conversationId
          ? "Odpowiedź i udostępniony plan znajdziesz w rozmowie."
          : "Wyślesz tę wersję planu, warunki instytucji i opis potrzeby."}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
