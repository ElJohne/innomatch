import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("failed submission preserves the description and allows retry", async ({
  page,
}) => {
  await page.goto("/potrzeby/nowa");
  const description =
    "Seniorzy mieszkający samotnie potrzebują spotkań w świetlicy.";
  await page.getByLabel("Co chcecie zmienić?").fill(description);
  await page.route("**/api/needs", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Usługa jest niedostępna." }),
    }),
  );
  await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "niedostępna",
  );
  await expect(page.getByLabel("Co chcecie zmienić?")).toHaveValue(description);
  await page.unroute("**/api/needs");
  await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
  await expect(
    page.getByRole("heading", { name: "Propozycje do sprawdzenia" }),
  ).toBeVisible();
});
test("same-session retries are idempotent and private API denies another browser", async ({
  page,
  browser,
}) => {
  await page.goto("/potrzeby/nowa");
  const key = crypto.randomUUID();
  const create = () =>
    page.request.post("/api/needs", {
      headers: { origin: "http://localhost:3000", "idempotency-key": key },
      data: {
        description: "Seniorzy potrzebują wspólnej świetlicy i spotkań.",
      },
    });
  const first = await (await create()).json();
  const second = await (await create()).json();
  expect(first.id).toBe(second.id);
  const other = await browser.newContext();
  expect(
    (
      await other.request.get(`http://localhost:3000/api/needs/${first.id}`)
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.request.post(
        `http://localhost:3000/api/needs/${first.id}/matches`,
        { headers: { origin: "http://localhost:3000" }, data: {} },
      )
    ).status(),
  ).toBe(404);
  await other.close();
});
test("home renders and remains accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Duża zmiana",
  );
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("need → saved results → source detail; other sessions cannot access", async ({
  page,
  browser,
}) => {
  await page.goto("/potrzeby/nowa");
  await page
    .getByLabel("Co chcecie zmienić?")
    .fill(
      "Seniorzy mieszkający samotnie rzadko uczestniczą w spotkaniach. Mamy świetlicę i wolontariuszy.",
    );
  await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
  await expect(
    page.getByRole("heading", { name: "Propozycje do sprawdzenia" }),
  ).toBeVisible();
  const url = page.url();
  await expect(
    page.getByRole("heading", { name: "Sąsiedzki stół" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sąsiedzki stół" }),
  ).toBeVisible();
  const second = await browser.newContext();
  const other = await second.newPage();
  await other.goto(url);
  await expect(
    other.getByRole("heading", { name: "Nie znaleziono tej strony." }),
  ).toBeVisible();
  await second.close();
  await page.getByRole("link", { name: "Sąsiedzki stół" }).click();
  await expect(
    page.getByRole("heading", { name: "Źródła i pochodzenie" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("no match and empty catalog are explicit", async ({ page }) => {
  await page.goto("/potrzeby/nowa");
  await page
    .getByLabel("Co chcecie zmienić?")
    .fill("Naprawa silnika rakietowego na orbicie Marsa jest niemożliwa.");
  await page.getByRole("button", { name: "Znajdź rozwiązania" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Nie znaleźliśmy wystarczającego dopasowania",
    }),
  ).toBeVisible();
  await page.goto("/innowacje?q=zzzzzzzz");
  await expect(
    page.getByRole("heading", { name: "Brak wyników" }),
  ).toBeVisible();
});
test("narrow form, keyboard focus and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/potrzeby/nowa");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Przejdź do treści" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/form-mobile.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("cross-origin writes and admin requests are denied", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/needs", {
        headers: {
          origin: "https://other.example",
          "idempotency-key": crypto.randomUUID(),
        },
        data: { description: "Seniorzy potrzebują wspólnego miejsca spotkań." },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/admin/stats")).status()).toBe(403);
});
