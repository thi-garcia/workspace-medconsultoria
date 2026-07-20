import { Link } from "@tanstack/react-router";
import { Loader2, LogIn, ArrowRight, UserCheck } from "lucide-react";
import { ROLE_LABEL } from "@app/shared";
import { useAuth } from "../../lib/auth-context";
import { Button, buttonVariants } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";

/**
 * `/login` com sessão ativa.
 *
 * Antes isto era um `redirect({ to: "/" })` mudo: quem já estava conectado e queria entrar com
 * OUTRA conta nunca via o formulário — voltava ao painel ainda logado como o usuário anterior e
 * concluía que a segunda conta não funcionava. Agora a situação fica explícita e trocar de conta
 * é um clique, sem ter de caçar o botão "Sair" no rodapé do menu.
 *
 * Sem o `AuthShell` de propósito: a rota já roda DENTRO do app, e a moldura de boas-vindas
 * (com o painel de marketing) só faria sentido para quem ainda está de fora.
 */
export function JaConectadoPage() {
  const { user, logout, loggingOut } = useAuth();

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Você já está conectado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta sessão continua aberta. Siga assim ou entre com outra conta.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <Avatar id={user.id} nome={user.nome} avatarUrl={user.avatarUrl} className="h-10 w-10" />
          {/* Sem `truncate`: o papel é justamente o que se precisa conferir ao trocar de conta. */}
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {user.nome} <span className="text-muted-foreground">· {ROLE_LABEL[user.role]}</span>
            </p>
            <p className="break-all text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Continuar como {user.nome.split(" ")[0]}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Button variant="outline" size="lg" className="w-full" onClick={logout} disabled={loggingOut}>
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar com outra conta
          </Button>
        </div>
      </div>
    </div>
  );
}
