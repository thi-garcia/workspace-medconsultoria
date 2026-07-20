import { test, expect } from "@playwright/test";
import { lerFixtures } from "./fixtures-helper";

// Cenário 3 — Documentos/arquivos: upload/download via HTTP REAL (não só service),
// validação de tipo/tamanho e isolamento de acesso entre clientes (CLIENTE não baixa de outro).
// clienteIds vêm da fixture (variam a cada seed).
// Respeita `E2E_BASE_URL` (mesma regra do playwright.config): fixar a porta fazia estes
// testes autenticarem numa instância e chamarem OUTRA — 401 no runner de banco isolado.
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:4310";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< >>\n%%EOF\n");

test("upload/download HTTP: válido, tipo inválido, tamanho e isolamento entre clientes", async ({ playwright }) => {
  const { portalClienteId: CLI_PORTAL, outroClienteId: CLI_OUTRO } = lerFixtures();
  const admin = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/admin.json" });
  const cliente = await playwright.request.newContext({ baseURL: BASE, storageState: "e2e/.auth/cliente.json" });

  // 1. Admin envia PDF válido para OUTRO cliente (Clinica Vida Plena)
  const up = await admin.post("/upload", {
    multipart: { clienteId: CLI_OUTRO, arquivo: { name: "teste-e2e.pdf", mimeType: "application/pdf", buffer: PDF } },
  });
  expect(up.status()).toBe(200);
  const idOutro = (await up.json()).id as string;

  // 2. Admin baixa e o conteúdo baixado é idêntico ao enviado
  const dl = await admin.get(`/arquivos/${idOutro}`);
  expect(dl.status()).toBe(200);
  expect(Buffer.from(await dl.body())).toEqual(PDF);

  // 3. Tipo não permitido → 415
  const bad = await admin.post("/upload", {
    multipart: { clienteId: CLI_OUTRO, arquivo: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ\x00\x00") } },
  });
  expect(bad.status()).toBe(415);

  // 4. Acima do limite (>20 MB) → 413
  const big = Buffer.alloc(21 * 1024 * 1024, 0x41);
  const over = await admin.post("/upload", {
    multipart: { clienteId: CLI_OUTRO, arquivo: { name: "grande.pdf", mimeType: "application/pdf", buffer: big } },
  });
  expect(over.status()).toBe(413);

  // 5. CLIENTE (Acme) tenta baixar arquivo de OUTRO cliente → 403 (isolamento)
  const cross = await cliente.get(`/arquivos/${idOutro}`);
  expect(cross.status()).toBe(403);

  // 6. Arquivo do PRÓPRIO cliente do portal → CLIENTE baixa (200)
  const upProp = await admin.post("/upload", {
    multipart: { clienteId: CLI_PORTAL, arquivo: { name: "meu-e2e.pdf", mimeType: "application/pdf", buffer: PDF } },
  });
  const idProprio = (await upProp.json()).id as string;
  const ok = await cliente.get(`/arquivos/${idProprio}`);
  expect(ok.status()).toBe(200);

  // 7. Sem autenticação → 401
  const anon = await playwright.request.newContext({ baseURL: BASE });
  expect((await anon.get(`/arquivos/${idProprio}`)).status()).toBe(401);
  await anon.dispose();

  // Limpeza: remove os arquivos criados (não deixar acumular na ficha dos clientes).
  for (const id of [idOutro, idProprio]) {
    await admin.post("/trpc/clientes.removerArquivo", {
      data: { json: { id } },
      headers: { "content-type": "application/json" },
    });
  }

  await admin.dispose();
  await cliente.dispose();
});
