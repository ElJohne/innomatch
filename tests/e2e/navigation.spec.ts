import { test, expect } from "@playwright/test";

test("header tracks navigation, filtered catalog and nested detail pages", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Menu główne", exact: true });
  await expect(nav.getByRole("link", { name: "Strona główna", exact: true })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Katalog innowacji" }).click();
  await expect(nav.locator("[aria-current]")).toHaveText("Katalog innowacji");
  await page.getByLabel("Szukaj w katalogu").fill("Sąsiedzki");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(nav.locator("[aria-current]")).toHaveText("Katalog innowacji");
  await page.getByRole("link", { name: "Sąsiedzki stół", exact: true }).click();
  await expect(nav.locator("[aria-current]")).toHaveAttribute("aria-current", "location");
  await nav.getByRole("link", { name: "Mam pomysł" }).click();
  await expect(nav.locator("[aria-current]")).toHaveText("Mam pomysł");
  for (const theme of ["Standardowy kontrast", "Biały tekst na czarnym tle", "Żółty tekst na czarnym tle", "Czarny tekst na żółtym tle"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(nav.locator("[aria-current]")).toHaveCSS("text-decoration-thickness", "3px");
  }
});
