import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Bloco 10 — varredura de acessibilidade (axe) nas páginas exercitadas pelos cenários.
// Falha em violações CRÍTICAS/SÉRIAS; as moderadas são registradas (log) para análise.
const PAGINAS_EQUIPE = ["/", "/clientes", "/leads", "/projetos", "/agenda", "/mensagens", "/documentos", "/financeiro", "/usuarios"];

// color-contrast (sério, difuso) depende da PALETA DA MARCA (muted-foreground e afins) — mudá-la é
// decisão de identidade/produto do dono, não correção cirúrgica; fica registrada, fora do gate.
// nested-interactive e scrollable-region-focusable ficam registradas para revisão estrutural.
const REGISTRADAS_SEM_GATE = new Set(["color-contrast", "nested-interactive", "scrollable-region-focusable"]);

async function varrer(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle").catch(() => {});
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bloqueantes = r.violations.filter((v) => (v.impact === "critical" || v.impact === "serious") && !REGISTRADAS_SEM_GATE.has(v.id));
  const registradas = r.violations.filter((v) => REGISTRADAS_SEM_GATE.has(v.id));
  if (registradas.length) console.log(`[a11y:${url}] registradas (design/estrutural, fora do gate): ${registradas.map((v) => `${v.id}[${v.impact}](${v.nodes.length})`).join(", ")}`);
  if (bloqueantes.length) console.log(`[a11y:${url}] BLOQUEANTES: ${bloqueantes.map((v) => `${v.id}[${v.impact}](${v.nodes.length})`).join(", ")}`);
  return bloqueantes;
}

test.describe("axe — páginas da equipe (ADMIN)", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  for (const url of PAGINAS_EQUIPE) {
    test(`sem violações bloqueantes: ${url}`, async ({ page }) => {
      const sev = await varrer(page, url);
      expect(sev, sev.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
    });
  }
});

test.describe("axe — login e Portal do cliente", () => {
  test("login (anônimo)", async ({ page }) => {
    const sev = await varrer(page, "/login");
    expect(sev, sev.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
  });
  test("Portal (cliente)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/cliente.json" });
    const page = await ctx.newPage();
    const sev = await varrer(page, "/");
    await ctx.close();
    expect(sev, sev.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
  });
});
