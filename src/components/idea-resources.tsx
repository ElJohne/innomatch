import { listKnowledge } from "@/server/services/repository";
export async function IdeaResources() {
  const canvas = (await listKnowledge()).find(
    (r) => r.id === "rops-knowledge-7b2381c3ed665c63",
  );
  return (
    <aside className="note">
      <h2>Materiały i nabory grantowe</h2>
      <p>
        W karcie możesz rozwinąć pomysł w Canvas i wydrukować zapisaną wersję.
        To uproszczony arkusz pracy; oryginalne plansze znajdziesz poniżej.
      </p>
      <p>
        Po zapisaniu karty możesz przygotować szkic merytoryczny na podstawie
        opublikowanego formularza IWS 2.0, policzyć koszty i wydrukować
        materiał. Ten nabór jest zakończony. Zapisanie lub przekazanie pomysłu
        nie jest zgłoszeniem do konkursu; aktualne warunki sprawdź u
        organizatora.
      </p>
      {canvas ? (
        <div>
          <h3>{canvas.title}</h3>
          <p>{canvas.description}</p>
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
    </aside>
  );
}
