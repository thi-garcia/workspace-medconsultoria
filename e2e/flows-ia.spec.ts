import { test, expect, type APIRequestContext } from "@playwright/test";

// Cenário 9 — IA: disponibilidade é só um booleano; RBAC (CLIENTE não acessa a IA da equipe);
// e o segredo (OPENAI_API_KEY) NUNCA chega ao navegador (nem config do painel Sistema vaza chave).
const BASE = "http://localhost:4310";

async function dataJson(res: { json: () => Promise<unknown> }) {
  return (await res.json() as { result: { data: { json: unknown } } }).result.data.json;
}
// Padrões de segredo que JAMAIS podem aparecer numa resposta ao cliente.
const VAZAMENTOS = [/sk-[A-Za-z0-9_-]{10,}/, /SESSION_SECRET/i, /SMTP_PASS/i, /mysql:\/\//i, /passwordHash/i];

test("ia.disponivel é booleano e o painel de config não vaza segredos", async ({ playwright }) => {
  const func: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/funcionario.json" });
  const root: APIRequestContext = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/root.json" });

  // Equipe: ia.disponivel devolve apenas { disponivel: boolean }
  const d = await func.get("/trpc/ia.disponivel");
  expect(d.status()).toBe(200);
  const disp = (await dataJson(d)) as Record<string, unknown>;
  expect(typeof disp.disponivel).toBe("boolean");
  expect(Object.keys(disp)).toEqual(["disponivel"]);
  // A resposta bruta não contém a chave nem qualquer segredo.
  const rawD = await d.text();
  for (const p of VAZAMENTOS) expect(rawD).not.toMatch(p);

  // Painel Sistema (ROOT): config expõe só flags/portas — nunca a chave/segredos.
  const cfg = await root.get("/trpc/sistema.config");
  expect(cfg.status()).toBe(200);
  const info = (await dataJson(cfg)) as Record<string, unknown>;
  expect(typeof info.iaAtiva).toBe("boolean");
  const rawCfg = await cfg.text();
  for (const p of VAZAMENTOS) expect(rawCfg).not.toMatch(p);

  await func.dispose();
  await root.dispose();
});

test("RBAC: CLIENTE não acessa a IA da equipe", async ({ playwright }) => {
  const cliente = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });
  const d = await cliente.get("/trpc/ia.disponivel");
  // funcionarioProcedure → CLIENTE bloqueado (UNAUTHORIZED/FORBIDDEN).
  expect(d.status()).toBeGreaterThanOrEqual(400);
  await cliente.dispose();
});
