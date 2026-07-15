import { test, expect } from "@playwright/test";
import { limparCaixa, esperarEmail, extrairLink } from "./mailpit";

// Cenário 10 (convites) — SMTP configurado (Mailpit). Convite de FUNCIONÁRIO pela UI real:
// criar → e-mail enviado (capturado no Mailpit) → abrir link → definir senha → entrar →
// token de uso único (reuso falha) → login com a nova senha.
test.use({ storageState: "e2e/.auth/admin.json" });

const TS = Date.now().toString().slice(-6);
const FUNC_EMAIL = `func-invite-${TS}@example.test`;
const FUNC_NOME = `Funcionario Convite ${TS}`;
const SENHA = "SenhaConvite2026";

test("convite de funcionário: e-mail (SMTP) → definir senha → entrar → reuso bloqueado", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await limparCaixa();

  // 1. ADMIN convida um funcionário pela gestão de usuários
  await page.goto("/usuarios");
  await page.getByRole("button", { name: "Convidar usuário" }).first().click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Nome *").fill(FUNC_NOME);
  await modal.getByLabel("E-mail *").fill(FUNC_EMAIL);
  await modal.getByLabel("Papel *").selectOption("FUNCIONARIO");
  await modal.getByRole("button", { name: "Enviar convite" }).click();

  // 2. Feedback: convite criado (com SMTP, o link NÃO aparece na tela — foi por e-mail)
  await expect(page.getByText(/Convite criado/i)).toBeVisible();

  // 3. E-mail chega no Mailpit → extrai o link de definir senha
  const email = await esperarEmail(FUNC_EMAIL);
  const link = extrairLink(email.text || email.html, "/definir-senha");

  // 4. Sessão NOVA (anônima) abre o link e define a senha → entra autenticado
  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto(link);
  await expect(p2.getByRole("heading", { name: /Olá/i })).toBeVisible();
  await p2.getByLabel("Nova senha").fill(SENHA);
  await p2.getByLabel("Confirmar senha").fill(SENHA);
  await p2.getByRole("button", { name: /Definir senha e entrar/i }).click();
  await expect(p2.locator('input[type="password"]')).toHaveCount(0, { timeout: 20_000 });

  // 5. Reuso do MESMO link (token de uso único) → convite inválido
  await p2.goto(link);
  await expect(p2.getByText(/Convite inválido ou expirado/i)).toBeVisible({ timeout: 15_000 });

  // 6. Login com a nova senha funciona (limpa a sessão para forçar autenticação real)
  await ctx.clearCookies();
  await p2.goto("/login");
  await p2.locator('input[type="email"]').fill(FUNC_EMAIL);
  await p2.locator('input[type="password"]').fill(SENHA);
  await p2.getByRole("button", { name: /entrar/i }).click();
  await expect(p2.locator('input[type="password"]')).toHaveCount(0, { timeout: 15_000 });

  await ctx.close();
});

// Convite de CLIENTE (acesso ao Portal) pela UI real: ficha → Enviar acesso → e-mail (Mailpit)
// → definir senha → cai no Portal do PRÓPRIO cliente.
test("convite de cliente: acesso ao Portal (SMTP) → definir senha → Portal do próprio cliente", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await limparCaixa();
  const CLI_EMAIL = `cli-invite-${TS}@example.test`;
  const CLI_NOME = `Cliente Convite ${TS}`;

  // Prepara o cliente por API (fixture), sem enviar acesso ainda
  const create = await page.request.post("/trpc/clientes.create", {
    data: { json: { nome: CLI_NOME, tipo: "PJ", email: CLI_EMAIL, enviarAcessoPortal: false } },
    headers: { "content-type": "application/json" },
  });
  expect(create.ok()).toBeTruthy();
  const clienteId = (await create.json()).result.data.json.id as string;

  try {
    // Envia o acesso pela UI (ficha do cliente → Enviar acesso → confirmar)
    await page.goto(`/clientes/${clienteId}`);
    await page.getByRole("button", { name: "Enviar acesso" }).click();
    const conf = page.getByRole("dialog");
    await conf.getByRole("button", { name: /Confirmar|Enviar|Sim/ }).click();

    // E-mail de boas-vindas no Mailpit → link de definir senha
    const email = await esperarEmail(CLI_EMAIL);
    const link = extrairLink(email.text || email.html, "/definir-senha");

    // Sessão nova define a senha → cai no Portal do próprio cliente
    const ctx = await browser.newContext();
    const p2 = await ctx.newPage();
    await p2.goto(link);
    await p2.getByLabel("Nova senha").fill(SENHA);
    await p2.getByLabel("Confirmar senha").fill(SENHA);
    await p2.getByRole("button", { name: /Definir senha e entrar/i }).click();
    await expect(p2.getByRole("heading", { name: /Portal/i })).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  } finally {
    await page.request.post("/trpc/clientes.remove", {
      data: { json: { id: clienteId } },
      headers: { "content-type": "application/json" },
    });
  }
});
