import "server-only";
import { z } from "zod";

export function config() {
  return z
    .object({
      DATA_PROVIDER: z.enum(["fixtures", "postgres"]).default("fixtures"),
      AI_PROVIDER: z.enum(["mock", "azure"]).default("mock"),
      DEMO_DATA_ENABLED: z.enum(["true", "false"]).default("true"),
      APP_URL: z.url().default("http://localhost:3000"),
      AI_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .min(1000)
        .max(60000)
        .default(20000),
      AI_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(2),
      AI_DAILY_REQUEST_LIMIT: z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .default(300),
    })
    .parse(process.env);
}
export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("CONFIGURATION_MISSING");
  return value;
}
