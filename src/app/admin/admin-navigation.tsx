import Link from "next/link";
import { LogoutButton } from "@/components/communication-forms";
import styles from "./admin.module.css";

const sections = [
  ["inbox", "/admin", "Zgłoszenia"],
  ["catalog", "/admin/katalog", "Katalog i wiedza"],
  ["feedback", "/admin/opinie", "Opinie"],
  ["analytics", "/admin/statystyki", "Statystyki"],
] as const;

export function AdminNavigation({
  active,
  isAdmin = true,
}: {
  active: (typeof sections)[number][0];
  isAdmin?: boolean;
}) {
  return (
    <div className={styles.navigation}>
      <nav aria-label="Panel personelu" className={styles.tabs}>
        {sections
          .filter(([id]) => isAdmin || id === "inbox")
          .map(([id, href, label]) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
      </nav>
      <LogoutButton />
    </div>
  );
}
