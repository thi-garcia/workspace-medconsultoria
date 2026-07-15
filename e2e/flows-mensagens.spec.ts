import { test, expect, type APIRequestContext } from "@playwright/test";
import { lerFixtures } from "./fixtures-helper";

// Cenário 7 — Mensagens/suporte: um chamado é ESCOPADO ao clienteId da sessão.
// O cliente abre e lê o próprio chamado, NÃO lê o de outro cliente, e a infra
// de tempo real (socket.io) está no ar e responde ao handshake autenticado.
const BASE = "http://localhost:4310";
const ASSUNTO = `Chamado E2E ${Date.now().toString().slice(-6)}`;

function jsonBody(input: unknown) {
  return { data: { json: input }, headers: { "content-type": "application/json" } };
}
function q(input: unknown) {
  return `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
}
async function dataJson(res: { json: () => Promise<unknown> }) {
  return (await res.json() as { result: { data: { json: unknown } } }).result.data.json;
}

test("chamado do cliente é isolado por sessão + realtime no ar", async ({ playwright }) => {
  const { outroConversaId: CONVERSA_ALHEIA } = lerFixtures();
  const cliente: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });

  // 1. Abre um chamado próprio → conversaId
  const abrir = await cliente.post("/trpc/portal.suporte.abrir", jsonBody({ assunto: ASSUNTO, mensagem: "Mensagem de teste E2E" }));
  expect(abrir.status()).toBe(200);
  const nova = (await dataJson(abrir)) as { id?: string; conversaId?: string };
  const conversaId = nova.conversaId ?? nova.id!;
  expect(conversaId).toBeTruthy();

  // 2. Lê o PRÓPRIO chamado → 200
  const minhas = await cliente.get(`/trpc/portal.suporte.mensagens${q({ conversaId })}`);
  expect(minhas.status()).toBe(200);

  // 3. Lê chamado de OUTRO cliente → erro (ensureChamadoDoCliente bloqueia)
  const alheio = await cliente.get(`/trpc/portal.suporte.mensagens${q({ conversaId: CONVERSA_ALHEIA })}`);
  expect(alheio.status()).toBeGreaterThanOrEqual(400);

  // 4. Realtime: o handshake do socket.io responde com a sessão do cliente autenticado.
  const hs = await cliente.get("/socket.io/?EIO=4&transport=polling");
  expect(hs.status()).toBe(200);
  expect(await hs.text()).toContain("sid");

  await cliente.dispose();
});
