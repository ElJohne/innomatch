import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPage } from "@/server/auth/admin-page";
import { listCatalog } from "@/server/services/catalog";
import {
  catalogKind,
  type CatalogEntry,
  type CatalogRecord,
} from "@/lib/contracts/catalog";
import { config } from "@/server/config";
import { CatalogEditor } from "@/components/catalog-editor";
import { AdminNavigation } from "../../../admin-navigation";
import styles from "../../../admin.module.css";
export default async function EditorPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const a = await adminPage();
  const route = await params;
  const parsedKind = catalogKind.safeParse(route.kind);
  if (!parsedKind.success) notFound();
  const kind = parsedKind.data;
  const demo = config().DATA_PROVIDER === "fixtures";
  const isNew = route.id === "nowy";
  let entry: CatalogEntry | undefined;
  if (isNew) {
    const base = {
      id: `admin-${randomUUID()}`,
      title: "",
      publicationStatus: "DRAFT" as const,
      origin: demo ? ("SYNTHETIC" as const) : ("PUBLIC_SOURCE" as const),
      sources: [
        {
          id: randomUUID(),
          sourceTitle: "",
          sourceRef: "",
          evidenceExcerpt: "",
        },
      ],
    };
    const record: CatalogRecord =
      kind === "innovation"
        ? {
            ...base,
            problem: "",
            solution: "",
            targetGroups: [],
            categories: [],
            requirements: [],
            maturity: "UNKNOWN",
          }
        : {
            ...base,
            description: "",
            topics: [],
            type: "EDUCATION",
            coverage: "DESCRIPTION",
          };
    entry = {
      kind,
      record,
      version: "",
      managedLocally: false,
      reviewedAt: null,
      indexPending: false,
    };
  } else
    entry = (await listCatalog(a, kind)).find((e) => e.record.id === route.id);
  if (!entry) notFound();
  return (
    <section className={styles.page}>
      <AdminNavigation active="catalog" />
      <Link href={`/admin/katalog?kind=${kind}`}>← Katalog i wiedza</Link>
      <p className="eyebrow detail-label">
        {kind === "innovation" ? "Innowacja" : "Materiał wiedzy"}
      </p>
      <h1>{isNew ? "Nowy wpis" : "Edytuj wpis"}</h1>
      <CatalogEditor
        initial={entry}
        isNew={isNew}
        demo={demo}
        canIndex={!demo && config().AI_PROVIDER !== "mock"}
      />
    </section>
  );
}
