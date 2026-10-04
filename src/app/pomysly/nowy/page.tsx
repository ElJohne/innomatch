import styles from "@/components/idea-simple.module.css";
import Link from "next/link";
import { IdeaStart } from "@/components/idea-start";
export default function NewIdea() {
  return (
    <section className={`narrow stack idea-page ${styles.page}`}>
      <Link className="back-link" href="/">
        ← Strona główna
      </Link>
      <header className="idea-hero">
        <div>
          <p className="eyebrow">Mam pomysł</p>
          <h1>Opisz pomysł. Zacznij działać.</h1>
        </div>
      </header>
      <IdeaStart />
      <Link href="/">Szukasz pomocy dla siebie? Opisz swoją potrzebę →</Link>
    </section>
  );
}
