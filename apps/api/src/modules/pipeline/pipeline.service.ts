import { prisma } from "@app/db";

/** Colunas padrão do funil, criadas na primeira vez que o pipeline é acessado. */
const DEFAULTS = [
  { nome: "Novo", ordem: 0, cor: "#2DA8E1", chaveAuto: "novo" },
  { nome: "Qualificação", ordem: 1, cor: "#003591", chaveAuto: "qualificacao" },
  { nome: "Proposta", ordem: 2, cor: "#30AD73", chaveAuto: "proposta" },
  { nome: "Negociação", ordem: 3, cor: "#F59E0B", chaveAuto: "negociacao" },
  { nome: "Fechado", ordem: 4, cor: "#30AD73", chaveAuto: "fechado" },
];

/** Lista as colunas do pipeline (semeando/backfillando os padrões quando faltar). */
export async function listStages() {
  const count = await prisma.pipelineStage.count();
  if (count === 0) {
    await prisma.pipelineStage.createMany({ data: DEFAULTS });
  } else {
    // Backfill idempotente da chave de automação em etapas padrão já existentes.
    const semChave = await prisma.pipelineStage.findMany({ where: { chaveAuto: null } });
    for (const s of semChave) {
      const padrao = DEFAULTS.find((d) => d.nome === s.nome);
      if (padrao) await prisma.pipelineStage.update({ where: { id: s.id }, data: { chaveAuto: padrao.chaveAuto } });
    }
  }
  return prisma.pipelineStage.findMany({ orderBy: { ordem: "asc" } });
}
