# Dane i źródła

| Plik | Zawartość |
| --- | --- |
| `data/rops/corpus.json` | 114 innowacji i 69 materiałów ze źródeł ROPS. |
| `data/rops/collection-report.json` | Metadane pobrania, źródła i pominięte rekordy. |
| `data/rops/regional-indicators.json` | 4 wskaźniki dla 22 powiatów, z rokiem i źródłem. |
| `data/demo/innovations.json` | 12 syntetycznych innowacji do demonstracji i testów. |

## Katalog i materiały

Snapshot katalogu pochodzi z 3 października 2026. Z 115 unikalnych kart pominięto „Lekki wózek aktywny” z powodu pustego opisu rozwiązania. Duplikaty między kategoriami połączono według identyfikatora źródła.

Materiały obejmują 44 opisy, 8 fragmentów Mapy Wyzwań Społecznych i 17 odnośników. Indeksowaniu podlega 114 innowacji i 52 materiały zawierające opis.

Źródła:

- [Biblioteka innowacji społecznych ROPS](https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie)
- [Raporty z badań](https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan)
- [Mapa Wyzwań Społecznych](https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf) — fragmenty stron 5, 9, 14, 19, 24, 29, 35 i 41
- [Publikacje ze świata innowacji](https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji)
- [Social Innovation Canvas — ROPS / InnoAGH](https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf)

Rekordy zachowują URL, datę pobrania i fragment źródłowy. Katalog nie importuje kontaktów ani osobistych historii. Pochodzenie, dojrzałość rozwiązania i publikacja są osobnymi polami.

## Wskaźniki regionalne

Snapshot z 4 października 2026 pochodzi z [Obserwatora ROPS](https://obserwator.rops.krakow.pl/), zestawy `285`, `17`, `215` i `25`. Dotyczy seniorów, pomocy społecznej i bezrobocia (2024) oraz niepełnosprawności (2021). Identyfikatory zestawów wskazano na podstawie [listy Wici](https://github.com/JohnnyArachnid/hackyeah-2026-hubmi/blob/main/data/wskazniki.yaml); wartości pobiera własny kolektor ze źródła ROPS.

```sh
node scripts/collect-regional-indicators.mjs
```

Kolektor sprawdza komplet 22 unikalnych powiatów, zgodność terytoriów, rok i zakres wartości. Aplikacja odczytuje zapisany plik bez zapytań do Obserwatora podczas obsługi użytkownika.

## Import i aktualizacja

```sh
npm run data:validate
npm run data:import -- --file data/import/records.json
npm run data:index
```

Import przyjmuje tablicę JSON zgodną z `innovationSchema`. Synchronizacja pełnego snapshotu: `npm run data:sync`. Komendy zapisujące wymagają dedykowanej bazy i konfiguracji z [DEPLOYMENT](DEPLOYMENT.md).

`npm run data:collect` pobiera katalog. `scripts/prepare-rops-corpus.mjs` łączy wynik z HTML i tekstami PDF przygotowanymi w `tmp/`; wymagane nazwy wejść znajdują się w skrypcie. Surowe pobrania pozostają poza Git.

Synchronizacja zachowuje ręczne zmiany administratora i statusy publikacji. Zmieniona treść unieważnia poprzedni embedding. Rekordy spoza snapshotu nie są usuwane.