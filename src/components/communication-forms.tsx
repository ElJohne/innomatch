"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Nie udało się wykonać operacji.");
  return data;
}
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Brak połączenia. Spróbuj ponownie.";
}
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form card stack"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setError("");
        try {
          await post("/api/auth/login", {
            login: data.get("login"),
            password: data.get("password"),
          });
          form.reset();
          router.push("/admin");
          router.refresh();
        } catch (error) {
          setError(errorText(error));
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="login">Adres e-mail personelu</label>
        <input
          id="login"
          name="login"
          type="email"
          autoComplete="username"
          required
          maxLength={200}
        />
      </div>
      <div>
        <label htmlFor="password">Hasło</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy}>{busy ? "Logowanie…" : "Zaloguj się"}</button>
    </form>
  );
}
export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        className="secondary small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await post("/api/auth/logout", {});
            router.push("/personel/logowanie");
            router.refresh();
          } catch (error) {
            setError(errorText(error));
            setBusy(false);
          }
        }}
      >
        Wyloguj personel
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
export function MessageForm({
  threadId,
  needId,
  innovationId,
  adaptationId,
}: {
  threadId?: string;
  needId?: string;
  innovationId?: string;
  adaptationId?: string;
}) {
  const router = useRouter();
  const key = useRef("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form card"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        key.current ||= crypto.randomUUID();
        setBusy(true);
        setError("");
        try {
          const result = await post(
            threadId ? `/api/threads/${threadId}/messages` : "/api/threads",
            {
              body,
              requestKey: key.current,
              ...(threadId ? {} : { needId, innovationId, adaptationId }),
            },
          );
          setBody("");
          key.current = "";
          if (!threadId) router.push(`/wiadomosci/${result.id}`);
          router.refresh();
        } catch (error) {
          setError(errorText(error));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="message-body">
        {threadId ? "Nowa wiadomość" : "O co chcesz zapytać koordynatora?"}
      </label>
      <p className="help" id="message-help">
        Nie wpisuj danych osobowych ani danych zdrowotnych. Rozmowę widzisz Ty i
        upoważniony personel.
      </p>
      <textarea
        id="message-body"
        aria-describedby="message-help"
        rows={5}
        required
        maxLength={4000}
        value={body}
        disabled={busy}
        onChange={(e) => {
          setBody(e.target.value);
          key.current = "";
        }}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-bottom">
        <button disabled={busy || !body.trim()}>
          {busy
            ? "Wysyłanie…"
            : threadId
              ? "Wyślij wiadomość"
              : "Wyślij do koordynatora"}
        </button>
      </div>
    </form>
  );
}
export function ReadReceipt({ id, through }: { id: string; through: number }) {
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!through) return;
    let active = true;
    post(`/api/threads/${id}/read`, { through })
      .then(() => {
        if (active) setError("");
      })
      .catch(() => {
        if (active)
          setError("Nie udało się oznaczyć rozmowy jako przeczytanej.");
      });
    return () => {
      active = false;
    };
  }, [id, through, retry]);
  return error ? (
    <p role="status">
      {error}{" "}
      <button
        className="secondary small"
        onClick={() => setRetry((x) => x + 1)}
      >
        Ponów
      </button>
    </p>
  ) : null;
}
export function RefreshMessages() {
  const router = useRouter();
  return (
    <button className="secondary small" onClick={() => router.refresh()}>
      Odśwież wiadomości
    </button>
  );
}
