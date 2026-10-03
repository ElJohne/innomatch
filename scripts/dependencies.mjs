import { readFileSync, writeFileSync } from "node:fs";
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const rows = Object.entries(lock.packages)
  .filter(([path]) => path)
  .map(([path, p]) => ({
    name: path.split("node_modules/").at(-1),
    version: p.version,
    license: p.license ?? "Review package LICENSE",
    developmentOnly: !!p.dev,
    source: p.resolved,
  }));
writeFileSync("docs/dependencies.json", JSON.stringify(rows, null, 2) + "\n");
console.log(
  `Recorded ${rows.length} dependency entries; no environment values read.`,
);
