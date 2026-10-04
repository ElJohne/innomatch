import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { listThreads } from "@/server/services/communication";
import { listOrganizations } from "@/server/services/organizations";
import { organizationOptions } from "@/lib/organizations";
import { FlowSteps } from "@/components/flow-steps";
import { QuickHelp } from "@/components/quick-help";
import styles from "@/components/matching.module.css";
export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ innovationId?: string; organizacja?: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const need = await getNeed((await params).id, s.ownerId);
  if (!need?.match) notFound();
  const result = await visibleMatch(need.match),
    query = await searchParams,
    records = await listInnovations();
  const innovationId =
    query.innovationId ??
    (query.organizacja
      ? organizationOptions(result, records, listOrganizations()).find(
          (x) => x.organization.id === query.organizacja,
        )?.innovation.id
      : undefined);
  const match = result.matches.find((m) => m.innovationId === innovationId),
    innovation = records.find((r) => r.id === innovationId);
  if (!match || !innovation) notFound();
  const material = innovation.sources.find(
    (source) => match.sourceIds.includes(source.id) && source.sourceUrl,
  );
  const existingThread = (await listThreads({ ownerId: s.ownerId })).find(
    (t) => t.needId === need.id,
  )?.id;
  return (
    <section className="flow-page plan-page narrow">
      <FlowSteps current={3} />
      <Link className="back-link" href={`/potrzeby/${need.id}`}>
        ← Wybierz inną pomoc
      </Link>
      <div className="flow-heading">
        <h1>Co zrobić teraz?</h1>
      </div>
      <div className="card next-action">
        <p className="eyebrow">{innovation.title}</p>
        <h2>
          {match.nextStep ||
            "Poproś koordynatora o pomoc w skorzystaniu z tego rozwiązania."}
        </h2>
        {(result.mode.explanation === "mock" ||
          innovation.origin === "SYNTHETIC") && (
          <p className="help">Przykład demonstracyjny</p>
        )}
        {material?.sourceUrl && (
          <p>
            <a
              className="button secondary"
              href={material.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Zobacz rozwiązanie ↗
            </a>
          </p>
        )}
        <QuickHelp
          needId={need.id}
          solution={innovation.title}
          existingThread={existingThread}
        />
      </div>
      {need.audience === "INSTITUTION" && (
        <p>
          <Link
            href={`/adaptacje/nowa?innovationId=${innovation.id}&needId=${need.id}`}
          >
            Przygotuj plan dla instytucji →
          </Link>
        </p>
      )}
      <p className={styles.sources}>
        <Link href={`/innowacje/${innovation.id}`}>
          Opis, warunki i źródła rozwiązania →
        </Link>
      </p>
    </section>
  );
}
