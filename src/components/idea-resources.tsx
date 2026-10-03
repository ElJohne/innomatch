import Link from "next/link";
import { listKnowledge } from "@/server/services/repository";
export async function IdeaResources() {
  const canvas = (await listKnowledge()).find(
    (r) => r.id === "rops-knowledge-7b2381c3ed665c63",
  );
  return (
    <aside className="note">
      <h2>Materiały i nabory grantowe</h2>
      <p>
        To ogólna karta pomysłu MI Connect. Nie zastępuje oficjalnej Canwy
        Innowacji Społecznych.
      </p>
      <p>
        Nie udostępniono aktywnego naboru ani jego formularza. Generator wniosku
        grantowego nie jest dostępny. Zapisanie lub przekazanie pomysłu nie jest
        zgłoszeniem do konkursu.
      </p>
      {canvas ? (
        <div>
          <h3>{canvas.title}</h3>
          <p>{canvas.description}</p>
          <Link href={`/wiedza#${canvas.id}`}>Opis i źródła materiału →</Link>
          {canvas.sources
            .filter((s) => s.sourceUrl)
            .map((s) => (
              <p key={s.id}>
                <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                  {s.sourceTitle} — dokument oryginalny ↗
                </a>
              </p>
            ))}
        </div>
      ) : (
        <p>
          W bieżącym katalogu nie ma dostępnego materiału Canvas. Formularz
          powyżej pozostaje ogólną kartą pomysłu.
        </p>
      )}
      <Link href="/wiedza">Przejrzyj dostępne materiały wiedzy →</Link>
    </aside>
  );
}
