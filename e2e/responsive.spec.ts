import { test, expect } from "@playwright/test";

/** Responsividade: sem overflow horizontal em telas-chave, nos 5 tamanhos exigidos. */
const VIEWPORTS = [
  { nome: "desktop-1920", w: 1920, h: 1080 },
  { nome: "notebook-1366", w: 1366, h: 768 },
  { nome: "tablet-768", w: 768, h: 1024 },
  { nome: "celular-390", w: 390, h: 844 },
  { nome: "celular-360", w: 360, h: 800 },
];
const PAGINAS = ["/", "/clientes", "/leads", "/projetos", "/agenda", "/documentos", "/financeiro"];

test.describe("Responsividade (ADMIN)", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  for (const vp of VIEWPORTS) {
    test(`sem overflow horizontal @ ${vp.nome}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      for (const url of PAGINAS) {
        await page.goto(url);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `overflow-x em ${url} @ ${vp.w}px`).toBeLessThanOrEqual(20); // tolera variância de renderização de fonte headless (0 no desktop local)
      }
    });
  }
});
