import { z } from "zod";
import type { IdeaCard } from "./idea";

// Substantive questions 1 and 3–11 of the published IWS 2.0 form.
// Applicant identifiers and legal declarations remain in the organizer's form.
export const grantTemplate = {
  id: "iws-2024",
  version: "iws-2024-public-form-v1",
  title: "Inkubator Włączenia Społecznego 2.0",
  opensAt: "2024-11-12T23:00:00Z",
  closesAt: "2024-12-13T22:59:59Z",
  origin: "PUBLIC_SOURCE",
  checkedAt: "2026-10-04",
  sourceUrl:
    "https://rops.krakow.pl/pliki-do-pobrania/artykul,wzor-formularza-aplikacyjnego,1049",
  callsUrl:
    "https://rops.krakow.pl/nabory-szkolenia-granty-dotacje-wizyty-studyjne-studia-specjalizacje-superwizje/granty-na-innowacje-spoleczne",
} as const;
export const grantFields = {
  title: {
    label: "1. Tytuł innowacji",
    hint: "Krótki tytuł związany z pomysłem.",
    maxLength: 200,
  },
  description: {
    label: "3. Opis innowacji",
    hint: "Jak działa rozwiązanie i jak wspiera włączenie społeczne oraz życie w społeczności?",
    maxLength: 3000,
  },
  novelty: {
    label: "4. Innowacyjność rozwiązania",
    hint: "Porównaj podobne rozwiązania i nazwij nową wartość. Sam opis pomysłu nie potwierdza jego nowości.",
    maxLength: 6000,
  },
  diagnosis: {
    label: "5. Diagnoza problemu",
    hint: "Opisz skalę problemu i podstawy diagnozy. Dodaj rzeczywiste raporty, dane i powiązanie z Mapą Wyzwań Społecznych; brak źródeł zaznacz do uzupełnienia.",
    maxLength: 4000,
  },
  recipients: {
    label: "6. Odbiorcy innowacji",
    hint: "Komu pomoże pomysł, jakie potrzeby ma ta grupa i co utrudnia jej udział w życiu społecznym?",
    maxLength: 3000,
  },
  change: {
    label: "7. Oczekiwana zmiana",
    hint: "Co ma się zmienić dla odbiorców? Oddziel oczekiwany efekt od sprawdzonych wyników.",
    maxLength: 4000,
  },
  future: {
    label: "8. Wizja przyszłości",
    hint: "Jak można zastosować rozwiązanie w innych miejscach lub dla innych grup? Co ułatwi wdrożenie?",
    maxLength: 3000,
  },
  preparation: {
    label: "9a. Przygotowanie do testu",
    hint: "Jakie działania, osoby i materiały są potrzebne? W tym archiwalnym formularzu okres przygotowania wynosił do 3 miesięcy. Terminy i koszty wpisz także do zestawienia poniżej.",
    maxLength: 3000,
  },
  testing: {
    label: "9b. Testowanie — faza I i II",
    hint: "Opisz uczestników, działania, sposób zebrania wiarygodnych wyników i dwie fazy testu. W archiwalnym formularzu okres testowania wynosił do 9 miesięcy.",
    maxLength: 3000,
  },
  team: {
    label: "11. Zespół i doświadczenie",
    hint: "Opisz potrzebne role oraz rzeczywiste doświadczenie zespołu. W szkicu wystarczą role, bez nazwisk i danych kontaktowych.",
    maxLength: 3000,
  },
} as const;
export type GrantKey = keyof typeof grantFields;
export const grantSections = z
  .object(
    Object.fromEntries(
      Object.entries(grantFields).map(([key, field]) => [
        key,
        z.string().trim().max(field.maxLength),
      ]),
    ) as Record<GrantKey, z.ZodString>,
  )
  .strict();
export const costPhases = {
  PREPARATION: "Przygotowanie",
  TEST_I: "Test — faza I",
  TEST_II: "Test — faza II",
} as const;
export const grantCost = z
  .object({
    phase: z.enum(["PREPARATION", "TEST_I", "TEST_II"]),
    action: z.string().trim().max(500),
    timing: z.string().trim().max(200),
    amountPLN: z.number().finite().min(0).max(10000000).nullable(),
  })
  .strict();
export const grantDraft = z
  .object({
    callId: z.literal(grantTemplate.id),
    templateVersion: z.literal(grantTemplate.version),
    sections: grantSections,
    costs: z.array(grantCost).min(1).max(20),
  })
  .strict();
export const grantEdit = z
  .object({ draft: grantDraft, expectedRevision: z.number().int().positive() })
  .strict();
export type GrantDraft = z.infer<typeof grantDraft>;
export type GrantSections = z.infer<typeof grantSections>;
export type GrantCost = z.infer<typeof grantCost>;
export type GrantSuggestion = {
  sections: GrantSections;
  mode: "mock" | "openai" | "azure";
};
export function prefillGrant(card: IdeaCard): GrantDraft {
  const sections = Object.fromEntries(
    Object.keys(grantFields).map((key) => [key, ""]),
  ) as GrantSections;
  Object.assign(sections, {
    title: card.title,
    description: card.essence,
    diagnosis: [card.problem, card.canvas?.problemContext]
      .filter(Boolean)
      .join("\n\n"),
    recipients: card.targetGroups.join("\n"),
    change: [
      card.canvas?.emotionalValue,
      card.canvas?.practicalValue,
      card.canvas?.impact,
    ]
      .filter(Boolean)
      .join("\n\n"),
    testing: card.pilotOutline,
  });
  return {
    callId: grantTemplate.id,
    templateVersion: grantTemplate.version,
    sections,
    costs: [
      { phase: "PREPARATION", action: "", timing: "", amountPLN: null },
      { phase: "TEST_I", action: "", timing: "", amountPLN: null },
      { phase: "TEST_II", action: "", timing: "", amountPLN: null },
    ],
  };
}
export function grantBudget(costs: GrantCost[]) {
  const total =
    Math.round(costs.reduce((sum, c) => sum + (c.amountPLN ?? 0), 0) * 100) /
    100;
  return {
    total,
    complete: costs.every((c) => c.action && c.timing && c.amountPLN !== null),
  };
}
export const formatPLN = (amount: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    amount,
  );
