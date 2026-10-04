import { LoginForm } from "@/components/communication-forms";
import styles from "@/app/admin/admin.module.css";
export default function LoginPage() {
  return (
    <section className={styles.login}>
      <p className="eyebrow">Strefa personelu</p>
      <h1>Logowanie koordynatora</h1>
      <LoginForm />
      <p className="help">
        Nie masz dostępu? Skontaktuj się z administratorem.
      </p>
    </section>
  );
}
