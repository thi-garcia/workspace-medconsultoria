import { test, expect, type Page } from "@playwright/test";

// Responsividade FUNCIONAL: em cada tamanho, exercita um fluxo real (abrir lista, abrir/preencher
// modal, navegar) e garante que a PÁGINA não rola na horizontal e o modal cabe na tela.
test.use({ storageState: "e2e/.auth/admin.json" });

const VIEWPORTS = [
  { nome: "tablet 768×1024", w: 768, h: 1024 },
  { nome: "celular 390×844", w: 390, h: 844 },
  { nome: "celular 360×800", w: 360, h: 800 },
];

async function semOverflowHorizontal(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "página não deve rolar horizontalmente").toBeLessThanOrEqual(1);
}

for (const vp of VIEWPORTS) {
  test(`fluxo funcional cabe na tela — ${vp.nome}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h });

    // Lista de leads
    await page.goto("/leads");
    await expect(page.getByRole("button", { name: "Novo lead" })).toBeVisible();
    await semOverflowHorizontal(page);

    // Modal "Novo lead" cabe e é preenchível
    await page.getByRole("button", { name: "Novo lead" }).click();
    const d = page.getByRole("dialog");
    await expect(d).toBeVisible();
    await d.getByLabel("Nome *").fill("Teste responsivo");
    const box = await d.boundingBox();
    expect(box!.width, "modal cabe na largura da tela").toBeLessThanOrEqual(vp.w);
    await semOverflowHorizontal(page);
    await page.keyboard.press("Escape");

    // Financeiro também cabe
    await page.goto("/financeiro");
    await semOverflowHorizontal(page);
  });
}
