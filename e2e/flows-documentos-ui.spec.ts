import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Bloco 6 — Documentos/arquivos PELA INTERFACE: o widget REAL de upload na ficha do cliente
// (anexar → aparece → baixar → conteúdo confere → remover → some após refresh).
// Os testes HTTP de segurança (415/413/403/401/isolamento) permanecem em flows-arquivos.
test.use({ storageState: "e2e/.auth/admin.json" });

const ACME = "cmr3t8hbf000ehy7g762b5dsu"; // cliente do Portal (seed)
const CONTEUDO = Buffer.from(`%PDF-1.4\nwidget-upload-e2e ${Date.now()}\n%%EOF\n`);

test("upload pela UI: widget real anexa, lista, baixa (conteúdo confere) e remove", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`/clientes/${ACME}`);
  const nome = `widget-e2e-${Date.now().toString().slice(-6)}.pdf`;

  // 1. Anexar pelo widget REAL (input file oculto atrás do botão "Anexar documento")
  const botao = page.getByRole("button", { name: "Anexar documento" });
  await expect(botao).toBeVisible();
  await botao.scrollIntoViewIfNeeded();
  await botao.locator('xpath=preceding-sibling::input[@type="file"]').setInputFiles({ name: nome, mimeType: "application/pdf", buffer: CONTEUDO });

  // 2. Aparece na lista da ficha
  const link = page.getByRole("link", { name: new RegExp(nome) });
  await expect(link).toBeVisible({ timeout: 15_000 });

  // 3. Baixar pela interface e conferir que o conteúdo é idêntico ao enviado
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  const caminho = await download.path();
  expect(Buffer.compare(readFileSync(caminho!), CONTEUDO), "arquivo baixado == enviado").toBe(0);

  // 4. Remover pela interface (botão "Remover" da MESMA linha = o 1º após o link no DOM) + confirmar
  await link.locator('xpath=following::button[@title="Remover"][1]').click();
  await page.getByRole("dialog").filter({ hasText: "Remover documento" }).getByRole("button", { name: "Remover" }).click();

  // 5. Refresh → sumiu
  await page.reload();
  await expect(page.getByRole("link", { name: new RegExp(nome) })).toHaveCount(0);
});
