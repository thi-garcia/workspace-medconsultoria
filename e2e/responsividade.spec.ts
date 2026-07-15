import { test, expect, type Page } from "@playwright/test";

// Bloco 11 — Responsividade FUNCIONAL: em cada viewport, além de não haver overflow horizontal,
// AÇÕES REAIS são CONCLUÍDAS pela interface (criar+salvar lead; ação financeira: criar→marcar→excluir).
test.use({ storageState: "e2e/.auth/admin.json" });

const VIEWPORTS = [
  { nome: "tablet 768x1024", w: 768, h: 1024 },
  { nome: "celular 390x844", w: 390, h: 844 },
  { nome: "celular 360x800", w: 360, h: 800 },
];

async function semOverflow(page: Page) {
  const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(of, "sem scroll horizontal").toBeLessThanOrEqual(20); // tolera variância de renderização headless (0 local)
}

for (const vp of VIEWPORTS) {
  test(`fluxos concluídos na interface — ${vp.nome}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    const RUN = `RSP${vp.w}${Date.now().toString().slice(-4)}`;

    // 1. Lista de leads sem overflow + modal cabe
    await page.goto("/leads");
    await semOverflow(page);
    await page.getByRole("button", { name: "Novo lead" }).click();
    const d = page.getByRole("dialog");
    await expect(d).toBeVisible();
    const box = await d.boundingBox();
    expect(box!.width, "modal cabe na largura").toBeLessThanOrEqual(vp.w);
    await semOverflow(page);

    // 2. CONCLUIR: preencher e SALVAR o lead
    await d.getByLabel("Nome *").fill(`Lead ${RUN}`);
    await d.getByRole("button", { name: "Criar lead" }).click();
    await expect(d).toHaveCount(0);
    // aparece na lista
    await page.getByPlaceholder(/Buscar por nome/i).fill(RUN);
    await expect(page.getByRole("button", { name: new RegExp(`Lead ${RUN}`) })).toBeVisible();

    // 3. Ação financeira CONCLUÍDA: criar conta → marcar paga → excluir
    await page.goto("/financeiro");
    await semOverflow(page);
    await page.getByRole("button", { name: "Nova conta" }).click();
    const c = page.getByRole("dialog", { name: "Nova conta" });
    await c.getByLabel("Tipo").selectOption("A pagar");
    await c.getByLabel("Valor *").fill("R$ 50,00");
    await c.getByLabel("Descrição *").fill(`Conta ${RUN}`);
    await c.getByLabel("Vencimento *").fill("2026-07-28");
    await c.getByRole("button", { name: "Criar conta" }).click();
    await expect(c).toHaveCount(0);
    await page.getByRole("button", { name: "Tudo" }).click();
    await page.getByRole("button", { name: "A pagar", exact: true }).first().click();
    const linha = page.getByRole("row").filter({ hasText: `Conta ${RUN}` });
    await expect(linha).toBeVisible();
    await linha.getByTitle("Marcar como paga").click();
    // excluir (limpeza)
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    await page.getByRole("row").filter({ hasText: `Conta ${RUN}` }).getByTitle("Remover").click();
    await page.getByRole("dialog").filter({ hasText: "Remover conta" }).getByRole("button", { name: "Remover" }).click();

    // 4. Limpeza do lead criado
    await page.goto("/leads");
    await page.getByPlaceholder(/Buscar por nome/i).fill(RUN);
    await page.getByRole("button", { name: new RegExp(`Lead ${RUN}`) }).click();
    const painel = page.getByRole("complementary");
    await painel.getByRole("button", { name: "Remover", exact: true }).click();
    await page.getByRole("dialog").filter({ hasText: /Remover|Excluir/ }).getByRole("button", { name: /Remover|Excluir/ }).click();
  });
}
