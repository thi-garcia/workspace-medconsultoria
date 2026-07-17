import { test, expect } from "@playwright/test";

// Bloco 2 — Descoberta de catálogos em Ajustes. Categorias/Origens/Operadoras existiam
// só dentro de Financeiro/Vendas/Documentos; agora também abrem a partir de Ajustes.
test.describe("Bloco 2 — Catálogos em Ajustes (ADMIN)", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("Ajustes expõe Categorias/Origens/Operadoras e cada card abre seu diálogo", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/ajustes");

    // A nova seção "Catálogos" aparece.
    await expect(page.getByRole("heading", { name: "Catálogos" })).toBeVisible();

    const abrirEFechar = async (card: RegExp, dialogo: string) => {
      await page.getByRole("button", { name: card }).click();
      const d = page.getByRole("dialog", { name: dialogo });
      await expect(d).toBeVisible();
      await page.keyboard.press("Escape"); // sem edição → fecha sem aviso
      await expect(d).toHaveCount(0);
    };

    await abrirEFechar(/Categorias financeiras/, "Categorias financeiras");
    await abrirEFechar(/Origens de leads/, "Origens de lead");
    await abrirEFechar(/Operadoras e convênios/, "Operadoras e convênios");
  });
});
