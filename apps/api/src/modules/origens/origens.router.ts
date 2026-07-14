import { z } from "zod";
import { createOrigemSchema, updateOrigemSchema } from "@app/shared";
import { router, funcionarioProcedure, adminProcedure } from "../../trpc/trpc.js";
import * as service from "./origens.service.js";

export const origensRouter = router({
  ativas: funcionarioProcedure.query(() => service.listOrigensAtivas()),
  list: adminProcedure.query(() => service.listOrigens()),
  criar: adminProcedure.input(createOrigemSchema).mutation(({ input }) => service.criarOrigem(input.nome)),
  atualizar: adminProcedure.input(updateOrigemSchema).mutation(({ input }) => {
    const { id, ...dados } = input;
    return service.atualizarOrigem(id, dados);
  }),
  remover: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => service.removerOrigem(input.id)),
  reordenar: adminProcedure
    .input(z.object({ ids: z.array(z.string().min(1)).min(1) }))
    .mutation(({ input }) => service.reordenarOrigens(input.ids)),
});
