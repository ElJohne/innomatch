# Pomocny Punkt — zakres rozwiązania

Platforma dla Małopolskiego Hubu Innowacji Społecznych. Łączy opis potrzeby z katalogiem rozwiązań, planem wdrożenia i kontaktem z koordynatorem.

## Użytkownicy

- **Mieszkaniec:** opisuje potrzebę, wybiera pomoc i rozpoczyna prywatną rozmowę.
- **Organizacja lub instytucja:** znajduje innowację i opracowuje plan jej zastosowania.
- **Autor pomysłu:** tworzy kartę, rozwija Canvas, przygotowuje szkic wniosku i przekazuje materiały do konsultacji.
- **Koordynator:** odpowiada na zgłoszenia i prośby o mentoring lub partnerstwo.
- **Administrator:** zarządza katalogiem, publikacją, opiniami i statystykami.

Główny przebieg: **opis potrzeby → propozycje ze źródłami → wybór → następny krok → rozmowa lub plan dla instytucji**.

## Moduły

| ID | Moduł | Zakres |
| --- | --- | --- |
| M1 | Matchmaking społeczny | Analiza potrzeby, wyszukiwanie, uzasadnienia, materiały, jedno doprecyzowanie i ponowienie po błędzie. |
| M2 | Zasobnik wiedzy | Katalog innowacji, materiały edukacyjne i raporty, wskaźniki powiatów. |
| M3 | Kreator pomysłów | Karta, Canvas, porównanie, formularz IWS 2.0, budżet i konsultacja. |
| M4 | Tester innowacji | Zgłoszenie zainteresowania testowaniem, ocena i moderowane opinie. |
| M5 | Komunikacja | Prywatne rozmowy, odpowiedzi i oznaczenia nieprzeczytanych wiadomości. |
| M6 | Administracja | Redakcja, publikacja, indeksowanie, kolejki obsługi i agregaty potrzeb. |
| M7 | Adaptacja innowacji | Plan usługi, warunki instytucji, kroki, zasoby, pilotaż, wersje i udostępnianie. |

Przypisanie modułów do kodu: [REQUIREMENTS](docs/REQUIREMENTS.md).

## Zasady produktu

1. Interfejs i odpowiedzi są po polsku. Krótki wynik prowadzi do jednej głównej akcji; pełne dokumenty mają osobne widoki.
2. Potrzeby, plany, pomysły i rozmowy należą do sesji autora. Personel uzyskuje dostęp do treści przekazanych do konsultacji.
3. Publiczny katalog zawiera wyłącznie opublikowane rekordy. Zmiana treści lub publikacji jest uwzględniana również w zapisanych wynikach.
4. Wyszukiwanie rozróżnia dopasowanie, częściowe dopasowanie, brak wyników i niedostępność usługi.
5. Źródła i identyfikatory odpowiedzi są sprawdzane na serwerze. Tekst użytkowników i dokumentów jest traktowany jako dane.
6. Koordynator otrzymuje wskazaną wersję planu; kolejne wersje wymagają osobnego udostępnienia.
7. Po przekazaniu pomysłu kolejne zapisane zmiany karty i wniosku są widoczne w konsultacji i tworzą powiadomienie.
8. Opinie trafiają do moderacji; edycja opublikowanej opinii przywraca status oczekujący.
9. Tryby demonstracyjne mają jawne oznaczenia. Błąd PostgreSQL nie przełącza aplikacji na dane w pamięci.
10. Sekrety, SDK i dostęp do bazy pozostają na serwerze. Logi nie zawierają surowych prywatnych opisów.

## Formularze i dane

Formularz grantowy opiera się na archiwalnym naborze IWS 2.0 z 2024 roku. Obejmuje treść, dane wnioskodawcy, harmonogram, budżet i listę deklaracji. Oficjalne podpisanie i złożenie wniosku odbywa się poza aplikacją.

Dane regionalne są prezentowane w tabelach dla 22 powiatów. Statystyki administratora opisują zgłoszenia na platformie. Katalog i materiały zachowują odnośniki do źródeł.

## Realizacja

Next.js App Router i TypeScript, PostgreSQL z Drizzle, OpenAI lub Azure OpenAI. Jeden pakiet npm, przypięte zależności i migracje SQL. Kontrola dostępu, walidacja Zod i obsługa powtórzonych żądań należą do warstwy serwerowej.

Weryfikacja: lint, TypeScript, testy jednostkowe, build, Playwright i testy PostgreSQL. Wyniki: [QA](docs/QA.md). Konfiguracja: [DEPLOYMENT](docs/DEPLOYMENT.md).

## Dokumenty źródłowe

- [CRITERIA — Województwo Małopolskie HUBMI](CRITERIA%20Wojewodztwo%20Malopolskie%20HUBMI.pdf)
- [RULES — Województwo Małopolskie HUBMI](RULES%20Wojewodztwo%20Malopolskie%20HUBMI.pdf)

Dokumenty źródłowe pozostają w oryginalnej postaci.