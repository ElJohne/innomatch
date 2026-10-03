"""Development provenance: these are invented examples, not ROPS records."""
import json
from pathlib import Path

items = [
    ('sasiedzki-stol', 'Sąsiedzki stół', 'Seniorzy mieszkający samotnie mają mało okazji do spotkań.', 'Regularne spotkania seniorów w świetlicy, przygotowywane przez wolontariuszy. Zaproszenia papierowe i telefoniczne, bez aplikacji mobilnej.', ['Seniorzy'], ['Samotność', 'Relacje sąsiedzkie'], ['Świetlica dostępna architektonicznie', 'Koordynator i wolontariusze']),
    ('cyfrowy-duet', 'Cyfrowy duet', 'Seniorzy napotykają trudności w korzystaniu z internetu.', 'Indywidualne ćwiczenia obsługi telefonu i usług cyfrowych z osobą wspierającą.', ['Seniorzy'], ['Wykluczenie cyfrowe'], ['Dostęp do urządzenia', 'Osoba prowadząca zajęcia']),
    ('krag-opiekunow', 'Krąg opiekunów', 'Opiekunowie rodzinni potrzebują kontaktu i wymiany doświadczeń.', 'Moderowane spotkania opiekunów i mapa lokalnych możliwości wsparcia.', ['Opiekunowie'], ['Wsparcie opiekunów'], ['Moderator', 'Bezpieczna przestrzeń spotkań']),
    ('mlodzi-razem', 'Młodzi razem', 'Młodzież szuka bezpiecznej przestrzeni do budowania relacji.', 'Warsztaty współpracy i wspólne działania prowadzone przez animatora, bez diagnoz medycznych.', ['Młodzież'], ['Relacje', 'Aktywność lokalna'], ['Animator', 'Zasady ochrony uczestników']),
    ('dostepny-urzad', 'Dostępna wizyta', 'Osoby z niepełnosprawnościami napotykają bariery w urzędach.', 'Przegląd ścieżki wizyty z użytkownikami i lista zmian organizacyjnych poprawiających dostępność.', ['Osoby z niepełnosprawnościami'], ['Dostępność usług'], ['Udział użytkowników', 'Koordynator dostępności']),
    ('jezyk-sasiedztwa', 'Język sąsiedztwa', 'Nowi mieszkańcy z doświadczeniem migracji potrzebują kontaktów i praktyki języka.', 'Spotkania konwersacyjne i wspólne poznawanie lokalnych usług.', ['Migranci'], ['Integracja', 'Język'], ['Prowadzący spotkania', 'Materiały w prostym języku']),
    ('powrot-do-pracy', 'Mały krok do pracy', 'Osoby długotrwale bezrobotne potrzebują wsparcia w powrocie do aktywności.', 'Warsztaty rozpoznania umiejętności i przygotowanie do rozmowy z doradcą zawodowym.', ['Osoby bezrobotne'], ['Praca'], ['Doradca', 'Miejsce warsztatów']),
    ('punkt-napraw', 'Punkt wspólnych napraw', 'Mieszkańcy wyrzucają przedmioty, które można naprawić, i rzadko współpracują.', 'Otwarte spotkania naprawcze z wolontariuszami i wymianą umiejętności.', ['Mieszkańcy'], ['Ekologia', 'Współpraca'], ['Narzędzia i zasady bezpieczeństwa', 'Osoby z doświadczeniem napraw']),
    ('spacer-bez-barier', 'Spacer bez barier', 'Osoby o ograniczonej mobilności mają trudności z wyborem dostępnych tras.', 'Wspólne przejście krótkich tras i opis napotkanych barier, bez obietnicy pełnej dostępności.', ['Osoby z niepełnosprawnościami'], ['Mobilność', 'Dostępność'], ['Opiekun trasy', 'Weryfikacja warunków na miejscu']),
    ('rodzic-w-sieci', 'Rodzice blisko', 'Rodzice małych dzieci potrzebują kontaktów z innymi rodzicami.', 'Sąsiedzkie spotkania rodziców z dziećmi w dostępnym miejscu.', ['Rodzice'], ['Rodzina', 'Relacje'], ['Miejsce przyjazne dzieciom', 'Koordynator']),
    ('ogrod-pokolen', 'Ogród pokoleń', 'Mieszkańcom brakuje wspólnych działań łączących różne pokolenia.', 'Mały ogród społeczny z podziałem obowiązków i otwartymi spotkaniami.', ['Mieszkańcy'], ['Międzypokoleniowość', 'Ekologia'], ['Zgoda na użycie terenu', 'Dostęp do wody']),
    ('prosty-list', 'Prosty list', 'Mieszkańcy mają trudności ze zrozumieniem urzędowych pism.', 'Warsztaty upraszczania komunikatów i testowanie ich z odbiorcami.', ['Mieszkańcy'], ['Prosty język', 'Dostępność usług'], ['Redaktor', 'Weryfikacja merytoryczna pisma']),
]
records = []
for slug, title, problem, solution, groups, categories, requirements in items:
    records.append(dict(id='demo-'+slug, title=title, problem=problem, solution=solution,
        targetGroups=groups, categories=categories, requirements=requirements,
        origin='SYNTHETIC', publicationStatus='PUBLISHED', maturity='CONCEPT',
        sources=[dict(id='source-demo-'+slug, sourceRef='data/demo/innovations.json#demo-'+slug,
            sourceTitle='Przykład syntetyczny MI Connect — '+title, evidenceExcerpt=solution)]))
path = Path('data/demo/innovations.json')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
