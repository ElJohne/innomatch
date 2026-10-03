import "server-only";
import { config } from "@/server/config";
import {
  innovationSchema,
  type Innovation,
  type KnowledgeResource,
} from "@/lib/contracts";
import source from "../../../data/demo/innovations.json";
const root = globalThis as unknown as {
  miFixtureCatalog?: {
    innovations: Map<string, Innovation>;
    knowledge: Map<string, KnowledgeResource>;
  };
};
export function fixtureCatalog() {
  const c = config();
  if (c.DATA_PROVIDER !== "fixtures" || c.DEMO_DATA_ENABLED !== "true")
    throw new Error("FIXTURES_DISABLED");
  return (root.miFixtureCatalog ??= {
    innovations: new Map(
      source.map((r) => {
        const parsed = innovationSchema.parse(r);
        return [parsed.id, parsed];
      }),
    ),
    knowledge: new Map(),
  });
}
