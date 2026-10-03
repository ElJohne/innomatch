import { z } from "zod";
export const ideaCard = z
  .object({
    title: z.string().trim().min(3).max(200),
    problem: z.string().trim().min(20).max(2000),
    essence: z.string().trim().min(20).max(3000),
    targetGroups: z.array(z.string().trim().min(2).max(200)).min(1).max(10),
    stage: z.enum(["CONCEPT", "PILOT", "TESTED"]),
    resources: z.string().trim().min(3).max(1500),
    pilotOutline: z.string().trim().min(3).max(1500),
  })
  .strict();
export const ideaCreate = z
  .object({ card: ideaCard, requestKey: z.string().uuid() })
  .strict();
export const ideaEdit = z
  .object({ card: ideaCard, expectedRevision: z.number().int().positive() })
  .strict();
export const ideaRevision = z
  .object({ expectedRevision: z.number().int().positive() })
  .strict();
export const ideaSuggestion = z
  .object({
    card: ideaCard,
    questions: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  })
  .strict();
export type IdeaCard = z.infer<typeof ideaCard>;
export type IdeaSuggestion = z.infer<typeof ideaSuggestion> & {
  mode: "mock" | "openai" | "azure";
};
export type Idea = {
  id: string;
  card: IdeaCard;
  revision: number;
  status: "DRAFT" | "SUBMITTED";
  origin: "SYNTHETIC" | "USER_SUBMISSION";
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
};
export const ideaLabels = {
  title: "Tytuł pomysłu",
  problem: "Jaki problem chcesz rozwiązać?",
  essence: "Na czym polega pomysł?",
  resources: "Zasoby i ograniczenia",
  pilotOutline: "Jak można sprawdzić pomysł w małej skali?",
} as const;
export const ideaStageLabels = {
  CONCEPT: "Koncepcja",
  PILOT: "W trakcie pilotażu",
  TESTED: "Po testach — deklaracja autora",
} as const;
export const grantCallSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().min(3).max(300),
    opensAt: z.iso.datetime(),
    closesAt: z.iso.datetime(),
    templateVersion: z.string().min(1).max(100),
    sourceUrl: z.url().refine((url) => new URL(url).protocol === "https:"),
    origin: z.enum(["ORGANIZER", "PUBLIC_SOURCE", "SYNTHETIC"]),
    fields: z
      .array(
        z
          .object({
            key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/),
            label: z.string().min(1).max(300),
            required: z.boolean(),
            maxLength: z.number().int().min(1).max(10000),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .refine(
    (c) => Date.parse(c.closesAt) > Date.parse(c.opensAt),
    "Nieprawidłowy okres naboru.",
  );
