import Link from "next/link";
import styles from "./discovery.module.css";

export function KnowledgeNav({
  current,
}: {
  current: "catalog" | "region" | "materials";
}) {
  return (
    <nav className={styles.navigation} aria-label="Biblioteka innowacji">
      {[
        ["catalog", "/innowacje", "Rozwiązania"],
        ["region", "/innowacje/region", "Dane regionu"],
        ["materials", "/innowacje/materialy", "Materiały i raporty"],
      ].map(([key, href, label]) => (
        <Link
          key={key}
          href={href}
          aria-current={current === key ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
