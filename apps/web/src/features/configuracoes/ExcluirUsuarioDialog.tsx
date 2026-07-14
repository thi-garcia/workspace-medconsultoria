import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  usuario: { id: string; nome: string } | null;
}

/** Confirmação de exclusão (soft delete) com transferência das responsabilidades. */
export function ExcluirUsuarioDialog({ open, onClose, usuario }: Props) {
  const utils = trpc.useUtils();
  const [destino, setDestino] = useState("");

  useEffect(() => {
    if (open) setDestino("");
  }, [open, usuario?.id]);

  const resumo = trpc.usuarios.resumoResponsabilidades.useQuery(
    { id: usuario?.id ?? "" },
    { enabled: open && !!usuario },
  );
  const equipe = trpc.usuarios.equipe.useQuery(undefined, { enabled: open });

  const remover = trpc.usuarios.remove.useMutation({
    onSuccess: () => {
      // A reatribuição toca estes domínios — invalida só o necessário (não o mundo todo).
      utils.usuarios.list.invalidate();
      utils.clientes.invalidate();
      utils.leads.invalidate();
      utils.projetos.invalidate();
      utils.cards.invalidate();
      utils.dashboard.invalidate();
      onClose();
    },
  });

  if (!usuario) return null;

  const opcoes = (equipe.data ?? []).filter((m) => m.id !== usuario.id);
  const r = resumo.data;
  const total = r?.total ?? 0;

  const partes = r
    ? [
        [r.clientes, "cliente(s)"],
        [r.leads, "lead(s)"],
        [r.projetos, "projeto(s)"],
        [r.tarefas, "tarefa(s)"],
      ]
        .filter(([n]) => (n as number) > 0)
        .map(([n, label]) => `${n} ${label}`)
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Excluir usuário"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={remover.isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={remover.isPending || resumo.isLoading}
            onClick={() => remover.mutate({ id: usuario.id, transferirParaId: destino })}
          >
            {remover.isPending ? "Excluindo…" : "Excluir usuário"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            <strong>{usuario.nome}</strong> perderá o acesso e as sessões serão encerradas. O histórico
            dele (documentos, mensagens, atividades) é preservado.
          </p>
        </div>

        {resumo.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando responsabilidades…
          </p>
        ) : total > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              É responsável por <strong className="text-foreground">{partes.join(", ")}</strong>. Escolha
              para quem transferir:
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="destino">Transferir responsabilidades para</Label>
              <Select id="destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">— Deixar sem responsável —</option>
                {opcoes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não é responsável por nenhum registro ativo — nada a transferir.
          </p>
        )}

        {r && r.participacoes > 0 && (
          <p className="text-xs text-muted-foreground">
            Também será removido como participante de {r.participacoes} projeto(s).
          </p>
        )}

        {remover.error && <p className="text-sm text-destructive">{remover.error.message}</p>}
      </div>
    </Modal>
  );
}
