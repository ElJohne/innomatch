# Decyzje techniczne

| Decyzja | Powód |
| --- | --- |
| Jeden serwer Next.js | Wspólny interfejs, API i autoryzacja bez dodatkowych usług aplikacyjnych. |
| PostgreSQL i migracje SQL | Trwałe dane, transakcje, blokady i kontrola kolejnych zmian schematu. |
| Oddzielne pule Drizzle i surowego SQL | Drizzle zmienia parsery klienta postgres-js. Rozdzielenie zapobiega błędom JSON i dat; każda pula ma maksymalnie 5 połączeń. |
| Wektory JSONB i dokładne podobieństwo cosinusowe | Obecny katalog pozwala działać bez pgvector. Model, długość i hash treści określają zgodność wektorów. |
| Wyszukiwanie semantyczne i leksykalne | Kandydaci leksykalni uzupełniają wyniki semantyczne. |
| Wersjonowany cache dopasowań | Klucz obejmuje katalog, modele i wersję algorytmu. Odświeżenie nie powtarza niezmienionego wyszukiwania. |
| OpenAI / Azure za adapterem serwerowym | Jeden kontrakt operacji i walidacji; klucze i prompty pozostają na serwerze. |
| Sesja gościa i kod odzyskiwania | Rozpoczęcie sprawy bez rejestracji i powrót na innym urządzeniu. |
| Role ADMIN i EXPERT | Koordynator obsługuje rozmowy; publikacja, moderacja i analityka należą do administratora. |
| Snapshot udostępnionego planu | Prywatna edycja nie zmienia dokumentu przekazanego koordynatorowi. |
| Revision i klucze żądań | Ochrona przed nadpisaniem równoległych zmian i duplikowaniem operacji. |

Sesja gościa i kod odzyskiwania działają do 90 dni; uprawnienia personelu do 8 godzin. Nowy kod zastępuje poprzedni. Hasła personelu są przechowywane jako salted scrypt, a kody odzyskiwania jako SHA-256.

Operacje AI mają timeout, limit równoległości i rejestr użycia. Limity sesyjne API pozostają aktywne; aplikacja nie stosuje globalnej dobowej kwoty AI.

Pochodzenie materiałów i zależności: [DATA](DATA.md), [DEPENDENCIES](DEPENDENCIES.md).