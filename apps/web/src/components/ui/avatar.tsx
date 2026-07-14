import { useState } from "react";
import { cn } from "@app/ui";

/** URL da foto de perfil de um usuário (servida por GET /avatar/:id). `v` cache-busta a cada troca. */
export function avatarSrc(userId?: string | null, avatarUrl?: string | null): string | null {
  if (!userId || !avatarUrl) return null;
  return `/avatar/${userId}?v=${encodeURIComponent(avatarUrl)}`;
}

/**
 * Avatar do usuário: mostra a foto (se houver) ou as iniciais como fallback.
 * Usado em toda a app (header, mensagens, listas, ficha, Portal).
 */
export function Avatar({
  id,
  nome,
  avatarUrl,
  className,
  text = "text-sm",
}: {
  id?: string | null;
  nome?: string | null;
  avatarUrl?: string | null;
  className?: string; // classes de tamanho (h-/w-) + extras
  text?: string; // tamanho da fonte da inicial
}) {
  const [erro, setErro] = useState(false);
  const src = erro ? null : avatarSrc(id, avatarUrl);
  const inicial = (nome?.trim().charAt(0) || "?").toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={nome ?? "Avatar"}
        onError={() => setErro(true)}
        className={cn("shrink-0 rounded-full bg-muted object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blueLight to-primary font-semibold text-white",
        text,
        className,
      )}
    >
      {inicial}
    </span>
  );
}

/**
 * Botão de upload da foto de perfil (POST /avatar, multipart). Mostra prévia,
 * progresso e permite remover. `onChanged` deve invalidar `auth.me` (equipe) ou
 * `portal.resumo` (cliente) para propagar a nova foto.
 */
export function AvatarUpload({
  id,
  nome,
  avatarUrl,
  onChanged,
  onRemover,
  podeRemover,
}: {
  id: string;
  nome: string;
  avatarUrl: string | null;
  onChanged: () => void;
  onRemover?: () => void;
  podeRemover?: boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = (file: File) => {
    setErro(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErro("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro("Imagem muito grande (máx. 5 MB).");
      return;
    }
    const fd = new FormData();
    fd.append("arquivo", file);
    setEnviando(true);
    fetch("/avatar", { method: "POST", body: fd, credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Falha no envio.");
        onChanged();
      })
      .catch((e) => setErro(e.message))
      .finally(() => setEnviando(false));
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar id={id} nome={nome} avatarUrl={avatarUrl} className="h-20 w-20" text="text-2xl" />
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            {enviando ? "Enviando…" : avatarUrl ? "Trocar foto" : "Enviar foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={enviando}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) enviar(f);
                e.target.value = "";
              }}
            />
          </label>
          {avatarUrl && podeRemover && onRemover && (
            <button type="button" onClick={onRemover} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive">
              Remover
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 5 MB.</p>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
      </div>
    </div>
  );
}
