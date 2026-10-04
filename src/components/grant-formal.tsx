"use client";
import {
  applicantFields,
  declarationChecks,
  emptyApplicant,
  partyFields,
  type ApplicantField,
  type GrantApplicant,
  type GrantDraft,
} from "@/lib/contracts/grant";

export function GrantFormal({
  draft,
  onChange,
}: {
  draft: GrantDraft;
  onChange: (value: GrantDraft) => void;
}) {
  const applicant = draft.applicant ?? emptyApplicant();
  const update = (value: GrantApplicant) =>
    onChange({ ...draft, applicant: value, declarationReview: undefined });
  return (
    <>
      <details className="canvas-section">
        <summary>2. Dane pomysłodawcy — opcjonalnie w szkicu</summary>
        <div className="stack">
          <p className="help">
            Dane wpisujesz samodzielnie. Nie są przekazywane do pomocy AI. Po
            przekazaniu pomysłu do konsultacji personel zobaczy również zapisane
            dane i ich kolejne aktualizacje.
          </p>
          <label htmlFor="applicant-kind">Rodzaj pomysłodawcy</label>
          <select
            id="applicant-kind"
            value={applicant.kind}
            onChange={(e) =>
              update(emptyApplicant(e.target.value as GrantApplicant["kind"]))
            }
          >
            <option value="PERSON">Osoba fizyczna</option>
            <option value="ENTITY">Podmiot</option>
            <option value="GROUP">Grupa nieformalna</option>
          </select>
          {applicant.parties.map((party, i) => (
            <fieldset className="stack" key={i}>
              <legend>
                {applicant.kind === "GROUP"
                  ? `Partner ${i + 1}`
                  : "Dane autora"}
              </legend>
              {applicant.kind === "GROUP" && (
                <label>
                  Rodzaj partnera
                  <select
                    value={party.kind}
                    onChange={(e) =>
                      update({
                        ...applicant,
                        parties: applicant.parties.map((p, j) =>
                          j === i
                            ? {
                                kind: e.target.value as "PERSON" | "ENTITY",
                                fields: {},
                              }
                            : p,
                        ),
                      })
                    }
                  >
                    <option value="PERSON">Osoba fizyczna</option>
                    <option value="ENTITY">Podmiot</option>
                  </select>
                </label>
              )}
              {partyFields(party.kind).map((key: ApplicantField) => (
                <label key={key} htmlFor={`applicant-${i}-${key}`}>
                  {applicantFields[key]}
                  <input
                    id={`applicant-${i}-${key}`}
                    maxLength={500}
                    value={party.fields[key] ?? ""}
                    onChange={(e) =>
                      update({
                        ...applicant,
                        parties: applicant.parties.map((p, j) =>
                          j === i
                            ? {
                                ...p,
                                fields: { ...p.fields, [key]: e.target.value },
                              }
                            : p,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              {applicant.kind === "GROUP" && applicant.parties.length > 1 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    update({
                      ...applicant,
                      parties: applicant.parties.filter((_, j) => i !== j),
                    })
                  }
                >
                  Usuń partnera {i + 1}
                </button>
              )}
            </fieldset>
          ))}
          {applicant.kind === "GROUP" && (
            <>
              <button
                type="button"
                className="secondary"
                disabled={applicant.parties.length >= 5}
                onClick={() =>
                  update({
                    ...applicant,
                    parties: [
                      ...applicant.parties,
                      { kind: "PERSON", fields: {} },
                    ],
                  })
                }
              >
                Dodaj partnera (maksymalnie 5)
              </button>
              {(
                [
                  ["groupContactName", "Imię i nazwisko reprezentanta grupy"],
                  ["groupContactPhone", "Telefon reprezentanta grupy"],
                  ["groupContactEmail", "E-mail reprezentanta grupy"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    maxLength={key === "groupContactPhone" ? 100 : 200}
                    value={applicant[key]}
                    onChange={(e) =>
                      update({ ...applicant, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </>
          )}
          <button
            type="button"
            className="secondary"
            onClick={() =>
              onChange({
                ...draft,
                applicant: undefined,
                declarationReview: undefined,
              })
            }
          >
            Usuń dane pomysłodawcy ze szkicu
          </button>
        </div>
      </details>
      <details className="canvas-section">
        <summary>
          12. Sprawdzenie oświadczeń przed wypełnieniem oryginału
        </summary>
        <p className="help">
          Otwórz oryginalny formularz: część 12A dla osoby fizycznej lub 12B dla
          reprezentanta podmiotu; dla grupy sprawdź właściwe części z każdym
          partnerem. Zaznaczenie oznacza przegląd tematu, nie złożenie ani
          podpisanie oświadczenia. Pełne brzmienie i klauzule informacyjne
          pozostają w formularzu organizatora.
        </p>
        {Object.entries(declarationChecks).map(([key, label]) => (
          <label className="checkbox-label" key={key}>
            <input
              type="checkbox"
              checked={Boolean(
                draft.declarationReview?.[
                  key as keyof typeof declarationChecks
                ],
              )}
              onChange={(e) =>
                onChange({
                  ...draft,
                  declarationReview: {
                    ...draft.declarationReview,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            Sprawdzono: {label}
          </label>
        ))}
      </details>
    </>
  );
}
