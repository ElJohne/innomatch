# Mapa modułów

| Moduł | Ekrany | Implementacja | Testy |
| --- | --- | --- | --- |
| M1 — Matchmaking | `/`, `/potrzeby/[id]`, następny krok | services/matching, server/search | core, evidence, clarification-policy, catalog-matching-refresh; E2E flow i search-guidance |
| M2 — Wiedza | `/innowacje`, `/innowacje/materialy`, `/innowacje/region` | catalog-search, knowledge, regional-diagnosis | catalog-matching-refresh; E2E navigation |
| M3 — Pomysły | Karta, edytor, Canvas, porównanie, grant, podgląd | services/ideas, idea-comparison; kontrakty idea/canvas/grant | grant-functional, workflows; E2E workflows |
| M4 — Testowanie | Szczegóły innowacji, `/admin/opinie` | services/pilots, kontrakt pilot | communication-pagination, workflows; E2E workflows |
| M5 — Komunikacja | `/wiadomosci`, rozmowa, `/moje-sprawy` | services/communication, auth/recovery | communication, communication-pagination; E2E communication |
| M6 — Administracja | `/admin`, katalog, opinie, statystyki | auth/staff, services/catalog, importer, analytics | staff, communication, workflows; E2E communication |
| M7 — Adaptacja | Nowy plan, edycja i podgląd | services/adaptations, kontrakt adaptation | adaptation-recovery, workflows; E2E quality-journey |

Usługi znajdują się w `src/server/`, komponenty w `src/components/`, a kontrakty w `src/lib/contracts/`. Nazwy testów odpowiadają plikom w `tests/unit/`, `tests/integration/` i `tests/e2e/`. Wyniki: [QA](QA.md).

## Granice funkcji

- M2 prezentuje wskaźniki w tabelach powiatów oraz opisy i odnośniki do raportów.
- M3 korzysta z formularza IWS 2.0 z 2024 roku. Rejestr kolejnych naborów i oficjalne składanie wniosków pozostają poza obecną implementacją.
- M4 obsługuje zainteresowanie testowaniem i opinie; organizację pilotażu uzgadnia koordynator.
- M5 obsługuje prośby o mentoring i partnerstwo przez rozmowę. Powiadomienia są dostępne wewnątrz aplikacji.
- M6 pokazuje aktywność platformy za 7, 30 lub 90 dni.
- M7 przechowuje plan i jego wersje; realizacja planu jest prowadzona przez instytucję.