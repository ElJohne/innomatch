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
    <section className="card stack">
      <p>
        Kod pozwala otworzyć Twoje sprawy na innym urządzeniu lub po usunięciu
        ciasteczek. Dostęp w tej przeglądarce trwa do 90 dni.
      </p>
      {canIssue && (
        <>
          <p className="help">
            Kod jest ważny 90 dni. Pokażemy go tylko raz; nowy unieważnia
            poprzedni. Zachowaj go prywatnie — otwiera Twoje sprawy i rozmowy.
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
          Masz tutaj inne sprawy? Najpierw zapisz ich kod, bo przywrócenie
          zmieni dostęp.
        </p>
        <button disabled={busy}>Przywróć sprawy z kodu</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {restored && <p role="status">Przywrócono dostęp do Twoich spraw.</p>}
    </section>
  );
}
