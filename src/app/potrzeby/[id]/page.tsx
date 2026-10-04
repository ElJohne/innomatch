import { notFound } from "next/navigation";
import { MATCHING_VERSION } from "@/server/search/intake";
import { session } from "@/server/auth/session";
import {
  getNeed,
  listInnovations,
  listKnowledge,
} from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { MatchResults } from "@/components/match-results";
import { FlowSteps } from "@/components/flow-steps";
export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const need = await getNeed((await params).id, s.ownerId);
  if (!need) notFound();
  return (
    <section className="flow-page">
      <FlowSteps current={2} />
      <MatchResults
        key={need.id}
        id={need.id}
        initial={
          need.match?.matchingVersion === MATCHING_VERSION
            ? await visibleMatch(need.match)
            : null
        }
        input={{
          audience: need.audience,
          description: need.description,
          municipality: need.municipality,
          targetGroups: need.targetGroups,
          constraints: need.constraints,
          clarifications: need.clarifications,
          skipClarification: need.skipClarification,
        }}
        records={await listInnovations()}
        resources={await listKnowledge()}
      />
    </section>
  );
}
