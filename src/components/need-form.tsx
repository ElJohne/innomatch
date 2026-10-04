"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { needInput, type NeedInput } from "@/lib/contracts";
import { VoiceInput } from "./voice-input";
import { FlowSteps } from "./flow-steps";
import { urgentSignal } from "@/lib/need-guidance";
import { UrgentHelp } from "./urgent-help";
export function NeedForm() {
  const router = useRouter(),
    key = useRef("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<NeedInput>({
    description: "",
    audience: "PRIVATE",
    targetGroups: [],
  });
  function change(value: Partial<NeedInput>) {
    setDraft((d) => ({ ...d, ...value }));
    key.current = "";
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const parsed = needInput.safeParse(draft);
    if (!parsed.success) {
      setError("Napisz krótko, w czym potrzebujesz pomocy.");
      return;
    }
    setError("");
    setBusy(true);
    key.current ||= crypto.randomUUID();
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
        throw new Error(
          body.message || "Nie udało się zapisać. Spróbuj ponownie.",
        );
      router.push(`/potrzeby/${body.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Brak połączenia. Spróbuj ponownie.",
      );
      setBusy(false);
    }
  }
  return (
    <>
      <FlowSteps current={1} />
      <section className="help-hero inclusive-hero welcoming-hero">
        <div className="hero-photo">
          <Image
            src="/images/community-conversation.png"
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 65vw"
          />
        </div>
        <div className="hero-copy">
          <h1>
            Potrzebujesz <span>pomocy?</span>
          </h1>
        </div>
        <form
          onSubmit={submit}
          className="form card home-form"
          aria-busy={busy}
        >
          <div
            className="actions audience-choice"
            role="group"
            aria-label="Dla kogo szukasz pomocy?"
          >
            <button
              type="button"
              className={draft.audience === "PRIVATE" ? "" : "secondary"}
              aria-pressed={draft.audience === "PRIVATE"}
              disabled={busy}
              onClick={() => change({ audience: "PRIVATE" })}
            >
              Osoba prywatna
            </button>
            <button
              type="button"
              className={draft.audience === "INSTITUTION" ? "" : "secondary"}
              aria-pressed={draft.audience === "INSTITUTION"}
              disabled={busy}
              onClick={() => change({ audience: "INSTITUTION" })}
            >
              Instytucja
            </button>
          </div>
          <label htmlFor="description">
            {draft.audience === "INSTITUTION"
              ? "Jaki problem chcesz rozwiązać w swojej instytucji?"
              : "Jakiej pomocy potrzebujesz?"}
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            minLength={3}
            maxLength={4000}
            value={draft.description}
            disabled={busy}
            aria-describedby={
              error ? "description-help description-error" : "description-help"
            }
            aria-invalid={!!error}
            placeholder={
              draft.audience === "INSTITUTION"
                ? "Np. chcemy pomóc seniorom samodzielnie korzystać z bankomatu…"
                : "Np. trudno mi zrobić zakupy lub obsłużyć bankomat…"
            }
            onChange={(e) => change({ description: e.target.value })}
          />
          <p id="description-help" className="help">
            Bez nazwisk i danych osobowych.
          </p>
          {urgentSignal(draft.description) && <UrgentHelp prominent />}
          {error && (
            <p id="description-error" className="error" role="alert">
              {error}
            </p>
          )}
          <div className="home-form-bottom">
            <VoiceInput
              onText={(text) =>
                change({
                  description: [draft.description.trim(), text.trim()]
                    .filter(Boolean)
                    .join(" ")
                    .slice(0, 4000),
                })
              }
            />
            <button type="submit" disabled={busy}>
              {busy ? "Szukamy…" : "Znajdź pomoc →"}
            </button>
          </div>
        </form>
      </section>
      <div className="catalog-invite home-discovery">
        <Link href="/innowacje">Przeglądaj dostępne rozwiązania →</Link>
      </div>
    </>
  );
}
