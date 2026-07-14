import { useEffect } from "react";
import { X, FileDown, FileText, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Button } from "../../components/ui/button";
import {
  DocumentoBranded,
  imprimirDocumento,
  baixarWordDocumento,
  type DocumentoBrandedProps,
} from "../documentos/DocumentoBranded";

export function PortalDocumentoModal({ id, onClose }: { id: string; onClose: () => void }) {
  const doc = trpc.portal.documento.useQuery({ id });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-card shadow-xl">
        {doc.isLoading || !doc.data ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          (() => {
            const props: DocumentoBrandedProps = { titulo: doc.data.titulo, conteudoMarkdown: doc.data.conteudo };
            return (
              <>
                <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
                  <h2 className="font-semibold text-primary">{doc.data.titulo}</h2>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => imprimirDocumento(props)}>
                      <FileDown className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => baixarWordDocumento(props)}>
                      <FileText className="h-4 w-4" />
                      Word
                    </Button>
                    <button
                      onClick={onClose}
                      className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                      aria-label="Fechar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-auto bg-muted/30 p-4 sm:p-6">
                  <DocumentoBranded {...props} />
                </div>
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
