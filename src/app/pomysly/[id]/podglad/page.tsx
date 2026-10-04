import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getIdea } from "@/server/services/ideas";
import { IdeaView } from "@/components/idea-view";
import { PrintButton } from "@/components/print-button";
import { GrantView } from "@/components/grant-view";

export default async function IdeaPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await session();
  if (!owner.ownerId) notFound();
  const idea = await getIdea((await params).id, owner.ownerId);
  if (!idea) notFound();
  return (
    <article className="narrow idea-preview stack">
      <div className="actions print-controls">
        <Link href={`/pomysly/${idea.id}`}>← Wróć do edycji</Link>
        <PrintButton />
      </div>
      <header>
        <p className="eyebrow">Pomocny Punkt · Karta pomysłu</p>
        <h1>{idea.card.title}</h1>
        <p>
          Wersja {idea.revision} ·{" "}
          {idea.status === "DRAFT"
            ? "Szkic prywatny"
            : "Przekazano do konsultacji"}
        </p>
        {idea.origin === "SYNTHETIC" && (
          <p className="notice">Karta demonstracyjna — dane syntetyczne.</p>
        )}
      </header>
      <IdeaView card={idea.card} />
      {idea.grantDraft && <GrantView draft={idea.grantDraft} />}
    </article>
  );
}
