import { z } from "zod";
import {
  createContaSchema,
  updateContaSchema,
  listContasSchema,
  marcarPagaSchema,
  createCategoriaSchema,
  updateCategoriaSchema,
  listCategoriasSchema,
  carteiraInputSchema,
} from "@app/shared";
import { router, adminProcedure } from "../../trpc/trpc.js";
import * as contas from "./contas.service.js";
import * as categorias from "./categorias.service.js";

// Financeiro é sensível → acesso ADMIN/ROOT (adminProcedure). Carteira PESSOAL é privada por usuário.
const ctxDe = (ctx: { user: { id: string; role: string } }): contas.Ctx => ({ userId: ctx.user.id, role: ctx.user.role });

export const financeiroRouter = router({
  categorias: router({
    list: adminProcedure
      .input(listCategoriasSchema)
      .query(({ input, ctx }) => categorias.listCategorias(input.escopo, ctxDe(ctx))),
    create: adminProcedure
      .input(createCategoriaSchema)
      .mutation(({ input, ctx }) => categorias.createCategoria(input, ctxDe(ctx))),
    update: adminProcedure
      .input(updateCategoriaSchema)
      .mutation(({ input, ctx }) => categorias.updateCategoria(input, ctxDe(ctx))),
    remove: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input, ctx }) => categorias.removeCategoria(input.id, ctxDe(ctx))),
  }),
  contas: router({
    resumo: adminProcedure
      .input(carteiraInputSchema)
      .query(({ input, ctx }) => contas.resumo(input.carteira, ctxDe(ctx))),
    porCategoria: adminProcedure
      .input(carteiraInputSchema)
      .query(({ input, ctx }) => contas.porCategoria(input.carteira, ctxDe(ctx))),
    agenda: adminProcedure
      .input(carteiraInputSchema)
      .query(({ input, ctx }) => contas.agendaFinanceira(input.carteira, ctxDe(ctx))),
    list: adminProcedure.input(listContasSchema).query(({ input, ctx }) => contas.listContas(input, ctxDe(ctx))),
    create: adminProcedure.input(createContaSchema).mutation(({ input, ctx }) => contas.createConta(input, ctxDe(ctx))),
    update: adminProcedure.input(updateContaSchema).mutation(({ input, ctx }) => contas.updateConta(input, ctxDe(ctx))),
    remove: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input, ctx }) => contas.removeConta(input.id, ctxDe(ctx))),
    marcarPaga: adminProcedure
      .input(marcarPagaSchema)
      .mutation(({ input, ctx }) => contas.marcarPaga(input.id, input.pago, ctxDe(ctx))),
  }),
});
