import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("idea editor saves, applies mock assistance explicitly, reloads and submits a private consultation", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/pomysly/nowy");
  await page.getByLabel("Tytuł pomysłu").fill("Syntetyczny klub sąsiedzki");
  await page
    .getByLabel("Jaki problem chcesz rozwiązać?")
    .fill("Syntetyczny przykład: seniorzy potrzebują regularnych spotkań.");
  await page
    .getByLabel("Na czym polega pomysł?")
    .fill(
      "Dobrowolne spotkania w świetlicy z udziałem lokalnych wolontariuszy.",
    );
  await page
    .getByLabel("Zasoby i ograniczenia")
    .fill("Świetlica i wolontariusze.");
  await page
    .getByLabel("Jak można sprawdzić pomysł w małej skali?")
    .fill("Mała dobrowolna próba i anonimowe uwagi.");
  await page.getByLabel("Dla kogo? Jedna grupa w wierszu").fill("Seniorzy");
  await page.getByRole("button", { name: "Zapisz prywatny szkic" }).click();
  await expect(page).toHaveURL(/\/pomysly\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const before = await (await page.request.get(`/api/ideas/${id}`)).json();
  await page
    .getByRole("button", { name: "Poproś o propozycję rozwoju" })
    .click();
  await expect(
    page.getByText("Przykład demonstracyjny — bez wywołania AI."),
  ).toBeVisible();
  expect(await (await page.request.get(`/api/ideas/${id}`)).json()).toEqual(
    before,
  );
  await page
    .getByRole("button", { name: "Zastosuj propozycję w formularzu" })
    .click();
  await page.getByRole("button", { name: "Zapisz zmiany karty" }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz zmiany karty" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByLabel("Jak można sprawdzić pomysł w małej skali?"),
  ).toHaveValue(/Propozycja demonstracyjna/);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  const other = await browser.newContext();
  try {
    expect(
      (await other.request.get(`${baseURL}/api/ideas/${id}`)).status(),
    ).toBe(401);
    const otherNeed = await other.request.post(`${baseURL}/api/needs`, {
      headers: {
        origin: new URL(baseURL!).origin,
        "idempotency-key": crypto.randomUUID(),
      },
      data: {
        description: "Syntetyczna potrzeba innej sesji do testu prywatności.",
      },
    });
    expect(otherNeed.status()).toBe(201);
    expect(
      (await other.request.get(`${baseURL}/api/ideas/${id}`)).status(),
    ).toBe(404);
    await page
      .getByRole("button", { name: "Przekaż pomysł do konsultacji" })
      .click();
    await expect(page).toHaveURL(/\/wiadomosci\/[a-f0-9-]{36}$/);
    const saved = await (await page.request.get(`/api/ideas/${id}`)).json();
    expect(saved.status).toBe("SUBMITTED");
    expect(
      (
        await other.request.get(`${baseURL}/api/threads/${saved.threadId}`)
      ).status(),
    ).toBe(404);
  } finally {
    await other.close();
  }
});

test("adaptation form persists a plan and recovery restores only the author's access in a new browser session", async ({
  page,
  browser,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const response = await page.request.post("/api/needs", {
    headers: { origin, "idempotency-key": crypto.randomUUID() },
    data: {
      description:
        "Syntetyczna potrzeba: seniorzy potrzebują spotkań w świetlicy.",
    },
  });
  expect(response.status()).toBe(201);
  const need = await response.json();
  await page.goto(
    `/adaptacje/nowa?innovationId=demo-sasiedzki-stol&needId=${need.id}`,
  );
  await page
    .getByLabel("Typ instytucji i jej rola")
    .fill("Syntetyczny ośrodek kultury");
  await page
    .getByLabel("Dostępne zasoby i ograniczenia")
    .fill("Świetlica i wolontariusze");
  await page
    .getByLabel("Dla kogo i jaki zasięg usługi?")
    .fill("Mała dobrowolna grupa seniorów");
  const savedResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/adaptations") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Przygotuj szkic adaptacji" }).click();
  const saved = await savedResponse;
  expect(saved.status()).toBe(200);
  const savedPlan = await saved.json();
  expect(
    (await page.request.get(`/api/adaptations/${savedPlan.id}`)).status(),
  ).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Twój szkic usługi" }),
  ).toBeVisible();
  const url = page.url();
  const id = new URL(url).pathname.split("/").at(-1)!;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Twój szkic usługi" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const recovery = await page.request.post("/api/session/recovery", {
    headers: { origin },
    data: {},
  });
  expect(recovery.status()).toBe(200);
  const { token } = await recovery.json();
  const other = await browser.newContext();
  try {
    expect(
      (await other.request.get(`${baseURL}/api/adaptations/${id}`)).status(),
    ).toBe(401);
    expect(
      (
        await other.request.post(`${baseURL}/api/session/restore`, {
          headers: { origin },
          data: { token },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await other.request.get(`${baseURL}/api/adaptations/${id}`)).status(),
    ).toBe(200);
    expect(
      (await other.request.get(`${baseURL}/api/admin/threads`)).status(),
    ).toBe(403);
    const restored = await other.newPage();
    await restored.goto(url);
    await expect(
      restored.getByRole("heading", { name: "Twój szkic usługi" }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
