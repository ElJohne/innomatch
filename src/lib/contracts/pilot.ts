import { z } from "zod";
export const feedbackInput = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(20).max(2000),
    improvements: z.string().trim().max(1500),
    experience: z.enum(["DESCRIPTION", "USED"]),
    consentToPublish: z.literal(true),
    expectedRevision: z.number().int().positive().nullable(),
  })
  .strict();
export const feedbackReview = z
  .object({
    status: z.enum(["PUBLISHED", "ARCHIVED"]),
    expectedRevision: z.number().int().positive(),
    reviewed: z.boolean(),
  })
  .strict();
export type Feedback = {
  id: string;
  innovationId: string;
  rating: number;
  comment: string;
  improvements: string;
  experience: "DESCRIPTION" | "USED";
  status: "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  origin: "SYNTHETIC" | "USER_SUBMISSION";
  sourceVersion: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type Participation = {
  id: string;
  innovationId: string;
  threadId: string;
  status: "REQUESTED";
  origin: "SYNTHETIC" | "USER_SUBMISSION";
  createdAt: string;
};
export type PublicFeedback = Pick<
  Feedback,
  | "id"
  | "rating"
  | "comment"
  | "improvements"
  | "experience"
  | "origin"
  | "updatedAt"
>;
export const feedbackStatusLabels = {
  IN_REVIEW: "Oczekuje na moderację",
  PUBLISHED: "Opublikowana",
  ARCHIVED: "Ukryta przez administratora",
} as const;
export const experienceLabels = {
  DESCRIPTION: "Opinia na podstawie opisu",
  USED: "Deklarowane doświadczenie z użycia",
} as const;
