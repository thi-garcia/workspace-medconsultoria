import { useEffect, useState } from "react";
import { Sparkles, Loader2, Copy, RefreshCw, Check } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

/**
 * Diálogo genérico de resultado de IA: roda `run()` ao abrir, mostra o texto gerado
 * com botões Copiar e Refazer. Padrão "a IA sugere, você usa/aprova".
 */
export function AssistenteIADialog({
  title,
  run,
  onClose,
}: {
  title: string;
  run: () => Promise<string>;
  onClose: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = () => {
    setLoading(true);
    setErro(null);
    run()
      .then((t) => setTexto(t))
      .catch((e) => setErro(e?.message ?? "Falha na IA."))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, []);

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A IA está pensando…
          </div>
        ) : erro ? (
          <p className="text-sm text-destructive">{erro}</p>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-3.5 text-sm leading-relaxed text-foreground">
            {texto}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Sugestão da IA — confira antes de usar.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Refazer
            </Button>
            <Button size="sm" onClick={copiar} disabled={loading || !texto}>
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
