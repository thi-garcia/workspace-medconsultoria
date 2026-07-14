import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { solicitarResetSchema, type SolicitarResetInput } from "@app/shared";
import { trpc } from "../../lib/trpc";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AuthShell } from "./AuthShell";

export function EsqueciSenhaPage() {
  const solicitar = trpc.auth.solicitarReset.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SolicitarResetInput>({ resolver: zodResolver(solicitarResetSchema) });

  if (solicitar.isSuccess) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Se houver uma conta com esse e-mail, enviamos as instruções para redefinir a senha.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Esqueceu a senha?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos um link para você criar uma nova.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => solicitar.mutate(d))} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="voce@medconsultoria.com.br"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={solicitar.isPending}>
          {solicitar.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Enviar link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <a
        href="/"
        className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao login
      </a>
    </AuthShell>
  );
}
