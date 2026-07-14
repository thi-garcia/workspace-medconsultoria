import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

/**
 * Posiciona um painel flutuante (dropdown) ancorado a um elemento, em coordenadas
 * FIXAS — para ser renderizado em portal, FORA de qualquer container com `overflow`.
 * Escolhe abrir para baixo ou para cima conforme o espaço disponível e limita a altura
 * ao espaço livre. Reposiciona em scroll/resize. Assim o dropdown flutua por cima e
 * NUNCA empurra nem rola o card/modal onde o campo está.
 */
export function useAnchoredStyle(
  anchorRef: RefObject<HTMLElement>,
  open: boolean,
  maxHeight = 240,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const margem = 8;
      const espacoAbaixo = window.innerHeight - r.bottom - margem;
      const espacoAcima = r.top - margem;
      // Abre para cima só quando embaixo não cabe um dropdown mínimo e em cima há mais espaço.
      const paraCima = espacoAbaixo < Math.min(maxHeight, 176) && espacoAcima > espacoAbaixo;
      const disponivel = Math.max(120, Math.floor(paraCima ? espacoAcima : espacoAbaixo));
      setStyle({
        position: "fixed",
        left: Math.round(r.left),
        width: Math.round(r.width),
        maxHeight: Math.min(maxHeight, disponivel),
        visibility: "visible",
        ...(paraCima
          ? { bottom: Math.round(window.innerHeight - r.top + 4) }
          : { top: Math.round(r.bottom + 4) }),
      });
    };

    update();
    // `true` = fase de captura, para pegar o scroll de qualquer ancestral (corpo do modal).
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, maxHeight]);

  return style;
}
