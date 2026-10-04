"use client";
import { contactLabels, type ContactPurpose } from "@/lib/contact-purpose";
const hints: Record<ContactPurpose, string> = {
  CONSULTATION: "Jaką decyzję chcesz omówić?",
  MENTORSHIP:
    "W czym potrzebujesz pomocy mentora? Koordynator sprawdzi możliwości.",
  PARTNERSHIP:
    "Jakiego partnera szukasz i co możesz zaoferować? To prośba o kontakt.",
};
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
        {value ? hints[value] : "Możesz też poprosić o mentora lub partnera."}
      </p>
    </div>
  );
}
