import { test, expect } from "@playwright/test";

// Login inválido — contexto SEM sessão (fresh).
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

// Logout — usa a sessão ADMIN salva.
test.describe("Auth — logout", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  test("sai da conta e volta ao login", async ({ page }) => {
    await page.goto("/");
    // Abre o menu do usuário (último botão da sidebar) e clica em "Sair da conta".
    await page.locator("aside").getByRole("button").last().click();
    await page.getByRole("button", { name: /sair da conta/i }).click();
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });
});
