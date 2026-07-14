import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  erro: Error | null;
}

/**
 * Rede de segurança para erros de RENDER: se um componente quebrar, mostra uma tela
 * amigável com "Recarregar" em vez de uma tela branca. (Erros de MUTAÇÃO já viram toast
 * pela MutationCache em main.tsx; erros de QUERY viram <QueryError> nas páginas.)
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo): void {
    // Registro no console para depuração (o servidor não vê erros de render do navegador).
    console.error("Erro de render capturado pelo ErrorBoundary:", erro, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-foreground">Algo deu errado nesta tela</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tivemos um problema inesperado ao mostrar esta página. Seus dados estão a salvo — é só recarregar para continuar.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              Recarregar
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Home className="h-4 w-4" />
              Ir para o Início
            </button>
          </div>
        </div>
      </div>
    );
  }
}
