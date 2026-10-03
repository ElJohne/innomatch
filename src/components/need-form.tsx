"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { needInput } from "@/lib/contracts";
export function NeedForm() {
  const router = useRouter();
  const key = useRef<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const data = new FormData(event.currentTarget);
    const parsed = needInput.safeParse({
      description,
      municipality: data.get("municipality"),
      targetGroups: data.get("group") ? [String(data.get("group"))] : [],
      constraints: data.get("constraints"),
    });
    if (!parsed.success) {
      setError(
        "Opisz potrzebę w 30–4000 znakach. Ograniczenia mogą mieć do 1500 znaków.",
      );
      return;
    }
    key.current ||= crypto.randomUUID();
    setBusy(true);
    try {
      const response = await fetch("/api/needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Nie udało się zapisać zgłoszenia.");
      router.push(`/potrzeby/${body.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Brak połączenia. Spróbuj ponownie.",
      );
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form card" aria-busy={busy}>
      <label htmlFor="description">
        Co chcecie zmienić? <span>(wymagane)</span>
      </label>
      <p className="help" id="description-help">
        Opisz sytuację, osoby potrzebujące wsparcia i oczekiwaną zmianę. Nie
        podawaj imion, adresów, danych zdrowotnych ani innych danych osobowych.
      </p>
      <textarea
        id="description"
        name="description"
        rows={6}
        minLength={30}
        maxLength={4000}
        required
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          key.current = "";
        }}
        aria-describedby="description-help"
        placeholder="Np. seniorzy mieszkający samotnie rzadko uczestniczą w życiu lokalnym…"
      />
      <div className="form-row">
        <div>
          <label htmlFor="municipality">
            Gmina <span>(opcjonalnie)</span>
          </label>
          <input
            id="municipality"
            name="municipality"
            maxLength={200}
            placeholder="Nazwa gminy"
            onChange={() => {
              key.current = "";
            }}
          />
        </div>
        <div>
          <label htmlFor="group">
            Dla kogo? <span>(opcjonalnie)</span>
          </label>
          <select
            id="group"
            name="group"
            onChange={() => {
              key.current = "";
            }}
          >
            <option value="">Wybierz grupę</option>
            <option>Seniorzy</option>
            <option>Młodzież</option>
            <option>Opiekunowie</option>
            <option>Osoby z niepełnosprawnościami</option>
            <option>Mieszkańcy</option>
          </select>
        </div>
      </div>
      <label htmlFor="constraints">
        Zasoby i ograniczenia <span>(opcjonalnie)</span>
      </label>
      <textarea
        id="constraints"
        name="constraints"
        rows={3}
        maxLength={1500}
        placeholder="Np. mamy świetlicę i wolontariuszy, potrzebujemy rozwiązania bez aplikacji."
        onChange={() => {
          key.current = "";
        }}
      />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-bottom">
        <p className="help">
          Zgłoszenie jest prywatne i przypisane do tej przeglądarki. Nie
          udostępniaj urządzenia osobom nieuprawnionym.
        </p>
        <button disabled={busy} type="submit">
          {busy ? "Zapisujemy…" : "Znajdź rozwiązania →"}
        </button>
      </div>
    </form>
  );
}
