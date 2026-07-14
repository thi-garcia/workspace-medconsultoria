import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Building2, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

/** Operadora na tela — existente (id do banco) ou nova ainda não salva (`_novo`). */
type LocalOp = { id: string; nome: string; _novo?: boolean };

/**
 * Gestão do catálogo de operadoras (Proposta de credenciamento) com **salvamento explícito**:
 * adicionar/editar/excluir só mexem numa lista LOCAL; nada vai ao banco até **Salvar alterações**.
 * "Cancelar" descarta. Excluir é permanente (o nome é só copiado para o documento; sem vínculo).
 */
export function OperadorasDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const cat = trpc.documentos.operadoras.list.useQuery(undefined, { enabled: open });

  const [local, setLocal] = useState<LocalOp[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (cat.data) {
      setLocal(cat.data.map((o) => ({ id: o.id, nome: o.nome })));
      setRemovidos([]);
      setDirty(false);
      setEditId(null);
      setNome("");
    }
  }, [cat.data]);

  const criar = trpc.documentos.operadoras.criar.useMutation();
  const renomear = trpc.documentos.operadoras.renomear.useMutation();
  const remover = trpc.documentos.operadoras.remover.useMutation();

  const limpar = () => {
    setEditId(null);
    setNome("");
  };

  const aplicarNoLocal = () => {
    const n = nome.trim();
    if (!n) return;
    if (editId) {
      setLocal((l) => l.map((o) => (o.id === editId ? { ...o, nome: n } : o)));
    } else {
      if (local.some((o) => o.nome.toLowerCase() === n.toLowerCase())) {
        limpar();
        return;
      }
      setLocal((l) => [...l, { id: `novo-${Date.now()}-${l.length}`, nome: n, _novo: true }]);
    }
    setDirty(true);
    limpar();
  };

  const excluirLocal = (id: string) => {
    const o = local.find((x) => x.id === id);
    setLocal((l) => l.filter((x) => x.id !== id));
    if (o && !o._novo) setRemovidos((r) => [...r, id]);
    if (editId === id) limpar();
    setDirty(true);
  };

  const fechar = () => {
    limpar();
    onClose();
  };

  const salvarTudo = async () => {
    setSalvando(true);
    setErro("");
    try {
      for (const id of removidos) await remover.mutateAsync({ id });
      for (const o of local) {
        if (o._novo) await criar.mutateAsync({ nome: o.nome });
        else {
          const orig = cat.data?.find((x) => x.id === o.id);
          if (orig && orig.nome !== o.nome) await renomear.mutateAsync({ id: o.id, nome: o.nome });
        }
      }
      await utils.documentos.operadoras.list.invalidate();
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar. Tente de novo.");
      await utils.documentos.operadoras.list.invalidate();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Operadoras e convênios"
      footer={
        <>
          <Button variant="outline" onClick={fechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarTudo} disabled={!dirty || salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O catálogo de operadoras que você pode credenciar. Aparecem para seleção na Proposta de credenciamento.
        </p>

        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {cat.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : local.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma operadora — adicione abaixo.</p>
          ) : (
            local.map((o) => (
              <div key={o.id} className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.nome}</span>
                {o._novo && <Badge variant="warning">novo</Badge>}
                <button
                  onClick={() => (setEditId(o.id), setNome(o.nome))}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => excluirLocal(o.id)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editId ? "Editar operadora" : "Nova operadora"}</h3>
            {(editId || nome.trim()) && (
              <button onClick={limpar} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                {editId ? "Cancelar edição" : "Limpar"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), aplicarNoLocal())}
              placeholder="Ex.: Unimed"
              autoComplete="off"
            />
            <Button variant="outline" onClick={aplicarNoLocal} disabled={!nome.trim()}>
              {editId ? "Aplicar" : (<><Plus className="h-4 w-4" /> Adicionar</>)}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          As mudanças só são gravadas ao clicar em <strong>Salvar alterações</strong>.
        </p>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Modal>
  );
}
