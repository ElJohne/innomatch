"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { needInput, type NeedInput } from "@/lib/contracts";
import { audienceGroups } from "@/lib/contracts/analytics";
import { VoiceInput } from "./voice-input";
import { FlowSteps } from "./flow-steps";
import { urgentSignal } from "@/lib/need-guidance";
import { UrgentHelp } from "./urgent-help";
export function NeedForm() {
  const router = useRouter();
  const key = useRef("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [draft, setDraft] = useState<NeedInput>({
    description: "",
    municipality: "",
    targetGroups: [],
    constraints: "",
  });
  const title = useRef<HTMLHeadingElement>(null);
  function change(field: keyof NeedInput, value: string | string[]) {
    setDraft((d) => ({ ...d, [field]: value }));
    key.current = "";
  }
  function review(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = needInput.safeParse(draft);
    if (!parsed.success) {
      setError(
        "Opisz potrzebę w 3–4000 znakach. Ograniczenia mogą mieć do 1500 znaków.",
      );
      return;
    }
    setError("");
    setConfirm(true);
    requestAnimationFrame(() => {
      title.current?.focus();
      window.scrollTo({ top: 0 });
    });
  }
  async function submit() {
    if (busy) return;
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
        body: JSON.stringify(needInput.parse(draft)),
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
  if (confirm)
    return (
      <section className="flow-page confirmation">
        {urgentSignal(draft.description + "\n" + (draft.constraints ?? "")) && (
          <UrgentHelp prominent />
        )}
        <FlowSteps current={2} />
        <div className="confirmation-intro">
          <div className="assistant-symbol" aria-hidden="true">
            ✧
          </div>
          <div>
            <p className="eyebrow">Krok 2 · Sprawdźmy razem</p>
            <h1 ref={title} tabIndex={-1}>
              Czy dobrze opisaliśmy Twoją potrzebę?
            </h1>
            <p className="lead">
              Potwierdź informacje. Potem poszukamy pasujących rozwiązań i
              organizacji.
            </p>
          </div>
        </div>
        <div className="confirmation-card card" aria-busy={busy}>
          <h2>
            <span className="check-icon" aria-hidden="true">
              ✓
            </span>{" "}
            Twoja sytuacja
          </h2>
          <div className="confirmed-description">
            <p>{draft.description}</p>
            {draft.municipality && (
              <p>
                <strong>Gmina:</strong> {draft.municipality}
              </p>
            )}
            {draft.targetGroups.length > 0 && (
              <p>
                <strong>Dla kogo:</strong> {draft.targetGroups.join(", ")}
              </p>
            )}
            {draft.constraints && (
              <p>
                <strong>Zasoby i ograniczenia:</strong> {draft.constraints}
              </p>
            )}
          </div>
          <p className="help">
            To Twój opis, bez dopisanych założeń. Wyniki mogą zawierać pytania,
            które warto doprecyzować.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="actions">
            <button disabled={busy} onClick={submit}>
              {busy ? "Zapisujemy i szukamy…" : "Tak, wszystko się zgadza →"}
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => {
                setConfirm(false);
                setError("");
                requestAnimationFrame(() =>
                  document.getElementById("description")?.focus(),
                );
              }}
            >
              Zmień informacje
            </button>
          </div>
          <p className="privacy-note">
            ♧ Twój opis jest prywatny i przypisany do tej przeglądarki.
          </p>
        </div>
        <p className="handwritten">Razem łatwiej zrobić pierwszy krok.</p>
      </section>
    );
  return (
    <>
      <FlowSteps current={1} />
      <section className="help-hero">
        <div className="hero-photo">
          <Image
            src="/images/community-hero.png"
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 65vw"
          />
        </div>

        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> Małopolska · Blisko ludzi
          </p>
          <h1>Potrzebujesz pomocy?</h1>
          <p className="lead">
            Opisz swoją sytuację własnymi słowami. Pomożemy znaleźć społeczne
            rozwiązania i podpowiemy, co zrobić dalej.
          </p>
        </div>
        <span className="hero-sticker" aria-hidden="true">
          Małe kroki.
          <br />
          Wielka zmiana.
          <br />
          <span>♡</span>
        </span>
        <span className="hero-sticker hero-sticker-together" aria-hidden="true">
          Silniejsza
          <br />
          Małopolska
          <br />— razem ♡
        </span>
        <form onSubmit={review} className="form card home-form">
          <label htmlFor="description">Jakiej pomocy potrzebujesz?</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            minLength={3}
            maxLength={4000}
            value={draft.description}
            onChange={(e) => change("description", e.target.value)}
          />

          <UrgentHelp
            prominent={urgentSignal(
              draft.description + "\n" + (draft.constraints ?? ""),
            )}
          />
          <details className="optional-fields">
            <summary>
              Dodaj szczegóły <span>· opcjonalnie</span>
            </summary>
            <div className="form-row">
              <div>
                <label htmlFor="municipality">Gmina</label>
                <input
                  id="municipality"
                  maxLength={200}
                  value={draft.municipality}
                  onChange={(e) => change("municipality", e.target.value)}
                  placeholder="Np. Kraków"
                />
              </div>
              <div>
                <label htmlFor="group">Dla kogo?</label>
                <select
                  id="group"
                  value={draft.targetGroups[0] || ""}
                  onChange={(e) =>
                    change(
                      "targetGroups",
                      e.target.value ? [e.target.value] : [],
                    )
                  }
                >
                  <option value="">Wybierz grupę</option>
                  {audienceGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
            <label htmlFor="constraints">Zasoby i ograniczenia</label>
            <textarea
              id="constraints"
              rows={2}
              maxLength={1500}
              value={draft.constraints}
              onChange={(e) => change("constraints", e.target.value)}
              placeholder="Co już macie, a czego brakuje?"
            />
          </details>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="home-form-bottom">
            <VoiceInput
              onText={(text) => {
                setDraft((previous) => ({
                  ...previous,
                  description: [previous.description.trim(), text.trim()]
                    .filter(Boolean)
                    .join(" ")
                    .slice(0, 4000),
                }));
                key.current = "";
              }}
            />
            <button type="submit">
              Znajdź wsparcie <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
      <section className="how-it-works" id="jak-to-dziala">
        <div>
          <p className="eyebrow">Jesteśmy po Twojej stronie</p>
          <h2>
            Od potrzeby do działania.
            <br />
            Krok po kroku.
          </h2>
        </div>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>Opisz i potwierdź</strong>
              <p>Nie musisz wiedzieć, jak nazywa się rozwiązanie.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Wybierz organizację</strong>
              <p>Sprawdź propozycje związane z Twoją potrzebą.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Zobacz, co dalej</strong>
              <p>Otrzymasz wskazówki i tekst do rozmowy.</p>
            </div>
          </li>
        </ol>
      </section>
      <div className="catalog-invite">
        <span>Wolisz najpierw poznać dostępne rozwiązania?</span>
        <Link href="/innowacje">Zajrzyj do biblioteki innowacji →</Link>
      </div>
    </>
  );
}
