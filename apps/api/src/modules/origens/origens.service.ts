import { prisma } from "@app/db";
import { TRPCError } from "@trpc/server";

/**
 * Origens padrão de lead — pré-configuradas, editáveis depois.
 * Espelham as fontes que o rastreio automático (derivarRastreioOrigem) sabe identificar,
 * mais as manuais comuns (Indicação, Evento, Outro).
 */
const DEFAULTS = [
  "Página de Captura",
  "Site",
  "Indicação",
  "Evento",
  "WhatsApp",
  "Google",
  "Facebook/Instagram",
  "LinkedIn",
  "YouTube",
  "Twitter/X",
  "Outro",
];

async function seedIfEmpty() {
  if ((await prisma.origem.count()) === 0) {
    await prisma.origem.createMany({ data: DEFAULTS.map((nome, ordem) => ({ nome, ordem })) });
  }
}

/** Todas as origens (gestão) — inclui inativas, na ordem manual definida pelo admin. */
export async function listOrigens() {
  await seedIfEmpty();
  return prisma.origem.findMany({ orderBy: { ordem: "asc" } });
}

/** Origens ativas (para o autocomplete do cadastro de lead). */
export async function listOrigensAtivas() {
  await seedIfEmpty();
  return prisma.origem.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" }, select: { id: true, nome: true } });
}

export async function criarOrigem(nome: string) {
  const max = await prisma.origem.aggregate({ _max: { ordem: true } });
  return prisma.origem.create({ data: { nome: nome.trim(), ordem: (max._max.ordem ?? -1) + 1 } });
}

export async function atualizarOrigem(id: string, dados: { nome?: string; ativo?: boolean }) {
  const data: Record<string, unknown> = {};
  if (dados.nome !== undefined) data.nome = dados.nome.trim();
  if (dados.ativo !== undefined) data.ativo = dados.ativo;
  return prisma.origem.update({ where: { id }, data }).catch(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "Origem não encontrada." });
  });
}

export async function removerOrigem(id: string) {
  await prisma.origem.deleteMany({ where: { id } });
  return { ok: true };
}

/** Reordena o catálogo: grava `ordem` conforme a posição de cada id na lista recebida. */
export async function reordenarOrigens(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, ordem) => prisma.origem.update({ where: { id }, data: { ordem } })),
  );
  return { ok: true };
}
