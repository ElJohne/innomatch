import { z } from "zod";
import type { ContactPurpose } from "@/lib/contact-purpose";

export const loginInput = z
  .object({
    login: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(1).max(200),
  })
  .strict();
export const messageInput = z
  .object({
    body: z.string().trim().min(1).max(4000),
    requestKey: z.string().uuid(),
  })
  .strict();
export const threadInput = messageInput
  .extend({
    needId: z.string().uuid().optional(),
    adaptationId: z.string().uuid().optional(),
    adaptationRevision: z.number().int().positive().optional(),
    innovationId: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .optional(),
  })
  .refine((v) => Boolean(v.adaptationId) === Boolean(v.adaptationRevision), {
    message: "Wskaż wersję udostępnianego planu.",
  })
  .refine(
    (v) =>
      [v.needId, v.innovationId, v.adaptationId].filter(Boolean).length === 1,
    {
      message: "Wybierz jeden kontekst rozmowy.",
    },
  );
export const readInput = z
  .object({ through: z.number().int().positive() })
  .strict();
export const sharePlanInput = z
  .object({
    expectedRevision: z.number().int().positive(),
    requestKey: z.string().uuid(),
  })
  .strict();
export type ThreadInput = z.infer<typeof threadInput>;
export type MessageInput = z.infer<typeof messageInput>;
export type Staff = {
  id: string;
  role: "ADMIN" | "EXPERT";
  authVersion: number;
};
export type Actor = { ownerId: string; staff?: Staff };
export type ThreadSummary = {
  title?: string;
  purpose?: ContactPurpose;
  ideaId?: string | null;
  adaptationId?: string | null;
  id: string;
  needId: string | null;
  innovationId: string | null;
  updatedAt: string;
  unread: number;
};
export type ThreadMessage = {
  id: string;
  sequence: number;
  authorRole: "USER" | "STAFF";
  body: string;
  createdAt: string;
};
