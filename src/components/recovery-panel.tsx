"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function RecoveryPanel({ canIssue }: { canIssue: boolean }) {
  const router = useRouter();
  const [issued, setIssued] = useState<{
    token: string;
    expiresAt: string;
  } | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  async function action(restore: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setRestored(false);
    try {
      const response = await fetch(
        restore ? "/api/session/restore" : "/api/session/recovery",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restore ? { token } : {}),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Nie udało się zapisać dostępu.");
      if (restore) {
        setToken("");
        setIssued(null);
        setRestored(true);
        router.refresh();
      } else setIssued(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brak połączenia.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="card need-summary">
      <summary>Zachowaj dostęp lub przywróć swoje sprawy</summary>
      <p>
        Ta przeglądarka pamięta dostęp przez maksymalnie 90 dni od zapisania
        sesji. Kod pozwala wrócić z innej przeglądarki lub po usunięciu
        ciasteczek.
      </p>
      {canIssue && (
        <>
          <p className="help">
            Zachowaj kod w bezpiecznym miejscu. Każdy, kto go zna, może otworzyć
            Twoje potrzeby i rozmowy. Utworzenie nowego kodu unieważnia
            poprzedni. Kod jest ważny 90 dni i pokażemy go tylko teraz.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => action(false)}
          >
            Utwórz nowy kod dostępu
          </button>
        </>
      )}
      {issued && (
        <div className="notice">
          <label htmlFor="issued-code">Twój prywatny kod — zapisz go</label>
          <input
            id="issued-code"
            readOnly
            value={issued.token}
            onFocus={(e) => e.target.select()}
            autoComplete="off"
            spellCheck={false}
          />
          <p>
            Ważny do {new Date(issued.expiresAt).toLocaleDateString("pl-PL")}.
          </p>
        </div>
      )}
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void action(true);
        }}
      >
        <label htmlFor="restore-code">Mam zapisany kod dostępu</label>
        <input
          id="restore-code"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          maxLength={43}
          minLength={43}
        />
        <p className="help">
          Przywrócenie otworzy sprawy przypisane do kodu w tej przeglądarce.
          Jeśli masz tutaj inne sprawy, najpierw zapisz ich kod.
        </p>
        <button disabled={busy}>Przywróć sprawy z kodu</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {restored && <p role="status">Przywrócono dostęp do Twoich spraw.</p>}
    </details>
  );
}
