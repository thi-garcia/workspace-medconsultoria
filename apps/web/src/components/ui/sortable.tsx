import { createContext, useContext, type ReactNode } from "react";
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
import { GripVertical } from "lucide-react";
import { cn } from "@app/ui";

/**
 * Lista reordenável por arraste-e-solte (dnd-kit). O pai mantém o estado da ordem
 * (otimista) e persiste em `onReorder(novaOrdemDeIds)`. Use com <SortableItem> +
 * <DragHandle> nos filhos.
 */
export function SortableList({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (ids: string[]) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

type HandleProps = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">;
const HandleCtx = createContext<HandleProps | null>(null);

/** Um item arrastável. Coloque um <DragHandle> em qualquer lugar dentro dele. */
export function SortableItem({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <HandleCtx.Provider value={{ attributes, listeners }}>
      <div ref={setNodeRef} style={style} className={cn(isDragging && "relative z-10 shadow-md", className)}>
        {children}
      </div>
    </HandleCtx.Provider>
  );
}

/** Alça de arraste — só funciona dentro de um <SortableItem>. */
export function DragHandle({ className }: { className?: string }) {
  const ctx = useContext(HandleCtx);
  return (
    <button
      type="button"
      {...(ctx?.attributes ?? {})}
      {...(ctx?.listeners ?? {})}
      title="Arraste para reordenar"
      className={cn(
        "cursor-grab touch-none rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
