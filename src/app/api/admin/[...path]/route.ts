import { json } from "@/server/http";
// Fail closed until staff authentication and moderation are implemented.
const denied = () =>
  json(
    {
      code: "FORBIDDEN",
      message: "Dostęp wymaga uprawnień administratora.",
      requestId: crypto.randomUUID(),
    },
    403,
  );
export const GET = denied;
export const POST = denied;
export const PATCH = denied;
export const DELETE = denied;
