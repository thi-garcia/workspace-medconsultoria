import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@app/ui";

const ACEITOS = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx";
const TAMANHO_MAX = 20 * 1024 * 1024;

/**
 * Botão de upload que envia um arquivo para o endpoint /upload (multipart), com barra
 * de progresso. Os `campos` extras (clienteId/servicoId/requisitoId) vão ANTES do
 * arquivo no FormData — o servidor lê os campos e então grava o arquivo.
 */
export function UploadArquivo({
  campos,
  onDone,
  label = "Enviar documento",
  size = "sm",
}: {
  campos: Record<string, string | undefined>;
  onDone?: () => void;
  label?: string;
  size?: "sm" | "xs";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = (file: File) => {
    setErro(null);
    if (file.size > TAMANHO_MAX) {
      setErro("Arquivo muito grande (máx. 20 MB).");
      return;
    }
    const fd = new FormData();
    for (const [k, v] of Object.entries(campos)) if (v) fd.append(k, v);
    fd.append("arquivo", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgresso(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        onDone?.();
      } else {
        try {
          setErro(JSON.parse(xhr.responseText).error ?? "Falha no envio.");
        } catch {
          setErro("Falha no envio.");
        }
      }
    };
    xhr.onerror = () => {
      setProgresso(null);
      setErro("Falha de conexão no envio.");
    };
    setProgresso(0);
    xhr.send(fd);
  };

  const enviando = progresso !== null;

  return (
    <div className="space-y-1">
      <input
        ref={ref}
        type="file"
        accept={ACEITOS}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) enviar(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={enviando}
        onClick={() => ref.current?.click()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60",
          size === "xs" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
        )}
      >
        {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {enviando ? `Enviando… ${progresso}%` : label}
      </button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

/** Link de download de um arquivo (baixa via /arquivos/:id, com o cookie de sessão). */
export function ArquivoLink({ id, nome, className }: { id: string; nome: string; className?: string }) {
  return (
    <a
      href={`/arquivos/${id}`}
      className={cn("truncate text-primary hover:underline", className)}
      title={`Baixar ${nome}`}
    >
      {nome}
    </a>
  );
}
