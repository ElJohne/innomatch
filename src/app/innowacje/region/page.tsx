import { RegionalDiagnosis } from "@/components/regional-diagnosis";
import { KnowledgeNav } from "../knowledge-nav";

export default function RegionPage() {
  return (
    <section className="section">
      <KnowledgeNav current="region" />
      <h1>Małopolska w liczbach</h1>
      <RegionalDiagnosis />
    </section>
  );
}
