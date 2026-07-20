import { test, expect, type APIRequestContext } from "@playwright/test";
import { lerFixtures } from "./fixtures-helper";

// Cenário 2 — Cliente e Portal: o cliente vê o PRÓPRIO cadastro, não acessa rota interna,
// e não consegue ler documento de outro cliente (isolamento LGPD por clienteId da sessão).
// Dados (nome do cliente, doc alheio) vêm da fixture — NUNCA hardcodar ids/nomes do seed.
test.use({ storageState: "e2e/.auth/cliente.json" });

// Respeita `E2E_BASE_URL` (mesma regra do playwright.config): fixar a porta fazia estes
// testes autenticarem numa instância e chamarem OUTRA — 401 no runner de banco isolado.
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:4310";

test("Portal carrega o próprio cliente e bloqueia rota interna", async ({ page }) => {
  const { portalClienteNome } = lerFixtures();
  // Primeiro nome do cliente do Portal (o nome real do seed atual).
  const primeiroNome = portalClienteNome.split(/\s+/)[0];
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
  await expect(page.getByText(new RegExp(primeiroNome, "i")).first()).toBeVisible();

  // Rota interna (Financeiro) → cliente não acessa; cai no Portal.
  await page.goto("/financeiro");
  await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
});

test("isolamento: CLIENTE não lê documento de outro cliente + meusDados é o próprio (HTTP)", async ({ playwright }) => {
  const { outroDocId, portalClienteNome } = lerFixtures();
  const cliente: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });

  // Documento de OUTRO cliente → NOT_FOUND (escopado por clienteId da sessão)
  const input = encodeURIComponent(JSON.stringify({ json: { id: outroDocId } }));
  const alheio = await cliente.get(`/trpc/portal.documento?input=${input}`);
  expect(alheio.status()).toBeGreaterThanOrEqual(400);

  // meusDados devolve o PRÓPRIO cadastro (nome real do seed)
  const md = await cliente.get("/trpc/portal.meusDados");
  expect(md.status()).toBe(200);
  const dados = (await md.json() as { result: { data: { json: unknown } } }).result.data.json;
  expect(JSON.stringify(dados)).toContain(portalClienteNome);

  await cliente.dispose();
});
