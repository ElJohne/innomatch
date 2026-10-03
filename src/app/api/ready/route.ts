import { json } from "@/server/http";
import { sqlClient } from "@/server/db/client";
import { config } from "@/server/config";
import { createLiveAiProvider } from "@/server/ai/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (config().AI_PROVIDER !== "mock") createLiveAiProvider();
    if (config().DATA_PROVIDER === "postgres") {
      const rows =
        await sqlClient()`select id from mi_migrations where id = '0001_core'`;
      if (!rows.length) return json({ status: "unavailable" }, 503);
    }
    return json({ status: "ok" });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
