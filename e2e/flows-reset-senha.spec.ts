import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";

// Cenário 10 — Reset de senha: exercita os endpoints HTTP (tRPC, superjson) do fluxo real.
// Garante: token válido consome e redefine; uso ÚNICO (reuso falha); expirado falha;
// e-mail inexistente responde ok:true (sem enumeração de usuário).
// Os RAW dos tokens (hash SHA-256 no banco) vêm da fixture determinística semeada no setup.
const BASE = "http://localhost:4310";
const FIX = JSON.parse(readFileSync("e2e/.auth/fixtures.json", "utf8")) as { resetRawValid: string; resetRawExpired: string };
const RAW_VALID = FIX.resetRawValid;
const RAW_EXPIRED = FIX.resetRawExpired;

function jsonBody(input: unknown) {
  return { data: { json: input }, headers: { "content-type": "application/json" } };
}
function inputQuery(input: unknown) {
  return `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
}
async function dataJson(res: { json: () => Promise<unknown> }) {
  return (await res.json() as { result: { data: { json: unknown } } }).result.data.json;
}

test("reset de senha: uso único, expiração e sem enumeração — via HTTP", async ({ playwright }) => {
  const req: APIRequestContext = await playwright.request.newContext({ baseURL: BASE });

  // validarReset com token válido → { valido: true }
  const v = await req.get(`/trpc/auth.validarReset${inputQuery({ token: RAW_VALID })}`);
  expect(v.status()).toBe(200);
  expect((await dataJson(v) as { valido: boolean }).valido).toBe(true);

  // redefinirSenha consome o token → sucesso
  const r1 = await req.post("/trpc/auth.redefinirSenha", jsonBody({ token: RAW_VALID, novaSenha: "NovaSenha2026", confirmar: "NovaSenha2026" }));
  expect(r1.status()).toBe(200);

  // reuso do MESMO token → falha (uso único)
  const r2 = await req.post("/trpc/auth.redefinirSenha", jsonBody({ token: RAW_VALID, novaSenha: "OutraSenha2026", confirmar: "OutraSenha2026" }));
  expect(r2.status()).toBeGreaterThanOrEqual(400);

  // token expirado → validar=false e redefinir falha
  const ve = await req.get(`/trpc/auth.validarReset${inputQuery({ token: RAW_EXPIRED })}`);
  expect((await dataJson(ve) as { valido: boolean }).valido).toBe(false);
  const re = await req.post("/trpc/auth.redefinirSenha", jsonBody({ token: RAW_EXPIRED, novaSenha: "Expirada2026", confirmar: "Expirada2026" }));
  expect(re.status()).toBeGreaterThanOrEqual(400);

  // solicitarReset para e-mail inexistente → ok:true (sem revelar se o e-mail existe)
  const s = await req.post("/trpc/auth.solicitarReset", jsonBody({ email: "naoexiste-xyz@example.test" }));
  expect(s.status()).toBe(200);
  expect((await dataJson(s) as { ok: boolean }).ok).toBe(true);

  await req.dispose();
});
