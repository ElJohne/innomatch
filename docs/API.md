# API

Kontrakty Zod: `src/lib/contracts/`. Handlery: `src/app/api/`. Logika: `src/server/services/`.

Odpowiedzi JSON mają `Cache-Control: private, no-store`. Błędy używają formatu `{code, message, requestId}`. Operacje zapisu wymagają `Origin` zgodnego z `APP_URL` i `Content-Type: application/json`.

## Potrzeby i katalog

| Metoda | Trasa | Działanie |
| --- | --- | --- |
| POST / GET | `/api/needs` | Utworzenie potrzeby / lista własnych potrzeb. |
| GET | `/api/needs/:id` | Własna potrzeba i zapisany wynik. |
| POST | `/api/needs/:id/matches` | Wyszukiwanie lub odczyt cache; opcjonalne `retryOf`. |
| GET | `/api/innovations` | Opublikowane innowacje; filtry i paginacja. |
| GET | `/api/innovations/:id` | Szczegóły opublikowanej innowacji. |
| GET | `/api/knowledge` | Opublikowane materiały; filtry i paginacja. |
| POST | `/api/innovations/:id/test-interest` | Jedno zgłoszenie udziału na autora i innowację. |
| POST / GET | `/api/innovations/:id/feedback` | Zapis własnej opinii / stronicowana lista opublikowanych opinii. |

Tworzenie potrzeby wymaga nagłówka `Idempotency-Key`. Opis ma 3–4000 znaków. Doprecyzowanie zachowuje pierwotny opis; odpowiedź lub `skipClarification` kończy rundę pytań.

Wynik dopasowania zawiera status, propozycje, materiały, źródła, tryb działania i `runId`. Ukryte lub zmienione źródła są sprawdzane także przy odczycie zapisanego wyniku.

## Pomysły i plany

| Metoda | Trasa | Działanie |
| --- | --- | --- |
| POST / GET | `/api/ideas` | Utworzenie karty / własne pomysły. |
| GET / PATCH | `/api/ideas/:id` | Odczyt / edycja karty i Canvas. |
| POST | `/api/ideas/assist` | Propozycja rozwinięcia pomysłu. |
| POST | `/api/ideas/:id/compare` | Porównanie z opublikowanym katalogiem. |
| PATCH | `/api/ideas/:id/grant` | Zapis szkicu wniosku; odczyt razem z kartą pomysłu. |
| POST | `/api/ideas/:id/grant/assist` | Propozycja treści wniosku. |
| POST | `/api/ideas/:id/submit` | Przekazanie do konsultacji i utworzenie rozmowy. |
| POST / GET | `/api/adaptations` | Utworzenie planu / własne plany. |
| GET / PATCH | `/api/adaptations/:id` | Odczyt / edycja planu i warunków. |

Prywatne API wymaga właściciela. Edycje używają `expectedRevision`; konflikt wersji zwraca 409. Propozycje tekstu są stosowane przez autora.

Personel odczytuje udostępnione materiały przez rozmowę. Plan jest przekazywany jako snapshot konkretnej wersji. W pomysłach i wnioskach zapisane zmiany po konsultacji są widoczne dla personelu.

## Rozmowy i dostęp

| Metoda | Trasa | Działanie |
| --- | --- | --- |
| GET / POST | `/api/threads` | Kolejka rozmów / nowa rozmowa. |
| GET | `/api/threads/:id` | Wiadomości i udostępniony kontekst. |
| POST | `/api/threads/:id/messages` | Wiadomość z `requestKey`. |
| POST | `/api/threads/:id/read` | Oznaczenie odczytu do sekwencji `through`. |
| POST | `/api/threads/:id/plan` | Udostępnienie kolejnej wersji planu. |
| POST | `/api/auth/login` | Logowanie personelu. |
| POST | `/api/auth/logout` | Zakończenie sesji personelu. |
| POST | `/api/session/recovery` | Utworzenie nowego kodu odzyskiwania. |
| POST | `/api/session/restore` | Odzyskanie spraw autora. |

Listy rozmów obsługują `page` i filtr `unread=1`. Powtórzony klucz wiadomości nie tworzy duplikatu. Odczyt GET nie zmienia stanu nieprzeczytanych wiadomości.

## Administracja

| Metoda | Trasa | Dostęp i działanie |
| --- | --- | --- |
| GET | `/api/admin/threads` | ADMIN / EXPERT: wspólna kolejka. |
| GET | `/api/admin/analytics` | ADMIN: agregaty za `days=7\|30\|90`. |
| GET | `/api/admin/catalog/:kind` | ADMIN: rekordy i stan indeksowania. |
| PUT | `/api/admin/catalog/:kind/:id` | ADMIN: zapis z `expectedVersion` i potwierdzeniem publikacji. |
| POST | `/api/admin/catalog/:kind/:id/index` | ADMIN: indeksowanie rekordu. |
| PATCH | `/api/admin/feedback/:id` | ADMIN: publikacja lub ukrycie opinii. |
| GET | `/api/health` | Publiczny status procesu. |
| GET | `/api/ready` | Publiczny status gotowości; 503 przy niedostępności. |

`kind` przyjmuje `innovation` albo `knowledge`. Role i aktywność konta są sprawdzane na serwerze. Statystyki zawierają agregaty, bez prywatnych opisów potrzeb. Nieznane trasy administracyjne są zamknięte.

POST /api/threads przyjmuje również supportPurpose: CONSULTATION, MENTORSHIP lub PARTNERSHIP bez innego kontekstu. Powtórzenie tego samego requestKey i celu zwraca istniejącą rozmowę. Wymagana migracja 0009_support_entry.
