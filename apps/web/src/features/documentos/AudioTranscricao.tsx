import { useRef, useState } from "react";
import { Mic, Square, Upload, Loader2 } from "lucide-react";

/**
 * Grava pelo microfone OU envia um arquivo de áudio; manda para `/transcrever` (IA/Whisper)
 * e devolve o texto por `onTexto` (o pai concatena no campo). Usado em Ata/Pauta/Gerar com IA.
 */
export function AudioTranscricao({ onTexto }: { onTexto: (texto: string) => void }) {
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [erro, setErro] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const enviar = async (blob: Blob, filename: string) => {
    setTranscrevendo(true);
    setErro("");
    try {
      const fd = new FormData();
      fd.append("audio", blob, filename);
      const resp = await fetch("/transcrever", { method: "POST", body: fd, credentials: "include" });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "Falha ao transcrever.");
      }
      const { texto } = (await resp.json()) as { texto: string };
      if (texto?.trim()) onTexto(texto.trim());
      else setErro("Não consegui entender o áudio — tente falar mais perto do microfone.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao transcrever.");
    } finally {
      setTranscrevendo(false);
    }
  };

  const iniciar = async () => {
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void enviar(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }), "gravacao.webm");
      };
      rec.start();
      recRef.current = rec;
      setGravando(true);
    } catch {
      setErro("Não consegui acessar o microfone. Permita o acesso no navegador.");
    }
  };

  const parar = () => {
    recRef.current?.stop();
    setGravando(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/20 p-2">
      {gravando ? (
        <button
          type="button"
          onClick={parar}
          className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
        >
          <Square className="h-3.5 w-3.5" />
          Parar e transcrever
          <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-white" />
        </button>
      ) : (
        <button
          type="button"
          onClick={iniciar}
          disabled={transcrevendo}
          className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <Mic className="h-3.5 w-3.5 text-primary" />
          Gravar áudio
        </button>
      )}

      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent">
        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        Enviar áudio
        <input
          type="file"
          accept="audio/*,video/webm"
          className="hidden"
          disabled={transcrevendo || gravando}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void enviar(f, f.name);
            e.target.value = "";
          }}
        />
      </label>

      {transcrevendo && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcrevendo o áudio…
        </span>
      )}
      {!transcrevendo && !gravando && !erro && (
        <span className="text-xs text-muted-foreground">A IA transcreve e você revisa o texto abaixo.</span>
      )}
      {erro && <span className="text-xs text-destructive">{erro}</span>}
    </div>
  );
}
