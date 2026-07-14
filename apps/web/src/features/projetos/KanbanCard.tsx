import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, CheckSquare } from "lucide-react";
import { cn } from "@app/ui";
import { PRIORIDADE_LABEL, type CardStatus, type Prioridade } from "@app/shared";
import { Badge, type BadgeProps } from "../../components/ui/badge";

export interface CardItem {
  id: string;
  projetoId: string;
  titulo: string;
  descricao: string | null;
  status: CardStatus;
  prioridade: Prioridade;
  prazo: Date | null;
  ordem: number;
  responsavel: { nome: string } | null;
  servico: { nome: string } | null;
  checklist: { id: string; concluido: boolean }[];
  tempoTotalSeg: number;
  timerInicio: Date | null;
}

const prioridadeVariant: Record<Prioridade, BadgeProps["variant"]> = {
  BAIXA: "default",
  MEDIA: "primary",
  ALTA: "warning",
  URGENTE: "danger",
};

function fmtDur(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function KanbanCard({
  card,
  onOpen,
  overlay = false,
}: {
  card: CardItem;
  onOpen?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const feitos = card.checklist.filter((c) => c.concluido).length;

  // O card INTEIRO é a alça de arrastar E o clique para abrir: o sensor de ponteiro
  // usa distância mínima (6px), então um clique curto abre e um movimento arrasta.
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      onClick={overlay ? undefined : onOpen}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        "rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        !overlay && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="text-sm font-medium">{card.titulo}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        <Badge variant={prioridadeVariant[card.prioridade]}>{PRIORIDADE_LABEL[card.prioridade]}</Badge>
        {card.checklist.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-muted-foreground">
            <CheckSquare className="h-3 w-3" />
            {feitos}/{card.checklist.length}
          </span>
        )}
        {(card.tempoTotalSeg > 0 || card.timerInicio) && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5",
              card.timerInicio ? "font-medium text-success" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3 w-3" />
            {fmtDur(card.tempoTotalSeg)}
            {card.timerInicio && " ▸"}
          </span>
        )}
      </div>
    </div>
  );
}
