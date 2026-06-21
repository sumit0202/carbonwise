import { expect, test } from "@playwright/test";

/**
 * Core journey: onboarding -> calculate -> recommendation -> mark action done.
 * Runs against the app in demo mode (no Google keys), so it is fully offline
 * and deterministic.
 */
test("a user can onboard, calculate, and complete a recommendation", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /understand and shrink/i }),
  ).toBeVisible();

  // Onboarding
  await page.getByRole("button", { name: /^calculate my footprint$/i }).click();
  await page.getByLabel(/city or area/i).fill("Seattle");
  await page.getByLabel("Diet style").selectOption("heavy_meat");
  await page.getByRole("button", { name: /^calculate my footprint$/i }).click();

  // Calculator result
  await expect(
    page.getByRole("heading", { name: /your carbon footprint/i }),
  ).toBeVisible();
  await expect(page.getByText(/top contributor/i).first()).toBeVisible();

  // Recommendation
  await page.getByRole("button", { name: "EcoGuide" }).click();
  await expect(
    page.getByRole("heading", { name: /your personalized assistant/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^mark done$/i })
    .first()
    .click();

  // Dashboard reflects the completed action
  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(page.getByText(/1 completed/i)).toBeVisible();
});

test("the health endpoint reports demo mode", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.demoMode).toBe(true);
});
