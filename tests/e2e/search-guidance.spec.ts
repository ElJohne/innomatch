import { test, expect } from "@playwright/test";

test("three-character input, preserved clarification and urgent help before submission", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill("Mąż nie oddycha");
  await expect(
    page.getByRole("link", { name: "Zadzwoń 112 — służby ratunkowe" }),
  ).toHaveAttribute("href", "tel:112");
  await expect(
    page.getByRole("link", { name: "Zadzwoń 999 — pogotowie" }),
  ).toHaveAttribute("href", "tel:999");
  await page.screenshot({
    path: "test-results/urgent-help.png",
    fullPage: true,
  });
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill("abc");
  await page.getByRole("button", { name: "Znajdź wsparcie" }).click();
  await page.getByRole("button", { name: "Tak, wszystko się zgadza" }).click();
  await expect(
    page.getByRole("heading", { name: "Pomóż nam lepiej zrozumieć" }),
  ).toBeVisible();
  const originalUrl = page.url();
  const answer =
    "Seniorzy mieszkający samotnie potrzebują spotkań w świetlicy. Mamy wolontariuszy.";
  await page
    .getByLabel("Co się wydarzyło lub w czym najbardziej potrzebujesz pomocy?")
    .fill(answer);
  await page
    .getByRole("button", { name: "Uwzględnij odpowiedź i szukaj" })
    .click();
  await expect(page).not.toHaveURL(originalUrl);
  await expect(
    page.getByRole("heading", { name: "Wybierz organizację", exact: true }),
  ).toBeVisible();
  const id = page.url().split("/").at(-1);
  const body = await (await page.request.get(`/api/needs/${id}`)).json();
  expect(body.description).toBe("abc");
  expect(body.clarifications[0].answer).toBe(answer);
  expect(body.match.clarifyingQuestions).toEqual([]);
  await expect(
    page.getByRole("heading", { name: "Doprecyzujmy razem" }),
  ).toHaveCount(0);
  expect((await request.get(`/api/needs/${id}`)).status()).toBe(404);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Wybierz organizację", exact: true }),
  ).toBeVisible();
});

test("skip clarification reaches a saved result and stays there on refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Jakiej pomocy potrzebujesz?").fill("Pomocy");
  await page.getByRole("button", { name: "Znajdź wsparcie" }).click();
  await page.getByRole("button", { name: "Tak, wszystko się zgadza" }).click();
  await page
    .getByRole("button", { name: "Pokaż wyniki bez dodatkowych odpowiedzi" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Nie znaleźliśmy wystarczającego dopasowania",
    }),
  ).toBeVisible();
  const id = page.url().split("/").at(-1);
  const body = await (await page.request.get(`/api/needs/${id}`)).json();
  expect(body.skipClarification).toBe(true);
  expect(body.description).toBe("Pomocy");
  expect(body.match.clarifyingQuestions).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Doprecyzujmy razem" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Zapytaj koordynatora" }),
  ).toBeVisible();
});

test("server emergency result has contacts, no recommendations or coordinator; manual help works without JS", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/");
  // Exhaust only this synthetic session's search allowance. Emergency contacts
  // must still be returned without an AI slot or a remaining search allowance.
  for (let i = 0; i < 20; i++) {
    const draft = await page.request.post("/api/needs", {
      headers: { origin: baseURL!, "idempotency-key": crypto.randomUUID() },
      data: { description: "abc" },
    });
    expect(draft.status()).toBe(201);
    const draftId = (await draft.json()).id;
    expect(
      (
        await page.request.post(`/api/needs/${draftId}/matches`, {
          headers: { origin: baseURL! },
          data: {},
        })
      ).status(),
    ).toBe(200);
  }
  const n = await page.request.post("/api/needs", {
    headers: { origin: baseURL!, "idempotency-key": crypto.randomUUID() },
    data: { description: "Mąż nie oddycha" },
  });
  expect(n.status()).toBe(201);
  const id = (await n.json()).id;
  await page.goto(`/potrzeby/${id}`);
  await expect(
    page.getByRole("heading", { name: "Najpierw zadbaj o bezpieczeństwo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Zapytaj koordynatora" }),
  ).toHaveCount(0);
  const match = await page.request.post(`/api/needs/${id}/matches`, {
    headers: { origin: baseURL! },
    data: {},
  });
  const result = await match.json();
  expect(result.contacts).toEqual(["112", "999"]);
  expect(result.matches).toEqual([]);
  expect(result.relatedResources).toEqual([]);
  const offline = await browser.newContext({ javaScriptEnabled: false });
  const manual = await offline.newPage();
  await manual.goto(`${baseURL}/pilna-pomoc`);
  await expect(
    manual.getByRole("link", { name: "Zadzwoń 112 — służby ratunkowe" }),
  ).toBeVisible();
  await offline.close();
});
