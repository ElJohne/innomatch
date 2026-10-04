"use client";
import {
  contactHints,
  contactLabels,
  type ContactPurpose,
} from "@/lib/contact-purpose";
export function ContactChoice({
  id,
  value,
  onChange,
  disabled = false,
  continuation = false,
}: {
  id: string;
  value: ContactPurpose | "";
  onChange: (value: ContactPurpose | "") => void;
  disabled?: boolean;
  continuation?: boolean;
}) {
  return (
    <div className="stack">
      <div>
        <label htmlFor={id}>
          {continuation ? "Cel tej wiadomości" : "Jakiego wsparcia szukasz?"}
        </label>
        <select
          id={id}
          value={value}
          disabled={disabled}
          aria-describedby={`${id}-hint`}
          onChange={(e) => onChange(e.target.value as ContactPurpose | "")}
        >
          {continuation && <option value="">Kontynuacja rozmowy</option>}
          {Object.entries(contactLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className="help" id={`${id}-hint`}>
        {value
          ? contactHints[value]
          : "Odpowiedz w istniejącej sprawie albo wybierz inny rodzaj wsparcia."}
      </p>
    </div>
  );
}
