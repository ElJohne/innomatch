"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="narrow">
      <h1>Nie udało się wczytać strony.</h1>
      <p role="alert">
        Usługa jest chwilowo niedostępna. Spróbuj ponownie później.
      </p>
      <button onClick={reset}>Spróbuj ponownie</button>
    </section>
  );
}
