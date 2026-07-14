import { z } from "zod";
import { ROLES } from "../constants/roles.js";
import { senhaForte } from "./auth.js";

/** Papel atribuível na gestão de usuários. */
export const roleEnum = z.enum(ROLES);

/** Criação de um usuário (equipe interna ou acesso de Portal do Cliente). */
export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: senhaForte,
  role: roleEnum,
  // Obrigatório quando role = CLIENTE (escopo do Portal). Validado no serviço.
  clienteId: z.string().optional().or(z.literal("")),
});
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

/** Convite de um usuário (sem senha — ele define a própria ao aceitar). */
export const inviteUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: roleEnum,
  // Obrigatório quando role = CLIENTE (escopo do Portal). Validado no serviço.
  clienteId: z.string().optional().or(z.literal("")),
});
export type InviteUsuarioInput = z.infer<typeof inviteUsuarioSchema>;

/** Atualização de um usuário. Campos ausentes ficam inalterados. */
export const updateUsuarioSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(2, "Informe o nome").optional(),
  email: z.string().trim().toLowerCase().email("E-mail inválido").optional(),
  role: roleEnum.optional(),
  ativo: z.boolean().optional(),
  clienteId: z.string().optional().or(z.literal("")),
  // Se preenchida, redefine a senha (e revoga sessões existentes).
  novaSenha: senhaForte.optional().or(z.literal("")),
});
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

/** Exclusão (soft delete) de um usuário, com transferência opcional de responsabilidades. */
export const deleteUsuarioSchema = z.object({
  id: z.string().min(1),
  // Para quem transferir clientes/leads/projetos/tarefas do excluído. Vazio = deixar sem responsável.
  transferirParaId: z.string().optional().or(z.literal("")),
});
export type DeleteUsuarioInput = z.infer<typeof deleteUsuarioSchema>;
