import Link from "next/link";
import { notFound } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { getNeed, listInnovations } from "@/server/services/repository";
import { listThreads } from "@/server/services/communication";
import { MessageForm } from "@/components/communication-forms";
import { getPlan } from "@/server/services/adaptations";
import { firstStepFor } from "@/lib/contracts/adaptation";
import { contactPurpose } from "@/lib/contact-purpose";
export default async function NewThread({
  searchParams,
}: {
  searchParams: Promise<{
    needId?: string;
    innovationId?: string;
    adaptationId?: string;
    purpose?: string;
  }>;
}) {
  const { needId, innovationId, adaptationId, purpose } = await searchParams;
  const parsedPurpose = contactPurpose.safeParse(purpose);
  if (purpose && !parsedPurpose.success) notFound();
  const initialPurpose = parsedPurpose.success ? parsedPurpose.data : undefined;
  const contexts = [needId, innovationId, adaptationId].filter(Boolean).length;
  const standalone = contexts === 0 && Boolean(initialPurpose);
  if (contexts !== 1 && !standalone) notFound();
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
  const existing =
    a && !standalone
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
      <h1>
        {initialPurpose === "MENTORSHIP"
          ? "Poproś o wsparcie mentora"
          : initialPurpose === "PARTNERSHIP"
            ? "Poproś o pomoc w znalezieniu partnera"
            : "Napisz do koordynatora"}
      </h1>
      {plan && (
        <p className="lead">
          Dotyczy szkicu adaptacji, wersja {plan.revision}.{" "}
          <Link href={`/adaptacje/${plan.id}`}>Przejrzyj zapisany plan</Link>
        </p>
      )}
      {innovation && <p className="lead">{innovation.title}</p>}
      {need && (
        <p>
          <Link href={`/potrzeby/${need.id}`}>
            Zobacz potrzebę dołączoną do rozmowy →
          </Link>
        </p>
      )}
      {!existing && (
        <p className="help">
          Personel otrzyma wiadomość
          {need ? " oraz opis i ograniczenia potrzeby" : ""}
          {plan
            ? ` oraz wersję ${plan.revision} planu z warunkami instytucji. Późniejsze zmiany planu udostępniasz osobno`
            : ""}
          . Odpowiedź znajdziesz w Moich sprawach; bez powiadomień e-mail.
        </p>
      )}
      {existing ? (
        <Link className="button" href={`/wiadomosci/${existing.id}`}>
          Otwórz istniejącą rozmowę
        </Link>
      ) : (
        <MessageForm
          key={`${initialPurpose ?? "CONSULTATION"}:${needId ?? innovationId ?? adaptationId ?? "support"}`}
          initialPurpose={initialPurpose}
          standalone={standalone}
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
