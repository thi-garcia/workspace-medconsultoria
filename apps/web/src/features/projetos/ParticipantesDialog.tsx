import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@app/ui";
import { trpc } from "../../lib/trpc";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";

/** Gerencia os participantes (membros) de um projeto — vários usuários por projeto. */
export function ParticipantesDialog({
  open,
  onClose,
  projetoId,
  atuais,
}: {
  open: boolean;
  onClose: () => void;
  projetoId: string;
  atuais: string[];
}) {
  const utils = trpc.useUtils();
  const equipe = trpc.usuarios.equipe.useQuery(undefined, { enabled: open });
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSel(new Set(atuais));
  }, [open, atuais]);

  const salvar = trpc.projetos.setParticipantes.useMutation({
    onSuccess: () => {
      utils.projetos.get.invalidate({ id: projetoId });
      onClose();
    },
  });

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Participantes do projeto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate({ projetoId, userIds: [...sel] })} disabled={salvar.isPending}>
            Salvar participantes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escolha quem participa/gerencia este projeto. Quem for adicionado recebe uma notificação.
        </p>
        <div className="max-h-72 space-y-1 overflow-auto">
          {(equipe.data ?? []).map((u) => {
            const on = sel.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  on ? "border-primary bg-primary/5" : "border-transparent hover:bg-accent/40",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blueLight to-primary text-xs font-semibold text-white">
                  {u.nome.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{u.nome}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        {salvar.error && <p className="text-sm text-destructive">{salvar.error.message}</p>}
      </div>
    </Modal>
  );
}
