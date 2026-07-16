import { test, expect } from "@playwright/test";

// Bloco 6 — Documentos PELA INTERFACE: criar por modelo (Novo documento inteligente),
// persistir (refresh + reabrir), editar o conteúdo e salvar, e imprimir/visualizar.
// (o widget REAL de upload/baixar/remover está em flows-documentos-ui.spec.ts)
test.use({ storageState: "e2e/.auth/admin.json" });

test("criar documento por modelo, persistir, editar conteúdo e imprimir", async ({ page }) => {
  test.setTimeout(60_000);
  const RUN = `DOC${Date.now().toString().slice(-6)}`;
  const TITULO = `Escopo ${RUN}`;

  // 1. Novo documento → escolher o modelo (Combobox) → "Gerar documento"
  await page.goto("/documentos");
  await page.getByRole("button", { name: "Novo documento" }).click();
  const d = page.getByRole("dialog");
  await d.getByPlaceholder("Escolha o tipo de documento…").fill("Escopo");
  await page.getByRole("option", { name: /Escopo de trabalho/ }).click();
  await d.getByLabel("Título").fill(TITULO);
  await d.getByLabel("Objetivo").fill(`Objetivo do ${RUN}`);
  await d.getByRole("button", { name: "Gerar documento" }).click();

  // 2. Navega para a ficha do documento (h1 = título)
  await expect(page).toHaveURL(/\/documentos\/[a-z0-9]+/i, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: TITULO }).first()).toBeVisible();
  const url = page.url();

  // 3. Refresh → persiste
  await page.reload();
  await expect(page.getByRole("heading", { name: TITULO }).first()).toBeVisible();

  // 4. Editar o conteúdo (Textarea) e salvar
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  const editor = page.locator("textarea").first();
  await expect(editor).toBeVisible();
  await editor.fill(`# ${TITULO}\n\nConteúdo editado ${RUN}.`);
  await page.getByRole("button", { name: "Salvar versão" }).click();
  // sai do modo edição (volta o botão Editar)
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeVisible({ timeout: 10_000 });

  // 5. Refresh → o conteúdo editado persiste (reabre em edição e confere)
  await page.reload();
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(page.locator("textarea").first()).toHaveValue(new RegExp(`Conteúdo editado ${RUN}`));
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();

  // 6. Imprimir/visualizar: o botão de impressão (PDF) existe e é acionável
  await expect(page.getByRole("button", { name: /PDF|Imprimir/i }).first()).toBeVisible();

  // 7. Confirma a URL estável (mesmo documento)
  expect(page.url()).toBe(url);
});
