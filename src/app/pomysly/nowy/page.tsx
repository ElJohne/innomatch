import { IdeaEditor } from "@/components/idea-editor";
import Link from "next/link";
export default function NewIdea() {
  return (
    <section className="idea-page">
      <Link className="back-link" href="/">
        ← Strona główna
      </Link>
      <div className="idea-hero">
        <div>
          <p className="eyebrow">Twój pomysł · Wspólna zmiana</p>
          <h1>
            Dobry pomysł zaczyna się
            <br />
            od Ciebie.
          </h1>
          <p>
            Masz pomysł na rozwiązanie problemu społecznego? Tutaj przygotujesz
            jego kartę — od opisu problemu po pierwszy test z uczestnikami.
          </p>
          <p className="idea-examples">
            Na przykład: zakupy dla samotnych seniorów albo bezpłatna pomoc
            dzieciom w nauce. Pomysł nie musi być gotowy — rozwiniesz go krok po kroku.
          </p>
        </div>
        <svg
          className="idea-illustration"
          viewBox="0 0 260 190"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="140" cy="95" r="82" fill="#dceef4" />
          <circle cx="177" cy="57" r="38" fill="#e4efe1" />
          <rect
            x="52"
            y="47"
            width="95"
            height="120"
            rx="13"
            fill="white"
            transform="rotate(-10 52 47)"
          />
          <path
            d="m70 79 44-8m-40 27 56-10m-53 29 42-7"
            stroke="#b3cddb"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M139 115c0-12-17-21-17-40a35 35 0 0 1 70 0c0 19-17 28-17 40Z"
            fill="#fff7d6"
            stroke="#0967a9"
            strokeWidth="4"
          />
          <path
            d="M142 124h30m-26 9h22m-11-19V85m-10-9 10 9 10-9"
            stroke="#0967a9"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="m156 17 0-9m48 34 8-6m-99 6-8-6m105 47h11"
            stroke="#58967c"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="203" cy="144" r="22" fill="#4b9276" />
          <path
            d="m193 144 7 7 13-14"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <aside className="idea-help-route" aria-label="Pomysł czy potrzeba pomocy?">
        <div>
          <h2>Szukasz pomocy dla siebie?</h2>
          <p>Ta strona służy do proponowania inicjatyw społecznych. Jeśli potrzebujesz
            wsparcia w swojej sytuacji życiowej, opisz ją na stronie głównej.</p>
        </div>
        <Link className="button secondary" href="/">Jakiej pomocy potrzebujesz? →</Link>
      </aside>
      <div className="idea-workspace">
        <div className="idea-form-column">
          <IdeaEditor hideDraftNotice />
        </div>
        <aside className="idea-guide" aria-label="Wskazówki do pomysłu">
          <div className="card idea-guide-card">
            <p className="eyebrow">Spokojnie, krok po kroku</p>
            <h2>Od myśli do działania</h2>
            <ol className="idea-roadmap">
              <li>
                <span>1</span>
                <div>
                  <h3>Zapisz swój pomysł</h3>
                  <p>
                    Opisz problem i to, co chcesz zmienić. Na początek wystarczą
                    proste słowa.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <h3>Rozwiń go w swoim tempie</h3>
                  <p>
                    Po zapisaniu możesz poprawiać kartę i poprosić AI o
                    propozycję rozwinięcia.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <h3>Zdecyduj o konsultacji</h3>
                  <p>
                    Szkic pozostaje prywatny. Personel zobaczy go dopiero po
                    wybraniu „Przekaż pomysł do konsultacji”.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}
