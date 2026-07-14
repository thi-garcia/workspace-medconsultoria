import { AlertTriangle } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

/** Estado de erro padrão para páginas que carregam dados de uma query. */
export function QueryError({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Não foi possível carregar"
      description={message ?? "Ocorreu um erro ao buscar os dados. Verifique a conexão e tente de novo."}
    >
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </EmptyState>
  );
}
