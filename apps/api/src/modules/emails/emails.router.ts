import { z } from "zod";
import { router, adminProcedure } from "../../trpc/trpc.js";
import * as service from "./emails.service.js";

const camposSchema = z.object({
  chave: z.string().min(1),
  assunto: z.string().trim().min(1, "Informe o assunto"),
  titulo: z.string().trim().min(1, "Informe o título"),
  corpo: z.string().trim().min(1, "Escreva o corpo"),
  ctaTexto: z.string().trim().optional().or(z.literal("")),
  nota: z.string().trim().optional().or(z.literal("")),
});

/** Gestão dos e-mails transacionais — só ADMIN/ROOT. */
export const emailsRouter = router({
  list: adminProcedure.query(() => service.listarTemplates()),

  update: adminProcedure.input(camposSchema).mutation(({ ctx, input }) => {
    const { chave, ...dados } = input;
    return service.atualizarTemplate(chave, dados, ctx.user.nome);
  }),

  resetar: adminProcedure
    .input(z.object({ chave: z.string().min(1) }))
    .mutation(({ input }) => service.resetarTemplate(input.chave)),

  // Prévia como mutation (POST) — o corpo pode ser longo (evita limite de URL).
  preview: adminProcedure.input(camposSchema).mutation(({ input }) => {
    const { chave, ...campos } = input;
    return service.gerarPreview(chave, campos);
  }),

  enviarTeste: adminProcedure
    .input(z.object({ chave: z.string().min(1), email: z.string().trim().email("E-mail inválido") }))
    .mutation(({ input }) => service.enviarTeste(input.chave, input.email)),
});
