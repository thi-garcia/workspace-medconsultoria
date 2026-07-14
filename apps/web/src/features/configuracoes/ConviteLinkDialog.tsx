import { useState } from "react";
import { Copy, Check, Mail, Link2, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import type { ConviteResultado } from "./UsuarioFormDialog";

/** Mostra o resultado de um convite: link (modo dev), confirmação de e-mail ou erro. */
export function ConviteLinkDialog({
  info,
  erro,
  onClose,
}: {
  info: ConviteResultado | null;
  erro?: string | null;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  if (!info && !erro) return null;

  if (erro) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Não foi possível convidar"
        footer={<Button onClick={onClose}>Entendi</Button>}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-foreground">{erro}</p>
          </div>
        </div>
      </Modal>
    );
  }
  if (!info) return null;

  const copiar = async () => {
    if (!info.conviteUrl) return;
    await navigator.clipboard.writeText(info.conviteUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Modal open onClose={onClose} title="Convite criado" footer={<Button onClick={onClose}>Concluir</Button>}>
      <div className="space-y-4">
        {info.conviteUrl ? (
          <>
            <p className="text-sm text-muted-foreground">
              O envio por e-mail ainda não está configurado (modo dev). Envie este link para{" "}
              <strong>{info.email}</strong> definir a senha:
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
              <Link2 className="ml-1 h-4 w-4 shrink-0 text-primary" />
              <code className="min-w-0 flex-1 truncate text-xs">{info.conviteUrl}</code>
              <Button size="sm" variant="outline" onClick={copiar}>
                {copiado ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O link expira em 72 horas e só pode ser usado uma vez.
            </p>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-sm text-foreground">
              Convite enviado por e-mail para <strong>{info.email}</strong>.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
