import { z } from "zod";
import type { IdeaCard } from "./idea";

// Archival form. Optional applicant data is entered by its author, never AI.
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
export const applicantFields = {
  firstName: "Imię",
  lastName: "Nazwisko",
  name: "Nazwa podmiotu",
  krs: "KRS (jeśli dotyczy)",
  regon: "REGON (jeśli dotyczy)",
  nip: "NIP (jeśli dotyczy)",
  address: "Ulica, numer budynku i lokalu",
  postalCode: "Kod pocztowy",
  city: "Miejscowość",
  phone: "Telefon",
  email: "E-mail",
  representativeRole: "Funkcja osoby upoważnionej",
  representativeName: "Imię i nazwisko osoby upoważnionej",
  representativePhone: "Telefon osoby upoważnionej",
  representativeEmail: "E-mail osoby upoważnionej",
  contactRole: "Funkcja osoby do kontaktów roboczych",
  contactName: "Imię i nazwisko osoby do kontaktów roboczych",
  contactPhone: "Telefon do kontaktów roboczych",
  contactEmail: "E-mail do kontaktów roboczych",
} as const;
export type ApplicantField = keyof typeof applicantFields;
const applicantParty = z
  .object({
    kind: z.enum(["PERSON", "ENTITY"]),
    fields: z.partialRecord(
      z.enum(
        Object.keys(applicantFields) as [ApplicantField, ...ApplicantField[]],
      ),
      z.string().trim().max(500),
    ),
  })
  .strict();
export const grantApplicant = z
  .object({
    kind: z.enum(["PERSON", "ENTITY", "GROUP"]),
    parties: z.array(applicantParty).min(1).max(5),
    groupContactName: z.string().trim().max(200),
    groupContactPhone: z.string().trim().max(100),
    groupContactEmail: z.string().trim().max(200),
  })
  .strict()
  .superRefine((applicant, ctx) => {
    // A group can be saved with one partner while its draft is incomplete.
    // Readiness, rather than draft persistence, requires the second partner.
    if (
      applicant.kind !== "GROUP" &&
      (applicant.parties.length !== 1 ||
        applicant.parties[0]?.kind !== applicant.kind)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["parties"],
        message:
          "Osoba fizyczna lub podmiot wymaga dokładnie jednego pomysłodawcy zgodnego rodzaju.",
      });
    }
  });
export type GrantApplicant = z.infer<typeof grantApplicant>;
export const declarationChecks = {
  eligibility: "Warunki podmiotowe i brak wykluczeń (część 12A lub 12B)",
  conflicts: "Powiązania i bezstronność wobec ROPS / INNOAGH",
  funding:
    "Brak równoległego finansowania, powielania wsparcia i limit dwóch aplikacji",
  testing:
    "Bezpłatne testowanie i charakter innowacyjny, nie wyłącznie wdrożeniowy",
  equality: "Równość szans, dostępność i zasada DNSH",
  procedures:
    "Procedury naboru, prawdziwość danych i zasady udostępnienia oceniającym",
  privacy:
    "Klauzule informacyjne ROPS / IZ i obowiązki wobec osób, których dane podano",
} as const;
export type DeclarationKey = keyof typeof declarationChecks;
export function emptyApplicant(
  kind: GrantApplicant["kind"] = "PERSON",
): GrantApplicant {
  return {
    kind,
    parties: [{ kind: kind === "ENTITY" ? "ENTITY" : "PERSON", fields: {} }],
    groupContactName: "",
    groupContactPhone: "",
    groupContactEmail: "",
  };
}
export const grantDraft = z
  .object({
    callId: z.literal(grantTemplate.id),
    templateVersion: z.literal(grantTemplate.version),
    sections: grantSections,
    costs: z.array(grantCost).min(1).max(20),
    schedule: z
      .object({
        preparationMonths: z.number().int().min(1).max(3).nullable(),
        testingMonths: z.number().int().min(1).max(9).nullable(),
        testers: z.number().int().min(1).max(1000000).nullable(),
      })
      .strict()
      .optional(),
    applicant: grantApplicant.optional(),
    declarationReview: z
      .partialRecord(
        z.enum(
          Object.keys(declarationChecks) as [
            DeclarationKey,
            ...DeclarationKey[],
          ],
        ),
        z.boolean(),
      )
      .optional(),
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
    complete:
      Object.keys(costPhases).every((phase) =>
        costs.some((c) => c.phase === phase),
      ) &&
      costs.every(
        (c) => c.action.trim() && c.timing.trim() && c.amountPLN !== null,
      ),
  };
}
export function partyFields(kind: "PERSON" | "ENTITY"): ApplicantField[] {
  return kind === "PERSON"
    ? [
        "firstName",
        "lastName",
        "address",
        "postalCode",
        "city",
        "phone",
        "email",
      ]
    : [
        "name",
        "krs",
        "regon",
        "nip",
        "address",
        "postalCode",
        "city",
        "phone",
        "email",
        "representativeRole",
        "representativeName",
        "representativePhone",
        "representativeEmail",
        "contactRole",
        "contactName",
        "contactPhone",
        "contactEmail",
      ];
}
export function grantReadiness(draft: GrantDraft): string[] {
  const missing: string[] = [];
  for (const [key, field] of Object.entries(grantFields)) {
    const value = draft.sections[key as GrantKey].trim();
    if (
      !value ||
      /^(do (ustalenia|uzupełnienia)(?:\s|[.!]|$)|brak[.!]?$|nie wiem[.!]?$)/i.test(
        value,
      )
    )
      missing.push(field.label);
  }
  if (!grantBudget(draft.costs).complete)
    missing.push(
      "9–10. Działania, terminy i koszty przygotowania oraz obu faz testu",
    );
  if (
    !draft.schedule?.preparationMonths ||
    !draft.schedule.testingMonths ||
    !draft.schedule.testers
  )
    missing.push(
      "9. Czas przygotowania (do 3 miesięcy), testowania (do 9 miesięcy) i liczba testerów",
    );
  const applicant = draft.applicant;
  if (!applicant) missing.push("2. Dane pomysłodawcy");
  else {
    if (applicant.kind === "GROUP" && applicant.parties.length < 2)
      missing.push("2. Co najmniej dwóch partnerów grupy");
    applicant.parties.forEach((party, index) => {
      if (
        partyFields(party.kind)
          .filter((key) => !["krs", "regon", "nip"].includes(key))
          .some((key) => !party.fields[key]?.trim())
      )
        missing.push(`2. Dane pomysłodawcy / partnera ${index + 1}`);
      if (
        partyFields(party.kind)
          .filter((key) => key.toLowerCase().endsWith("email"))
          .some(
            (key) =>
              party.fields[key] &&
              !z.email().safeParse(party.fields[key]).success,
          )
      )
        missing.push(`2. Poprawne adresy e-mail partnera ${index + 1}`);
    });
    if (
      applicant.kind === "GROUP" &&
      (!applicant.groupContactName ||
        !applicant.groupContactPhone ||
        !z.email().safeParse(applicant.groupContactEmail).success)
    )
      missing.push("2. Kontakt do reprezentanta grupy");
  }
  if (
    Object.keys(declarationChecks).some(
      (key) => !draft.declarationReview?.[key as DeclarationKey],
    )
  )
    missing.push(
      "12. Przegląd oświadczeń w oryginalnym formularzu przez autora",
    );
  return missing;
}
export const formatPLN = (amount: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(
    amount,
  );
