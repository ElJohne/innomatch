import { LoginForm } from "@/components/communication-forms";
export default function LoginPage() {
  return (
    <section className="narrow">
      <p className="eyebrow">Strefa personelu</p>
      <h1>Logowanie koordynatora</h1>
      <p className="lead">
        Dostęp dla upoważnionego personelu obsługującego zgłoszenia. Konto
        przygotowuje administrator systemu.
      </p>
      <LoginForm />
    </section>
  );
}
