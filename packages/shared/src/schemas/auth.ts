import { z } from "zod";

/** Login por e-mail + senha. Reusado no form do front e no input da procedure. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Regra única de força de senha — reusada em perfil e gestão de usuários. */
export const senhaForte = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres")
  .max(200, "Senha muito longa");

/** Edição do próprio perfil (o e-mail não é editável por aqui). */
export const updateProfileSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Troca da própria senha: confirma a atual e valida a nova. */
export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: senhaForte,
    confirmar: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "A confirmação não confere",
    path: ["confirmar"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Aceite de convite: a pessoa define a própria senha a partir do token do link. */
export const aceitarConviteSchema = z
  .object({
    token: z.string().min(1),
    novaSenha: senhaForte,
    confirmar: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "A confirmação não confere",
    path: ["confirmar"],
  });
export type AceitarConviteInput = z.infer<typeof aceitarConviteSchema>;

/** Solicitação de redefinição de senha (informa o e-mail). */
export const solicitarResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
});
export type SolicitarResetInput = z.infer<typeof solicitarResetSchema>;

/** Redefinição de senha via token do link. */
export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(1),
    novaSenha: senhaForte,
    confirmar: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "A confirmação não confere",
    path: ["confirmar"],
  });
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
