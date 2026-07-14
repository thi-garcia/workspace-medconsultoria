import { useEffect, useRef, useState } from "react";
import { Send, Loader2, LifeBuoy } from "lucide-react";
import { cn } from "@app/ui";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { dataHora } from "../../lib/format-date";

export interface SuporteMsg {
  id: string;
  conteudo: string;
  createdAt: Date;
  autor: { id: string; nome: string; role: string } | null;
}

/** Chat de suporte (Portal ↔ equipe). `meuLado` alinha os balões do lado certo. */
export function SuporteChat({
  mensagens,
  meuLado,
  onEnviar,
  enviando,
  isLoading,
}: {
  mensagens: SuporteMsg[];
  meuLado: "equipe" | "cliente";
  onEnviar: (corpo: string) => void;
  enviando: boolean;
  isLoading?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const enviar = () => {
    if (texto.trim()) {
      onEnviar(texto.trim());
      setTexto("");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-80 min-h-40 flex-1 space-y-2 overflow-auto p-3">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <LifeBuoy className="h-6 w-6 text-muted-foreground/40" />
            {meuLado === "cliente"
              ? "Precisa de algo? Envie uma mensagem para a nossa equipe."
              : "Nenhuma mensagem de suporte com este cliente ainda."}
          </div>
        ) : (
          mensagens.map((m) => {
            const daEquipe = m.autor?.role !== "CLIENTE";
            const minha = (meuLado === "equipe") === daEquipe;
            return (
              <div key={m.id} className={cn("flex", minha ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    minha ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {!minha && (
                    <div className="mb-0.5 text-[11px] font-semibold opacity-80">
                      {daEquipe ? (m.autor?.nome ?? "Equipe MedConsultoria") : (m.autor?.nome ?? "Cliente")}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.conteudo}</p>
                  <div
                    className={cn(
                      "mt-0.5 text-right text-[10px]",
                      minha ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {dataHora(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="flex items-center gap-2 border-t bg-muted/20 p-3"
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem…"
          className="rounded-full bg-card"
        />
        <Button type="submit" size="icon" disabled={enviando || !texto.trim()} className="shrink-0 rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
