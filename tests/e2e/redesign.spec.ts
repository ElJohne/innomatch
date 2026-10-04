import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("knowledge navigation exposes regional sources and filters without disclosures", async ({
  page,
}) => {
  await page.goto("/innowacje");
  await page.screenshot({
    path: "test-results/redesign-catalog.png",
    fullPage: false,
  });
  await expect(page.getByLabel("Odbiorcy", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Dane regionu", exact: true }).click();
  await page
    .getByLabel("Powiat lub miasto na prawach powiatu")
    .selectOption({ label: "miasto Kraków" });
  await expect(page.locator("main article")).toHaveCount(4);
  await expect(page.locator("main")).toContainText("19,89");
  await expect(
    page.getByRole("link", {
      name: "Źródło w Obserwatorze ROPS (nowa karta) ↗",
    }),
  ).toHaveCount(4);
  await expect(page.locator("main details")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/redesign-region.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Materiały i raporty", exact: true })
    .click();
  await page.getByLabel("Temat lub tytuł").fill("zzzzzz");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Brak materiałów" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Wyczyść filtry" }).click();
  await expect(page.getByLabel("Temat lub tytuł")).toBeEmpty();
});

test("testing interest, rating and moderation retain their real lifecycle", async ({
  page,
  browser,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  await page.goto("/innowacje/demo-sasiedzki-stol");
  await expect(
    page.getByRole("heading", { name: "Materiały źródłowe" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zgłoś chęć udziału" }).click();
  await expect(
    page.getByRole("heading", { name: "Twoje zgłoszenie do testów" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Zgłoś chęć udziału" }),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: "4 z 5", exact: true }).check();
  const comment =
    "Syntetyczna opinia QA: spotkania są przydatne, potrzebny jest jasny harmonogram.";
  await page
    .getByRole("textbox", { name: "Twoja opinia", exact: true })
    .fill(comment);
  await page
    .getByLabel("Propozycje ulepszeń (opcjonalnie)")
    .fill("Stała godzina spotkań.");
  await page
    .getByRole("checkbox", { name: /Zgadzam się na publikację/ })
    .check();
  await page
    .getByRole("button", { name: "Zapisz opinię do moderacji" })
    .click();
  await expect(
    page.getByText("Opinia zapisana. Czeka na moderację."),
  ).toBeVisible();
  await expect(
    page.locator("article .message-body").filter({ hasText: comment }),
  ).toHaveCount(0);
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
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/redesign-testing-mobile.png",
    fullPage: true,
  });
  const staff = await browser.newContext();
  try {
    const admin = await staff.newPage();
    await admin.goto("/personel/logowanie");
    await admin
      .getByLabel("Adres e-mail personelu")
      .fill("coordinator@example.test");
    await admin
      .getByLabel("Hasło", { exact: true })
      .fill(process.env.MI_E2E_STAFF_PASSWORD!);
    await admin.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(admin).toHaveURL(/\/admin$/);
    await admin.goto("/admin/opinie");
    const opinion = admin.locator("article").filter({ hasText: comment });
    await opinion.getByRole("checkbox").check();
    await opinion.getByRole("button", { name: "Opublikuj opinię" }).click();
    await expect(
      opinion.getByRole("button", { name: "Opublikuj opinię" }),
    ).toHaveCount(0);
    await page.reload();
    await expect(
      page.locator("article .message-body").filter({ hasText: comment }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Twoja opinia", exact: true })
      .fill(comment + " Aktualizacja.");
    await page
      .getByRole("checkbox", { name: /Zgadzam się na publikację/ })
      .check();
    await page
      .getByRole("button", { name: "Zapisz opinię do moderacji" })
      .click();
    await expect(
      page.getByText("Opinia zapisana. Czeka na moderację."),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator("article .message-body").filter({ hasText: comment }),
    ).toHaveCount(0);
    expect(
      (await page.request.get(`${origin}/api/admin/analytics`)).status(),
    ).toBe(403);
  } finally {
    await staff.close();
  }
});
