"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CatalogHelp({
  innovationId,
  title,
  existingThread,
}: {
  innovationId: string;
  title: string;
  existingThread?: string;
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (existingThread)
    return (
      <Link className="button" href={`/wiadomosci/${existingThread}`}>
        Otwórz moją rozmowę →
      </Link>
    );
  async function requestHelp() {
    if (busy) return;
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          innovationId,
          requestKey: key.current,
          body: `Chcę skorzystać z rozwiązania „${title}”. Proszę o pomoc i wskazanie pierwszego kroku.`,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Nie udało się wysłać prośby. Spróbuj ponownie.",
        );
      router.push(`/wiadomosci/${data.id}?sent=1`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Brak połączenia. Spróbuj ponownie.",
      );
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" disabled={busy} onClick={requestHelp}>
        {busy ? "Wysyłam…" : "Poproś o pomoc →"}
      </button>
      <p className="help">
        Koordynator otrzyma prośbę dotyczącą tego rozwiązania.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
