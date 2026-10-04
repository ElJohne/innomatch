"use client";
import { useState } from "react";
import type { KnowledgeResource } from "@/lib/contracts";
import { coverageLabels, knowledgeTypes } from "@/lib/knowledge-labels";
import { grantFields } from "@/lib/contracts/grant";

function normalize(text: string) {
  return text
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}
export function GrantResources({
  items,
  diagnosis,
  onAppend,
}: {
  items: KnowledgeResource[];
  diagnosis: string;
  onAppend: (text: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [limit, setLimit] = useState(6);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const results = items
    .filter(
      (r) =>
        (!type || r.type === type) &&
        words.every((word) =>
          normalize([r.title, r.description, ...r.topics].join(" ")).includes(
            word,
          ),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.type === "CHALLENGE") - Number(a.type === "CHALLENGE") ||
        (b.sources[0]?.sourceDate ?? "").localeCompare(
          a.sources[0]?.sourceDate ?? "",
        ) ||
        a.title.localeCompare(b.title, "pl"),
    );
  return (
    <section className="canvas-section">
      <h3>Znajdź źródła do diagnozy</h3>
      <div className="stack">
        <div>
          <label htmlFor="grant-resource-query">Temat materiału</label>
          <input
            id="grant-resource-query"
            placeholder="np. seniorzy, rodzina, zdrowie"
            maxLength={200}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(6);
            }}
          />
        </div>
        <div>
          <label htmlFor="grant-resource-type">Rodzaj źródła</label>
          <select
            id="grant-resource-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setLimit(6);
            }}
          >
            <option value="">Mapa i raporty</option>
            <option value="CHALLENGE">Mapa wyzwań społecznych</option>
            <option value="REPORT">Raporty i dane</option>
          </select>
        </div>
        <p className="help" role="status">
          {query.trim() || type
            ? `Znaleziono: ${results.length}.`
            : "Wpisz temat lub wybierz rodzaj źródła."}
        </p>
        {(query.trim() || type ? results.slice(0, limit) : []).map((r) => {
          const sources = r.sources.filter((s) => s.sourceUrl);
          const note = `Materiał do sprawdzenia: ${r.title}\n${sources.map((s) => `${s.sourceRef}${s.sourceDate ? ` (${s.sourceDate})` : ""}\n${s.sourceUrl}`).join("\n")}\nDo uzupełnienia: które ustalenie z materiału dotyczy problemu i odbiorców tego pomysłu?`;
          const alreadyAdded = sources.some((s) =>
            diagnosis.includes(s.sourceUrl!),
          );
          const tooLong =
            diagnosis.length + note.length + 2 >
            grantFields.diagnosis.maxLength;
          return (
            <article className="note stack" key={r.id}>
              <div>
                <p className="help">
                  {knowledgeTypes[r.type]} · {coverageLabels[r.coverage]}
                  {r.sources[0]?.sourceDate && ` · ${r.sources[0].sourceDate}`}
                </p>
                <h3>{r.title}</h3>
              </div>
              {r.origin === "SYNTHETIC" && (
                <p className="notice">
                  Materiał demonstracyjny — dane syntetyczne.
                </p>
              )}
              <div className="stack">
                {sources.map((s) => (
                  <a
                    key={s.id}
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.sourceTitle} — otwórz źródło ↗
                  </a>
                ))}
              </div>
              {sources.length > 0 && (
                <button
                  type="button"
                  className="secondary"
                  disabled={alreadyAdded || tooLong}
                  onClick={() => onAppend(note)}
                >
                  {alreadyAdded
                    ? "Odnośnik jest już w diagnozie"
                    : "Dodaj odnośnik do diagnozy"}
                </button>
              )}
              {tooLong && !alreadyAdded && (
                <p className="help">
                  Skróć diagnozę, aby zmieścić odnośnik w limicie{" "}
                  {grantFields.diagnosis.maxLength} znaków.
                </p>
              )}
            </article>
          );
        })}
        {(query.trim() || type) && !results.length && (
          <p>
            Nie znaleziono materiału. Spróbuj krótszego hasła albo innego
            rodzaju źródła.
          </p>
        )}
        {(query.trim() || type) && results.length > limit && (
          <button
            type="button"
            className="secondary"
            onClick={() => setLimit(limit + 6)}
          >
            Pokaż kolejne materiały
          </button>
        )}
      </div>
    </section>
  );
}
