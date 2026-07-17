/**
 * True se o erro de uma query/mutation tRPC é um NOT_FOUND (recurso inexistente).
 * Usado nas páginas de detalhe para mostrar "não encontrado" (estado terminal) em vez
 * do erro genérico de carregamento com "Tentar de novo" (que sugere falha transitória).
 */
export function isNotFoundError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "data" in err &&
    (err as { data?: { code?: string } }).data?.code === "NOT_FOUND"
  );
}
