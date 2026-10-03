import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("private need → coordinator inbox → reply → unread receipt; other session denied", async ({
  page,
  browser,
}) => {
  const origin = "http://localhost:3000";
  const description =
    "Syntetyczna potrzeba: seniorzy potrzebują wspólnych spotkań i świetlicy.";
  const created = await page.request.post("/api/needs", {
    headers: { origin, "idempotency-key": crypto.randomUUID() },
    data: { description },
  });
  const { id: needId } = await created.json();
  await page.goto(`/potrzeby/${needId}`);
  await page.getByRole("link", { name: "Zapytaj koordynatora" }).click();
  await page
    .getByLabel("O co chcesz zapytać koordynatora?")
    .fill("Jak rozpocząć współpracę? To wiadomość syntetyczna.");
  await page.getByRole("button", { name: "Wyślij do koordynatora" }).click();
  await expect(
    page.getByRole("heading", { name: "Rozmowa z koordynatorem" }),
  ).toBeVisible();
  const url = page.url();
  const threadId = url.split("/").at(-1)!;
  const other = await browser.newContext();
  const staffPage = await other.newPage();
  await staffPage.goto("/personel/logowanie");
  await staffPage
    .getByLabel("Adres e-mail personelu")
    .fill("coordinator@example.test");
  await staffPage
    .getByLabel("Hasło", { exact: true })
    .fill(process.env.MI_E2E_STAFF_PASSWORD!);
  await staffPage.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(
    staffPage.getByRole("heading", { name: "Skrzynka zgłoszeń" }),
  ).toBeVisible();
  await expect(staffPage.getByRole("status").first()).toContainText("1");
  await staffPage
    .getByRole("link", { name: new RegExp(threadId.slice(0, 8)) })
    .click();
  await staffPage.getByText("Potrzeba udostępniona koordynatorowi").click();
  await expect(staffPage.getByText(description, { exact: true })).toBeVisible();
  await staffPage
    .getByLabel("Nowa wiadomość")
    .fill("Zacznijmy od rozmowy o zasobach. Odpowiedź syntetyczna.");
  await staffPage
    .getByRole("button", { name: "Wyślij wiadomość", exact: true })
    .click();
  await expect(
    staffPage.getByText(
      "Zacznijmy od rozmowy o zasobach. Odpowiedź syntetyczna.",
    ),
  ).toBeVisible();
  await page.goto("/moje-sprawy");
  await expect(page.getByText("Nowe wiadomości: 1")).toBeVisible();
  await page
    .getByRole("link", { name: new RegExp(threadId.slice(0, 8)) })
    .click();
  await expect(
    page.getByText("Zacznijmy od rozmowy o zasobach. Odpowiedź syntetyczna."),
  ).toBeVisible();
  await page.reload();
  expect((await page.request.get(`/api/threads/${threadId}`)).status()).toBe(
    200,
  );
  const intruder = await browser.newContext();
  await intruder.request.post(`${origin}/api/needs`, {
    headers: { origin, "idempotency-key": crypto.randomUUID() },
    data: { description },
  });
  expect(
    (await intruder.request.get(`${origin}/api/threads/${threadId}`)).status(),
  ).toBe(404);
  expect(
    (
      await intruder.request.post(
        `${origin}/api/threads/${threadId}/messages`,
        {
          headers: { origin },
          data: { body: "Intrusion", requestKey: crypto.randomUUID() },
        },
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await intruder.request.post(`${origin}/api/threads/${threadId}/read`, {
        headers: { origin },
        data: { through: 1 },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await intruder.request.get(`${origin}/api/admin/threads`)).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post(`/api/threads/${threadId}/messages`, {
        headers: { origin: "https://other.example" },
        data: { body: "Intrusion", requestKey: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(403);
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
  await page.screenshot({
    path: "test-results/conversation-mobile.png",
    fullPage: true,
  });
  await staffPage.goto("/admin");
  await staffPage.getByRole("button", { name: "Wyloguj personel" }).click();
  await expect(
    staffPage.getByRole("heading", { name: "Logowanie koordynatora" }),
  ).toBeVisible();
  expect(
    (await other.request.get(`${origin}/api/threads/${threadId}`)).status(),
  ).toBe(404);
  await intruder.close();
  await other.close();
});

test("innovation contact is idempotent; forged roles and incorrect login are rejected", async ({
  page,
}) => {
  const origin = "http://localhost:3000";
  const data = {
    innovationId: "demo-sasiedzki-stol",
    body: "Syntetyczne pytanie o współpracę.",
    requestKey: crypto.randomUUID(),
  };
  const first = await page.request.post("/api/threads", {
    headers: { origin },
    data,
  });
  expect(first.status()).toBe(201);
  const { id } = await first.json();
  const second = await page.request.post("/api/threads", {
    headers: { origin },
    data,
  });
  expect((await second.json()).id).toBe(id);
  expect(
    (await (await page.request.get(`/api/threads/${id}`)).json()).messages,
  ).toHaveLength(1);
  expect(
    (
      await page.request.post(`/api/threads/${id}/messages`, {
        headers: { origin },
        data: {
          body: "Forged",
          requestKey: crypto.randomUUID(),
          authorRole: "STAFF",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { origin },
        data: { login: "coordinator@example.test", password: "wrong" },
      })
    ).status(),
  ).toBe(401);
  expect((await page.request.get("/api/admin/threads")).status()).toBe(403);
});
