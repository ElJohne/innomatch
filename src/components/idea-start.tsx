"use client";
import Link from "next/link";
import styles from "./idea-simple.module.css";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea, IdeaSuggestion } from "@/lib/contracts/idea";
import { emptyCanvas } from "@/lib/contracts/canvas";
async function request(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.message || "Nie udało się przygotować karty. Spróbuj ponownie.",
    );
  return data;
}
export function IdeaStart() {
  const router = useRouter(),
    key = useRef("");
  const [description, setDescription] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState<Idea | null>(null);
  return (
    <form
      className={`form card stack ${styles.start}`}
      aria-busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        void (async () => {
          try {
            key.current ||= crypto.randomUUID();
            const draft: Idea =
              saved ??
              (await request("/api/ideas", "POST", {
                requestKey: key.current,
                card: {
                  title: description
                    .trim()
                    .split(/[.!?\n]/)[0]
                    .slice(0, 180),
                  problem: description.trim(),
                  essence: description.trim(),
                  targetGroups: ["Do ustalenia"],
                  stage: "CONCEPT",
                  resources: "Do ustalenia",
                  pilotOutline: "Do ustalenia",
                  canvas: emptyCanvas(),
                },
              }));
            setSaved(draft);
            const proposal: IdeaSuggestion = await request(
              "/api/ideas/assist",
              "POST",
              { id: draft.id, expectedRevision: draft.revision },
            );
            const ready: Idea = await request(
              `/api/ideas/${draft.id}`,
              "PATCH",
              { card: proposal.card, expectedRevision: draft.revision },
            );
            router.push(`/pomysly/${ready.id}`);
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Brak połączenia. Spróbuj ponownie.",
            );
            setBusy(false);
          }
        })();
      }}
    >
      <label htmlFor="idea-description">Co chcesz zrobić i komu pomóc?</label>
      <textarea
        id="idea-description"
        rows={5}
        minLength={30}
        maxLength={2000}
        required
        disabled={busy || Boolean(saved)}
        value={description}
        placeholder="Chcę zorganizować pomoc w zakupach dla samotnych seniorów w mojej okolicy."
        onChange={(e) => {
          setDescription(e.target.value);
          key.current = "";
        }}
      />
      <p className="help">
        Bez nazwisk i danych osobowych. Kartę i Canvas przygotujemy z Twojego
        opisu.
      </p>
      <button disabled={busy}>
        {busy
          ? "Przygotowujemy Twój pomysł…"
          : saved
            ? "Dokończ przygotowanie"
            : "Przygotuj kartę i Canvas →"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saved && error && (
        <Link href={`/pomysly/${saved.id}`}>
          Otwórz zapisany opis i edytuj ręcznie →
        </Link>
      )}
    </form>
  );
}
