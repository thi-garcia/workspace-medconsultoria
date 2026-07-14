import { test, expect } from "@playwright/test";

const PASS = process.env.E2E_PASSWORD ?? "medconsultoria123";

test.describe("Auth — login inválido", () => {
  test("mostra erro e permanece no login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("naoexiste@example.test");
    await page.locator('input[type="password"]').fill("senha-errada");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe("Auth — logout", () => {
  // NÃO reutiliza a sessão compartilhada (admin.json): faz login PRÓPRIO para não invalidar
  // a sessão usada pelos outros testes ao deslogar (isolamento).
  test("sai da conta e volta ao login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("thais.garcia@medconsultoria.com.br");
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.locator('input[type="password"]')).toHaveCount(0, { timeout: 15000 });

    await page.locator("aside").getByRole("button").last().click();
    await page.getByRole("button", { name: /sair da conta/i }).click();
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });
});
