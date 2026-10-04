import { requireStaff } from "@/server/auth/staff";
import { threadQueue } from "@/server/services/communication";
import { queueQuery } from "@/lib/contracts/communication";
import { handle, json } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const a = await requireStaff();
    const query = queueQuery.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(
      await threadQueue(a, { page: query.page, unread: query.unread === "1" }),
    );
  });
}
