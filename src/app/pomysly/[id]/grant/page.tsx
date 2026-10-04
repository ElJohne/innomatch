import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getIdea } from "@/server/services/ideas";
import { GrantEditor } from "@/components/grant-editor";
export default async function GrantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const idea = await getIdea((await params).id, s.ownerId);
  if (!idea) notFound();
  return (
    <section className="narrow stack">
      <Link href={`/pomysly/${idea.id}`}>← Karta pomysłu</Link>
      <header>
        <p className="eyebrow">Od pomysłu do wniosku</p>
        <h1>Przygotuj szkic grantowy</h1>
        <p>{idea.card.title}</p>
      </header>
      <GrantEditor initial={idea} />
    </section>
  );
}
