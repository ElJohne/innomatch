import { z } from "zod";
import { actor } from "@/server/auth/staff";
import { assistIdea } from "@/server/services/ideas";
import { ideaRevision } from "@/lib/contracts/idea";
import { handle, json, readBody, writeGuard } from "@/server/http";
export async function POST(r: Request) {
  return handle(async () => {
    writeGuard(r);
    const input = ideaRevision
      .extend({ id: z.string().uuid() })
      .strict()
      .parse(await readBody(r));
    return json(
      await assistIdea(
        input.id,
        (await actor()).ownerId,
        input.expectedRevision,
      ),
    );
  });
}
