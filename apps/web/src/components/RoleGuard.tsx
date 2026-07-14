import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { hasRoleLevel, type Role } from "@app/shared";
import { useAuth } from "../lib/auth-context";
import { EmptyState } from "./ui/empty-state";
import { buttonVariants } from "./ui/button";

/**
 * Barra o conteúdo quando o papel do usuário não alcança `minRole`.
 * Defesa em profundidade no cliente — o backend já exige o papel nas procedures.
 */
export function RoleGuard({ minRole, children }: { minRole: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!hasRoleLevel(user.role, minRole)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acesso restrito"
        description="Você não tem permissão para ver esta área. Fale com um administrador se precisar de acesso."
      >
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Voltar ao início
        </Link>
      </EmptyState>
    );
  }
  return <>{children}</>;
}
