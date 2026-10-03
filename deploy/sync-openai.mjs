import { spawnSync } from "node:child_process";

// Feed the credential directly to kubectl stdin; never write it to disk or argv.
const key = process.env.OPENAI_API_KEY?.trim();
if (!key || key.length < 20 || /\s/.test(key)) {
  console.error("OPENAI_API_KEY repository secret is missing or malformed.");
  process.exit(1);
}
const values = {
  OPENAI_API_KEY: key,
  AI_PROVIDER: "openai",
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || "gpt-6-luna",
  OPENAI_EMBEDDING_MODEL:
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
};
const data = Object.fromEntries(
  Object.entries(values).map(([name, value]) => [
    name,
    Buffer.from(value).toString("base64"),
  ]),
);
const result = spawnSync(
  "kubectl",
  [
    "-n",
    "innomatch",
    "patch",
    "secret",
    "openai-env",
    "--type=merge",
    "--patch-file=/dev/stdin",
  ],
  {
    input: JSON.stringify({ data }),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  },
);
if (result.status !== 0) {
  console.error(
    "OpenAI runtime secret update failed. Secret values were not logged.",
  );
  process.exit(1);
}
console.log("OpenAI runtime secret: configured");
