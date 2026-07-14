import { Download, Loader2 } from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { escapeHtml } from "../../../lib/escape-html";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

type Valor = string | string[];
const valorTexto = (v: Valor | undefined) => (Array.isArray(v) ? v.join(", ") : v || "—");

/** Visualização (só-leitura) da resposta de um briefing pela equipe, na ficha. */
export function RespostaBriefingDialog({ respostaId, onClose }: { respostaId: string; onClose: () => void }) {
  const q = trpc.formularios.resposta.useQuery({ id: respostaId });
  const d = q.data;

  const baixar = () => {
    if (!d) return;
    // Escapa TODOS os valores (rótulo/resposta/título/cliente) — conteúdo vem do cliente (XSS #6).
    const linhas = d.campos
      .map(
        (c) =>
          `<div style="margin-bottom:14px"><div style="font-weight:600">${escapeHtml(c.rotulo)}</div><div style="white-space:pre-wrap">${escapeHtml(valorTexto(d.respostas[c.id]))}</div></div>`,
      )
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escapeHtml(d.titulo)}</title></head><body style="font-family:Arial,sans-serif;max-width:640px;margin:24px auto;color:#111"><h1 style="color:#002463">${escapeHtml(d.titulo)}</h1><p style="color:#555">${escapeHtml(d.clienteNome)}</p>${linhas}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Modal open onClose={onClose} title={d?.titulo ?? "Respostas"}>
      {q.isLoading || !d ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {d.status === "ENVIADO" ? "Enviado pelo cliente" : "Rascunho do cliente"}
            </span>
            <Button variant="outline" size="sm" onClick={baixar}>
              <Download className="h-4 w-4" /> Baixar
            </Button>
          </div>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {d.campos.map((c) => (
              <div key={c.id}>
                <p className="text-sm font-medium text-foreground">{c.rotulo}</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{valorTexto(d.respostas[c.id])}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
