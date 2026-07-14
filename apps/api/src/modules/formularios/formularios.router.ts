import { z } from "zod";
import {
  createFormularioSchema,
  updateFormularioSchema,
  addCampoSchema,
  updateCampoSchema,
} from "@app/shared";
import { router, funcionarioProcedure, adminProcedure } from "../../trpc/trpc.js";
import * as service from "./formularios.service.js";

export const formulariosRouter = router({
  // Catálogo de formulários (para ligar a um requisito e para a gestão).
  list: funcionarioProcedure.query(() => service.listFormularios()),
  get: funcionarioProcedure.input(z.object({ id: z.string() })).query(({ input }) => service.getFormulario(input.id)),

  // Gestão (admin): criar/editar/remover formulários e campos.
  criar: adminProcedure.input(createFormularioSchema).mutation(({ input }) => service.criarFormulario(input)),
  atualizar: adminProcedure.input(updateFormularioSchema).mutation(({ input }) => {
    const { id, ...dados } = input;
    return service.atualizarFormulario(id, dados);
  }),
  remover: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => service.removerFormulario(input.id)),

  addCampo: adminProcedure.input(addCampoSchema).mutation(({ input }) => service.addCampo(input)),
  atualizarCampo: adminProcedure.input(updateCampoSchema).mutation(({ input }) => {
    const { id, ...dados } = input;
    return service.atualizarCampo(id, dados);
  }),
  removerCampo: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => service.removerCampo(input.id)),
  reordenarCampos: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(({ input }) => service.reordenarCampos(input.ids)),

  // Resposta preenchida (equipe vê na ficha).
  resposta: funcionarioProcedure.input(z.object({ id: z.string() })).query(({ input }) => service.getResposta(input.id)),
});
