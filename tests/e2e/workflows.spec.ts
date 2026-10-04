import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("idea editor saves, applies mock assistance explicitly, reloads and submits a private consultation", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/pomysly/nowy");
  await page
    .getByLabel("Co chcesz zrobić i komu pomóc?")
    .fill(
      "Syntetyczny przykład: chcę organizować regularne spotkania samotnych seniorów w świetlicy z wolontariuszami.",
    );
  await page.getByRole("button", { name: "Przygotuj kartę" }).click();
  await expect(page).toHaveURL(/\/pomysly\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("link", { name: "Canvas", exact: true }).click();
  const canvasNote =
    "Syntetyczny przykład: spotkania co tydzień dla małej grupy seniorów z jednej okolicy.";
  await page.getByLabel("Skala i częstotliwość problemu").fill(canvasNote);
  await page
    .getByLabel("Koszty stałe", { exact: true })
    .fill("Sala do uzgodnienia z biblioteką; koszt nie jest jeszcze znany.");
  await page
    .getByLabel("Wpływ i sposób sprawdzenia")
    .fill(
      "Hipoteza: łatwiejszy kontakt z sąsiadami. Zbierzemy anonimowe uwagi po spotkaniu.",
    );
  await page.getByRole("button", { name: "Zapisz zmiany karty" }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz zmiany karty" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("Skala i częstotliwość problemu")).toHaveValue(
    canvasNote,
  );
  const before = await (await page.request.get(`/api/ideas/${id}`)).json();
  await page
    .getByRole("button", { name: "Poproś AI o propozycję rozwoju" })
    .click();
  await expect(page.getByText("Propozycja demonstracyjna.")).toBeVisible();
  expect(await (await page.request.get(`/api/ideas/${id}`)).json()).toEqual(
    before,
  );
  await page.getByRole("button", { name: "Zastosuj propozycję" }).click();
  await page.getByRole("button", { name: "Zapisz zmiany karty" }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz zmiany karty" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("Skala i częstotliwość problemu")).toHaveValue(
    canvasNote,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: "Podgląd i druk" }).click();
  await expect(
    page.getByRole("heading", { name: "Canvas pomysłu", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(canvasNote, { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/canvas-preview-mobile.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Drukuj lub zapisz PDF" }),
  ).toBeHidden();
  await expect(page.locator(".header")).toBeHidden();
  await expect(page.getByText(canvasNote, { exact: true })).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.goto(`/pomysly/${id}/grant`);
  await expect(page.locator("main details")).toHaveCount(0);
  await page.getByLabel("Całkowity koszt w PLN — działanie 1").fill("125.50");
  await page
    .getByRole("button", { name: "Zapisz szkic grantowy", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Zapisz szkic grantowy", exact: true }),
  ).toBeDisabled();
  const savedGrant = await (await page.request.get(`/api/ideas/${id}`)).json();
  await page
    .getByRole("button", { name: "Zaproponuj tekst szkicu", exact: true })
    .click();
  await expect(
    page.getByText("Propozycja demonstracyjna.", { exact: true }),
  ).toBeVisible();
  expect(await (await page.request.get(`/api/ideas/${id}`)).json()).toEqual(
    savedGrant,
  );
  await page
    .getByRole("button", { name: "Wstaw propozycję do formularza" })
    .click();
  await page
    .getByRole("button", { name: "Zapisz szkic grantowy", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Zapisz szkic grantowy", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByLabel("Całkowity koszt w PLN — działanie 1"),
  ).toHaveValue("125.5");
  const finalGrant = await (await page.request.get(`/api/ideas/${id}`)).json();
  expect(finalGrant.grantDraft.costs[0].amountPLN).toBe(125.5);
  await page.goto(`/pomysly/${id}`);
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
    const shared = await (
      await page.request.get(`/api/threads/${saved.threadId}`)
    ).json();
    expect(JSON.stringify(shared)).toContain(canvasNote);
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
    .getByLabel("Jaka instytucja będzie działać?")
    .fill("Syntetyczny ośrodek kultury");
  await page
    .getByLabel("Co macie do dyspozycji?")
    .fill("Świetlica i wolontariusze");
  await page.getByLabel("Dla kogo?").fill("Mała dobrowolna grupa seniorów");
  const savedResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/adaptations") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Przygotuj plan →" }).click();
  const saved = await savedResponse;
  expect(saved.status()).toBe(200);
  const savedPlan = await saved.json();
  expect(
    (await page.request.get(`/api/adaptations/${savedPlan.id}`)).status(),
  ).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Twój plan działania" }),
  ).toBeVisible();
  const url = page.url();
  const id = new URL(url).pathname.split("/").at(-1)!;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Twój plan działania" }),
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
      restored.getByRole("heading", { name: "Twój plan działania" }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
