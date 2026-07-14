import { test, expect } from "@playwright/test";

/**
 * Proteção de rota por PERFIL (defesa no cliente; o backend reexige nas procedures).
 * Cada teste usa a sessão salva do papel e verifica acesso permitido × proibido.
 */
const RESTRITO = "Acesso restrito";

test.describe("FUNCIONARIO", () => {
  test.use({ storageState: "e2e/.auth/funcionario.json" });
  test("acessa Clientes, mas NÃO Financeiro nem Sistema", async ({ page }) => {
    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
    await page.goto("/financeiro");
    await expect(page.getByText(RESTRITO)).toBeVisible();
    await page.goto("/sistema");
    await expect(page.getByText(RESTRITO)).toBeVisible();
  });
});

test.describe("ADMIN", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  test("acessa Financeiro, mas NÃO Sistema (ROOT)", async ({ page }) => {
    await page.goto("/financeiro");
    await expect(page.getByText(RESTRITO)).toHaveCount(0);
    await page.goto("/sistema");
    await expect(page.getByText(RESTRITO)).toBeVisible();
  });
});

test.describe("ROOT", () => {
  test.use({ storageState: "e2e/.auth/root.json" });
  test("acessa o painel Sistema", async ({ page }) => {
    await page.goto("/sistema");
    await expect(page.getByText(RESTRITO)).toHaveCount(0);
  });
});

test.describe("CLIENTE (Portal)", () => {
  test.use({ storageState: "e2e/.auth/cliente.json" });
  test("vê o Portal e NÃO as páginas internas da equipe", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
    // Navegar direto para rota interna não expõe o conteúdo da equipe (App.tsx renderiza o Portal).
    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
    await expect(page.getByText("Total de clientes")).toHaveCount(0);
  });
});
