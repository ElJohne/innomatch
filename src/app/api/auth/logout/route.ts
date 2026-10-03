import { session } from "@/server/auth/session";
import { handle, json, writeGuard } from "@/server/http";
export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const s = await session();
    delete s.staffId;
    delete s.authVersion;
    delete s.staffExpiresAt;
    await s.save();
    return json({ ok: true });
  });
}
