import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@app/db";
import { getDocumento } from "../modules/portal/portal.service";
import { removerArquivo } from "../modules/arquivos/arquivos.service";
import { hashPassword } from "../lib/password";

const PFX = `iso-${randomBytes(4).toString("hex")}`;

let clienteA: string;
let clienteB: string;
let docA: string;
let docB: string;
let arqA: string;
let arqB: string;

beforeAll(async () => {
  expect(process.env.DATABASE_URL, "os testes devem usar o banco _test").toContain("_test");
  const a = await prisma.cliente.create({ data: { nome: `${PFX}-A`, tipo: "PJ" } });
  const b = await prisma.cliente.create({ data: { nome: `${PFX}-B`, tipo: "PJ" } });
  clienteA = a.id;
  clienteB = b.id;

  const criador = await prisma.user.create({
    data: { nome: `${PFX}-criador`, email: `${PFX}-criador@example.test`, passwordHash: await hashPassword("x"), role: "FUNCIONARIO" },
  });

  const dA = await prisma.documento.create({
    data: { clienteId: clienteA, titulo: `${PFX}-docA`, conteudo: "conteudo A", status: "ENVIADO", criadoPorId: criador.id },
  });
  const dB = await prisma.documento.create({
    data: { clienteId: clienteB, titulo: `${PFX}-docB`, conteudo: "conteudo B", status: "ENVIADO", criadoPorId: criador.id },
  });
  docA = dA.id;
  docB = dB.id;

  const fA = await prisma.arquivo.create({
    data: { clienteId: clienteA, nome: `${PFX}-A.pdf`, mimetype: "application/pdf", tamanho: 10, caminho: `clientes/${clienteA}/x.pdf`, enviadoPorTipo: "CLIENTE" },
  });
  const fB = await prisma.arquivo.create({
    data: { clienteId: clienteB, nome: `${PFX}-B.pdf`, mimetype: "application/pdf", tamanho: 10, caminho: `clientes/${clienteB}/y.pdf`, enviadoPorTipo: "CLIENTE" },
  });
  arqA = fA.id;
  arqB = fB.id;
});

afterAll(async () => {
  await prisma.documento.deleteMany({ where: { titulo: { startsWith: PFX } } });
  await prisma.arquivo.deleteMany({ where: { nome: { startsWith: PFX } } });
  await prisma.cliente.deleteMany({ where: { nome: { startsWith: PFX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PFX } } });
  await prisma.$disconnect();
});

describe("Isolamento do Portal por clienteId", () => {
  it("o cliente vê o PRÓPRIO documento", async () => {
    const doc = await getDocumento(docA, clienteA);
    expect(doc.titulo).toContain("docA");
  });

  it("NÃO vê documento de OUTRO cliente (NOT_FOUND, sem revelar existência)", async () => {
    await expect(getDocumento(docB, clienteA)).rejects.toThrow();
  });

  it("o cliente remove o PRÓPRIO arquivo", async () => {
    await expect(removerArquivo(arqA, clienteA)).resolves.toBeTruthy();
  });

  it("NÃO remove arquivo de OUTRO cliente (FORBIDDEN)", async () => {
    await expect(removerArquivo(arqB, clienteA)).rejects.toThrow();
  });
});

describe("Regra de integridade — Documento.criadoPorId SetNull (#1)", () => {
  it("excluir o usuário criador PRESERVA o documento (criadoPorId vira null)", async () => {
    const u = await prisma.user.create({
      data: { nome: `${PFX}-del`, email: `${PFX}-del@example.test`, passwordHash: await hashPassword("x"), role: "FUNCIONARIO" },
    });
    const d = await prisma.documento.create({
      data: { clienteId: clienteA, titulo: `${PFX}-docDel`, conteudo: "c", status: "RASCUNHO", criadoPorId: u.id },
    });
    await prisma.user.delete({ where: { id: u.id } }); // HARD delete → dispara ON DELETE SET NULL
    const depois = await prisma.documento.findUnique({ where: { id: d.id } });
    expect(depois, "o documento deve continuar existindo").not.toBeNull();
    expect(depois?.criadoPorId, "criadoPorId deve virar null").toBeNull();
  });
});
