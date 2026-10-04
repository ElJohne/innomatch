"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function AdaptationForm({
  innovationId,
  needs,
  selectedNeedId,
}: {
  innovationId: string;
  needs: { id: string; description: string }[];
  selectedNeedId?: string;
}) {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="form card stack"
      aria-busy={busy}
      onChange={() => {
        key.current = "";
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = new FormData(e.currentTarget);
        key.current ||= crypto.randomUUID();
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/adaptations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              needId: form.get("needId"),
              innovationId,
              requestKey: key.current,
              constraints: Object.fromEntries(
                ["institution", "resources", "scope", "timeline", "budget"].map(
                  (k) => [k, form.get(k)],
                ),
              ),
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          router.push(`/adaptacje/${data.id}`);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Nie udało się przygotować planu.",
          );
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="stack">
        <legend>Potrzeba i warunki instytucji</legend>
        <label htmlFor="plan-need">Twoja zapisana potrzeba</label>
        <select
          id="plan-need"
          name="needId"
          required
          defaultValue={selectedNeedId ?? needs[0]?.id}
        >
          {needs.map((n) => (
            <option value={n.id} key={n.id}>
              {n.description.slice(0, 120)}
            </option>
          ))}
        </select>
        <p className="help">
          Nie wpisuj danych osobowych ani danych zdrowotnych. Wystarczy typ
          instytucji i ogólny opis warunków. Podane informacje posłużą do
          przygotowania szkicu AI.
        </p>
        <label htmlFor="plan-institution">Typ instytucji i jej rola</label>
        <p className="help">
          Działasz prywatnie? Wpisz „osoba prywatna” lub rodzaj grupy — bez
          nazwisk. Jeśli zasoby nie są jeszcze znane, napisz „do ustalenia”.
        </p>
        <input
          id="plan-institution"
          name="institution"
          required
          minLength={3}
          maxLength={300}
          placeholder="Np. gminny ośrodek kultury"
        />
        <label htmlFor="plan-resources">Dostępne zasoby i ograniczenia</label>
        <textarea
          id="plan-resources"
          name="resources"
          required
          minLength={3}
          maxLength={1500}
          rows={4}
          placeholder="Miejsce, zespół, dostępność, ograniczenia…"
        />
        <label htmlFor="plan-scope">Dla kogo i jaki zasięg usługi?</label>
        <textarea
          id="plan-scope"
          name="scope"
          required
          minLength={3}
          maxLength={600}
          rows={3}
        />
        <label htmlFor="plan-timeline">Termin — jeśli znany</label>
        <input id="plan-timeline" name="timeline" maxLength={300} />
        <label htmlFor="plan-budget">Budżet — jeśli znany</label>
        <input id="plan-budget" name="budget" maxLength={300} />
      </fieldset>
      <p className="notice">
        Otrzymasz prywatną, edytowalną propozycję do oceny. To nie jest
        zatwierdzenie ROPS ani obietnica finansowania.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {busy && <p role="status">Przygotowujemy i zapisujemy szkic…</p>}
      <button disabled={busy}>Przygotuj szkic adaptacji</button>
    </form>
  );
}
