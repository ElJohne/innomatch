import { actor } from "@/server/auth/staff";
import { issueRecovery } from "@/server/auth/recovery";
import { session } from "@/server/auth/session";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, writeGuard } from "@/server/http";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const a = await actor();
    if (a.staff)
      throw new HttpError(
        403,
        "STAFF",
        "Kod dotyczy tylko spraw użytkownika. Personel korzysta z logowania.",
      );
    if (
      !(await consumeLimit(
        `recovery-issue:${a.ownerId}:${new Date().toISOString().slice(0, 10)}`,
        10,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Zbyt wiele nowych kodów. Spróbuj jutro.",
      );
    const recovery = await issueRecovery(a.ownerId);
    const s = await session();
    await s.save();
    return json(recovery);
  });
}
