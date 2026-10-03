"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  catalogSave,
  publicationLabels,
  type CatalogEntry,
  type CatalogRecord,
} from "@/lib/contracts/catalog";
import type { Innovation, KnowledgeResource } from "@/lib/contracts";
import { coverageLabels, knowledgeTypes } from "@/lib/knowledge-labels";

export function CatalogEditor({
  initial,
  isNew,
  demo,
  canIndex,
}: {
  initial: CatalogEntry;
  isNew: boolean;
  demo: boolean;
  canIndex: boolean;
}) {
  const router = useRouter();
  const [entry, setEntry] = useState(initial);
  const [record, setRecord] = useState<CatalogRecord>(initial.record);
  const [version, setVersion] = useState<string | null>(
    isNew ? null : initial.version,
  );
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function change(name: string, value: unknown) {
    setRecord((r) => ({ ...r, [name]: value }));
    setReviewed(false);
    setNotice("");
  }
  function sourceChange(index: number, name: string, value: string) {
    change(
      "sources",
      record.sources.map((s, i) =>
        i === index
          ? {
              ...s,
              [name]:
                name === "sourceTitle" || name === "sourceRef"
                  ? value
                  : value || undefined,
            }
          : s,
      ),
    );
  }
  const text = (
    name: string,
    label: string,
    value: string,
    max: number,
    min = 0,
    rows = 1,
  ) => (
    <div key={name}>
      <label htmlFor={`edit-${name}`}>{label}</label>
      {rows > 1 ? (
        <textarea
          id={`edit-${name}`}
          value={value}
          maxLength={max}
          minLength={min}
          required={min > 0}
          rows={rows}
          onChange={(e) => change(name, e.target.value)}
        />
      ) : (
        <input
          id={`edit-${name}`}
          value={value}
          maxLength={max}
          minLength={min}
          required={min > 0}
          onChange={(e) => change(name, e.target.value)}
        />
      )}
    </div>
  );
  // Keep raw textarea values while typing; split only when saving to allow new lines.
  const [lists, setLists] = useState({
    targetGroups:
      "targetGroups" in record ? record.targetGroups.join("\n") : "",
    categories: "categories" in record ? record.categories.join("\n") : "",
    requirements:
      "requirements" in record ? record.requirements.join("\n") : "",
    topics: "topics" in record ? record.topics.join("\n") : "",
  });
  const list = (name: keyof typeof lists, label: string, required = false) => (
    <div>
      <label htmlFor={`edit-${name}`}>{label}</label>
      <p className="help">
        Każda pozycja w osobnym wierszu, maksymalnie 20 pozycji.
      </p>
      <textarea
        id={`edit-${name}`}
        rows={3}
        required={required}
        value={lists[name]}
        maxLength={name === "requirements" ? 10000 : 4000}
        onChange={(e) => {
          setLists((v) => ({ ...v, [name]: e.target.value }));
          setReviewed(false);
          setNotice("");
        }}
      />
    </div>
  );
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const names =
      entry.kind === "innovation"
        ? (["targetGroups", "categories", "requirements"] as const)
        : (["topics"] as const);
    const value = {
      ...record,
      ...Object.fromEntries(
        names.map((name) => [
          name,
          lists[name]
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ),
    };
    const input = catalogSave.safeParse({
      kind: entry.kind,
      record: value,
      expectedVersion: version,
      reviewed,
    });
    if (!input.success) {
      setError(
        "Uzupełnij tytuł, opisy, wymagane grupy i źródła. Sprawdź długość pól, liczbę pozycji oraz poprawność adresów HTTPS.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/catalog/${entry.kind}/${record.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.data),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Nie udało się zapisać wpisu.");
      setEntry(result);
      setRecord(result.record);
      setVersion(result.version);
      setReviewed(false);
      setNotice(
        `Zapisano. Status: ${publicationLabels[result.record.publicationStatus as keyof typeof publicationLabels]}.`,
      );
      if (isNew) router.replace(`/admin/katalog/${entry.kind}/${record.id}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Brak połączenia. Zmiany pozostają w formularzu.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function index() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/catalog/${entry.kind}/${record.id}/index`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || "Nie udało się zaktualizować wyszukiwania.",
        );
      setEntry((e) => ({ ...e, indexPending: false }));
      setNotice("Zaktualizowano wyszukiwanie AI dla zapisanego wpisu.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brak połączenia.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {entry.managedLocally && (
        <p className="notice">
          Automatyczny import zachowa ten wpis w wersji zredagowanej przez
          administratora.
        </p>
      )}
      <form className="form card" onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy} className="editor-fields stack">
          <legend>Treść i źródła</legend>
          {text(
            "title",
            "Tytuł",
            record.title,
            entry.kind === "innovation" ? 200 : 300,
            3,
          )}
          {entry.kind === "innovation" ? (
            <>
              {text(
                "problem",
                "Na jaką potrzebę odpowiada?",
                (record as Innovation).problem,
                4000,
                10,
                5,
              )}
              {text(
                "solution",
                "Na czym polega rozwiązanie?",
                (record as Innovation).solution,
                6000,
                10,
                6,
              )}
              {list("targetGroups", "Grupy odbiorców", true)}
              {list("categories", "Tematy", true)}
              {list("requirements", "Warunki zastosowania")}
              <div>
                <label htmlFor="maturity">Etap potwierdzony w źródle</label>
                <select
                  id="maturity"
                  value={(record as Innovation).maturity}
                  onChange={(e) => change("maturity", e.target.value)}
                >
                  <option value="UNKNOWN">Nieustalony</option>
                  <option value="CONCEPT">Koncepcja</option>
                  <option value="PILOT">Pilotaż</option>
                  <option value="TESTED">Przetestowane</option>
                </select>
                <p className="help">
                  Sama publikacja materiału nie dowodzi skuteczności innowacji.
                </p>
              </div>
            </>
          ) : (
            <>
              {text(
                "description",
                "Opis materiału",
                (record as KnowledgeResource).description,
                6000,
                10,
                6,
              )}
              {list("topics", "Tematy")}
              <div>
                <label htmlFor="knowledge-type">Rodzaj materiału</label>
                <select
                  id="knowledge-type"
                  value={(record as KnowledgeResource).type}
                  onChange={(e) => change("type", e.target.value)}
                >
                  {Object.entries(knowledgeTypes).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="coverage">Zakres dostępnego materiału</label>
                <select
                  id="coverage"
                  value={(record as KnowledgeResource).coverage}
                  onChange={(e) => change("coverage", e.target.value)}
                >
                  {Object.entries(coverageLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label htmlFor="origin">Pochodzenie</label>
            <select
              id="origin"
              value={record.origin}
              disabled={Boolean(version) || demo}
              onChange={(e) => change("origin", e.target.value)}
            >
              <option value="PUBLIC_SOURCE">Źródło publiczne</option>
              {entry.kind === "innovation" && (
                <>
                  <option value="ORGANIZER">Materiał organizatora</option>
                  <option value="USER_SUBMISSION">
                    Zgłoszenie użytkownika
                  </option>
                </>
              )}
              <option value="SYNTHETIC">Przykład syntetyczny</option>
            </select>
          </div>
          <h2>Źródła</h2>
          <p className="help">
            Zachowaj pochodzenie materiału. Przed publikacją podaj fragment
            potwierdzający opis; dla źródła publicznego także link HTTPS.
          </p>
          {record.sources.map((s, i) => (
            <fieldset className="source-editor stack" key={s.id}>
              <legend>Źródło {i + 1}</legend>
              <div>
                <label htmlFor={`source-title-${i}`}>Nazwa źródła</label>
                <input
                  id={`source-title-${i}`}
                  required
                  maxLength={300}
                  value={s.sourceTitle}
                  onChange={(e) =>
                    sourceChange(i, "sourceTitle", e.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor={`source-ref-${i}`}>
                  Odniesienie (np. tytuł dokumentu i strona)
                </label>
                <input
                  id={`source-ref-${i}`}
                  required
                  maxLength={500}
                  value={s.sourceRef}
                  onChange={(e) => sourceChange(i, "sourceRef", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`source-url-${i}`}>
                  Adres HTTPS (jeśli dostępny)
                </label>
                <input
                  id={`source-url-${i}`}
                  type="url"
                  value={s.sourceUrl ?? ""}
                  onChange={(e) => sourceChange(i, "sourceUrl", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`source-date-${i}`}>
                  Data źródła (jeśli znana)
                </label>
                <input
                  id={`source-date-${i}`}
                  maxLength={200}
                  value={s.sourceDate ?? ""}
                  onChange={(e) =>
                    sourceChange(i, "sourceDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor={`source-evidence-${i}`}>
                  Fragment potwierdzający opis
                </label>
                <textarea
                  id={`source-evidence-${i}`}
                  rows={4}
                  maxLength={5000}
                  value={s.evidenceExcerpt ?? ""}
                  onChange={(e) =>
                    sourceChange(i, "evidenceExcerpt", e.target.value)
                  }
                />
              </div>
              {record.sources.length > 1 && (
                <button
                  className="secondary small"
                  type="button"
                  onClick={() =>
                    change(
                      "sources",
                      record.sources.filter((_, index) => index !== i),
                    )
                  }
                >
                  Usuń źródło {i + 1}
                </button>
              )}
            </fieldset>
          ))}
          {record.sources.length < (entry.kind === "innovation" ? 20 : 5) && (
            <button
              className="secondary"
              type="button"
              onClick={() =>
                change("sources", [
                  ...record.sources,
                  {
                    id: crypto.randomUUID(),
                    sourceTitle: "",
                    sourceRef: "",
                    evidenceExcerpt: "",
                  },
                ])
              }
            >
              Dodaj źródło
            </button>
          )}
          <div>
            <label htmlFor="publication-status">Widoczność wpisu</label>
            <select
              id="publication-status"
              value={record.publicationStatus}
              onChange={(e) => change("publicationStatus", e.target.value)}
            >
              {Object.entries(publicationLabels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
            <p className="help">
              Tylko opublikowane wpisy są dostępne w katalogu i wyszukiwaniu.
              Ukrycie usuwa wpis również z dostępnych wyników wcześniejszych
              wyszukiwań.
            </p>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            Sprawdzono treść, źródła i informacje o etapie rozwiązania.
            Potwierdzam, że materiał można udostępnić.
          </label>
          <button type="submit">{busy ? "Zapisywanie…" : "Zapisz wpis"}</button>
        </fieldset>
      </form>
      {entry.indexPending && (
        <aside className="note">
          <h2>Aktualizacja wyszukiwania</h2>
          <p>
            Zapisaną treść można znaleźć po słowach kluczowych. Zaktualizuj
            wyszukiwanie AI, aby uwzględniało jej nowe znaczenie.
          </p>
          {canIndex ? (
            <button disabled={busy} onClick={index}>
              Zaktualizuj wyszukiwanie AI
            </button>
          ) : (
            <p>W trybie demonstracyjnym dostępne jest wyszukiwanie tekstowe.</p>
          )}
        </aside>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
