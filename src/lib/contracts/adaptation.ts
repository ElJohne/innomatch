import { z } from "zod";
const text = z.string().trim().min(1).max(1200);
const items = z.array(z.string().trim().min(1).max(600)).min(1).max(8);
export const firstStepSchema = z
  .object({
    action: z.string().trim().min(1).max(600),
    responsible: z.string().trim().min(1).max(600),
    resources: z.string().trim().min(1).max(600),
    completion: z.string().trim().min(1).max(600),
  })
  .strict();
export const adaptationDraft = z
  .object({
    // Optional for saved v1 plans; required for newly generated plans below.
    firstStep: firstStepSchema.optional(),
    summary: text,
    serviceDescription: text,
    fitAndGaps: text,
    steps: items,
    requiredRoles: items,
    requiredResources: items,
    pilot: z
      .object({ scope: text, activities: items, proposedMetrics: items })
      .strict(),
    risks: items,
    openQuestions: items,
    assumptions: items,
    sourceIds: z.array(z.string().min(1).max(100)).min(1).max(20),
  })
  .strict();
export const adaptationInput = z
  .object({
    needId: z.string().uuid(),
    innovationId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    constraints: z
      .object({
        institution: z.string().trim().min(3).max(300),
        resources: z.string().trim().min(3).max(1500),
        scope: z.string().trim().min(3).max(600),
        timeline: z.string().trim().max(300),
        budget: z.string().trim().max(300),
      })
      .strict(),
    requestKey: z.string().uuid(),
  })
  .strict();
export const adaptationEdit = z
  .object({
    expectedRevision: z.number().int().positive(),
    draft: adaptationDraft,
    constraints: adaptationInput.shape.constraints.optional(),
  })
  .strict();
export type AdaptationDraft = z.infer<typeof adaptationDraft>;
export const generatedAdaptationDraft = adaptationDraft.extend({
  firstStep: firstStepSchema,
});
export const firstStepLabels = {
  action: "Pierwsze działanie",
  responsible: "Kto odpowiada?",
  resources: "Co jest potrzebne na start?",
  completion: "Po czym poznamy, że krok jest wykonany?",
} as const;
export function firstStepFor(draft: AdaptationDraft) {
  return (
    draft.firstStep ?? {
      action: draft.steps[0],
      responsible: "Do wyznaczenia przez autora planu.",
      resources: draft.requiredResources[0],
      completion:
        "Do uzgodnienia z koordynatorem przed rozpoczęciem działania.",
    }
  );
}
export type AdaptationInput = z.infer<typeof adaptationInput>;
export const constraintLabels = {
  institution: "Instytucja",
  resources: "Zasoby i ograniczenia",
  scope: "Odbiorcy i zasięg",
  timeline: "Termin — jeśli znany",
  budget: "Budżet — jeśli znany",
} as const;
export type AdaptationPlan = {
  id: string;
  needId: string;
  innovationId: string;
  constraints: AdaptationInput["constraints"];
  draft: AdaptationDraft;
  revision: number;
  editedByOwner: boolean;
  sourceVersion: string;
  mode: "mock" | "openai" | "azure";
  promptVersion: "adaptation-v1" | "adaptation-v2";
  createdAt: string;
};
export const draftLabels = {
  summary: "Cel adaptacji",
  serviceDescription: "Propozycja usługi",
  fitAndGaps: "Dopasowanie i luki",
  steps: "Kroki wdrożenia",
  requiredRoles: "Potrzebne role",
  requiredResources: "Potrzebne zasoby",
  risks: "Ryzyka",
  openQuestions: "Pytania do eksperta",
  assumptions: "Założenia do weryfikacji",
} as const;
export const pilotLabels = {
  scope: "Zakres pilotażu",
  activities: "Działania pilotażowe",
  proposedMetrics: "Proponowane kryteria oceny",
} as const;
export function draftText(draft: AdaptationDraft) {
  const section = (label: string, value: string | string[]) =>
    `${label}\n${Array.isArray(value) ? value.map((x) => `• ${x}`).join("\n") : value}`;
  return [
    "SZKIC ADAPTACJI — propozycja do weryfikacji, bez zatwierdzenia ROPS",
    ...Object.entries(firstStepLabels).map(([key, label]) =>
      section(label, firstStepFor(draft)[key as keyof typeof firstStepLabels]),
    ),
    ...Object.entries(draftLabels).map(([key, label]) =>
      section(label, draft[key as keyof typeof draftLabels]),
    ),
    ...Object.entries(pilotLabels).map(([key, label]) =>
      section(label, draft.pilot[key as keyof typeof pilotLabels]),
    ),
  ].join("\n\n");
}
