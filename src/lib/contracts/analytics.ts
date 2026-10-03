import { z } from "zod";

export const analyticsQuery = z
  .object({ days: z.enum(["7", "30", "90"]).default("30") })
  .strict();
export const audienceGroups = [
  "Seniorzy",
  "Młodzież",
  "Opiekunowie",
  "Osoby z niepełnosprawnościami",
  "Mieszkańcy",
] as const;
export const searchStatusLabels = {
  pending: "Bez zapisanego wyniku",
  matched: "Znaleziono dopasowania",
  partial: "Częściowe dopasowanie",
  no_match: "Bez dopasowania",
  unknown: "Nierozpoznany status",
} as const;
export type AnalyticsBucket = { label: string; count: number };
export type NeedAnalytics = {
  generatedAt: string;
  period: { days: number; from: string; through: string; timeZone: "UTC" };
  source: "fixtures" | "postgres";
  total: number;
  withMunicipality: number;
  daily: AnalyticsBucket[];
  audiences: AnalyticsBucket[];
  searchStatuses: { status: keyof typeof searchStatusLabels; count: number }[];
};
