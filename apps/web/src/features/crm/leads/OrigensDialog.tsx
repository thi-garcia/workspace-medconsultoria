import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, GripVertical, Pencil, Check, X, Loader2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@app/ui";
import { trpc } from "../../../lib/trpc";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

/** Origem na tela — existente (id do banco) ou nova ainda não salva (`_novo`). */
type LocalOrigem = { id: string; nome: string; ativo: boolean; _novo?: boolean };

/** Uma origem na lista — arrastável pela alça (GripVertical), com nome editável e remover. */
function OrigemRow({
  o,
  onToggle,
  onRemove,
  onRename,
}: {
  o: LocalOrigem;
  onToggle: () => void;
  onRemove: () => void;
  onRename: (nome: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: o.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(o.nome);
  const salvar = () => {
    const n = draft.trim();
    if (n && n !== o.nome) onRename(n);
    setEditando(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card p-2.5 text-sm",
        !o.ativo && "opacity-60",
        isDragging && "z-10 shadow-md",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Arraste para reordenar"
        className="-ml-1 cursor-grab touch-none rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {editando ? (
        <Input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvar();
            } else if (e.key === "Escape") {
              setDraft(o.nome);
              setEditando(false);
            }
          }}
          className="h-8 flex-1"
          aria-label={`Editar ${o.nome}`}
        />
      ) : (
        <span className="flex-1">
          {o.nome}
          {o._novo && <Badge variant="warning" className="ml-2">novo</Badge>}
          {!o.ativo && <span className="ml-2 text-xs text-muted-foreground">(inativa)</span>}
        </span>
      )}
      {editando ? (
        <>
          <button type="button" onClick={salvar} title="Salvar" className="rounded p-1 text-primary transition-colors hover:bg-primary/10">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => (setDraft(o.nome), setEditando(false))} title="Cancelar" className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => (setDraft(o.nome), setEditando(true))}
            title="Editar nome"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            title={o.ativo ? "Desativar (ocultar das sugestões)" : "Ativar"}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {o.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remover"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Gestão do catálogo de origens de lead com **salvamento explícito**: criar / renomear / ativar /
 * remover / reordenar só mexem numa lista LOCAL; nada vai ao banco até **Salvar alterações**.
 * "Cancelar" descarta tudo.
 */
export function OrigensDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const lista = trpc.origens.list.useQuery(undefined, { enabled: open });

  const [items, setItems] = useState<LocalOrigem[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (lista.data) {
      setItems(lista.data.map((o) => ({ id: o.id, nome: o.nome, ativo: o.ativo })));
      setRemovidos([]);
      setDirty(false);
      setNome("");
    }
  }, [lista.data]);

  const criar = trpc.origens.criar.useMutation();
  const atualizar = trpc.origens.atualizar.useMutation();
  const remover = trpc.origens.remover.useMutation();
  const reordenar = trpc.origens.reordenar.useMutation();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
    setDirty(true);
  };

  const adicionar = () => {
    const n = nome.trim();
    if (!n) return;
    setItems((l) => [...l, { id: `novo-${Date.now()}-${l.length}`, nome: n, ativo: true, _novo: true }]);
    setNome("");
    setDirty(true);
  };
  const renomear = (id: string, novoNome: string) => {
    setItems((l) => l.map((o) => (o.id === id ? { ...o, nome: novoNome } : o)));
    setDirty(true);
  };
  const toggle = (id: string) => {
    setItems((l) => l.map((o) => (o.id === id ? { ...o, ativo: !o.ativo } : o)));
    setDirty(true);
  };
  const excluir = (id: string) => {
    const o = items.find((x) => x.id === id);
    setItems((l) => l.filter((x) => x.id !== id));
    if (o && !o._novo) setRemovidos((r) => [...r, id]);
    setDirty(true);
  };

  const salvarTudo = async () => {
    setSalvando(true);
    setErro("");
    try {
      for (const id of removidos) await remover.mutateAsync({ id });
      // Cria as novas e guarda o id real (para a reordenação final).
      const idMap = new Map<string, string>();
      for (const o of items) {
        if (o._novo) {
          const criada = await criar.mutateAsync({ nome: o.nome });
          idMap.set(o.id, criada.id);
          if (!o.ativo) await atualizar.mutateAsync({ id: criada.id, ativo: false });
        }
      }
      // Renomeações / ativar-desativar das existentes que mudaram.
      for (const o of items) {
        if (o._novo) continue;
        const orig = lista.data?.find((x) => x.id === o.id);
        if (orig && (orig.nome !== o.nome || orig.ativo !== o.ativo)) {
          await atualizar.mutateAsync({ id: o.id, nome: o.nome, ativo: o.ativo });
        }
      }
      // Ordem final (com os ids reais das novas).
      const finalIds = items.map((o) => idMap.get(o.id) ?? o.id);
      if (finalIds.length) await reordenar.mutateAsync({ ids: finalIds });

      utils.origens.list.invalidate();
      utils.origens.ativas.invalidate();
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar. Tente de novo.");
      utils.origens.list.invalidate();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Origens de lead"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
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
          De onde os leads chegam. Aparecem como sugestões no campo “Origem” do cadastro. Arraste pela alça para
          definir a ordem.
        </p>

        <div className="flex gap-2">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
            placeholder="Nova origem… (ex.: Google Ads)"
            autoComplete="off"
          />
          <Button variant="outline" onClick={adicionar} disabled={!nome.trim()}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        <div className="max-h-[45vh] space-y-1.5 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((o) => (
                <OrigemRow
                  key={o.id}
                  o={o}
                  onToggle={() => toggle(o.id)}
                  onRemove={() => excluir(o.id)}
                  onRename={(n) => renomear(o.id, n)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {items.length === 0 && !lista.isLoading && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma origem cadastrada.</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          As mudanças só são gravadas ao clicar em <strong>Salvar alterações</strong>.
        </p>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </Modal>
  );
}
