import type { Role } from "./constants/roles.js";

/** Usuário autenticado exposto ao front (sem campos sensíveis). */
export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  clienteId: string | null;
}
