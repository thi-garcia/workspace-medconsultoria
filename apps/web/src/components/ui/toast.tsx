import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@app/ui";

type ToastTipo = "error" | "success";
interface ToastItem {
  id: number;
  message: string;
  tipo: ToastTipo;
}

let listeners: ((items: ToastItem[]) => void)[] = [];
let items: ToastItem[] = [];
let seq = 1;

function emit() {
  for (const l of listeners) l(items);
}

/** Mostra um aviso flutuante (canto inferior direito). Some sozinho em ~5s. */
export function toast(message: string, tipo: ToastTipo = "error") {
  const id = seq++;
  items = [...items, { id, message, tipo }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 5000);
}

/** Container dos toasts — montar uma vez na raiz do app. */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((l) => l !== setList);
    };
  }, []);

  const fechar = (id: number) => {
    items = items.filter((i) => i.id !== id);
    emit();
  };

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 text-sm shadow-lg animate-fade-in",
            t.tipo === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-success/30 bg-success/10 text-success",
          )}
        >
          {t.tipo === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1 leading-snug text-foreground">{t.message}</span>
          <button onClick={() => fechar(t.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground" title="Fechar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
