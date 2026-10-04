import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("product entries, mobile action order and reviewable desktop/mobile layouts", async ({
  page,
}) => {
  for (const [name, path] of [
    ["home", "/"],
    ["cooperation", "/wspolpraca"],
    ["idea", "/pomysly/nowy"],
    ["solution", "/innowacje/demo-sasiedzki-stol"],
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width !== 320)
        await page.screenshot({
          path: `docs/screenshots/priority-one-${name}-${width}.png`,
          fullPage: true,
        });
    }
    await page
      .getByRole("button", { name: "Rozmiar tekstu 200%", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Rozmiar tekstu 100%", exact: true })
      .click();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
  const summary = page.locator("main .lead");
  const action = page.getByRole("heading", {
    name: "Skorzystaj z rozwiązania",
  });
  const description = page.getByRole("heading", {
    name: "Na jaką potrzebę odpowiada?",
  });
  expect((await action.boundingBox())!.y).toBeGreaterThan(
    (await summary.boundingBox())!.y,
  );
  expect((await action.boundingBox())!.y).toBeLessThan(
    (await description.boundingBox())!.y,
  );
  await page
    .getByRole("link", { name: "Chcę testować lub dodać opinię" })
    .click();
  await expect(page).toHaveURL(/#testowanie$/);
  await expect(
    page.getByRole("button", { name: "Zgłoś chęć udziału" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page
      .getByRole("navigation", { name: "Poznaj możliwości" })
      .getByRole("link"),
  ).toHaveCount(4);
  await expect(
    page.locator(".header").getByRole("link", { name: "Małopolska" }),
  ).toHaveCount(0);
  await expect(
    page.locator("footer").getByRole("link", { name: "Małopolska" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Przejdź do treści" }),
  ).toBeFocused();
});

test("support entry preselects purpose and saves a private coordinator request", async ({
  page,
  browser,
}) => {
  for (const [label, purpose, field] of [
    [
      "Mam pytanie do koordynatora",
      "CONSULTATION",
      "O co chcesz zapytać koordynatora?",
    ],
    ["Potrzebuję mentora", "MENTORSHIP", "W czym potrzebujesz pomocy mentora?"],
    [
      "Szukam partnera do działania",
      "PARTNERSHIP",
      "Kogo szukasz i co proponujesz?",
    ],
  ]) {
    await page.goto("/wspolpraca");
    await page.getByRole("link", { name: `${label} →`, exact: true }).click();
    await expect(page.getByLabel("Jakiego wsparcia szukasz?")).toHaveValue(
      purpose,
    );
    const text = `Syntetyczny przykład QA ${purpose}: szukam wsparcia w organizacji spotkań. Proponuję salę i pomoc wolontariuszy.`;
    await page.getByLabel(field, { exact: true }).fill(text);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page
      .getByRole("button", { name: "Wyślij do koordynatora", exact: true })
      .click();
    await expect(page).toHaveURL(/\/wiadomosci\/[a-f0-9-]{36}$/);
    await expect(page.locator("main")).toContainText(text);
    await page.reload();
    await expect(page.locator("main")).toContainText(text);
    const outsider = await browser.newContext();
    try {
      const origin = new URL(page.url()).origin;
      expect(
        (
          await outsider.request.get(
            origin +
              "/api/threads/" +
              new URL(page.url()).pathname.split("/").at(-1),
          )
        ).status(),
      ).toBe(401);
      await outsider.request.post(origin + "/api/needs", {
        headers: { origin, "idempotency-key": crypto.randomUUID() },
        data: { description: "Syntetyczna potrzeba obcej sesji." },
      });
      expect(
        (
          await outsider.request.get(
            origin +
              "/api/threads/" +
              new URL(page.url()).pathname.split("/").at(-1),
          )
        ).status(),
      ).toBe(404);
    } finally {
      await outsider.close();
    }
  }
  await page.goto("/wiadomosci/nowa?purpose=UNKNOWN");
  await expect(
    page.getByRole("heading", { name: /Nie znaleziono/ }),
  ).toBeVisible();
});

test("solution request names its immediate send and returns to the saved conversation", async ({
  page,
}) => {
  await page.goto("/innowacje/demo-sasiedzki-stol");
  await page
    .getByRole("button", { name: "Wyślij prośbę do koordynatora" })
    .click();
  await expect(page).toHaveURL(/\/wiadomosci\/[a-f0-9-]{36}\?sent=1$/);
  const url = page.url().split("?")[0];
  await page.goto("/innowacje/demo-sasiedzki-stol");
  await page.getByRole("link", { name: "Otwórz moją rozmowę" }).click();
  await expect(page).toHaveURL(url);
});
