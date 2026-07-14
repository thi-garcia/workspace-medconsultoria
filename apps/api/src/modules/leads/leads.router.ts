import { z } from "zod";
import { createLeadSchema, updateLeadSchema, moveLeadSchema, capturaLeadSchema, novaOportunidadeSchema } from "@app/shared";
import { router, funcionarioProcedure, publicProcedure } from "../../trpc/trpc.js";
import * as service from "./leads.service.js";

export const leadsRouter = router({
  list: funcionarioProcedure.query(() => service.listLeads()),

  /** Formulário público do site — cria o lead no funil. Sem autenticação. */
  capturar: publicProcedure
    .input(capturaLeadSchema)
    .mutation(({ input, ctx }) => service.capturarLead(input, ctx.req.ip)),

  create: funcionarioProcedure
    .input(createLeadSchema)
    .mutation(({ input, ctx }) => service.createLead(input, ctx.user.id)),

  update: funcionarioProcedure
    .input(updateLeadSchema)
    .mutation(({ input, ctx }) => service.updateLead(input, ctx.user.id)),

  move: funcionarioProcedure
    .input(moveLeadSchema)
    .mutation(({ input, ctx }) => service.moveLead(input, ctx.user.id)),

  convert: funcionarioProcedure
    .input(z.object({ id: z.string(), enviarEmail: z.boolean().optional() }))
    .mutation(({ input, ctx }) => service.convertLead(input.id, ctx.user.id, input.enviarEmail ?? true)),

  /** Abre uma nova oportunidade no funil para um cliente que já existe (com serviços). */
  novaOportunidade: funcionarioProcedure
    .input(novaOportunidadeSchema)
    .mutation(({ input, ctx }) =>
      service.criarOportunidadeParaCliente(input.clienteId, ctx.user.id, {
        servicoIds: input.servicoIds,
        valorEstimado: input.valorEstimado,
        observacoes: input.observacoes,
      }),
    ),

  /** Indicadores de ganho/perda do funil. */
  resumo: funcionarioProcedure.query(() => service.funilResumo()),

  /** Leads perdidos (relatório + reabertura). */
  perdidos: funcionarioProcedure.query(() => service.listPerdidos()),

  marcarPerdido: funcionarioProcedure
    .input(z.object({ id: z.string(), motivo: z.string().trim().min(1, "Diga o motivo da perda").max(500) }))
    .mutation(({ input, ctx }) => service.marcarPerdido(input.id, input.motivo, ctx.user.id)),

  reabrir: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.reabrirLead(input.id, ctx.user.id)),

  /** Convida o lead para o Portal (cria conta Cliente Prospect + convite). */
  convidarPortal: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.convidarPortal(input.id, ctx.user)),

  remove: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.removeLead(input.id, ctx.user.id)),

  // ── Painel do lead + checklist por etapa (Fase 2) ──
  detalhe: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => service.getLeadDetalhe(input.id)),

  togglePasso: funcionarioProcedure
    .input(z.object({ passoId: z.string() }))
    .mutation(({ input, ctx }) => service.togglePasso(input.passoId, ctx.user.id)),

  addPasso: funcionarioProcedure
    .input(z.object({ leadId: z.string(), titulo: z.string().trim().min(1, "Escreva o passo").max(200) }))
    .mutation(({ input }) => service.addPasso(input.leadId, input.titulo)),

  removePasso: funcionarioProcedure
    .input(z.object({ passoId: z.string() }))
    .mutation(({ input }) => service.removePasso(input.passoId)),

  avancarEtapa: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.avancarEtapa(input.id, ctx.user.id)),
});
