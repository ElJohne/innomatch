import { session } from "@/server/auth/session";
import { getNeed } from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { handle, HttpError, json } from "@/server/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const s = await session();
    const need = s.ownerId
      ? await getNeed((await context.params).id, s.ownerId)
      : null;
    if (!need)
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Nie znaleziono sprawy w tej sesji.",
      );
    return json({
      id: need.id,
      description: need.description,
      municipality: need.municipality,
      targetGroups: need.targetGroups,
      constraints: need.constraints,
      clarifications: need.clarifications ?? [],
      skipClarification: need.skipClarification ?? false,
      createdAt: need.createdAt,
      match: need.match ? await visibleMatch(need.match) : null,
    });
  });
}
