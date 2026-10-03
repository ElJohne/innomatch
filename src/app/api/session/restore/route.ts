import { z } from "zod";
import { restoreOwner } from "@/server/auth/recovery";
import { session } from "@/server/auth/session";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const { token } = z
      .object({
        token: z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9_-]{43}$/),
      })
      .strict()
      .parse(await readBody(request));
    if (
      !(await consumeLimit(
        `recovery-global:${Math.floor(Date.now() / 60000)}`,
        30,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Zbyt wiele prób. Spróbuj za minutę.",
      );
    const ownerId = await restoreOwner(token);
    const s = await session();
    s.ownerId = ownerId;
    delete s.staffId;
    delete s.authVersion;
    delete s.staffExpiresAt;
    await s.save();
    return json({ ok: true });
  });
}
