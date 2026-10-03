import Link from "next/link";
import { notFound } from "next/navigation";
import { session } from "@/server/auth/session";
import { getIdea } from "@/server/services/ideas";
import { IdeaEditor } from "@/components/idea-editor";
import { IdeaResources } from "@/components/idea-resources";
export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await session();
  if (!s.ownerId) notFound();
  const idea = await getIdea((await params).id, s.ownerId);
  if (!idea) notFound();
  return (
    <section className="narrow">
      <Link href="/moje-sprawy">← Moje sprawy</Link>
      <p className="eyebrow detail-label">Kreator pomysłów</p>
      <h1>Twoja karta pomysłu</h1>
      <IdeaEditor initial={idea} />
      <IdeaResources />
    </section>
  );
}
