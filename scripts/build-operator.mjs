import { build } from "esbuild";
await build({
  entryPoints: ["scripts/manage.ts"],
  outfile: ".next/standalone/scripts/manage.cjs",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  conditions: ["react-server"],
  external: ["postgres", "./check-openai.mjs"],
});
