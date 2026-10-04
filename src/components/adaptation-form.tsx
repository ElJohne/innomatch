"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdaptationInput } from "@/lib/contracts/adaptation";
import styles from "./adaptation.module.css";
export function AdaptationForm({
  innovationId,
  needs,
  selectedNeedId,
  initialConstraints,
}: {
  innovationId: string;
  needs: { id: string; description: string }[];
  selectedNeedId?: string;
  initialConstraints?: AdaptationInput["constraints"];
}) {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fixedNeed =
    selectedNeedId ?? (needs.length === 1 ? needs[0].id : undefined);
  return (
    <form
      className="form card stack"
      aria-busy={busy}
      onChange={() => {
        key.current = "";
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        const needId = String(form.get("needId") ?? "");
        const value = (name: string) => String(form.get(name) ?? "").trim();
        key.current ||= crypto.randomUUID();
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/adaptations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              needId,
              innovationId,
              requestKey: key.current,
              constraints: {
                institution: value("institution"),
                resources:
                  value("resources") || "Nie podano zasobów — do ustalenia.",
                scope:
                  value("scope") ||
                  needs
                    .find((need) => need.id === needId)
                    ?.description.slice(0, 600) ||
                  "Zakres do ustalenia.",
                timeline: value("timeline"),
                budget: value("budget"),
              },
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          router.push(`/adaptacje/${data.id}`);
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Nie udało się przygotować planu.",
          );
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="stack">
        <legend>Twoja instytucja</legend>
        {fixedNeed ? (
          <input type="hidden" name="needId" value={fixedNeed} />
        ) : (
          <>
            <label htmlFor="plan-need">Której potrzeby dotyczy plan?</label>
            <select
              id="plan-need"
              name="needId"
              required
              defaultValue={needs[0]?.id}
            >
              {needs.map((need) => (
                <option value={need.id} key={need.id}>
                  {need.description.slice(0, 120)}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="plan-institution">
          Jaka instytucja będzie działać?
        </label>
        <input
          id="plan-institution"
          name="institution"
          required
          minLength={3}
          maxLength={300}
          placeholder="Np. biblioteka lub ośrodek pomocy"
          defaultValue={initialConstraints?.institution}
        />
      </fieldset>
      <fieldset disabled={busy} className="stack">
        <legend>
          Warunki działania <span className="help">— opcjonalnie</span>
        </legend>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="plan-resources">Co macie do dyspozycji?</label>
            <textarea
              id="plan-resources"
              name="resources"
              minLength={3}
              maxLength={1500}
              rows={2}
              placeholder="Np. sala i dwie osoby do pomocy"
              defaultValue={initialConstraints?.resources}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="plan-scope">Dla kogo?</label>
            <textarea
              id="plan-scope"
              name="scope"
              minLength={3}
              maxLength={600}
              rows={2}
              placeholder="Np. 10 seniorów z naszej gminy"
              defaultValue={initialConstraints?.scope}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="plan-timeline">Termin</label>
            <input
              id="plan-timeline"
              name="timeline"
              maxLength={300}
              defaultValue={initialConstraints?.timeline}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="plan-budget">Budżet</label>
            <input
              id="plan-budget"
              name="budget"
              maxLength={300}
              defaultValue={initialConstraints?.budget}
            />
          </div>
        </div>
      </fieldset>
      <p className="help">Nie podawaj danych osobowych uczestników.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={busy}>
        {busy ? "Przygotowujemy plan…" : "Przygotuj plan →"}
      </button>
    </form>
  );
}
