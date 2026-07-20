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

// Trocar de conta: `/login` com sessão ativa REDIRECIONAVA em silêncio para o painel. Quem já
// estava logado nunca via o formulário — voltava ao painel ainda como o usuário anterior e
// concluía que a segunda conta não funcionava. Foi o que travou o dono em 20/07/2026.
test.describe("Auth — trocar de conta", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("/login com sessão ativa mostra quem está conectado, não redireciona calado", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Você já está conectado/i })).toBeVisible();
    // Precisa dizer QUEM — é o que se confere ao trocar de conta.
    await expect(page.getByText(/@medconsultoria\.com\.br/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar com outra conta/i })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/); // não foi expulso para "/"
  });

  test("'Entrar com outra conta' devolve o formulário e o login leva ao painel", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Entrar com outra conta/i }).click();

    // Voltou ao formulário de verdade.
    const senha = page.locator('input[type="password"]');
    await expect(senha).toBeVisible();

    await page.locator('input[type="email"]').fill("root@medconsultoria.com.br");
    await senha.fill(PASS);
    await page.getByRole("button", { name: /entrar/i }).click();

    // Cai no painel — e NÃO de volta em "Você já está conectado".
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Você já está conectado/i })).toHaveCount(0);
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
