import Link from "next/link";
export default function NotFound() {
  return (
    <section className="narrow">
      <h1>Nie znaleziono tej strony.</h1>
      <p>Sprawa może należeć do innej sesji albo nie być już dostępna.</p>
      <Link href="/moje-sprawy">Przejdź do moich spraw</Link>
    </section>
  );
}
