# Wyszukiwanie

## Przebieg

1. Walidacja potrzeby i kontrola sesji autora.
2. Rozpoznanie głównego celu; najwyżej jedno doprecyzowanie, z możliwością pominięcia.
3. Dobór opublikowanych kandydatów przez embeddingi i wyszukiwanie leksykalne.
4. Ocena kandydatów względem celu, odbiorców i ograniczeń.
5. Walidacja identyfikatorów, cytowanych fragmentów oraz aktualnej publikacji.
6. Zapis wyniku z wersją katalogu, modeli i algorytmu.

Odpowiedź zawiera do trzech innowacji, materiały, uzasadnienie i następny krok. Brak dopasowania i niedostępność usługi mają osobne stany. Ponowienie po błędzie odnosi się do konkretnego `runId`.

## Scenariusze testowe

`tests/search-quality/` przechowuje przypadki wejściowe i oczekiwane identyfikatory: bezpośrednie potrzeby, krótkie opisy, częściowe dopasowania, potrzeby spoza katalogu, doprecyzowania i sytuacje pilne. Dane są syntetyczne.

Podstawowy zestaw `quality-cases.json` ma 30 przypadków; `quality-holdout.json` zawiera 10 osobnych przypadków. Hit@3 oznacza obecność oczekiwanego identyfikatora w pierwszych trzech wynikach.

Lokalne sprawdzenie kandydatów, bez usług AI i bazy:

```sh
npx tsx --conditions=react-server scripts/evaluate-quality.ts
npx tsx --conditions=react-server scripts/evaluate-quality.ts --holdout
```

Raporty uruchomień są ignorowane przez Git. Lokalizację wyniku można wskazać przez `SEARCH_QA_OUTPUT`. Opcja `--cases=id,id` ogranicza zestaw.

Test pełnego procesu używa `--live`, `SEARCH_QA=synthetic`, PostgreSQL oraz wybranego dostawcy AI. Wykonuje płatne operacje i tworzy tymczasowe potrzeby, które usuwa po zakończeniu. Powinien korzystać z wydzielonego środowiska testowego.

Pozostałe narzędzia: `evaluate-clarifications.ts`, `evaluate-search-revision.ts`, `evaluate-search.mjs` i `diagnose-search.ts`.