# Pomocny Punkt

**Od lokalnej potrzeby do rozwiązania, pomysłu i współpracy.**

Pomocny Punkt łączy mieszkańców Małopolski, organizacje społeczne i instytucje z biblioteką innowacji społecznych. Użytkownik opisuje potrzebę własnymi słowami, otrzymuje propozycje z uzasadnieniem i źródłami, a następnie może skontaktować się z koordynatorem lub przygotować plan wdrożenia.

[Aplikacja](https://pomocnypunkt.pl) · [Konfiguracja](docs/DEPLOYMENT.md) · [Wyniki testów](docs/QA.md)

## Co oferuje

| Obszar | Możliwości |
| --- | --- |
| Znajdź pomoc | Wyszukiwanie według opisu potrzeby, dopasowane rozwiązania, materiały i następny krok. |
| Biblioteka inspiracji | 114 innowacji, 69 materiałów oraz dane społeczne dla 22 powiatów. Filtry, opisy i odnośniki do źródeł. |
| Mam pomysł | Karta pomysłu, Canvas, porównanie z katalogiem oraz szkic wniosku z harmonogramem i budżetem według formularza IWS 2.0. |
| Plan dla instytucji | Dostosowanie innowacji do zasobów organizacji; edycja, wersje i wydruk planu. |
| Współpraca | Prywatne rozmowy z koordynatorem, prośby o konsultację, mentoring lub partnerstwo. |
| Testowanie | Zgłoszenia do testów, oceny i opinie z moderacją. |
| Panel zespołu | Obsługa rozmów, redakcja i publikacja katalogu, moderacja opinii oraz statystyki potrzeb. |

Własne potrzeby, pomysły, plany i rozmowy są dostępne w **Moich sprawach**. Kod odzyskiwania pozwala wrócić do nich na innym urządzeniu. Interfejs obsługuje klawiaturę, zmianę kontrastu i wielkości tekstu oraz funkcje głosowe przeglądarki.

## Uruchomienie lokalne

Wymagania: **Node.js 22+ i npm**. Polecenia wykonuj w katalogu głównym repozytorium.

```sh
npm ci
npm run dev
```

Otwórz [localhost:3000](http://localhost:3000). Domyślny tryb demonstracyjny działa bez zewnętrznych usług: 12 przykładowych innowacji, dane w pamięci i deterministyczny adapter `mock`. Restart usuwa zapisane w tym trybie sprawy.

Aby korzystać z PostgreSQL i OpenAI lub Azure OpenAI, skopiuj [.env.example](.env.example) do `.env.local` i uzupełnij konfigurację według [instrukcji](docs/DEPLOYMENT.md).

## Architektura

Jeden serwer Next.js obsługuje interfejs, API i logikę aplikacji. PostgreSQL przechowuje dane i wektory wyszukiwania. Adapter OpenAI / Azure OpenAI odpowiada za analizę potrzeb, dopasowanie i pomoc w opracowaniu pomysłów.

- **Interfejs:** Next.js App Router, React, TypeScript, Tailwind CSS i CSS Modules.
- **Dane:** PostgreSQL, Drizzle ORM, migracje SQL, walidacja Zod.
- **Wyszukiwanie:** dopasowanie semantyczne i leksykalne, ocena kandydatów, powiązanie odpowiedzi ze źródłami.
- **Dostęp:** sesje gości, role ADMIN / EXPERT, kontrola właściciela i publikacji po stronie serwera.

```text
src/app/             strony i API
src/components/      interfejs
src/lib/contracts/   schematy danych i kontrakty
src/server/          autoryzacja, baza, AI, wyszukiwanie i usługi
data/                katalog ROPS, wskaźniki regionalne i dane demonstracyjne
scripts/             import, indeksowanie i narzędzia operatora
tests/               testy jednostkowe, PostgreSQL, E2E i scenariusze wyszukiwania
deploy/              wdrożenie i kopie zapasowe
docs/                dokumentacja techniczna
```

## Testy

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:integration
```

E2E uruchamia osobny serwer z danymi demonstracyjnymi na porcie 3300. Testy PostgreSQL korzystają z `TEST_DATABASE_URL` i osobnych schematów; bez tej zmiennej są pomijane. [QA](docs/QA.md) zawiera wyniki ostatniego uruchomienia.

## Dokumentacja

- [Zakres rozwiązania](SPEC.md) i [mapa modułów](docs/REQUIREMENTS.md)
- [Konfiguracja i wdrożenie](docs/DEPLOYMENT.md), [API](docs/API.md), [decyzje techniczne](docs/DECISIONS.md)
- [Źródła danych](docs/DATA.md), [formularz grantowy](docs/GRANTS.md), [wyszukiwanie](docs/SEARCH-QUALITY.md)
- [Stan repozytorium](docs/STATUS.md), [koszty utrzymania](docs/COSTS.md), [zależności](docs/DEPENDENCIES.md)

## Licencja

Kod jest objęty [LICENSE](LICENSE). Materiały ROPS i dokumenty konkursowe zachowują warunki swoich źródeł.