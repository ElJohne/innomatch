# Uruchomienie i wdrożenie

## Lokalnie

Node.js 22+ i npm. CI korzysta z Node.js 24.

```sh
npm ci
npm run dev
```

Adres domyślny: `http://localhost:3000`. Bez dodatkowej konfiguracji aplikacja korzysta z danych demonstracyjnych w pamięci i adaptera `mock`.

Zbudowana aplikacja:

```sh
npm run build
npm run start
```

`scripts/start.mjs` kopiuje zasoby statyczne do katalogu standalone i uruchamia serwer. `PORT` zmienia port, a `MI_BIND_HOST` adres nasłuchu. `APP_URL` musi odpowiadać adresowi w przeglądarce, łącznie z portem — służy do kontroli Origin.

## Konfiguracja

Skopiuj `.env.example` do `.env.local`. Pliki z sekretami są ignorowane przez Git.

| Zmienna | Znaczenie |
| --- | --- |
| `DATA_PROVIDER` | `fixtures` albo `postgres`. |
| `AI_PROVIDER` | `mock`, `openai` albo `azure`. |
| `APP_URL` | Pełny adres aplikacji. |
| `AUTH_SECRET` | Losowy sekret sesji, minimum 32 znaki. Wymagany dla PostgreSQL. |
| `DATABASE_URL` | Połączenie PostgreSQL. |
| `DATABASE_DIRECT_URL` | Opcjonalne połączenie bez poolera dla migracji. |
| `DATABASE_CONFIRMED_FOR_PROJECT` | `true` wyłącznie dla bazy przeznaczonej na ten projekt; wymagane przez komendy zapisujące. |
| `DEMO_DATA_ENABLED` | Włączenie danych syntetycznych; dla zwykłego środowiska PostgreSQL ustaw `false`. |
| `AI_TIMEOUT_MS` | Limit czasu operacji, domyślnie 20000 ms. |
| `AI_MAX_CONCURRENCY` | Równoległe operacje AI w procesie, domyślnie 2. |
| `TEST_DATABASE_URL` | Osobna baza dla testów integracyjnych. |

### OpenAI

Ustaw `AI_PROVIDER=openai` i `OPENAI_API_KEY`. Modele określają `OPENAI_CHAT_MODEL` i `OPENAI_EMBEDDING_MODEL`; wartości domyślne są w `.env.example`.

Adapter korzysta z Responses API, schematu JSON, walidacji Zod i `store:false`. Zmiana modelu embeddingów wymaga ponownego indeksowania.

### Azure OpenAI

Ustaw `AI_PROVIDER=azure` oraz `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_CHAT_DEPLOYMENT` i `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`.

Adres bazowy kończy się na `/openai/v1/`. Osobny zasób embeddingów może używać `AZURE_OPENAI_EMBEDDING_BASE_URL` i `AZURE_OPENAI_EMBEDDING_API_KEY`.

## Baza i katalog

Dla skonfigurowanej, dedykowanej bazy:

```sh
npm run doctor
npm run db:migrate
npm run data:validate
npm run data:sync
```

Migracje `0001`–`0009` znajdują się w `src/server/db/migrations/`. Synchronizacja importuje katalog ROPS i indeksuje zmienione rekordy. Indeksowanie używa wybranego dostawcy AI.

Pozostałe komendy:

| Polecenie | Działanie |
| --- | --- |
| `npm run data:import -- --file data/import/records.json` | Import tablicy innowacji JSON. |
| `npm run data:index` | Indeksowanie nowych i zmienionych treści. |
| `npm run db:seed:demo -- --demo` | Wstawienie danych syntetycznych; wymaga `DEMO_DATA_ENABLED=true`. |
| `npm run doctor -- --live` | Jawny test tekstu i embeddingów u dostawcy AI. |
| `node scripts/build-operator.mjs` | Pakiet CLI do katalogu standalone. |

`doctor` nie wypisuje wartości sekretów. Zwykły build nie wymaga bazy ani kluczy AI.

## Konto personelu

W prywatnym środowisku operatora ustaw `STAFF_LOGIN`, `STAFF_PASSWORD` (14–200 znaków) i `STAFF_ROLE=ADMIN` lub `EXPERT`, następnie:

```sh
npm run auth:staff
```

Po operacji usuń `STAFF_PASSWORD` ze środowiska operatora. Ponowne wykonanie zmienia hasło i rolę oraz unieważnia wcześniejsze sesje personelu. Logowanie: `/personel/logowanie`.

Tryb fixtures obsługuje osobne `DEMO_STAFF_LOGIN` i `DEMO_STAFF_PASSWORD_HASH` w formacie scrypt-v1. E2E generuje własne tymczasowe dane logowania.

## Wdrożenie

`Dockerfile` tworzy obraz standalone. Istniejący workflow `.github/workflows/deploy.yml` uruchamia się po push do `master` lub ręcznie:

1. Instalacja, build, walidacja katalogu i pakiet CLI.
2. Przygotowanie wydania z zasobami statycznymi i migracjami.
3. Migracje w osobnym Job.
4. Synchronizacja konfiguracji OpenAI i katalogu.
5. Przełączenie Deployment, readiness i kontrola rollout.

Workflow wdrożeniowy wykonuje build i walidację danych; zestawy testów uruchamia się komendami z [QA](QA.md). Klucz OpenAI trafia do etapu wdrożenia przez GitHub Secret `OPENAI_API_KEY`. Nazwy modeli można ustawić przez GitHub Variables.

Konfiguracja k3s używa namespace `innomatch`, PostgreSQL 17.11, PVC bazy 5 GiB oraz adresu `https://pomocnypunkt.pl`. Cloudflare Tunnel przekazuje ruch do Ingress z zachowaniem nagłówka Host. Runner produkcyjny obsługuje wyłącznie zaufaną gałąź wdrożeniową.

## Kontrola i kopie

- `/api/health` sprawdza proces.
- `/api/ready` sprawdza bazę, migracje i konfigurację AI, bez płatnego wywołania.
- Backup wykonuje `pg_dump` o 02:00 UTC; retencja wynosi 7 dni na osobnym lokalnym PVC.
- Przed zmianą schematu wykonaj kopię i poczekaj na zakończenie zadania.
- Nieudany rollout przywraca poprzednie wydanie aplikacji. Migracje nie są automatycznie cofane.

```sh
kubectl -n innomatch rollout status deployment/innomatch
kubectl -n innomatch rollout undo deployment/innomatch
kubectl -n innomatch create job --from=cronjob/postgres-backup backup-manual-UNIKALNY-ID
```

Przechowywanie kopii poza węzłem jest osobną konfiguracją infrastruktury. Odzyskiwanie danych wykonuje się do osobnej bazy przed przełączeniem aplikacji.

Migracja 0009_support_entry dodaje bezpośrednie zgłoszenia wsparcia. Workflow wykonuje przed migracją backup i sprawdza go przez pg_restore --list; błąd kopii zatrzymuje wydanie.

