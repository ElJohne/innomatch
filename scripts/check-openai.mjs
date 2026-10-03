import { pathToFileURL } from "node:url";

// Explicit operator diagnostic only: two short, synthetic requests and no retries.
export async function checkOpenAi() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.log("OpenAI: missing");
    return false;
  }
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-6-luna";
  const operations = [
    [
      "responses",
      {
        model,
        store: false,
        max_output_tokens: 128,
        ...(/^gpt-[56]/.test(model) ? { reasoning: { effort: "none" } } : {}),
        instructions:
          "Odpowiedz po polsku. To syntetyczna próba połączenia. Zwróć status gotowe.",
        input: "Sprawdź połączenie.",
        text: {
          format: {
            type: "json_schema",
            name: "connection_check",
            strict: true,
            schema: {
              type: "object",
              properties: { status: { type: "string", enum: ["gotowe"] } },
              required: ["status"],
              additionalProperties: false,
            },
          },
        },
      },
    ],
    [
      "embeddings",
      {
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
        input: "Syntetyczna próba połączenia.",
        encoding_format: "float",
      },
    ],
  ];
  let ok = true;
  for (const [operation, body] of operations) {
    try {
      const response = await fetch(`https://api.openai.com/v1/${operation}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok) {
        const code = result.error?.code;
        const category = [
          "insufficient_quota",
          "credit_balance_exhausted",
          "project_spend_limit_exceeded",
          "organization_spend_limit_exceeded",
          "invalid_api_key",
          "model_not_found",
        ].includes(code)
          ? code
          : `HTTP_${response.status}`;
        console.log(`OpenAI ${operation}: failed (${category})`);
        ok = false;
        continue;
      }
      if (operation === "responses") {
        const text = result.output
          ?.flatMap((item) => item.content || [])
          .filter((item) => item.type === "output_text")
          .map((item) => item.text)
          .join("");
        if (
          result.status !== "completed" ||
          JSON.parse(text).status !== "gotowe"
        )
          throw new Error("INVALID_RESPONSE");
      } else if (
        !result.data?.[0]?.embedding?.length ||
        result.data[0].embedding.some((value) => !Number.isFinite(value))
      ) {
        throw new Error("INVALID_EMBEDDING");
      }
      console.log(`OpenAI ${operation}: reachable`);
    } catch {
      console.log(`OpenAI ${operation}: failed (connection_or_response)`);
      ok = false;
    }
  }
  return ok;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.argv.includes("--live")) {
    console.error(
      "Pass --live to explicitly authorize two small OpenAI requests.",
    );
    process.exitCode = 1;
  } else
    checkOpenAi().then((ok) => {
      if (!ok) process.exitCode = 1;
    });
}
