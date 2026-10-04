# Stan repozytorium

4 października 2026.

Pomocny Punkt obejmuje wyszukiwanie pomocy, katalog i materiały, dane powiatów, pomysły z Canvas i formularzem IWS 2.0, plany dla instytucji, prywatne rozmowy, testowanie i panel administracyjny. [Mapa modułów](REQUIREMENTS.md).

## Przygotowanie do przeglądu

- README opisuje produkt, uruchomienie, architekturę i testy po polsku.
- Dokumentacja techniczna przedstawia aktualną implementację bez historii kolejnych iteracji.
- Usunięto 52 pliki: historyczne raporty, wyniki eksperymentów, robocze zrzuty ekranów, nieużywaną grafikę i skrypt jednorazowego eksperymentu.
- Zachowano scenariusze testowe, katalog źródłowy, migracje, LICENSE i oryginalne PDF.
- Raporty lokalne są ignorowane przez Git; wykaz zależności można odtworzyć z lockfile.

Lint, TypeScript, build, 79 testów jednostkowych i walidacja katalogu zakończyły się powodzeniem. E2E: 27 udanych scenariuszy, 1 nieudany. Testy PostgreSQL: 8 pominiętych bez TEST_DATABASE_URL. Dalsze sprawdzanie zakończono na polecenie właściciela. Szczegóły: [QA](QA.md).

Porządkowanie połączono z aktualnym master: zachowano nową nawigację, /wspolpraca, bezpośrednie zgłoszenia wsparcia i migrację 0009_support_entry. Aktualne makiety: [galeria](priority-one-layouts.html).
