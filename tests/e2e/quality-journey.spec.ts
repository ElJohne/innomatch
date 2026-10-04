import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function createNeed(page: Page, baseURL: string) {
  const response = await page.request.post("/api/needs", {
    headers: {
      origin: new URL(baseURL).origin,
      "idempotency-key": crypto.randomUUID(),
    },
    data: {
      description:
        "Seniorzy mieszkający samotnie potrzebują spotkań w świetlicy z wolontariuszami.",
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
async function accessibility(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test("unavailable search offers a retry for the same saved need, not a false no-match or a new form", async ({
  page,
  baseURL,
}) => {
  const need = await createNeed(page, baseURL!);
  const runId = crypto.randomUUID();
  let attempts = 0;
  await page.route(`**/api/needs/${need.id}/matches`, async (route) => {
    attempts++;
    if (attempts === 1) {
      await route.fulfill({
        json: {
          needId: need.id,
          runId,
          status: "unavailable",
          matches: [],
          relatedResources: [],
          clarifyingQuestions: [],
          mode: {
            retrieval: "keyword",
            explanation: "template",
            data: "synthetic",
          },
          warnings: [],
        },
      });
    } else {
      expect(route.request().postDataJSON()).toEqual({ retryOf: runId });
      await route.continue();
    }
  });
  await page.goto(`/potrzeby/${need.id}`);
  await expect(
    page.getByRole("heading", {
      name: "Nie udało się teraz sprawdzić dopasowania",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Nie znaleźliśmy wystarczającego dopasowania", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Opisz potrzebę ponownie/ }),
  ).toHaveCount(0);
  await accessibility(page);
  await page.getByRole("button", { name: "Ponów wyszukiwanie" }).click();
  await expect(page.locator(".match-card").first()).toBeVisible();
  expect(attempts).toBe(2);
  await expect(page).toHaveURL(new RegExp(`/potrzeby/${need.id}$`));
  await page.reload();
  await expect(page.locator(".match-card").first()).toBeVisible();
  expect(attempts).toBe(2);
});

test("evidence cards stay readable with keyboard, contrast, narrow viewport and 200% text", async ({
  page,
  baseURL,
}) => {
  const need = await createNeed(page, baseURL!);
  await page.goto(`/potrzeby/${need.id}`);
  const card = page.locator(".match-card").first();
  await expect(
    card.getByRole("heading", { name: "Sąsiedzki stół" }),
  ).toBeVisible();
  await expect(card.locator("blockquote")).toContainText(
    "Regularne spotkania seniorów",
  );
  const primary = card.getByRole("link", { name: /Zaplanuj pierwszy krok/ });
  await primary.focus();
  await expect(primary).toBeFocused();
  for (const name of [
    "Standardowy kontrast",
    "Biały tekst na czarnym tle",
    "Żółty tekst na czarnym tle",
    "Czarny tekst na żółtym tle",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await accessibility(page);
  }
  await page
    .getByRole("button", { name: "Standardowy kontrast", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/quality-results-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page
    .getByRole("button", { name: "Rozmiar tekstu 200%", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/quality-results-mobile-200.png",
    fullPage: true,
  });
});

test("evidence → saved editable first step → explicit sharing → coordinator reply → return; foreign session denied", async ({
  page,
  browser,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const need = await createNeed(page, baseURL!);
  await page.goto(`/potrzeby/${need.id}`);
  await page
    .locator(".match-card")
    .first()
    .getByRole("link", { name: /Zaplanuj pierwszy krok/ })
    .click();
  await page
    .getByLabel("Typ instytucji i jej rola")
    .fill("Syntetyczna świetlica");
  await page
    .getByLabel("Dostępne zasoby i ograniczenia")
    .fill("Sala i wolontariusze — do potwierdzenia");
  await page
    .getByLabel("Dla kogo i jaki zasięg usługi?")
    .fill("Dobrowolna grupa seniorów");
  await page.getByRole("button", { name: "Przygotuj szkic adaptacji" }).click();
  await expect(
    page.getByRole("heading", { name: "Twój pierwszy krok" }),
  ).toBeVisible();
  const planURL = page.url();
  const planId = planURL.split("/").at(-1)!;
  await expect(
    page.getByText("Nieustalony — przed działaniem trzeba oszacować koszty."),
  ).toBeVisible();
  await page.getByText("Edytuj szkic", { exact: true }).click();
  await page
    .getByLabel("Kto odpowiada?", { exact: true })
    .fill("Rola koordynatora świetlicy — do uzgodnienia");
  await page
    .getByLabel("Po czym poznamy, że krok jest wykonany?", { exact: true })
    .fill("Zapisano zakres pierwszego spotkania i listę potrzebnych zasobów.");
  await page.getByRole("button", { name: "Zapisz zmiany planu" }).click();
  await expect(page.getByRole("status")).toContainText("Zapisano nową wersję");
  await page.reload();
  await expect(page.locator(".first-step-grid")).toContainText(
    "Rola koordynatora świetlicy — do uzgodnienia",
  );
  const plan = await (
    await page.request.get(`/api/adaptations/${planId}`)
  ).json();
  expect(plan.revision).toBe(2);
  expect(plan.draft.firstStep.completion).toContain("Zapisano zakres");
  await accessibility(page);
  await page.screenshot({
    path: "test-results/quality-first-step.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page
    .getByRole("link", { name: "Zapytaj koordynatora", exact: true })
    .click();
  await expect(
    page.getByLabel("O co chcesz zapytać koordynatora?"),
  ).toHaveValue(/wersja 2/);
  const before = await page.request.get("/api/threads");
  expect((await before.json()).items).toEqual([]);
  await page
    .getByLabel("O co chcesz zapytać koordynatora?")
    .fill(
      "Syntetyczna konsultacja: proszę o ocenę pierwszego kroku i zasobów.",
    );
  await page.getByRole("button", { name: "Wyślij do koordynatora" }).click();
  await expect(page).toHaveURL(/\/wiadomosci\/[a-f0-9-]{36}$/);
  const threadURL = page.url(),
    threadId = threadURL.split("/").at(-1)!;
  const stranger = await browser.newContext();
  const staff = await browser.newContext();
  try {
    await stranger.request.post(`${origin}/api/needs`, {
      headers: { origin, "idempotency-key": crypto.randomUUID() },
      data: { description: "Syntetyczna potrzeba innej sesji" },
    });
    for (const resource of [
      `needs/${need.id}`,
      `adaptations/${planId}`,
      `threads/${threadId}`,
    ])
      expect(
        (await stranger.request.get(`${origin}/api/${resource}`)).status(),
      ).toBe(404);
    expect(
      (
        await stranger.request.post(`${origin}/api/needs/${need.id}/matches`, {
          headers: { origin },
          data: { retryOf: crypto.randomUUID() },
        })
      ).status(),
    ).toBe(404);
    const coordinator = await staff.newPage();
    await coordinator.goto("/personel/logowanie");
    await coordinator
      .getByLabel("Adres e-mail personelu")
      .fill("coordinator@example.test");
    await coordinator
      .getByLabel("Hasło", { exact: true })
      .fill(process.env.MI_E2E_STAFF_PASSWORD!);
    await coordinator.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(
      coordinator.getByRole("heading", { name: "Skrzynka zgłoszeń" }),
    ).toBeVisible();
    const shared = await (
      await staff.request.get(`${origin}/api/threads/${threadId}`)
    ).json();
    expect(shared.adaptation.draft.firstStep).toEqual(plan.draft.firstStep);
    const privateEdit = await page.request.patch(`/api/adaptations/${planId}`, {
      headers: { origin },
      data: {
        expectedRevision: plan.revision,
        draft: {
          ...plan.draft,
          summary: "Prywatna trzecia wersja przed konsultacją.",
        },
      },
    });
    expect(privateEdit.ok()).toBe(true);
    const beforeShare = await (
      await staff.request.get(`${origin}/api/threads/${threadId}`)
    ).json();
    expect(beforeShare.adaptation.revision).toBe(2);
    expect(JSON.stringify(beforeShare)).not.toContain(
      "Prywatna trzecia wersja",
    );
    await page.reload();
    await page
      .getByRole("button", {
        name: "Udostępnij wersję 3 koordynatorowi",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Autor udostępnił wersję 3 planu adaptacji.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      (
        await (
          await staff.request.get(`${origin}/api/threads/${threadId}`)
        ).json()
      ).adaptation.revision,
    ).toBe(3);
    await coordinator.goto(threadURL);
    await coordinator
      .getByLabel("Nowa wiadomość")
      .fill(
        "Syntetyczna odpowiedź: ustalmy dostępność sali przed pierwszym spotkaniem.",
      );
    await coordinator
      .getByRole("button", { name: "Wyślij wiadomość", exact: true })
      .click();
    await expect(
      coordinator
        .locator(".message-body")
        .filter({ hasText: "Syntetyczna odpowiedź: ustalmy" }),
    ).toBeVisible();
    await page.goto(planURL);
    await expect(page.getByRole("status")).toContainText("Nowe wiadomości: 1");
    await page.getByRole("link", { name: "Wróć do rozmowy" }).click();
    await expect(
      page.getByText(
        "Syntetyczna odpowiedź: ustalmy dostępność sali przed pierwszym spotkaniem.",
      ),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText(
        "Syntetyczna odpowiedź: ustalmy dostępność sali przed pierwszym spotkaniem.",
      ),
    ).toBeVisible();
  } finally {
    await stranger.close();
    await staff.close();
  }
});
