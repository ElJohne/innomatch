import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function reviewSurface(page: Page, name: string) {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const scale of [100, 200]) {
      await page
        .getByRole("button", { name: `Rozmiar tekstu ${scale}%`, exact: true })
        .click();
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        scrollX,
        bodyWidth: document.body.scrollWidth,
        font: document.documentElement.style.fontSize,
        offenders: [...document.querySelectorAll("body *")]
          .filter(
            (el) => el.getBoundingClientRect().right + scrollX > innerWidth + 1,
          )
          .slice(0, 8)
          .map((el) => ({
            tag: el.tagName,
            className: el.className,
            width: el.getBoundingClientRect().width,
          })),
      }));
      if (overflow.width > width)
        await page.screenshot({
          path: "test-results/quality-overflow.png",
          fullPage: true,
        });
      expect(
        overflow.width,
        `${name}, ${width}px, ${scale}%: ${JSON.stringify(overflow)}`,
      ).toBeLessThanOrEqual(width);
      if (scale === 200 && width === 390) {
        await page.locator("main").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `test-results/quality-${name}-390-200.png`,
        });
      }
    }
  }
  for (const contrast of [
    "Standardowy kontrast",
    "Biały tekst na czarnym tle",
    "Żółty tekst na czarnym tle",
    "Czarny tekst na żółtym tle",
  ]) {
    await page.getByRole("button", { name: contrast, exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations, `${name}, ${contrast}`).toEqual([]);
  }
  await page
    .getByRole("button", { name: "Standardowy kontrast", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rozmiar tekstu 100%", exact: true })
    .click();
  await page.setViewportSize({ width: 1280, height: 900 });
}

test("core screens reflow at 320/390/1280 and 200% text, with four accessible contrast themes", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120000);
  const origin = new URL(baseURL!).origin;
  await page.goto("/");
  await page
    .getByLabel("Jakiej pomocy potrzebujesz?")
    .fill(
      "Seniorzy potrzebują regularnych spotkań w świetlicy z wolontariuszami.",
    );
  await reviewSurface(page, "form");
  await page.getByRole("button", { name: "Znajdź pomoc" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".match-card").first()).toBeVisible();
  const needId = new URL(page.url()).pathname.split("/").at(-1)!;
  await reviewSurface(page, "matches");
  const response = await page.request.post("/api/adaptations", {
    headers: { origin },
    data: {
      needId,
      innovationId: "demo-sasiedzki-stol",
      requestKey: crypto.randomUUID(),
      constraints: {
        institution: "Syntetyczna świetlica",
        resources: "Sala i wolontariusze",
        scope: "Mała dobrowolna grupa",
        budget: "",
        timeline: "",
      },
    },
  });
  expect(response.ok()).toBe(true);
  const plan = await response.json();
  await page.goto(`/adaptacje/${plan.id}/edycja`);
  await reviewSurface(page, "plan-editor");
  const threadResponse = await page.request.post("/api/threads", {
    headers: { origin },
    data: {
      adaptationId: plan.id,
      adaptationRevision: plan.revision,
      requestKey: crypto.randomUUID(),
      body: "Syntetyczne pytanie o pierwszy krok.",
    },
  });
  expect(threadResponse.ok()).toBe(true);
  await page.goto(`/wiadomosci/${(await threadResponse.json()).id}`);

  await reviewSurface(page, "conversation");
});
