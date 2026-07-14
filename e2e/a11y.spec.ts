import { test, expect } from "@playwright/test";

/** Acessibilidade dos componentes estruturais (Modal, Combobox). Sessão ADMIN. */
test.use({ storageState: "e2e/.auth/admin.json" });

test.describe("Modal — acessibilidade e foco", () => {
  test("role=dialog, aria-modal, foco inicial dentro, Escape fecha e restaura o foco", async ({ page }) => {
    await page.goto("/clientes");
    const abrir = page.getByRole("button", { name: "Novo cliente" });
    await abrir.focus();
    await abrir.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // Tem nome acessível (aria-labelledby aponta para o título).
    await expect(dialog).toHaveAttribute("aria-labelledby", /.+/);

    // Foco inicial ficou DENTRO do modal.
    const focoDentro = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    expect(focoDentro).toBe(true);

    // Escape fecha.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    // Foco restaurado para o botão que abriu.
    const voltouProBotao = await page.evaluate(() => document.activeElement?.textContent?.includes("Novo cliente") ?? false);
    expect(voltouProBotao).toBe(true);
  });
});

test.describe("Combobox — acessibilidade", () => {
  test("role=combobox e aria-expanded alterna ao abrir", async ({ page }) => {
    await page.goto("/documentos");
    await page.getByRole("button", { name: "Novo documento" }).click();
    const combo = page.getByRole("combobox", { name: /o que criar/i }).first();
    await expect(combo).toBeVisible();
    await expect(combo).toHaveAttribute("aria-expanded", "false");
    await combo.click();
    await expect(combo).toHaveAttribute("aria-expanded", "true");
    await expect(combo).toHaveAttribute("aria-controls", /.+/);
  });
});
