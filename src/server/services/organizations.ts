import "server-only";
import { config } from "@/server/config";
import { demoOrganizations } from "@/lib/organizations";
export function listOrganizations() {
  const c = config();
  return c.DATA_PROVIDER === "fixtures" && c.DEMO_DATA_ENABLED === "true"
    ? demoOrganizations
    : [];
}
