import { z } from "zod";
import {
  createUsuarioSchema,
  inviteUsuarioSchema,
  updateUsuarioSchema,
  deleteUsuarioSchema,
} from "@app/shared";
import { router, adminProcedure, funcionarioProcedure } from "../../trpc/trpc.js";
import * as usuarios from "./usuarios.service.js";

// Gestão de equipe e acessos de Portal — sensível → ADMIN/ROOT (adminProcedure).
export const usuariosRouter = router({
  list: adminProcedure.query(() => usuarios.listUsuarios()),
  // Lista simples da equipe (id+nome) para atribuir responsáveis — acesso interno.
  equipe: funcionarioProcedure.query(() => usuarios.listEquipe()),
  create: adminProcedure
    .input(createUsuarioSchema)
    .mutation(({ ctx, input }) => usuarios.createUsuario(ctx.user.role, input)),
  // Convite por e-mail (onboarding padrão) — cria pendente e devolve o link em modo dev.
  convidar: adminProcedure
    .input(inviteUsuarioSchema)
    .mutation(({ ctx, input }) => usuarios.convidarUsuario(ctx.user.role, input)),
  reenviarConvite: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) => usuarios.reenviarConvite(ctx.user.role, input.id)),
  update: adminProcedure
    .input(updateUsuarioSchema)
    .mutation(({ ctx, input }) => usuarios.updateUsuario(ctx.user.id, ctx.user.role, input)),
  // Resumo do que o usuário é responsável — alimenta o diálogo de exclusão.
  resumoResponsabilidades: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => usuarios.resumoResponsabilidades(input.id)),
  remove: adminProcedure
    .input(deleteUsuarioSchema)
    .mutation(({ ctx, input }) =>
      usuarios.deleteUsuario(ctx.user.id, ctx.user.role, input.id, input.transferirParaId),
    ),
});
