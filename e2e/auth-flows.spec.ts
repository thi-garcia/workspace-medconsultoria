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

  // O navegador autopreenche contas antigas. Sem ver QUAL e-mail foi enviado, a pessoa jura
  // que digitou o certo e fica presa em "senha incorreta" — foi exatamente o que aconteceu
  // depois da limpeza de dados, com o Chrome repondo uma conta que não existe mais.
  test("o erro mostra qual e-mail foi tentado (denuncia autofill de conta antiga)", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("conta-antiga@example.test");
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByRole("alert")).toContainText("conta-antiga@example.test");
    await expect(page.getByRole("alert")).toContainText(/navegador pode ter preenchido outro/i);
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
