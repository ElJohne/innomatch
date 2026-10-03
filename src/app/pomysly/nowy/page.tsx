import { IdeaEditor } from "@/components/idea-editor";
import { IdeaResources } from "@/components/idea-resources";
export default function NewIdea() {
  return (
    <section className="narrow">
      <p className="eyebrow">Kreator pomysłów</p>
      <h1>Masz pomysł na zmianę?</h1>
      <p className="lead">
        Zapisz krótką kartę, rozwiń ją i zdecyduj, kiedy poprosić koordynatora o
        konsultację.
      </p>
      <IdeaEditor />
      <IdeaResources />
    </section>
  );
}
