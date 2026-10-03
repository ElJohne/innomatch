import { requireStaff } from "@/server/auth/staff";
import { needAnalytics } from "@/server/services/analytics";
import { handle, json } from "@/server/http";
export async function GET(request: Request) {
  return handle(async () => {
    const actor = await requireStaff(true);
    return json(
      await needAnalytics(
        actor,
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  });
}
