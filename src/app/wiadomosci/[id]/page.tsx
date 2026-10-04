import Link from "next/link";
import { notFound } from "next/navigation";
import { actor } from "@/server/auth/staff";
import { session } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { getThread } from "@/server/services/communication";
import { AdaptationView } from "@/components/adaptation-view";
import { IdeaView } from "@/components/idea-view";
import { GrantView } from "@/components/grant-view";
import { contactLabels, purposeFromMessage } from "@/lib/contact-purpose";
import styles from "@/components/communication.module.css";
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
  let thread: Awaited<ReturnType<typeof getThread>>;
  try {
    thread = await getThread((await params).id, a);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const sent = (await searchParams).sent === "1";
  const latest = thread.messages.at(-1);
  const purpose = [...thread.messages]
    .reverse()
    .map((m) => purposeFromMessage(m.body))
    .find(Boolean);
  function message(m: (typeof thread.messages)[number]) {
    const messagePurpose = purposeFromMessage(m.body);
    const body = messagePurpose
      ? m.body.replace(
          `Cel zgłoszenia: ${contactLabels[messagePurpose]}\n\n`,
          "",
        )
      : m.body;
    return (
      <article
        className={`${styles.message} ${m.authorRole === "STAFF" ? styles.staffMessage : ""}`}
        key={m.id}
      >
        <div className={styles.messageMeta}>
          <h3>
            {m.authorRole === "STAFF"
              ? "Koordynator"
              : a.staff
                ? "Osoba zgłaszająca"
                : "Ty"}
          </h3>
          <time dateTime={m.createdAt}>
            {new Date(m.createdAt).toLocaleString("pl-PL", {
              timeZone: "Europe/Warsaw",
            })}
          </time>
        </div>
        {messagePurpose && (
          <p className="help">{contactLabels[messagePurpose]}</p>
        )}
        <p className="message-body">{body}</p>
      </article>
    );
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
          : sent
            ? "Prośba wysłana"
            : "Rozmowa z koordynatorem"}
      </h1>
      {!a.staff && sent && (
        <p>Odpowiedź pojawi się w tej rozmowie i w Moich sprawach.</p>
      )}
      {purpose && <p className="help">{contactLabels[purpose]}</p>}
      <div className={styles.heading}>
        <h2>Ostatnia wiadomość</h2>
        <RefreshMessages />
      </div>
      {latest && message(latest)}
      <MessageForm
        threadId={thread.id}
        contactOptions={!a.staff && !thread.need}
      />
      {thread.messages.length > 1 && (
        <section className="stack" aria-label="Historia rozmowy">
          <h2>Wcześniejsze wiadomości</h2>
          {thread.messages.slice(0, -1).reverse().map(message)}
        </section>
      )}
      <section
        className={styles.attachments}
        aria-label="Udostępnione materiały"
      >
        <h2>Dotyczy rozmowy</h2>
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
        <div className="stack">
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
                Pomysł udostępniony koordynatorowi — wersja{" "}
                {thread.idea.revision}
              </summary>
              <p className="notice">
                {thread.idea.origin === "SYNTHETIC"
                  ? "Karta demonstracyjna. "
                  : "Pomysł autora. "}
                Udostępniono tylko do konsultacji.
              </p>
              <IdeaView card={thread.idea.card} />
              {thread.idea.grantDraft && (
                <GrantView draft={thread.idea.grantDraft} />
              )}
            </details>
          )}
          {thread.adaptationUnavailable && (
            <p className="notice">
              Udostępniony plan jest niedostępny, ponieważ źródło zmieniło się
              lub zostało ukryte.
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
                Termin:{" "}
                {thread.adaptation.constraints.timeline || "Nieustalony"};
                budżet: {thread.adaptation.constraints.budget || "Nieustalony"}
              </p>
              <AdaptationView plan={thread.adaptation} />
              <Link href={`/innowacje/${thread.adaptation.innovationId}`}>
                Innowacja i źródła
              </Link>
            </details>
          )}
        </div>
      </section>
      <ReadReceipt
        id={thread.id}
        through={thread.messages.at(-1)?.sequence ?? 0}
      />
    </section>
  );
}
