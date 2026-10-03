import { createHash } from "node:crypto";
import { loginInput } from "@/lib/contracts/communication";
import { authenticateStaff } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { consumeLimit } from "@/server/services/repository";
import { handle, HttpError, json, readBody, writeGuard } from "@/server/http";

export async function POST(request: Request) {
  return handle(async () => {
    writeGuard(request);
    const input = loginInput.parse(await readBody(request));
    const minute = Math.floor(Date.now() / 60000);
    const loginHash = createHash("sha256").update(input.login).digest("hex");
    // Global and account limits cannot be bypassed by resetting browser cookies.
    if (
      !(await consumeLimit(`staff-login-global:${minute}`, 30)) ||
      !(await consumeLimit(
        `staff-login:${loginHash}:${Math.floor(minute / 15)}`,
        10,
      ))
    )
      throw new HttpError(
        429,
        "RATE_LIMIT",
        "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.",
      );
    const staff = await authenticateStaff(input.login, input.password);
    if (!staff)
      throw new HttpError(401, "LOGIN", "Nieprawidłowy login lub hasło.");
    const s = await session(true);
    s.staffId = staff.id;
    s.authVersion = staff.authVersion;
    s.staffExpiresAt = Date.now() + 8 * 60 * 60 * 1000;
    await s.save();
    return json({ ok: true });
  });
}
