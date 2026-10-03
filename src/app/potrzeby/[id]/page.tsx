import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { listOrganizations } from "@/server/services/organizations";
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
      <FlowSteps current={3} />
      <MatchResults
        id={need.id}
        initial={need.match ? await visibleMatch(need.match) : null}
        records={await listInnovations()}
        organizations={listOrganizations()}
      />
    </section>
  );
}
