import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const themes = [
  "Standardowy kontrast",
  "Biały tekst na czarnym tle",
  "Żółty tekst na czarnym tle",
  "Czarny tekst na żółtym tle",
];
for (const route of ["/", "/innowacje", "/pomysly/nowy"]) {
  test(`all contrast themes remain accessible on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    for (const name of themes) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (name !== themes[0]) {
        const field = page.locator("main input, main textarea").first();
        await field.focus();
        const styles = await field.evaluate((el) => ({
          color: getComputedStyle(el).color,
          placeholder: getComputedStyle(el, "::placeholder").color,
          outline: getComputedStyle(el).outlineStyle,
        }));
        expect(styles.placeholder).toBe(styles.color);
        expect(styles.outline).toBe("dashed");
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Rozmiar tekstu 200%", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (route === "/innowacje")
      await page.screenshot({
        path: "test-results/catalog-contrast.png",
        fullPage: true,
      });
  });
}

test("hover feedback stays visible and readable in every theme", async ({
  page,
}) => {
  await page.goto("/innowacje");
  const search = page.getByRole("button", { name: "Szukaj", exact: true });
  for (const name of themes) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.mouse.move(0, 0);
    const before = await search.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await search.hover();
    const after = await search.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      outline: getComputedStyle(el).outlineStyle,
    }));
    expect(after.background).not.toBe(before);
    expect(after.outline).toBe("solid");
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const link = page.locator("article.card h2 a").first();
    await link.hover();
    expect(
      await link.evaluate((el) => getComputedStyle(el).textDecorationThickness),
    ).toBe("2px");
    const field = page.getByLabel("Szukaj w katalogu");
    await field.hover();
    expect(
      await field.evaluate((el) => getComputedStyle(el).boxShadow),
    ).not.toBe("none");
  }
});
