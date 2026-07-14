import { prisma } from "@app/db";
import { OPERADORAS_COMUNS } from "@app/shared";
import { TRPCError } from "@trpc/server";

/** Semeia o catálogo com as operadoras comuns na primeira vez (depois é 100% editável). */
async function seedIfEmpty() {
  if ((await prisma.operadora.count()) === 0) {
    await prisma.operadora.createMany({ data: OPERADORAS_COMUNS.map((nome, ordem) => ({ nome, ordem })) });
  }
}

/** Catálogo de operadoras (para a Proposta de credenciamento). */
export async function listOperadoras() {
  await seedIfEmpty();
  return prisma.operadora.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }], select: { id: true, nome: true } });
}

export async function criarOperadora(nome: string) {
  const max = await prisma.operadora.aggregate({ _max: { ordem: true } });
  return prisma.operadora.create({ data: { nome: nome.trim(), ordem: (max._max.ordem ?? -1) + 1 } });
}

export async function renomearOperadora(id: string, nome: string) {
  return prisma.operadora.update({ where: { id }, data: { nome: nome.trim() } }).catch(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "Operadora não encontrada." });
  });
}

/** Exclusão PERMANENTE do catálogo (não há vínculo por FK — o nome só é copiado no documento). */
export async function removerOperadora(id: string) {
  await prisma.operadora.deleteMany({ where: { id } });
  return { ok: true };
}
