import { test, expect } from "@playwright/test";

// Bloco 3 — UX de erros/edge (404 de recurso, 404 de rota, token inválido).
// BUG-002: um cliente inexistente (404 NOT_FOUND) mostrava o erro genérico de conexão
// ("Tentar de novo") em vez de "Cliente não encontrado" (estado terminal).
test.describe("Bloco 3 — UX de erros (ADMIN)", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("recurso inexistente (/clientes/$id 404) mostra 'não encontrado', não 'tentar de novo'", async ({ page }) => {
    await page.goto("/clientes/idinexistente000000000000");
    await expect(page.getByText(/Cliente não encontrado/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Voltar para clientes/i })).toBeVisible();
    // NÃO deve oferecer "Tentar de novo" (retentar um 404 não resolve).
    await expect(page.getByRole("button", { name: /Tentar de novo/i })).toHaveCount(0);
  });

  test("rota inexistente mostra 'Página não encontrada' dentro do shell", async ({ page }) => {
    await page.goto("/rota-que-nao-existe-xyz");
    await expect(page.getByText(/Página não encontrada/i)).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible(); // shell/menu presente
    // BUG-005: o fallback do título já é "MedConsultoria" e o sufixo era aplicado por cima.
    await expect(page).toHaveTitle("MedConsultoria");
  });

  // BUG-004: `useEffect(() => window.scrollTo(0, 0), [])` devolvia implicitamente o retorno de
  // `scrollTo` — uma **Promise** nos Chrome atuais. O React tratava isso como a função de
  // limpeza, quebrava com "destroy is not a function" e a página inteira sumia. Como é onde se
  // troca a própria senha, tem de renderizar sempre.
  test("Configurações renderiza de verdade (efeito não pode devolver Promise)", async ({ page }) => {
    const quebras: string[] = [];
    page.on("pageerror", (e) => quebras.push(e.message));
    page.on("console", (m) => m.type() === "error" && /destroy is not a function/.test(m.text()) && quebras.push(m.text()));

    await page.goto("/configuracoes");

    await expect(page.getByRole("heading", { name: "Configurações", level: 1 })).toBeVisible();
    // Conteúdo real das três seções — não só o cabeçalho.
    await expect(page.getByText(/Foto de perfil/i)).toBeVisible();
    await expect(page.getByText(/senha/i).first()).toBeVisible();
    expect(quebras, `a página quebrou: ${quebras.join(" | ")}`).toEqual([]);
  });
});

// Página pública: token de proposta inválido → mensagem clara (sem login, sem crash).
test("proposta com token inválido mostra 'Link inválido'", async ({ page }) => {
  await page.goto("/proposta/token-invalido-abc123xyz");
  await expect(page.getByText(/Link inválido/i)).toBeVisible();
});
