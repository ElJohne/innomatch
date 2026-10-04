import Link from "next/link";
import { notFound } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { getThread } from "@/server/services/communication";
import { AdaptationView } from "@/components/adaptation-view";
import { IdeaView } from "@/components/idea-view";
import { GrantView } from "@/components/grant-view";
import {
  MessageForm,
  ReadReceipt,
  RefreshMessages,
  SharePlanButton,
} from "@/components/communication-forms";
export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  if (!(await session()).ownerId) notFound();
  const a = await actor();
  let thread;
  try {
    thread = await getThread((await params).id, a);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  return (
    <section className="narrow">
      <Link href={a.staff ? "/admin" : "/moje-sprawy"}>
        ← {a.staff ? "Skrzynka zgłoszeń" : "Moje sprawy"}
      </Link>
      <p className="eyebrow detail-label">Rozmowa prywatna</p>
      <h1>
        {a.staff
          ? "Rozmowa ze zgłaszającym"
          : (await searchParams).sent === "1"
            ? "Prośba wysłana"
            : "Rozmowa z koordynatorem"}
      </h1>
      {!a.staff && (await searchParams).sent === "1" && (
        <p>Odpowiedź znajdziesz tutaj lub w Moich sprawach.</p>
      )}
      {thread.innovation && (
        <p>
          Innowacja:{" "}
          <Link href={`/innowacje/${thread.innovation.id}`}>
            {thread.innovation.title}
          </Link>
        </p>
      )}
      {thread.need && (
        <details className="card need-summary">
          <summary>Potrzeba udostępniona koordynatorowi</summary>
          <p>{thread.need.description}</p>
          {thread.need.clarifications.map((x, i) => (
            <p key={i}>
              <strong>{x.question}</strong> {x.answer}
            </p>
          ))}
          {thread.need.constraints && (
            <p>Ograniczenia: {thread.need.constraints}</p>
          )}
        </details>
      )}
      <div className="actions">
        {!a.staff &&
          thread.privatePlanRevision &&
          thread.privatePlanRevision !== thread.adaptation?.revision && (
            <aside className="note">
              <h2>Masz nowszą prywatną wersję planu</h2>
              <p>Koordynator zobaczy ją dopiero po udostępnieniu.</p>
              {thread.adaptation && (
                <p>
                  <Link href={`/adaptacje/${thread.adaptation.id}`}>
                    Przejrzyj aktualny plan
                  </Link>
                </p>
              )}
              <SharePlanButton
                threadId={thread.id}
                revision={thread.privatePlanRevision}
              />
            </aside>
          )}
        {thread.idea && (
          <details className="card">
            <summary>
              Pomysł udostępniony koordynatorowi — wersja {thread.idea.revision}
            </summary>
            <p className="notice">
              {thread.idea.origin === "SYNTHETIC"
                ? "Karta demonstracyjna. "
                : "Pomysł autora. "}
              Konsultacja, bez publicznej publikacji i bez potwierdzenia
              skuteczności.
            </p>
            <IdeaView card={thread.idea.card} />
            {thread.idea.grantDraft && (
              <GrantView draft={thread.idea.grantDraft} />
            )}
          </details>
        )}
        {thread.adaptationUnavailable && (
          <p className="notice">
            Udostępniony plan jest niedostępny, ponieważ źródło zmieniło się lub
            zostało ukryte.
          </p>
        )}
        {thread.adaptation && (
          <details className="card">
            <summary>
              Plan udostępniony koordynatorowi — wersja{" "}
              {thread.adaptation.revision}
            </summary>
            <p>Instytucja: {thread.adaptation.constraints.institution}</p>
            <p>Zasoby: {thread.adaptation.constraints.resources}</p>
            <p>Zasięg: {thread.adaptation.constraints.scope}</p>
            <p>
              Termin: {thread.adaptation.constraints.timeline || "Nieustalony"};
              budżet: {thread.adaptation.constraints.budget || "Nieustalony"}
            </p>
            <AdaptationView plan={thread.adaptation} />
            <Link href={`/innowacje/${thread.adaptation.innovationId}`}>
              Innowacja i źródła
            </Link>
          </details>
        )}
        <RefreshMessages />
      </div>
      <div className="stack" aria-label="Historia rozmowy">
        {thread.messages.map((m) => (
          <article className="card" key={m.id}>
            <h2>
              {m.authorRole === "STAFF" ? "Koordynator" : "Osoba zgłaszająca"}
            </h2>
            <p className="help">
              <time dateTime={m.createdAt}>
                {new Date(m.createdAt).toLocaleString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                })}
              </time>
            </p>
            <p className="message-body">{m.body}</p>
          </article>
        ))}
      </div>
      <ReadReceipt
        id={thread.id}
        through={thread.messages.at(-1)?.sequence ?? 0}
      />
      {a.staff ? (
        <MessageForm threadId={thread.id} />
      ) : (
        <details className="card">
          <summary>Dodaj wiadomość</summary>
          <MessageForm threadId={thread.id} contactOptions={!thread.need} />
        </details>
      )}
    </section>
  );
}
