import { describe, it, expect, vi, afterEach } from "vitest";
import {
  urgentSignal,
  supportSignal,
  fallbackQuestions,
} from "@/lib/need-guidance";
import { needInput } from "@/lib/contracts";
import ordinary from "../search-quality/cases.json";
import unusual from "../search-quality/unusual-cases.json";
import { createNeed, getNeed } from "@/server/services/repository";
import { matchNeed } from "@/server/services/matching";
afterEach(() => vi.unstubAllEnvs());
describe("immediate guidance before AI", () => {
  it.each(
    [...ordinary.cases, ...unusual.cases]
      .filter((c) => c.kind === "emergency")
      .map((c) => [c.id, c.description]),
  )("routes synthetic emergency %s", (_id, text) =>
    expect(urgentSignal(text)).toBe(true),
  );
  it.each([
    "Telefon nie reaguje na dotyk, potrzebuję naprawy.",
    "Zaraz wezmę tabletki zgodnie z zaleceniem lekarza.",
    "Szkolenie: co zrobić gdy ktoś nie oddycha?",
    "Chcemy warsztaty o pożarach w mieszkaniu i profilaktyce.",
    "Nie czuć gazu i nic nie cieknie, tylko piec hałasuje.",
    "Nie chcę odebrać sobie życia. Potrzebuję rozmowy.",
    "Wczoraj był nieprzytomny, dziś jest stabilny w szpitalu.",
  ])(
    "does not treat education/history/negation/devices as immediate: %s",
    (text) => expect(urgentSignal(text)).toBe(false),
  );
  it("keeps a separate current danger after educational context", () =>
    expect(urgentSignal("Wczoraj były warsztaty. Teraz mąż nie oddycha.")).toBe(
      true,
    ));
  it("supports distress without affirming a belief", () => {
    expect(supportSignal("Czajnik mnie podsłuchuje, nie śpię.")).toBe(true);
    expect(fallbackQuestions("Żółty papier od pani")[0]).toContain(
      "instytucji",
    );
    expect(fallbackQuestions("NIE DZIAŁA")[0]).toContain("Co dokładnie");
  });
  it("saves emergency contacts without provider configuration and keeps clarification text", async () => {
    vi.stubEnv("DATA_PROVIDER", "fixtures");
    vi.stubEnv("DEMO_DATA_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");
    const n = await createNeed(
      "guidance-owner",
      needInput.parse({ description: "Mąż nie oddycha" }),
      crypto.randomUUID(),
    );
    const r = await matchNeed(n);
    expect(r.guidance).toBe("emergency");
    expect(r.contacts).toEqual(["112", "999"]);
    expect(r.matches).toEqual([]);
    expect(r.relatedResources).toEqual([]);
    expect((await getNeed(n.id, "guidance-owner"))?.match).toEqual(r);
    const c = await createNeed(
      "guidance-owner",
      needInput.parse({
        description: "Pomocy",
        clarifications: [
          { question: "Co się stało?", answer: "Mąż nie oddycha" },
        ],
      }),
      crypto.randomUUID(),
    );
    expect((await matchNeed(c)).guidance).toBe("emergency");
    expect(c.description).toBe("Pomocy");
  });
});
