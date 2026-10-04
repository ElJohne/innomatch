import { z } from "zod";
export const contactPurpose = z.enum([
  "CONSULTATION",
  "MENTORSHIP",
  "PARTNERSHIP",
]);
export type ContactPurpose = z.infer<typeof contactPurpose>;
export const contactLabels = {
  CONSULTATION: "Konsultacja pomysłu lub rozwiązania",
  MENTORSHIP: "Wsparcie mentora",
  PARTNERSHIP: "Poszukiwanie partnera do działania",
} as const;
export const contactHints = {
  CONSULTATION:
    "Napisz, jaką decyzję chcesz omówić i co już wiesz. Koordynator odpowie w tej rozmowie.",
  MENTORSHIP:
    "Opisz, w czym potrzebujesz doświadczenia mentora, np. projektowaniu pilotażu, dostępności lub ocenie efektów. Koordynator sprawdzi możliwość wsparcia.",
  PARTNERSHIP:
    "Napisz, jakiej roli partnera szukasz, co możesz zaoferować i jaki pierwszy wspólny krok proponujesz. Koordynator omówi możliwości; samo zgłoszenie nie oznacza nawiązania partnerstwa.",
} as const;
export function withContactPurpose(
  body: string,
  purpose?: ContactPurpose | "",
) {
  return purpose
    ? `Cel zgłoszenia: ${contactLabels[purpose]}\n\n${body}`
    : body;
}
export function purposeFromMessage(body: string): ContactPurpose | undefined {
  return (Object.keys(contactLabels) as ContactPurpose[]).find((purpose) =>
    body.startsWith(`Cel zgłoszenia: ${contactLabels[purpose]}\n`),
  );
}
