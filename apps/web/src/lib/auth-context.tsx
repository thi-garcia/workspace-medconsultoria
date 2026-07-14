import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@app/shared";

interface AuthValue {
  user: SessionUser;
  logout: () => void;
  loggingOut: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ value, children }: { value: AuthValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
