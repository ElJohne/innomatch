import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { config } from "@/server/config";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function writeGuard(request: Request) {
  if (request.headers.get("origin") !== new URL(config().APP_URL).origin)
    throw new HttpError(403, "ORIGIN", "Nie można wykonać tego żądania.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "CONTENT_TYPE", "Wymagany format JSON.");
}
export async function readBody(request: Request, maximumBytes = 20000) {
  // Bound the stream, not only a client-controlled Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "BODY", "Brak danych.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximumBytes) {
      await reader.cancel();
      throw new HttpError(413, "TOO_LARGE", "Opis jest zbyt długi.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON", "Nieprawidłowe dane formularza.");
  }
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function handle(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    const requestId = randomUUID();
    if (error instanceof HttpError)
      return json(
        { code: error.code, message: error.message, requestId },
        error.status,
      );
    if (error instanceof ZodError)
      return json(
        {
          code: "VALIDATION",
          message: "Sprawdź wymagane pola i dopuszczalną długość tekstu.",
          requestId,
        },
        400,
      );
    // Do not serialize provider exceptions, connection strings or private text.
    return json(
      {
        code: "UNAVAILABLE",
        message:
          "Usługa jest niedostępna. Spróbuj ponownie później. Dane formularza pozostają na ekranie.",
        requestId,
      },
      503,
    );
  }
}
