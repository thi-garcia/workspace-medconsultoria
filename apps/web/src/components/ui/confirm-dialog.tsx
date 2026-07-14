import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@app/ui";
import { Modal } from "./modal";
import { Button } from "./button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: LucideIcon;
  /** Caixa de opção opcional (ex.: "enviar e-mail?"). O valor volta em `marcado`. */
  checkbox?: { label: string; hint?: string; default?: boolean };
}

interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  required?: boolean;
}

/** Resultado da confirmação com checkbox: se confirmou e se a opção ficou marcada. */
export interface ConfirmarResult {
  confirmado: boolean;
  marcado: boolean;
}

type Estado =
  | { tipo: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { tipo: "confirmar"; opts: ConfirmOptions; resolve: (v: ConfirmarResult) => void }
  | { tipo: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void }
  | null;

interface DialogsApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Como `confirm`, mas com uma caixa de opção; devolve `{ confirmado, marcado }`. */
  confirmar: (opts: ConfirmOptions & { checkbox: NonNullable<ConfirmOptions["checkbox"]> }) => Promise<ConfirmarResult>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
}

const Ctx = createContext<DialogsApi | null>(null);

/** Diálogos imperativos (substituem window.confirm/prompt) com o visual da app. */
export function useDialogs(): DialogsApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialogs exige o <DialogsProvider> na árvore.");
  return ctx;
}
export const useConfirm = () => useDialogs().confirm;
export const useConfirmar = () => useDialogs().confirmar;
export const usePrompt = () => useDialogs().prompt;

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(null);
  const [texto, setTexto] = useState("");
  const [marcado, setMarcado] = useState(false);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setEstado({ tipo: "confirm", opts, resolve })),
    [],
  );
  const confirmar = useCallback(
    (opts: ConfirmOptions & { checkbox: NonNullable<ConfirmOptions["checkbox"]> }) =>
      new Promise<ConfirmarResult>((resolve) => {
        setMarcado(opts.checkbox.default ?? false);
        setEstado({ tipo: "confirmar", opts, resolve });
      }),
    [],
  );
  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setTexto(opts.defaultValue ?? "");
        setEstado({ tipo: "prompt", opts, resolve });
      }),
    [],
  );

  const api = useMemo(() => ({ confirm, confirmar, prompt }), [confirm, confirmar, prompt]);

  const fechar = (cancelado: boolean) => {
    if (!estado) return;
    if (estado.tipo === "confirm") estado.resolve(!cancelado);
    else if (estado.tipo === "confirmar") estado.resolve({ confirmado: !cancelado, marcado });
    else estado.resolve(cancelado ? null : texto);
    setEstado(null);
  };

  const destrutivo = estado?.opts.variant === "destructive";
  const Icon: LucideIcon =
    estado?.opts.icon ?? (destrutivo ? AlertTriangle : HelpCircle);
  const promptInvalido =
    estado?.tipo === "prompt" && !!estado.opts.required && !texto.trim();

  return (
    <Ctx.Provider value={api}>
      {children}
      {estado && (
        <Modal open onClose={() => fechar(true)} title={estado.opts.title} size="sm">
          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  destrutivo ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                {estado.opts.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {estado.opts.description}
                  </p>
                )}

                {estado.tipo === "prompt" &&
                  (estado.opts.multiline ? (
                    <textarea
                      autoFocus
                      rows={4}
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      placeholder={estado.opts.placeholder}
                      className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  ) : (
                    <input
                      autoFocus
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !promptInvalido) fechar(false);
                      }}
                      placeholder={estado.opts.placeholder}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                  ))}

                {estado.opts.checkbox && (
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={(e) => setMarcado(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">{estado.opts.checkbox.label}</span>
                      {estado.opts.checkbox.hint && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {estado.opts.checkbox.hint}
                        </span>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => fechar(true)}>
                {estado.opts.cancelText ?? "Cancelar"}
              </Button>
              <Button
                variant={destrutivo ? "destructive" : "default"}
                disabled={promptInvalido}
                onClick={() => fechar(false)}
              >
                {estado.opts.confirmText ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}
