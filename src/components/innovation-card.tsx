import Link from "next/link";
import type { Innovation } from "@/lib/contracts";
export function InnovationCard({ item }: { item: Innovation }) {
  return (
    <article className="card">
      <div className="eyebrow">{item.categories[0]}</div>
      <h2>
        <Link href={`/innowacje/${item.id}`}>{item.title}</Link>
      </h2>
      <p>{item.problem}</p>
      <div className="tags">
        {item.targetGroups.map((g) => (
          <span key={g}>{g}</span>
        ))}
        <span>
          {item.origin === "SYNTHETIC"
            ? "Przykład syntetyczny"
            : "Z materiału źródłowego"}
        </span>
      </div>
      <Link className="text-link" href={`/innowacje/${item.id}`}>
        Poznaj rozwiązanie <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
