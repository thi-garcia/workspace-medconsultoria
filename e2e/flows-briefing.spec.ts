import { test, expect, type APIRequestContext } from "@playwright/test";

// Cenário 4 — Serviços/requisitos/briefings: o cliente preenche um briefing online com
// TODOS os tipos de campo (curto/longo/escolha/múltipla/número/sim-não/data), envia e o
// conteúdo persiste (round-trip pela mesma API que a equipe lê na ficha). Setup via DB (marcado E2E).
// Respeita `E2E_BASE_URL` (mesma regra do playwright.config): fixar a porta fazia estes
// testes autenticarem numa instância e chamarem OUTRA — 401 no runner de banco isolado.
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:4310";
const REQ = "e2ereqbrief00000000000000"; // ServicoRequisito(BRIEFING) semeado para o Acme

function jsonBody(input: unknown) {
  return { data: { json: input }, headers: { "content-type": "application/json" } };
}
function q(input: unknown) {
  return `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
}
async function dataJson(res: { json: () => Promise<unknown> }) {
  return (await res.json() as { result: { data: { json: unknown } } }).result.data.json;
}

test("briefing: cliente preenche todos os tipos de campo, envia e persiste (HTTP)", async ({ playwright }) => {
  const cliente: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });

  // 1. Cliente abre o briefing → 7 campos, um por tipo (fixture determinística semeada no setup)
  const g = await cliente.get(`/trpc/portal.briefing.get${q({ requisitoId: REQ })}`);
  expect(g.status()).toBe(200);
  const form = (await dataJson(g)) as { campos: { id: string; tipo: string }[] };
  expect(form.campos.length).toBe(7);
  const byTipo = Object.fromEntries(form.campos.map((c) => [c.tipo, c.id])) as Record<string, string>;

  // 2. Preenche cada tipo e ENVIA
  const respostas: Record<string, string | string[]> = {
    [byTipo.TEXTO_CURTO]: "Resposta curta",
    [byTipo.TEXTO_LONGO]: "Primeira linha\nSegunda linha",
    [byTipo.ESCOLHA]: "A",
    [byTipo.MULTIPLA]: ["X", "Z"],
    [byTipo.NUMERO]: "42",
    [byTipo.SIM_NAO]: "SIM",
    [byTipo.DATA]: "2026-07-20",
  };
  const salvar = await cliente.post("/trpc/portal.briefing.salvar", jsonBody({ requisitoId: REQ, respostas, enviar: true }));
  expect(salvar.status()).toBe(200);

  // 3. Reabre (refresh) → status ENVIADO e todos os valores persistidos, inclusive múltipla escolha
  const g2 = await cliente.get(`/trpc/portal.briefing.get${q({ requisitoId: REQ })}`);
  const form2 = (await dataJson(g2)) as { resposta: { status: string; respostas: Record<string, unknown> } };
  expect(form2.resposta.status).toBe("ENVIADO");
  expect(form2.resposta.respostas[byTipo.TEXTO_LONGO]).toBe("Primeira linha\nSegunda linha");
  expect(form2.resposta.respostas[byTipo.MULTIPLA]).toEqual(["X", "Z"]);
  expect(form2.resposta.respostas[byTipo.NUMERO]).toBe("42");
  expect(form2.resposta.respostas[byTipo.DATA]).toBe("2026-07-20");

  await cliente.dispose();
});
