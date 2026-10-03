// Normalize downloaded public descriptions. Review the generated snapshot before committing.
// Inputs: collect-rops.mjs output, ROPS HTML pages and pdftotext -layout PDF extracts in tmp/.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { load } from "cheerio";
const read = (name) => readFile(`tmp/rops-${name}`, "utf8");
const clean = (value) => value.replace(/\s+/g, " ").trim();
const id = (value) =>
  "rops-knowledge-" +
  createHash("sha256").update(value).digest("hex").slice(0, 16);
const collected = JSON.parse(
  await readFile("data/import/rops-collection-report.json", "utf8"),
);
const knowledge = [];
function add({
  title,
  type,
  description,
  url,
  reference = url,
  date,
  coverage = "DESCRIPTION",
  topics = [],
}) {
  const key = id(url);
  if (knowledge.some((r) => r.id === key)) return;
  knowledge.push({
    id: key,
    title,
    type,
    description,
    topics,
    coverage,
    origin: "PUBLIC_SOURCE",
    publicationStatus: "PUBLISHED",
    sources: [
      {
        id: key + "-source",
        sourceRef: reference,
        sourceTitle: `ROPS Kraków — ${title}`.slice(0, 300),
        sourceUrl: url,
        ...(date ? { sourceDate: date } : {}),
        retrievedAt: collected.retrievedAt,
        evidenceExcerpt: description.slice(0, 800),
      },
    ],
  });
}
const base = "https://rops.krakow.pl";
const reportsUrl = base + "/badania-analizy-raporty/raporty-z-badan";
const reports = load(await read("reports.html"));
reports(".content__main .files__item").each((_, el) => {
  const item = reports(el),
    link = item.find(".files__link"),
    title = clean(link.text());
  const description = clean(item.find(".files__desc").text());
  if (!title) return;
  add({
    title,
    type: "REPORT",
    description:
      description ||
      `Raport dostępny w bazie ROPS: ${title}. Strona źródłowa nie zawiera opisu treści; zapoznaj się z pełnym dokumentem.`,
    url: new URL(link.attr("href"), base).href,
    reference: reportsUrl,
    date: title.match(/^\d{4}/)?.[0],
    coverage: description ? "DESCRIPTION" : "DIRECTORY",
  });
});
const publicationUrl =
  base + "/innowacje-spoleczne/publikacje-ze-swiata-innowacji";
const publications = load(await read("publications.html"));
publications(".content__main tr").each((_, el) => {
  const row = publications(el),
    href = row.find('a[href$=".pdf"]').attr("href");
  if (!href) return;
  const text = clean(row.text());
  const titles = [
    [
      "Połącz kropki",
      "Połącz kropki, czyli o sile innowacji społecznych w obszarze włączenia społecznego",
    ],
    [
      "Innowacje społeczne dla dostępności",
      "Innowacje społeczne dla dostępności",
    ],
    ["Przewodnik po innowacjach", "Przewodnik po innowacjach społecznych"],
    ["Guide to social innovations", "Guide to social innovations"],
  ];
  const title = titles.find(([start]) => text.includes(start))?.[1];
  if (title)
    add({
      title,
      type: "EDUCATION",
      description: text,
      url: new URL(href, base).href,
      reference: publicationUrl,
      date: text.match(/20\d{2}/)?.[0],
    });
});
const mapUrl = base + "/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf";
const mapPages = (await read("map.txt")).split("\f");
for (let i = 0; i < mapPages.length; i++) {
  const page = mapPages[i];
  if (!page.includes("Kluczowe wyzwania")) continue;
  const topic = clean(page.split("Kluczowe wyzwania")[0]).replace(
    /^\d+\.\s*/,
    "",
  );
  const description =
    "Zakres: cała Polska. Wybrane wyzwania z mapy ROPS; nie są to dane o samej Małopolsce.\n\n" +
    clean(page.split("Kluczowe wyzwania")[1]);
  add({
    title: `Mapa wyzwań — ${topic}`,
    type: "CHALLENGE",
    description,
    url: `${mapUrl}#page=${i + 1}`,
    reference: `Mapa wyzwań społecznych, s. ${i + 1}`,
    coverage: "EXCERPT",
    topics: [topic, "Polska"],
  });
}
add({
  title: "Social Innovation Canvas",
  type: "EDUCATION",
  description:
    "Arkusz do pracy nad innowacją społeczną. Pierwsza plansza pomaga opisać intensywność, częstotliwość i skalę problemu, aktorów wspierających lub utrudniających zmianę, wartość i gotowość rozwiązania oraz koszty stałe i zmienne. Otwórz pełny dokument, aby pracować z oryginalnymi planszami.",
  url: base + "/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf",
  coverage: "DESCRIPTION",
  topics: ["Projektowanie innowacji", "Koszty", "Problem", "Rozwiązanie"],
});
add({
  title: "Internetowy Obserwator Statystyk Społecznych",
  type: "REPORT",
  description:
    "Portal ROPS z zestawieniami statystycznymi oraz analizą zróżnicowania i trendów. Obejmuje m.in. demografię, pomoc społeczną, pieczę zastępczą, zdrowie, kulturę, rynek pracy, edukację i migracje. Dane można analizować na mapie, w tabelach i na wykresach. Wybierz rok i jednostkę terytorialną w portalu; ten katalog nie zawiera kopii wartości wskaźników.",
  url: "https://obserwator.rops.krakow.pl/",
  coverage: "DIRECTORY",
  topics: ["Statystyki", "Małopolska"],
});
for (const [title, type, url, description] of [
  [
    "Biblioteka Innowacji Społecznych",
    "EDUCATION",
    base + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie",
    "Biblioteka ROPS uporządkowana w dziewięć kategorii odbiorców. Opisy wybranych innowacji są także dostępne w katalogu MI Connect. ROPS informuje o przebudowie strony i możliwej niedostępności części odnośników.",
  ],
  [
    "Baza raportów ROPS",
    "REPORT",
    reportsUrl,
    "Zbiór raportów z badań ROPS dotyczących polityki społecznej. Wybrane opisy dokumentów są dostępne poniżej; pełne raporty otwierają się w serwisie źródłowym.",
  ],
  [
    "Publikacje ze świata innowacji",
    "EDUCATION",
    publicationUrl,
    "Zbiór publikacji o inkubowaniu i rozwijaniu innowacji społecznych, w tym przewodniki oraz Social Canvas.",
  ],
  [
    "Mapa wyzwań społecznych",
    "CHALLENGE",
    mapUrl,
    "Mapa ROPS dla projektu Inkubator Włączenia Społecznego 2.0. Dane mają zakres ogólnopolski. Obejmuje rodzinę i pieczę zastępczą, bezdomność, niepełnosprawność, ubóstwo, integrację cudzoziemców, zdrowie, zdrowie psychiczne i seniorów.",
  ],
])
  add({ title, type, url, description, coverage: "DIRECTORY" });
const innovations = JSON.parse(
  await readFile("data/import/rops-innovations.json", "utf8"),
);
await mkdir("data/rops", { recursive: true });
await writeFile(
  "data/rops/corpus.json",
  JSON.stringify(
    { version: 1, retrievedAt: collected.retrievedAt, innovations, knowledge },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "data/rops/collection-report.json",
  JSON.stringify(collected, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    innovations: innovations.length,
    knowledge: knowledge.length,
    types: knowledge.reduce(
      (r, x) => ((r[x.type] = (r[x.type] || 0) + 1), r),
      {},
    ),
  }),
);
