import Link from "next/link";
import styles from "./idea-simple.module.css";
export function IdeaNav({
  id,
  current,
  disabled = false,
}: {
  id: string;
  current: "card" | "canvas" | "compare" | "grant";
  disabled?: boolean;
}) {
  const items = [
    ["card", "Karta pomysłu", `/pomysly/${id}`],
    ["canvas", "Canvas — plan rozwoju", `/pomysly/${id}/canvas`],
    ["compare", "Podobne rozwiązania", `/pomysly/${id}/porownanie`],
    ["grant", "Szkic grantowy", `/pomysly/${id}/grant`],
  ];
  return (
    <nav className={styles.nav} aria-label="Praca nad pomysłem">
      {items.map(([key, label, href]) =>
        disabled ? (
          <span
            key={key}
            aria-current={key === current ? "page" : undefined}
            aria-disabled="true"
          >
            {label}
          </span>
        ) : (
          <Link
            key={key}
            href={href}
            aria-current={key === current ? "page" : undefined}
          >
            {label}
          </Link>
        ),
      )}
      {disabled ? (
        <span aria-disabled="true">Podgląd i druk</span>
      ) : (
        <Link href={`/pomysly/${id}/podglad`}>Podgląd i druk</Link>
      )}
    </nav>
  );
}
