# Wyniki sprawdzenia

4 października 2026. Windows, Node.js 22.16.0, npm 10.9.2. Testy aplikacji: fixtures / mock; E2E: zainstalowany Chrome, port 3300.

| Polecenie | Wynik |
| --- | --- |
| `npm ci` | 432 pakiety z lockfile; lokalny cache npm. |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 79 testów, 13 plików. |
| `npm run build` | PASS |
| `npm run data:validate` | PASS — 114 innowacji i 69 materiałów. |
| `npm run test:e2e` | 27 scenariuszy PASS, 1 FAIL. |
| `npm run test:integration` | 8 pominiętych; brak TEST_DATABASE_URL. |

Nieudany scenariusz E2E: `tests/e2e/workflows.spec.ts:4` — edycja pomysłu, pomoc mock, ponowne otwarcie i przekazanie do konsultacji. Po wynikach wszystkich 28 scenariuszy proces zakończono na polecenie właściciela; bez powtórzenia i dalszej diagnostyki.

Polecenia npm wykonano przez zainstalowany `npm-cli.js`, ponieważ globalny launcher Windows wskazuje nieistniejącą ścieżkę. Instalacja z cache w `.tools/npm-cache` zakończyła się powodzeniem.

Sprawdzono lokalne odnośniki w README, SPEC i dokumentacji technicznej. Nie wykonywano operacji na produkcyjnej bazie ani wywołań zewnętrznych usług AI.

Wyniki powyżej dotyczą porządkowania na bazie 1c1bf41. Przed push zachowano nowsze zmiany master a5a5005; po połączeniu nie uruchamiano testów zgodnie z poleceniem właściciela.

