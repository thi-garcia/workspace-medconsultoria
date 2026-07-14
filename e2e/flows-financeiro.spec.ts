import { test, expect } from "@playwright/test";

// CENÁRIO 8 — Financeiro (UI real). Cria contas únicas; RBAC por perfil.
const RUN = `FIN${Date.now().toString().slice(-6)}`;

test.describe.serial("Cenário 8 — financeiro (ADMIN)", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  async function criarConta(page, tipo: "A pagar" | "A receber", descricao: string, valor: string) {
    await page.goto("/financeiro");
    await page.getByRole("button", { name: "Nova conta" }).click();
    const d = page.getByRole("dialog", { name: "Nova conta" });
    await d.getByLabel("Tipo").selectOption(tipo);
    await d.getByLabel("Valor *").fill(valor);
    await d.getByLabel("Descrição *").fill(descricao);
    await d.getByLabel("Vencimento *").fill("2026-07-28");
    await d.getByRole("button", { name: "Criar conta" }).click();
    await expect(d).toHaveCount(0);
  }

  test("cria conta a receber e a pagar e persiste após refresh", async ({ page }) => {
    await criarConta(page, "A receber", `${RUN} receber`, "R$ 1.500,00");
    await criarConta(page, "A pagar", `${RUN} pagar`, "R$ 800,00");
    await page.goto("/financeiro");
    await page.getByRole("button", { name: "Tudo" }).click();
    // a receber aparece na visão padrão; a pagar fica na aba "A pagar"
    await expect(page.getByText(`${RUN} receber`)).toBeVisible();
    await page.getByRole("button", { name: "A pagar", exact: true }).first().click();
    await expect(page.getByText(`${RUN} pagar`)).toBeVisible();
  });
});

test.describe("Cenário 8 — RBAC do Financeiro", () => {
  test("FUNCIONARIO não acessa /financeiro (URL direta)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/funcionario.json" });
    const page = await ctx.newPage();
    await page.goto("/financeiro");
    await expect(page.getByText("Acesso restrito")).toBeVisible();
    await ctx.close();
  });

  test("CLIENTE não vê o Financeiro (Portal)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/cliente.json" });
    const page = await ctx.newPage();
    await page.goto("/financeiro");
    await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
    await ctx.close();
  });
});
