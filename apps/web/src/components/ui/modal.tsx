import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@app/ui";

/** Seletor dos elementos focáveis dentro do modal (para foco inicial e focus trap). */
const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const listarFocaveis = (root: HTMLElement | null): HTMLElement[] =>
  root ? [...root.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((el) => el.offsetParent !== null || el === document.activeElement) : [];

/** Larguras padronizadas dos modais. `md` é o padrão (mais confortável que o antigo). */
const SIZES = {
  sm: "max-w-md", // ~448px — confirmações/prompts curtos
  md: "max-w-xl", // ~576px — padrão (formulários simples)
  lg: "max-w-2xl", // ~672px — formulários maiores
  xl: "max-w-4xl", // ~896px — construtores/tabelas
  "2xl": "max-w-6xl", // ~1152px — construtor + preview lado a lado
} as const;

// Pilha de onClose dos modais abertos + UM listener global de Esc que fecha SEMPRE o do topo
// (o último registrado). Assim um modal-sobre-modal (ex.: "Gerenciar operadoras" dentro do
// "Novo documento") fecha só o de cima no Esc — sem perder o de baixo.
const escStack: Array<() => void> = [];
let escListening = false;
function ensureEscListener() {
  if (escListening) return;
  escListening = true;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && escStack.length) escStack[escStack.length - 1]!();
  });
}


/**
 * Modal (overlay + card). Fecha no Esc e no clique fora.
 * Estrutura: cabeçalho FIXO · corpo que ROLA POR DENTRO · rodapé FIXO (opcional).
 * Assim as ações (Salvar/Cancelar) ficam SEMPRE visíveis — só os campos rolam.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Rodapé fixo (ex.: botões de ação). Fica sempre visível; só o corpo rola. */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
}) {
  // onClose via ref (evita re-registrar a cada render). Registra na pilha global de Esc ao abrir.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const cardRef = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!open) return;
    ensureEscListener();
    const fn = () => onCloseRef.current();
    escStack.push(fn);

    // Acessibilidade: guarda o foco atual, foca o 1º elemento do modal e prende o Tab dentro dele.
    focoAnterior.current = (document.activeElement as HTMLElement) ?? null;
    const card = cardRef.current;
    const t = window.setTimeout(() => {
      const foc = listarFocaveis(card);
      (foc[0] ?? card)?.focus();
    }, 0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !card) return;
      const foc = listarFocaveis(card);
      if (!foc.length) return;
      const primeiro = foc[0]!;
      const ultimo = foc[foc.length - 1]!;
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    card?.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t);
      const i = escStack.lastIndexOf(fn);
      if (i >= 0) escStack.splice(i, 1);
      card?.removeEventListener("keydown", onKeyDown);
      // Restaura o foco para quem abriu o modal (se ainda estiver no documento).
      focoAnterior.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={cn("flex max-h-[95vh] w-full animate-scale-in flex-col rounded-xl border bg-card shadow-lg outline-none", SIZES[size])}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
          <h2 id={tituloId} className="text-lg font-semibold text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-card px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
