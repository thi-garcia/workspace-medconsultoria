/**
 * Papéis do sistema (RBAC). Espelha o enum `Role` do Prisma em packages/db.
 * Ordem = hierarquia de privilégio (maior índice = mais poder), útil para checagens.
 */
export const ROLES = ["CLIENTE", "FUNCIONARIO", "ADMIN", "ROOT"] as const;

export type Role = (typeof ROLES)[number];

/** Nível numérico de cada papel para comparação de privilégio. */
export const ROLE_LEVEL: Record<Role, number> = {
  CLIENTE: 0,
  FUNCIONARIO: 1,
  ADMIN: 2,
  ROOT: 3,
};

/** Rótulos em PT-BR para exibição na UI. */
export const ROLE_LABEL: Record<Role, string> = {
  CLIENTE: "Cliente",
  FUNCIONARIO: "Funcionário",
  ADMIN: "Administrador",
  ROOT: "Root",
};

/** Verdadeiro se `role` tem privilégio >= ao `required`. */
export function hasRoleLevel(role: Role, required: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required];
}
