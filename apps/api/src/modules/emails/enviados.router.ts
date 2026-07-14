import { z } from "zod";
import { router, protectedProcedure, funcionarioProcedure, adminProcedure } from "../../trpc/trpc.js";
import * as service from "./enviados.service.js";

/** Histórico de e-mails por destinatário + monitor global (ROOT/ADMIN). */
export const emailsEnviadosRouter = router({
  // Os meus (qualquer usuário logado vê os e-mails que recebeu — em Configurações).
  meus: protectedProcedure.query(({ ctx }) => service.listMeus(ctx.user.id, ctx.user.email)),

  // Enviados a um lead / cliente (equipe interna, na ficha do lead/cliente).
  doLead: funcionarioProcedure
    .input(z.object({ leadId: z.string().min(1) }))
    .query(({ input }) => service.listPorLead(input.leadId)),
  doCliente: funcionarioProcedure
    .input(z.object({ clienteId: z.string().min(1) }))
    .query(({ input }) => service.listPorCliente(input.clienteId)),

  // ── Monitor global (só ADMIN/ROOT): indicadores + lista completa filtrável ──
  resumo: adminProcedure.query(() => service.resumoEnviados()),
  todos: adminProcedure
    .input(
      z.object({
        status: z.enum(["ENVIADO", "FALHOU"]).optional(),
        template: z.string().optional(),
        busca: z.string().optional(),
        dias: z.number().int().optional(),
        limite: z.number().int().min(1).max(500).optional(),
      }),
    )
    .query(({ input }) => service.listTodos(input)),
});
