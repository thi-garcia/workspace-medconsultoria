import { z } from "zod";
import { createProjetoSchema, updateProjetoSchema, setParticipantesSchema } from "@app/shared";
import { router, funcionarioProcedure } from "../../trpc/trpc.js";
import * as service from "./projetos.service.js";

export const projetosRouter = router({
  setParticipantes: funcionarioProcedure
    .input(setParticipantesSchema)
    .mutation(({ input, ctx }) => service.setParticipantes(input.projetoId, input.userIds, ctx.user.id)),

  list: funcionarioProcedure
    .input(z.object({ clienteId: z.string().optional() }).optional())
    .query(({ input }) => service.listProjetos(input?.clienteId)),

  get: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => service.getProjeto(input.id)),

  create: funcionarioProcedure
    .input(createProjetoSchema)
    .mutation(({ input, ctx }) => service.createProjeto(input, ctx.user.id)),

  update: funcionarioProcedure
    .input(updateProjetoSchema)
    .mutation(({ input }) => service.updateProjeto(input)),

  remove: funcionarioProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => service.removeProjeto(input.id, ctx.user.id)),
});
