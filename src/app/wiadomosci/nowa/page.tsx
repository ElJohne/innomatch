import Link from "next/link";
import { notFound } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { listThreads } from "@/server/services/communication";
import { MessageForm } from "@/components/communication-forms";
import { getPlan } from "@/server/services/adaptations";
import { firstStepFor } from "@/lib/contracts/adaptation";
export default async function NewThread({
  searchParams,
}: {
  searchParams: Promise<{
    needId?: string;
    innovationId?: string;
    adaptationId?: string;
  }>;
}) {
  const { needId, innovationId, adaptationId } = await searchParams;
  if ([needId, innovationId, adaptationId].filter(Boolean).length !== 1)
    notFound();
  const s = await session();
  const a = s.ownerId ? await actor() : null;
  if (a?.staff)
    return (
      <section className="narrow">
        <h1>Strefa personelu</h1>
        <p>
          Odpowiadaj na zgłoszenia ze skrzynki koordynatora. Aby zadać własne
          pytanie jako użytkownik, wyloguj personel.
        </p>
        <Link href="/admin">Otwórz skrzynkę</Link>
      </section>
    );
  const plan =
    adaptationId && s.ownerId ? await getPlan(adaptationId, s.ownerId) : null;
  if (adaptationId && !plan) notFound();
  const contextNeedId = plan?.needId ?? needId;
  const need =
    contextNeedId && s.ownerId ? await getNeed(contextNeedId, s.ownerId) : null;
  const innovation = innovationId
    ? (await listInnovations()).find((i) => i.id === innovationId)
    : null;
  if ((needId && !need) || (innovationId && !innovation)) notFound();
  const existing = a
    ? (await listThreads(a)).find((t) =>
        adaptationId
          ? t.adaptationId === adaptationId
          : needId
            ? t.needId === needId && !t.adaptationId
            : t.innovationId === innovationId,
      )
    : null;
  return (
    <section className="narrow">
      <p className="eyebrow">Wsparcie i współpraca</p>
      <h1>Zapytaj koordynatora</h1>
      {plan && (
        <p className="lead">
          Dotyczy szkicu adaptacji, wersja {plan.revision}.{" "}
          <Link href={`/adaptacje/${plan.id}`}>Przejrzyj zapisany plan</Link>
        </p>
      )}
      {innovation && <p className="lead">{innovation.title}</p>}
      {need && (
        <div className="card">
          <h2>Twoja potrzeba</h2>
          <p>{need.description}</p>
          {need.clarifications?.map((x, i) => (
            <p key={i}>
              <strong>{x.question}</strong> {x.answer}
            </p>
          ))}
        </div>
      )}
      <p className="notice">
        Wysyłając pytanie, udostępniasz personelowi treść rozmowy
        {need ? " oraz opis i ograniczenia tej potrzeby" : ""}
        {plan
          ? `, wersję ${plan.revision} planu adaptacji i warunki instytucji. Późniejsze zmiany pozostają prywatne, dopóki ich nie udostępnisz`
          : ""}
        . To zgłoszenie do kontaktu, bez gwarancji partnerstwa lub finansowania.
      </p>
      <p className="help">
        Odpowiedź znajdziesz w „Moje sprawy” w tej samej przeglądarce, w czasie
        ważności sesji lub po przywróceniu prywatnym kodem dostępu. Zapisz kod w
        „Moje sprawy”. Nie wysyłamy powiadomień e-mail.
      </p>
      {existing ? (
        <Link className="button" href={`/wiadomosci/${existing.id}`}>
          Otwórz istniejącą rozmowę
        </Link>
      ) : (
        <MessageForm
          needId={needId}
          innovationId={innovationId}
          adaptationId={adaptationId}
          adaptationRevision={plan?.revision}
          initialBody={
            plan
              ? `Proszę o ocenę pierwszego kroku mojego planu (wersja ${plan.revision}):\n${firstStepFor(plan.draft).action}\n\nCo trzeba sprawdzić przed rozpoczęciem?\n${plan.draft.openQuestions.slice(0, 2).join("\n")}`
              : undefined
          }
        />
      )}
    </section>
  );
}
