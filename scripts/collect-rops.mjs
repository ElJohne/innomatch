// Operator-only, bounded public-source collection. Never follows arbitrary links.
import { load } from "cheerio";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const base = "https://rops.krakow.pl";
const library = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/";
const output = "data/import";
const cache = "tmp/rops-cache";
await mkdir(output, { recursive: true });
await mkdir(cache, { recursive: true });
const clean = (value) => value.replace(/\s+/g, " ").trim();
const hash = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  retrievedAt: new Date().toISOString(),
  categories: [],
  failures: [],
  records: 0,
};
let requests = 0;
async function page(url) {
  const u = new URL(url);
  if (u.origin !== base || !u.pathname.startsWith(library))
    throw new Error("SOURCE_NOT_ALLOWED");
  const file = `${cache}/${hash(url)}.html`;
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch {
    if (++requests > 250) throw new Error("FETCH_BUDGET");
    await new Promise((resolve) => setTimeout(resolve, 150));
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    html = await response.text();
    if (html.length > 2000000) throw new Error("PAGE_TOO_LARGE");
    await writeFile(file, html);
  }
  return load(html);
}
const index = await page(base + library + "kategorie");
const categories = [
  ...new Set(
    index(".text-content a[href]")
      .map((_, a) => {
        const u = new URL(index(a).attr("href"), base);
        u.protocol = "https:";
        return u.href;
      })
      .get(),
  ),
].filter(
  (url) => url.startsWith(base + library + "dla-") && !url.includes(","),
);
if (categories.length !== 9) throw new Error("CATEGORY_LAYOUT_CHANGED");
const entries = new Map();
for (const url of categories) {
  const $ = await page(url);
  const category = clean($(".page-title").text());
  const links = $(".content__main a.news-list__title");
  if (!links.length) throw new Error("CATEGORY_LAYOUT_CHANGED");
  report.categories.push({ url, category, entries: links.length });
  links.each((_, link) => {
    const detail = new URL($(link).attr("href"), base).href;
    const slug = new URL(detail).pathname.split(",")[1];
    if (!slug) return;
    const previous = entries.get(slug);
    if (previous) {
      previous.categories.push(category);
      return;
    }
    entries.set(slug, {
      url: detail,
      title: clean($(link).text()),
      categories: [category],
    });
  });
}
if (entries.size > 220) throw new Error("CATALOG_BUDGET");
const records = [];
for (const [slug, entry] of entries) {
  try {
    const $ = await page(entry.url);
    const root = $(".content__main .text-content").first();
    // Keep numbered descriptive sections only. Author/contact/testimonial sections are excluded.
    const sections = {};
    let section;
    root.children().each((_, element) => {
      const text = clean($(element).text());
      const n = text.length < 100 && text.match(/^([1-6])\.\s/)?.[1];
      if (n) {
        section = n;
        return;
      }
      if (section && Number(section) <= 4)
        sections[section] = clean((sections[section] || "") + " " + text);
    });
    const solution = sections["1"],
      problem = sections["2"];
    const audience = sections["3"] || sections["4"];
    if (!solution || !problem || !audience) {
      report.failures.push({
        url: entry.url,
        reason: "UNSTRUCTURED_DETAIL",
        headings: root
          .find("h3,h4,h5")
          .map((_, h) => clean($(h).text()))
          .get(),
      });
      continue;
    }
    const selected = [
      solution,
      problem,
      sections["3"],
      sections["4"] || "",
    ].join(" ");
    if (/@|https?:\/\/|\b(?:tel\.|telefon|e-mail)\b/i.test(selected)) {
      report.failures.push({
        url: entry.url,
        reason: "CONTACT_REVIEW_REQUIRED",
      });
      continue;
    }
    const id =
      "rops-" +
      slug.slice(0, 60).replace(/-$/, "") +
      "-" +
      hash(slug).slice(0, 8);
    const group = audience;
    // Split lengthy audience descriptions at sentence boundaries; preserve verbatim source text.
    const groups = entry.categories.map((c) =>
      c.replace(/^Dla /, "").replace(/^./, (c) => c.toLocaleUpperCase("pl")),
    );
    records.push({
      id,
      title: entry.title,
      problem: problem.slice(0, 4000),
      solution: solution.slice(0, 6000),
      targetGroups: groups,
      categories: [...new Set(entry.categories)],
      requirements: [
        "Przed wdrożeniem sprawdź pełną dokumentację, zasady wykorzystania i wymagane zasoby u źródła.",
      ],
      origin: "PUBLIC_SOURCE",
      publicationStatus: "PUBLISHED",
      maturity: "UNKNOWN",
      sources: [
        {
          id: `${id}-source`,
          sourceRef: entry.url,
          sourceTitle: `ROPS Kraków — ${entry.title}`,
          sourceUrl: entry.url,
          retrievedAt: report.retrievedAt,
          evidenceExcerpt: `${solution}\nGrupa docelowa: ${group}`.slice(
            0,
            1800,
          ),
        },
      ],
    });
  } catch (error) {
    report.failures.push({
      url: entry.url,
      reason: error.message.startsWith("HTTP_")
        ? error.message
        : "FETCH_OR_PARSE_FAILED",
    });
  }
}
report.records = records.length;
report.discovered = entries.size;
await writeFile(
  `${output}/rops-innovations.json`,
  JSON.stringify(records, null, 2) + "\n",
);
await writeFile(
  `${output}/rops-collection-report.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    categories: categories.length,
    discovered: entries.size,
    collected: records.length,
    skipped: report.failures.length,
  }),
);
