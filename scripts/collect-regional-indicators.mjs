import { writeFile, mkdir } from "node:fs/promises";
import { load } from "cheerio";
// Discovery of official indicator IDs: Wici / data/wskazniki.yaml (see DATA.md).
// Values, years, labels and source names are read directly from ROPS.
const definitions = [
  {
    id: 285,
    key: "seniors",
    unit: "%",
    denominator: "mieszkańców",
    label: "Mieszkańcy w wieku 65+",
  },
  {
    id: 17,
    key: "social-support",
    unit: "%",
    denominator: "mieszkańców",
    label: "Korzystający z pomocy społecznej",
  },
  {
    id: 215,
    key: "disability",
    unit: "%",
    denominator: "mieszkańców",
    label: "Osoby z niepełnosprawnością",
  },
  {
    id: 25,
    key: "unemployment",
    unit: "%",
    denominator: "aktywnych zawodowo",
    label: "Stopa bezrobocia rejestrowanego",
  },
];
const retrievedAt = new Date().toISOString();
const items = [];
for (const definition of definitions) {
  const sourceUrl = `https://obserwator.rops.krakow.pl/differenceanalysis/${definition.id}`;
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "Pomocny Punkt public-data import" },
  });
  if (!response.ok) throw new Error(`ROPS_HTTP_${response.status}`);
  const html = await response.text(),
    $ = load(html);
  const year = Number(
    $("#differenceanalysis_year option[selected]").attr("value"),
  );
  const names = JSON.parse(
    html.match(/var myChartLabelsmyChart0 = (\[.*?\]);/s)?.[1] ?? "null",
  );
  const values = JSON.parse(
    html.match(/var myChartValuesmyChart0 = (\[.*?\]);/s)?.[1] ?? "null",
  );
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    !Array.isArray(names) ||
    names.length !== 22 ||
    new Set(names).size !== 22 ||
    !Array.isArray(values) ||
    values.length !== 22 ||
    values.some(
      (v) => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100,
    )
  )
    throw new Error(`ROPS_DATA_INVALID_${definition.id}`);
  const sourceTitle = $(".text-content h1").text().trim();
  const source = $(".analysisSource")
    .first()
    .text()
    .replace(/^Źródło:\s*/, "")
    .trim();
  if (
    !sourceTitle ||
    !source ||
    names.some((n) => typeof n !== "string" || !n.startsWith("powiat "))
  )
    throw new Error(`ROPS_METADATA_INVALID_${definition.id}`);
  items.push({
    ...definition,
    year,
    sourceTitle,
    source,
    sourceUrl,
    values: names.map((name, index) => ({
      county: name.replace(/^powiat /, ""),
      value: values[index],
    })),
  });
  console.log(
    JSON.stringify({
      key: definition.key,
      year,
      count: names.length,
      title: sourceTitle,
    }),
  );
}
if (
  items.some((item) =>
    item.values.some(
      (v) => !items[0].values.some((first) => first.county === v.county),
    ),
  )
)
  throw new Error("ROPS_COUNTIES_MISMATCH");
await mkdir("data/rops", { recursive: true });
await writeFile(
  "data/rops/regional-indicators.json",
  JSON.stringify({ retrievedAt, items }, null, 2) + "\n",
);
