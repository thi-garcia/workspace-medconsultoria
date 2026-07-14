import { Link } from "@tanstack/react-router";
import { Briefcase, Mail, UserCog, Send, FileText, ChevronRight, type LucideIcon } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";

interface AjusteItem {
  icon: LucideIcon;
  label: string;
  desc: string;
  to: string;
}

/**
 * Ajustes — a "porta única" do que se configura uma vez e o sistema usa sozinho.
 * Junta os painéis administrativos que antes poluíam o menu principal.
 */
const SECOES: { titulo: string; descricao: string; itens: AjusteItem[] }[] = [
  {
    titulo: "Automações",
    descricao: "O que você configura uma vez e o sistema usa sozinho.",
    itens: [
      {
        icon: Briefcase,
        label: "Serviços",
        desc: "O catálogo de serviços e o que cada um dispara: passos da venda, o que o cliente precisa enviar e as tarefas da equipe.",
        to: "/servicos",
      },
      {
        icon: FileText,
        label: "Modelos de documento",
        desc: "Os textos-base de proposta, contrato, ata e recibo. Os documentos de cada cliente você gera na ficha dele; vê todos em Documentos.",
        to: "/modelos",
      },
      {
        icon: Mail,
        label: "Mensagens automáticas",
        desc: "Os textos dos e-mails e avisos que o sistema envia sozinho — com a marca da empresa. (era “Comunicações”)",
        to: "/emails",
      },
    ],
  },
  {
    titulo: "Administração",
    descricao: "Os bastidores da empresa — acesso restrito.",
    itens: [
      {
        icon: UserCog,
        label: "Equipe e acessos",
        desc: "Quem entra no sistema e o que cada pessoa pode fazer (equipe e acessos do Portal). (era “Usuários”)",
        to: "/usuarios",
      },
      {
        icon: Send,
        label: "E-mails enviados",
        desc: "Histórico de todos os e-mails que o sistema mandou — entregas, falhas e o motivo de cada falha.",
        to: "/emails-enviados",
      },
    ],
  },
];

export function AjustesPage() {
  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Ajustes"
        subtitle="Tudo que você configura uma vez e o sistema usa sozinho, num lugar só. Você raramente precisa entrar aqui."
      />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {SECOES.map((secao) => (
          <section key={secao.titulo}>
            <div className="mb-2.5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{secao.titulo}</h2>
              <p className="text-xs text-muted-foreground">{secao.descricao}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {secao.itens.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-semibold">
                      {it.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{it.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
