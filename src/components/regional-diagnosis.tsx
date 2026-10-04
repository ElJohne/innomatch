"use client";
import { useState } from "react";
import indicators from "../../data/rops/regional-indicators.json";
import { grantFields } from "@/lib/contracts/grant";
import styles from "@/app/innowacje/discovery.module.css";

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
    <section aria-labelledby="regional-heading">
      <h2 id="regional-heading">Dane ROPS dla Twojego powiatu</h2>
      <p className="help">
        Wskaźniki opisują powiat, nie potrzeby konkretnej osoby. Rok danych
        podano przy każdej wartości.
      </p>
      <div className={styles.county}>
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
        <div className={styles.metrics}>
          {indicators.items.map((item) => {
            const value = item.values.find((v) => v.county === county)!;
            const note = `Obserwator ROPS — ${countyLabel(county)}, ${item.year}: wskaźnik „${item.sourceTitle}” wynosi ${number(value.value)}${item.unit} ${item.denominator}.\nŹródło pierwotne: ${item.source}\n${item.sourceUrl}\nDo uzupełnienia: jak ten kontekst regionalny odnosi się do obserwowanej potrzeby odbiorców pomysłu?`;
            const added = diagnosis.includes(
              `Obserwator ROPS — ${countyLabel(county)}, ${item.year}: wskaźnik „${item.sourceTitle}”`,
            );
            const tooLong =
              diagnosis.length + note.length + 2 >
              grantFields.diagnosis.maxLength;
            return (
              <article className={styles.metric} key={item.key}>
                <h3>{item.label}</h3>
                <p>
                  <strong>
                    {number(value.value)}
                    {item.unit}
                  </strong>{" "}
                  {item.denominator} · {item.year}
                </p>
                <p className="help">{item.source}</p>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  Źródło w Obserwatorze ROPS (nowa karta) ↗
                </a>
                {onAppend && (
                  <div>
                    <button
                      type="button"
                      className="secondary"
                      disabled={added || tooLong}
                      onClick={() => onAppend(note)}
                    >
                      {added ? "Dodano do diagnozy" : "Dodaj do diagnozy"}
                    </button>
                    {tooLong && !added && (
                      <p className="help">
                        Skróć diagnozę, aby zmieścić dane w limicie{" "}
                        {grantFields.diagnosis.maxLength} znaków.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <p className="help">
        Pobrano z Obserwatora ROPS:{" "}
        {new Intl.DateTimeFormat("pl-PL", {
          dateStyle: "long",
          timeZone: "Europe/Warsaw",
        }).format(new Date(indicators.retrievedAt))}
        .{onAppend && " Po dodaniu danych zapisz szkic."}
      </p>
    </section>
  );
}
