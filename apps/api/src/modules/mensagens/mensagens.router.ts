import { z } from "zod";
import {
  startIndividualSchema,
  createGrupoSchema,
  sendMensagemSchema,
  renomearGrupoSchema,
  gerirParticipanteSchema,
  addParticipantesSchema,
  conversaIdSchema,
  iniciarChamadoSchema,
  setChamadoStatusSchema,
  setChamadoResponsavelSchema,
  setChamadoAssuntoSchema,
  setChamadoPrioridadeSchema,
  editarMensagemSchema,
  mensagemIdSchema,
  togglePreferenciaSchema,
} from "@app/shared";
import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import * as service from "./mensagens.service.js";

export const mensagensRouter = router({
  listConversas: funcionarioProcedure
    .input(z.object({ arquivadas: z.boolean().optional() }).optional())
    .query(({ input, ctx }) => service.listConversas(ctx.user.id, input?.arquivadas ?? false)),
  usuarios: funcionarioProcedure.query(({ ctx }) => service.listUsuarios(ctx.user.id)),
  clientes: funcionarioProcedure
    .input(z.object({ busca: z.string().optional() }).optional())
    .query(({ input }) => service.listClientesParaChamado(input?.busca)),
  chamadosDoCliente: funcionarioProcedure
    .input(z.object({ clienteId: z.string() }))
    .query(({ input, ctx }) => service.listChamadosDoCliente(input.clienteId, ctx.user.id)),
  info: funcionarioProcedure.input(conversaIdSchema).query(({ input, ctx }) => service.getConversaInfo(input.conversaId, ctx.user.id)),

  startIndividual: funcionarioProcedure.input(startIndividualSchema).mutation(({ input, ctx }) => service.startIndividual(ctx.user.id, input.outroUserId)),
  createGrupo: funcionarioProcedure.input(createGrupoSchema).mutation(({ input, ctx }) => service.createGrupo(ctx.user.id, input.nome, input.participantIds)),

  // Gestão de grupo / conversa.
  renomearGrupo: funcionarioProcedure.input(renomearGrupoSchema).mutation(({ input, ctx }) => service.renomearGrupo(input.conversaId, ctx.user.id, input.nome)),
  addParticipantes: funcionarioProcedure.input(addParticipantesSchema).mutation(({ input, ctx }) => service.addParticipantes(input.conversaId, ctx.user.id, input.userIds)),
  removerParticipante: funcionarioProcedure.input(gerirParticipanteSchema).mutation(({ input, ctx }) => service.removerParticipante(input.conversaId, ctx.user.id, input.userId)),
  sair: funcionarioProcedure.input(conversaIdSchema).mutation(({ input, ctx }) => service.sairDaConversa(input.conversaId, ctx.user.id)),
  apagar: funcionarioProcedure.input(conversaIdSchema).mutation(({ input, ctx }) => service.apagarConversa(input.conversaId, ctx.user.id)),

  // Preferências por usuário.
  fixar: funcionarioProcedure.input(togglePreferenciaSchema).mutation(({ input, ctx }) => service.fixar(input.conversaId, ctx.user.id, input.ligar)),
  silenciar: funcionarioProcedure.input(togglePreferenciaSchema).mutation(({ input, ctx }) => service.silenciar(input.conversaId, ctx.user.id, input.ligar)),
  arquivar: funcionarioProcedure.input(togglePreferenciaSchema).mutation(({ input, ctx }) => service.arquivar(input.conversaId, ctx.user.id, input.ligar)),

  // Chamados/tickets.
  iniciarChamado: funcionarioProcedure.input(iniciarChamadoSchema).mutation(({ input, ctx }) => service.iniciarChamado(ctx.user.id, input.clienteId, input.assunto, input.prioridade)),
  setStatus: funcionarioProcedure.input(setChamadoStatusSchema).mutation(({ input, ctx }) => service.setChamadoStatus(input.conversaId, ctx.user.id, input.status)),
  resolver: funcionarioProcedure.input(conversaIdSchema).mutation(({ input, ctx }) => service.resolverChamado(input.conversaId, ctx.user.id)),
  reabrir: funcionarioProcedure.input(conversaIdSchema).mutation(({ input, ctx }) => service.reabrirChamado(input.conversaId, ctx.user.id)),
  setResponsavel: funcionarioProcedure.input(setChamadoResponsavelSchema).mutation(({ input, ctx }) => service.setChamadoResponsavel(input.conversaId, ctx.user.id, input.responsavelId)),
  setAssunto: funcionarioProcedure.input(setChamadoAssuntoSchema).mutation(({ input, ctx }) => service.setChamadoAssunto(input.conversaId, ctx.user.id, input.assunto)),
  setPrioridade: funcionarioProcedure.input(setChamadoPrioridadeSchema).mutation(({ input, ctx }) => service.setChamadoPrioridade(input.conversaId, ctx.user.id, input.prioridade)),

  // Mensagens.
  listMensagens: funcionarioProcedure.input(conversaIdSchema).query(({ input, ctx }) => service.listMensagens(input.conversaId, ctx.user.id)),
  send: funcionarioProcedure.input(sendMensagemSchema).mutation(({ input, ctx }) => service.sendMensagem(input.conversaId, input.conteudo, ctx.user.id)),
  editar: funcionarioProcedure.input(editarMensagemSchema).mutation(({ input, ctx }) => service.editarMensagem(input.mensagemId, ctx.user.id, input.conteudo)),
  apagarMensagem: funcionarioProcedure.input(mensagemIdSchema).mutation(({ input, ctx }) => service.apagarMensagem(input.mensagemId, ctx.user.id)),
  markRead: funcionarioProcedure.input(conversaIdSchema).mutation(({ input, ctx }) => service.markRead(input.conversaId, ctx.user.id)),
});
