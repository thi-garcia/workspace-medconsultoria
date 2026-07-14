import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@app/ui";
import { useAnchoredStyle } from "./use-anchored-style";

/**
 * Campo de texto livre com sugestões (autocomplete). Diferente do Combobox, aceita
 * qualquer valor digitado — as sugestões são apenas atalhos. Dropdown estilizado
 * no padrão do design system (tema claro/escuro), com navegação por teclado.
 */
export function Autocomplete({
  value,
  onChange,
  sugestoes,
  placeholder,
  id,
  maxItens = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  sugestoes: string[];
  placeholder?: string;
  id?: string;
  maxItens?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const opcaoId = (i: number) => `${listId}-opt-${i}`;
  // Dropdown flutua em portal (fixed) — não empurra nem rola o modal onde o campo está.
  const dropStyle = useAnchoredStyle(ref, open, 224);

  const q = value.trim().toLowerCase();
  const filtradas = sugestoes
    .filter((s) => (q ? s.toLowerCase().includes(q) && s.toLowerCase() !== q : true))
    .slice(0, maxItens);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (ref.current?.contains(alvo) || panelRef.current?.contains(alvo)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => setActive(-1), [value]);

  const escolher = (s: string) => {
    onChange(s);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtradas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0 && filtradas[active]) {
      e.preventDefault();
      escolher(filtradas[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors hover:border-muted-foreground/40 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        role="combobox"
        aria-expanded={open && filtradas.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 && filtradas[active] ? opcaoId(active) : undefined}
      />
      {open &&
        filtradas.length > 0 &&
        createPortal(
          <div
            ref={panelRef}
            id={listId}
            role="listbox"
            style={dropStyle}
            className="z-[70] animate-scale-in overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg"
          >
            {filtradas.map((s, i) => (
              <button
                key={s}
                type="button"
                role="option"
                id={opcaoId(i)}
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(s);
                }}
                className={cn(
                  "flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
