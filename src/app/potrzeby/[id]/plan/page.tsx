import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { visibleMatch } from "@/server/services/matching";
import { listOrganizations } from "@/server/services/organizations";
import { organizationOptions } from "@/lib/organizations";
import { FlowSteps } from "@/components/flow-steps";
import { MessageDraft } from "@/components/message-draft";

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ organizacja?: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const need = await getNeed((await params).id, s.ownerId);
  if (!need?.match) notFound();
  const result = await visibleMatch(need.match);
  const organizationId = (await searchParams).organizacja;
  const selected = organizationOptions(
    result,
    await listInnovations(),
    listOrganizations(),
  ).find((x) => x.organization.id === organizationId);
  if (!selected) notFound();
  const { organization, innovation, match } = selected;
  const message = `Dzień dobry, szukam wsparcia w następującej sprawie: ${need.description}${need.municipality ? ` Gmina: ${need.municipality}.` : ""} Interesuje mnie rozwiązanie „${innovation.title}”. Czy zajmują się Państwo takim obszarem i czy możemy omówić możliwości współpracy?${need.constraints ? ` Nasze zasoby i ograniczenia: ${need.constraints}` : ""}`;
  return (
    <section className="flow-page plan-page">
      <FlowSteps current={4} />
      <Link className="back-link" href={`/potrzeby/${need.id}`}>
        ← Wybierz inną organizację
      </Link>
      <div className="flow-heading">
        <p className="eyebrow">Krok 4 · Mały krok, wspólna zmiana</p>
        <h1>Co zrobić dalej?</h1>
        <p className="lead">
          Spokojnie, krok po kroku. Przygotowaliśmy wskazówki do pierwszej
          rozmowy.
        </p>
      </div>
      <div className="plan-layout">
        <div>
          <ol className="action-steps">
            <li>
              <span>1</span>
              <div>
                <h2>Przygotuj się do kontaktu</h2>
                <p>
                  Wybrana organizacja: <strong>{organization.name}</strong>. W
                  wersji rzeczywistej najpierw sprawdź jej oficjalne dane
                  kontaktowe i obszar działania.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h2>Opowiedz o swojej potrzebie</h2>
                <p>
                  Skorzystaj z tekstu poniżej. Zapytaj o rozwiązanie{" "}
                  <strong>„{innovation.title}”</strong> i o to, czy odpowiada
                  Twojej sytuacji.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h2>Ustalcie możliwy następny krok</h2>
                <p>
                  Zapytaj o dostępność, potrzebne zasoby i warunki udziału.
                  Wspólnie uzgodnijcie termin, jeśli organizacja potwierdzi
                  możliwość wsparcia.
                </p>
              </div>
            </li>
          </ol>
          <p className="notice">
            To przykład demonstracyjny. Organizacja jest fikcyjna — nie podajemy
            numeru telefonu ani adresu. Te wskazówki nie oznaczają przyjęcia
            zgłoszenia.
          </p>
        </div>
        <aside className="selected-organization card">
          <span className="organization-icon" aria-hidden="true">
            {organization.symbol}
          </span>
          <p className="eyebrow">Twój wybór · demo</p>
          <h2>{organization.name}</h2>
          <p>{organization.description}</p>
          <div className="organization-solution">
            <span>Rozwiązanie do omówienia</span>
            <strong>{innovation.title}</strong>
          </div>
          <p className="handwritten">
            Razem łatwiej
            <br />
            zrobić pierwszy krok. ♡
          </p>
        </aside>
      </div>
      <MessageDraft initial={message} />
      <details className="card plan-evidence">
        <summary>
          Dlaczego ta propozycja? Zobacz rozwiązanie, źródła i ograniczenia
        </summary>
        <h2>{innovation.title}</h2>
        <p>{innovation.solution}</p>
        <p className="help">
          {result.mode.explanation === "azure"
            ? "Wyjaśnienia AI — wymagają oceny."
            : "Wyjaśnienia szablonowe — bez analizy AI."}{" "}
          Powiązanie z organizacją jest fikcyjne. To ogólne wskazówki, nie plan
          adaptacji zatwierdzony przez ROPS.
        </p>
        <h3>Pasujące aspekty</h3>
        <ul>
          {match.reasons.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h3>Ograniczenia i warunki</h3>
        <ul>
          {match.limitations.map((t) => (
            <li key={t}>{t}</li>
          ))}
          {innovation.requirements.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h3>Warto doprecyzować</h3>
        <ul>
          {result.clarifyingQuestions.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h3>Źródła</h3>
        {innovation.sources
          .filter((source) => match.sourceIds.includes(source.id))
          .map((source) => (
            <p key={source.id}>
              {source.sourceTitle}
              {source.sourceUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                    Otwórz źródło
                  </a>
                </>
              )}
            </p>
          ))}
        <Link className="text-link" href={`/innowacje/${innovation.id}`}>
          Poznaj pełny opis innowacji →
        </Link>
      </details>
      <div className="catalog-invite">
        <span>Ta propozycja nie odpowiada Twojej potrzebie?</span>
        <Link href={`/potrzeby/${need.id}`}>
          Sprawdź pozostałe organizacje →
        </Link>
      </div>
    </section>
  );
}
