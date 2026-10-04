import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const base = `http://127.0.0.1:${process.env.MI_E2E_PORT || "3300"}`;
const description =
  "Seniorzy mieszkający samotnie rzadko uczestniczą w spotkaniach. Mamy świetlicę i wolontariuszy.";
async function review(page: Page, text = description) {
  await page.goto("/");
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill(text);
  await page.getByRole("button", { name: "Znajdź pomoc" }).click();
  await expect(page).toHaveURL(/\/potrzeby\/[a-f0-9-]{36}$/);
}
async function accessible(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}
test("home has the problem field, no category picker and accessible design", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Potrzebujesz pomocy",
  );
  await expect(page.getByLabel("Jakiej pomocy potrzebujesz?")).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await accessible(page);
});
test("failed submission preserves the description and retries without a confirmation step", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill(description);
  await page.route("**/api/needs", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Usługa jest niedostępna." },
    }),
  );
  await page.getByRole("button", { name: "Znajdź pomoc" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "niedostępna",
  );
  await expect(page.getByLabel("Jakiej pomocy potrzebujesz?")).toHaveValue(
    description,
  );
  await page.unroute("**/api/needs");
  await page.getByRole("button", { name: "Znajdź pomoc" }).click();
  await expect(
    page.getByRole("heading", { name: "Wybierz pomoc" }),
  ).toBeVisible();
});
test("three steps lead to a saved private conversation and reject another owner", async ({
  page,
  browser,
}) => {
  await review(page);
  await expect(page.locator(".match-card").first()).toBeVisible();
  await accessible(page);
  const needUrl = page.url();
  await page
    .locator(".match-card")
    .first()
    .getByRole("link", { name: /Wybieram/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Co zrobić teraz?" }),
  ).toBeVisible();
  const planUrl = page.url();
  await expect(
    page.getByRole("link", { name: /Przygotuj plan dla instytucji/ }),
  ).toHaveCount(0);
  await accessible(page);
  await page.getByRole("button", { name: "Poproś o pomoc →" }).click();
  await expect(page).toHaveURL(/\/wiadomosci\/[a-f0-9-]{36}/);
  const threadUrl = page.url();
  await page.goto(planUrl);
  await page.getByRole("button", { name: "Otwórz moją rozmowę →" }).click();
  await expect(page).toHaveURL(threadUrl.split("?")[0]);
  const other = await browser.newContext();
  const stranger = await other.newPage();
  for (const url of [needUrl, planUrl, threadUrl]) {
    await stranger.goto(url);
    await expect(
      stranger.getByRole("heading", { name: "Nie znaleziono tej strony." }),
    ).toBeVisible();
  }
  await other.close();
  await page.goto(`${needUrl}/plan?organizacja=unknown`);
  await expect(
    page.getByRole("heading", { name: "Nie znaleziono tej strony." }),
  ).toBeVisible();
});
test("no match and empty catalog remain explicit", async ({ page }) => {
  await review(
    page,
    "Naprawa silnika rakietowego na orbicie Marsa jest niemożliwa.",
  );
  await expect(
    page.getByRole("heading", {
      name: "Nie znaleźliśmy pasującego rozwiązania",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Wybierz organizację/ }),
  ).toHaveCount(0);
  await page.goto("/innowacje?q=zzzzzzzz");
  await expect(
    page.getByRole("heading", { name: "Brak wyników" }),
  ).toBeVisible();
});
test("mobile complete flow, keyboard skip, text 200% and high contrast", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Przejdź do treści" }),
  ).toBeFocused();
  const reflow = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  await reflow();
  await accessible(page);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Rozmiar tekstu 200%", exact: true })
    .click();
  await reflow();
  await page
    .getByRole("button", { name: "Biały tekst na czarnym tle" })
    .click();
  await accessible(page);
  await page
    .getByRole("button", { name: "Rozmiar tekstu 100%", exact: true })
    .click();
  await page.getByRole("button", { name: "Standardowy kontrast" }).click();
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill(description);
  await page.getByRole("button", { name: "Znajdź pomoc" }).click();
  await reflow();
  await page.getByRole("link", { name: /Wybieram — Sąsiedzki stół/ }).click();
  await reflow();
  await accessible(page);
  await page.screenshot({
    path: "test-results/plan-mobile.png",
    fullPage: true,
  });
});
test("session retries idempotent, other owner and cross-origin denied", async ({
  page,
  browser,
  request,
}) => {
  await page.goto("/");
  const key = crypto.randomUUID();
  const create = () =>
    page.request.post("/api/needs", {
      headers: { origin: base, "idempotency-key": key },
      data: { description },
    });
  const first = await (await create()).json();
  const second = await (await create()).json();
  expect(first.id).toBe(second.id);
  const other = await browser.newContext();
  expect(
    (await other.request.get(`${base}/api/needs/${first.id}`)).status(),
  ).toBe(404);
  expect(
    (
      await other.request.post(`${base}/api/needs/${first.id}/matches`, {
        headers: { origin: base },
        data: {},
      })
    ).status(),
  ).toBe(404);
  await other.close();
  expect(
    (
      await request.post("/api/needs", {
        headers: {
          origin: "https://other.example",
          "idempotency-key": crypto.randomUUID(),
        },
        data: { description },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/admin/stats")).status()).toBe(403);
});

test("question is above the fold and all accessibility controls are exposed", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1008, height: 600 },
    { width: 390, height: 844 },
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const field = await page
      .getByLabel("Jakiej pomocy potrzebujesz?")
      .boundingBox();
    expect(field).not.toBeNull();
    expect(field!.y).toBeGreaterThanOrEqual(0);
    expect(field!.y + field!.height).toBeLessThanOrEqual(viewport.height);
    await expect(
      page.getByRole("button", { name: "Czytaj", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Zatrzymaj odczyt" }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 1008, height: 600 });
  await page.goto("/");
  await expect(page).toHaveTitle(/Pomocny Punkt/);
  await expect(
    page.getByRole("link", { name: "Małopolska ↗", exact: true }),
  ).toHaveAttribute("href", "https://www.malopolska.pl");
  await page.screenshot({ path: "test-results/first-screen.png" });
  for (const name of [
    "Biały tekst na czarnym tle",
    "Żółty tekst na czarnym tle",
    "Czarny tekst na żółtym tle",
    "Standardowy kontrast",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await accessible(page);
  }
});

test("reading controls call Polish speech and stop", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: () => {},
        getVoices: () => [],
        speak: (speech: SpeechSynthesisUtterance) => {
          if (
            speech.lang !== "pl-PL" ||
            !speech.text.includes("Potrzebujesz pomocy")
          )
            throw new Error("Invalid reading text");
          speech.onstart?.(new Event("start") as SpeechSynthesisEvent);
        },
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Czytaj", exact: true }).click();
  await expect(page.locator(".speech-status")).toContainText(
    "Czytamy treść strony",
  );
  await page.getByRole("button", { name: "Zatrzymaj odczyt" }).click();
  await expect(page.locator(".speech-status")).toContainText("zatrzymany");
});

test("voice input appends editable Polish dictation, stops and handles denial", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class Recognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        if (this.lang !== "pl-PL") throw new Error("Expected Polish");
        if (location.search.includes("denied")) {
          setTimeout(() => {
            this.onerror?.({ error: "not-allowed" });
            this.onend?.();
          }, 0);
        } else {
          this.onresult?.({
            resultIndex: 0,
            results: [
              {
                isFinal: true,
                0: { transcript: "Potrzebuję pomocy w zakupach." },
              },
            ],
          });
        }
      }
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: Recognition,
    });
  });
  await page.goto("/");
  const field = page.getByLabel("Jakiej pomocy potrzebujesz?");
  await field.fill("Mieszkam w Krakowie.");
  await page.getByRole("button", { name: "Powiedz głosem" }).click();
  await expect(field).toHaveValue(
    "Mieszkam w Krakowie. Potrzebuję pomocy w zakupach.",
  );
  await page.getByRole("button", { name: "Stop — zakończ dyktowanie" }).click();
  await expect(page.locator(".voice-status")).toContainText("zakończone");
  await field.fill(description);
  await page.getByRole("button", { name: "Znajdź pomoc" }).click();
  await expect(page).toHaveURL(/\/potrzeby\/[a-f0-9-]{36}$/);
  const saved = await (
    await page.request.get(`/api/needs/${page.url().split("/").at(-1)}`)
  ).json();
  expect(saved.description).toBe(description);
  await page.goto("/?denied");
  await page.getByRole("button", { name: "Powiedz głosem" }).click();
  await expect(page.locator(".voice-status")).toContainText(
    "Nie udzielono dostępu",
  );
});

test("voice input explains unsupported browsers without changing typed text", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
    });
  });
  await page.goto("/");
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill(description);
  await page.getByRole("button", { name: "Powiedz głosem" }).click();
  await expect(page.locator(".voice-status")).toContainText(
    "nie obsługuje dyktowania",
  );
  await expect(page.getByLabel("Jakiej pomocy potrzebujesz?")).toHaveValue(
    description,
  );
});
