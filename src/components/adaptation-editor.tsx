"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./adaptation.module.css";
import {
  draftLabels,
  pilotLabels,
  draftText,
  firstStepFor,
  firstStepLabels,
  constraintLabels,
  type AdaptationPlan,
} from "@/lib/contracts/adaptation";
import type { Innovation } from "@/lib/contracts";
const lines = (value: string) =>
  value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
export function AdaptationEditor({
  initial,
  sources,
}: {
  initial: AdaptationPlan;
  sources: Innovation["sources"];
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [copyFallback, setCopyFallback] = useState(false);
  const copyText =
    draftText(plan.draft) +
    "\n\nWarunki instytucji:\n" +
    Object.entries(constraintLabels)
      .map(
        ([key, label]) =>
          `${label}: ${plan.constraints[key as keyof typeof constraintLabels] || "Nieustalony"}`,
      )
      .join("\n") +
    `\n\n${plan.mode === "mock" ? "Tryb demonstracyjny, bez AI." : "Szkic AI"}${plan.editedByOwner ? "; zmieniony przez autora" : ""}. Wersja ${plan.revision}.\n\nŹródła:\n` +
    sources
      .filter((s) => plan.draft.sourceIds.includes(s.id))
      .map(
        (s) =>
          `${s.sourceTitle} — ${s.sourceRef}${s.sourceUrl ? `\n${s.sourceUrl}` : ""}`,
      )
      .join("\n");
  return (
    <div className="stack">
      <p className="help">W listach wpisuj jedną pozycję w wierszu.</p>
      <p className="help">
        Po zmianie warunków sprawdź też treść planu. Zapis nie uruchamia AI;
        nową wersję udostępnisz w rozmowie.
      </p>
      <form
        className="form stack"
        key={plan.revision}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const form = new FormData(e.currentTarget);
          setBusy(true);
          setMessage("");
          const draft = { ...plan.draft, pilot: { ...plan.draft.pilot } };
          draft.firstStep = {
            action: String(form.get("first-action") ?? ""),
            responsible: String(form.get("first-responsible") ?? ""),
            resources: String(form.get("first-resources") ?? ""),
            completion: String(form.get("first-completion") ?? ""),
          };
          for (const key of Object.keys(
            draftLabels,
          ) as (keyof typeof draftLabels)[]) {
            const value = String(form.get(key) ?? "");
            if (
              key === "summary" ||
              key === "serviceDescription" ||
              key === "fitAndGaps"
            )
              draft[key] = value;
            else draft[key] = lines(value);
          }
          draft.pilot.scope = String(form.get("pilot-scope") ?? "");
          draft.pilot.activities = lines(
            String(form.get("pilot-activities") ?? ""),
          );
          draft.pilot.proposedMetrics = lines(
            String(form.get("pilot-proposedMetrics") ?? ""),
          );
          try {
            const response = await fetch(`/api/adaptations/${plan.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                draft,
                constraints: Object.fromEntries(
                  Object.keys(constraintLabels).map((key) => [
                    key,
                    String(form.get(`constraint-${key}`) ?? ""),
                  ]),
                ),
                expectedRevision: plan.revision,
              }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setPlan(data);
            setMessage("Zapisano nową wersję szkicu.");
            router.refresh();
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Nie udało się zapisać zmian.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="stack">
          <legend>Warunki instytucji</legend>
          {Object.entries(constraintLabels).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`constraint-${key}`}>{label}</label>
              <textarea
                id={`constraint-${key}`}
                name={`constraint-${key}`}
                rows={2}
                required={!["timeline", "budget"].includes(key)}
                minLength={
                  !["timeline", "budget"].includes(key) ? 3 : undefined
                }
                maxLength={
                  key === "resources" ? 1500 : key === "scope" ? 600 : 300
                }
                defaultValue={
                  plan.constraints[key as keyof typeof constraintLabels]
                }
              />
            </div>
          ))}
        </fieldset>
        <fieldset disabled={busy} className="stack">
          <legend>Pierwszy krok</legend>
          {Object.entries(firstStepLabels).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`first-${key}`}>{label}</label>
              <textarea
                id={`first-${key}`}
                name={`first-${key}`}
                required
                maxLength={600}
                rows={3}
                defaultValue={
                  firstStepFor(plan.draft)[key as keyof typeof firstStepLabels]
                }
              />
            </div>
          ))}
        </fieldset>
        <fieldset disabled={busy} className="stack">
          <legend>Usługa i wdrożenie</legend>
          {Object.entries(draftLabels).map(([key, label]) => {
            const v = plan.draft[key as keyof typeof draftLabels];
            return (
              <div key={key}>
                <label htmlFor={`edit-${key}`}>{label}</label>
                <textarea
                  id={`edit-${key}`}
                  name={key}
                  rows={4}
                  required
                  maxLength={Array.isArray(v) ? 4807 : 1200}
                  defaultValue={Array.isArray(v) ? v.join("\n") : v}
                />
              </div>
            );
          })}
        </fieldset>
        <fieldset disabled={busy} className="stack">
          <legend>Pilotaż</legend>
          {Object.entries(pilotLabels).map(([key, label]) => {
            const v = plan.draft.pilot[key as keyof typeof pilotLabels];
            return (
              <div key={key}>
                <label htmlFor={`pilot-${key}`}>{label}</label>
                <textarea
                  id={`pilot-${key}`}
                  name={`pilot-${key}`}
                  rows={3}
                  required
                  maxLength={Array.isArray(v) ? 4807 : 1200}
                  defaultValue={Array.isArray(v) ? v.join("\n") : v}
                />
              </div>
            );
          })}
        </fieldset>
        <div className={styles.formActions}>
          <button disabled={busy}>
            {busy ? "Zapisywanie…" : "Zapisz zmiany planu"}
          </button>
          <Link href={`/adaptacje/${plan.id}`}>Wróć do planu</Link>
        </div>
      </form>
      {message && <p role="status">{message}</p>}
      <div>
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyText);
              setMessage(`Skopiowano zapisaną wersję ${plan.revision}.`);
            } catch {
              setCopyFallback(true);
            }
          }}
        >
          Kopiuj zapisaną wersję {plan.revision}
        </button>
      </div>
      {copyFallback && (
        <div className="card">
          <label htmlFor="copy-plan">Plan wraz ze źródłami</label>
          <textarea
            id="copy-plan"
            readOnly
            rows={12}
            value={copyText}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </div>
  );
}
