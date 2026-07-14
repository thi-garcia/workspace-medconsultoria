import { z } from "zod";
import { createCardSchema, updateCardSchema, moveCardSchema, addChecklistSchema, hasRoleLevel } from "@app/shared";
import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import * as service from "./cards.service.js";

export const cardsRouter = router({
  list: funcionarioProcedure
    .input(z.object({ projetoId: z.string() }))
    .query(({ input, ctx }) => service.listCards(input.projetoId, ctx.user.id)),

  get: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => service.getCard(input.id, ctx.user.id)),

  create: funcionarioProcedure
    .input(createCardSchema)
    .mutation(({ input, ctx }) => service.createCard(input, ctx.user.id)),

  update: funcionarioProcedure
    .input(updateCardSchema)
    .mutation(({ input, ctx }) => service.updateCard(input, ctx.user.id)),

  move: funcionarioProcedure
    .input(moveCardSchema)
    .mutation(({ input }) => service.moveCard(input)),

  remove: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => service.removeCard(input.id)),

  addChecklist: funcionarioProcedure
    .input(addChecklistSchema)
    .mutation(({ input }) => service.addChecklist(input)),

  toggleChecklist: funcionarioProcedure
    .input(z.object({ id: z.string(), concluido: z.boolean() }))
    .mutation(({ input }) => service.toggleChecklist(input.id, input.concluido)),

  removeChecklist: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => service.removeChecklist(input.id)),

  addComentario: funcionarioProcedure
    .input(z.object({ cardId: z.string(), conteudo: z.string().trim().min(1) }))
    .mutation(({ input, ctx }) => service.addComentario(input.cardId, input.conteudo, ctx.user.id)),

  editComentario: funcionarioProcedure
    .input(z.object({ id: z.string(), conteudo: z.string().trim().min(1) }))
    .mutation(({ input, ctx }) => service.editComentario(input.id, input.conteudo, ctx.user.id)),

  removeComentario: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.removeComentario(input.id, ctx.user.id, hasRoleLevel(ctx.user.role, "ADMIN"))),

  startTimer: funcionarioProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(({ input, ctx }) => service.startTimer(input.cardId, ctx.user.id)),

  stopTimer: funcionarioProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(({ input, ctx }) => service.stopTimer(input.cardId, ctx.user.id)),
});
