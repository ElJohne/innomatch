"use client";
import { useState } from "react";
import indicators from "../../data/rops/regional-indicators.json";
import { grantFields } from "@/lib/contracts/grant";
const number = (value: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value);
const countyLabel = (county: string) =>
  county.startsWith("m. ") ? `miasto ${county.slice(3)}` : `powiat ${county}`;

export function RegionalDiagnosis({
  diagnosis = "",
  onAppend,
}: {
  diagnosis?: string;
  onAppend?: (note: string) => void;
}) {
  const [county, setCounty] = useState("");
  const counties = indicators.items[0].values.map((v) => v.county);
  return (
    <details className="canvas-section">
      <summary>Dane ROPS dla Twojego powiatu</summary>
      <div className="stack">
        <p>
          Wybierz obszar, aby sprawdzić regionalny kontekst problemu. To
          publiczne wskaźniki powiatowe z Obserwatora ROPS, nie dane uczestników
          Twojego projektu. Każdy wskaźnik ma własny rok — nie traktuj go jako
          pomiaru bieżącej sytuacji.
        </p>
        <div>
          <label htmlFor="diagnosis-county">
            Powiat lub miasto na prawach powiatu
          </label>
          <select
            id="diagnosis-county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">Wybierz obszar</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {countyLabel(c)}
              </option>
            ))}
          </select>
        </div>
        {county && (
          <div className="stack">
            {indicators.items.map((item) => {
              const value = item.values.find((v) => v.county === county)!;
              const note = `Obserwator ROPS — ${countyLabel(county)}, ${item.year}: wskaźnik „${item.sourceTitle}” wynosi ${number(value.value)}${item.unit} ${item.denominator}.\nŹródło pierwotne: ${item.source}\n${item.sourceUrl}\nDo uzupełnienia: jak ten kontekst regionalny odnosi się do obserwowanej potrzeby odbiorców pomysłu?`;
              const added = diagnosis.includes(item.sourceUrl),
                tooLong =
                  diagnosis.length + note.length + 2 >
                  grantFields.diagnosis.maxLength;
              return (
                <article className="note stack" key={item.key}>
                  <div>
                    <h3>{item.label}</h3>
                    <p>
                      <strong>
                        {number(value.value)}
                        {item.unit}
                      </strong>{" "}
                      {item.denominator} · {item.year} · {countyLabel(county)}
                    </p>
                  </div>
                  <p className="help">
                    Nazwa w źródle: {item.sourceTitle}. Źródło pierwotne:{" "}
                    {item.source}
                  </p>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    Sprawdź wskaźnik w Obserwatorze ROPS ↗
                  </a>
                  {onAppend && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={added || tooLong}
                      onClick={() => onAppend(note)}
                    >
                      {added
                        ? "Wskaźnik jest już w diagnozie"
                        : "Dodaj dane do diagnozy"}
                    </button>
                  )}
                  {onAppend && tooLong && !added && (
                    <p className="help">
                      Skróć diagnozę, aby dodać dane w limicie{" "}
                      {grantFields.diagnosis.maxLength} znaków.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <p className="help">
          Dane pobrano z ROPS {indicators.retrievedAt.slice(0, 10)}. Opis nie
          dowodzi przyczyn problemu, skuteczności rozwiązania ani potrzeb
          pojedynczej osoby. {onAppend && "Zapisz szkic po dodaniu danych."}
        </p>
        <details>
          <summary>Tabela wszystkich 22 powiatów</summary>
          <div
            className="regional-table-scroll"
            role="region"
            aria-label="Wskaźniki ROPS według powiatów"
            tabIndex={0}
          >
            <table>
              <caption>
                Wartości procentowe; lata podano osobno dla każdego wskaźnika.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Obszar</th>
                  {indicators.items.map((i) => (
                    <th scope="col" key={i.key}>
                      {i.label}
                      <br />
                      {i.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {counties.map((c) => (
                  <tr key={c}>
                    <th scope="row">{countyLabel(c)}</th>
                    {indicators.items.map((i) => (
                      <td key={i.key}>
                        {number(i.values.find((v) => v.county === c)!.value)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </details>
  );
}
