import { test, expect, type APIRequestContext } from "@playwright/test";

// Cenário 2 — Cliente e Portal: o cliente vê o PRÓPRIO cadastro, não acessa rota interna,
// e não consegue ler documento de outro cliente (isolamento LGPD por clienteId da sessão).
test.use({ storageState: "e2e/.auth/cliente.json" });

const BASE = "http://localhost:4310";
const DOC_ALHEIO = "cmrcp67n00001hy0w4mpoza59"; // documento de "Rede Saúde+" (não é do cliente logado, Acme)

test("Portal carrega o próprio cliente e bloqueia rota interna", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
  await expect(page.getByText(/Acme/i).first()).toBeVisible();

  // Rota interna (Financeiro) → cliente não acessa; cai no Portal.
  await page.goto("/financeiro");
  await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
});

test("isolamento: CLIENTE não lê documento de outro cliente + meusDados é o próprio (HTTP)", async ({ playwright }) => {
  const cliente: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });

  // Documento de outro cliente → NOT_FOUND (escopado por clienteId da sessão)
  const input = encodeURIComponent(JSON.stringify({ json: { id: DOC_ALHEIO } }));
  const alheio = await cliente.get(`/trpc/portal.documento?input=${input}`);
  expect(alheio.status()).toBeGreaterThanOrEqual(400);

  // meusDados devolve o PRÓPRIO cadastro (Acme)
  const md = await cliente.get("/trpc/portal.meusDados");
  expect(md.status()).toBe(200);
  const dados = (await md.json() as { result: { data: { json: unknown } } }).result.data.json;
  expect(JSON.stringify(dados)).toMatch(/Acme/i);

  await cliente.dispose();
});
