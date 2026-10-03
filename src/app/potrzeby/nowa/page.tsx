import { NeedForm } from "@/components/need-form";
export default function NewNeed() {
  return (
    <section className="narrow">
      <p className="eyebrow">01 / Opis potrzeby</p>
      <h1>Co jest ważne dla Waszej społeczności?</h1>
      <p className="lead">
        Nie musisz znać nazwy rozwiązania. Zacznij od tego, z czym mierzycie się
        na co dzień.
      </p>
      <NeedForm />
    </section>
  );
}
