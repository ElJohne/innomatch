# Zależności i materiały

Wersje, adresy pakietów i sumy integralności są zapisane w `package-lock.json`. Zależności bezpośrednie w `package.json` mają dokładne wersje.

| Warstwa | Pakiety |
| --- | --- |
| Aplikacja | Next.js, React, TypeScript |
| Style | Tailwind CSS, PostCSS |
| Dane i walidacja | Drizzle ORM, postgres, Zod |
| Sesje | iron-session |
| AI | OpenAI SDK |
| Testy | Vitest, Playwright, axe-core |
| Narzędzia | ESLint, Prettier, tsx, Cheerio, esbuild |

Pełny lokalny wykaz licencji można odtworzyć z lockfile:

```sh
node scripts/dependencies.mjs
```

Wynik `docs/dependencies.json` jest plikiem roboczym poza Git.

Grafika strony głównej: `public/images/community-conversation.png`. Dane i materiały zewnętrzne opisuje [DATA](DATA.md), a formularz ROPS — [GRANTS](GRANTS.md). Oryginalne dokumenty konkursowe znajdują się w katalogu głównym. Licencja aplikacji: [LICENSE](../LICENSE).