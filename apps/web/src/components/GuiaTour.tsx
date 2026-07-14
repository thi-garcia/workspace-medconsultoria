import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Compass,
  LayoutDashboard,
  Filter,
  Briefcase,
  FileSignature,
  Users,
  CalendarClock,
  Mail,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  ListChecks,
  ArrowRightLeft,
  UserCheck,
  FolderKanban,
  Wallet,
  MessageSquare,
  UserCog,
  ServerCog,
  Settings,
  FileText,
} from "lucide-react";
import { cn } from "@app/ui";
import { hasRoleLevel, type Role } from "@app/shared";
import { useAuth } from "../lib/auth-context";

interface Passo {
  icon: LucideIcon;
  titulo: string;
  descricao: React.ReactNode;
  minRole?: Role;
  /** Mostra o logotipo (igual o menu) no lugar do ícone. */
  logo?: boolean;
}
interface Guia {
  titulo: string;
  passos: Passo[];
}

// ── Guia geral (aparece no Dashboard) ────────────────────
const VISAO_GERAL: Passo[] = [
  {
    icon: Sparkles,
    logo: true,
    titulo: "Bem-vindo ao Workspace!",
    descricao:
      "Este é o cérebro operacional da MedConsultoria — clientes, funil de vendas, projetos, agenda, finanças e documentos, tudo num só lugar. Em um minutinho eu te mostro o essencial.",
  },
  {
    icon: Compass,
    titulo: "O menu lateral",
    descricao:
      "À esquerda você navega entre as áreas, agrupadas em Comercial, Operação e Gestão. O que aparece depende do seu nível de acesso. Pode recolher o menu no ícone do topo.",
  },
  {
    icon: LayoutDashboard,
    titulo: "Dashboard",
    descricao:
      "Sua tela inicial reúne o que precisa da sua atenção agora: tarefas, compromissos do dia, contas a vencer e alertas. É o seu ponto de partida todo dia.",
  },
  {
    icon: Filter,
    titulo: "Funil de vendas",
    descricao: (
      <>
        Cada oportunidade é um <strong>card</strong>. Clique para abrir o painel do lead com os{" "}
        <strong>próximos passos</strong>; arraste (por qualquer ponto) para mudar de etapa. Ao concluir os passos
        obrigatórios, o lead fica pronto para avançar. Alguns avanços acontecem sozinhos.
      </>
    ),
  },
  {
    icon: Briefcase,
    titulo: "Serviços",
    minRole: "ADMIN",
    descricao:
      "Cadastre os serviços que a MedConsultoria oferece. Cada serviço tem seus próprios passos por etapa — que entram automaticamente no checklist do lead que escolher aquele serviço.",
  },
  {
    icon: FileSignature,
    titulo: "Documentos e assinaturas",
    descricao: (
      <>
        Gere <strong>propostas, contratos e briefings</strong> a partir de modelos, já preenchidos com os dados do
        cliente. Envie para <strong>assinatura digital</strong> — o cliente e a equipe assinam pelo link, com validade
        jurídica e trilha de auditoria.
      </>
    ),
  },
  {
    icon: Users,
    titulo: "Clientes e Projetos",
    descricao:
      "Quando um lead fecha, ele vira Cliente e um Projeto é criado com os serviços como tarefas. Acompanhe tudo pela ficha do cliente e pelos quadros (kanban) de cada projeto.",
  },
  {
    icon: CalendarClock,
    titulo: "Agenda e Financeiro",
    descricao:
      "Organize compromissos, reuniões e lembretes na Agenda (com avisos automáticos). No Financeiro, controle contas a pagar e a receber, com alertas de vencimento e o resultado do mês.",
  },
  {
    icon: Mail,
    titulo: "Comunicações",
    minRole: "ADMIN",
    descricao:
      "Personalize os textos de todos os e-mails e notificações automáticas — mantendo o logo, as cores e a assinatura da marca. Você edita só o conteúdo.",
  },
  {
    icon: CheckCircle2,
    titulo: "Pronto para começar!",
    descricao: (
      <>
        É isso! Em <strong>qualquer página</strong>, o botão <strong>?</strong> no topo abre o guia daquela tela. Bom
        trabalho! 🚀
      </>
    ),
  },
];

// ── Guias por página ─────────────────────────────────────
const GUIA_FUNIL: Passo[] = [
  {
    icon: Filter,
    titulo: "O funil de vendas",
    descricao: "Cada oportunidade é um card; as colunas são as etapas (do primeiro contato ao fechamento). No topo, os números do funil: leads, valor e ticket médio.",
  },
  {
    icon: MousePointerClick,
    titulo: "Abra e mova o card",
    descricao: (
      <>
        <strong>Clique</strong> num card para abrir o painel do lead (contato por WhatsApp/e-mail, serviços, próximos
        passos e histórico). <strong>Arraste</strong> por qualquer ponto do card para mudar de etapa.
      </>
    ),
  },
  {
    icon: ListChecks,
    titulo: "Próximos passos",
    descricao: (
      <>
        Cada etapa tem um checklist — os passos <em>obrigatórios</em> precisam ser concluídos para avançar. Cada serviço
        do lead adiciona seus próprios passos, e você pode incluir passos avulsos.
      </>
    ),
  },
  {
    icon: FileSignature,
    titulo: "Gerar documentos e assinar",
    descricao: "Passos como “Enviar proposta” têm o botão Gerar: ele cria o documento do modelo com os dados do lead e leva à página do documento, onde você solicita a assinatura digital. Ao assinar, o passo se conclui sozinho.",
  },
  {
    icon: ArrowRightLeft,
    titulo: "Avanços automáticos",
    descricao: "Convidou para o Portal → Qualificação; o lead acessou o Portal ou uma proposta foi assinada → Proposta. A automação só avança, nunca volta — e você pode mover manualmente quando quiser.",
  },
  {
    icon: UserCheck,
    titulo: "Converter em cliente",
    descricao: "Ao fechar, use Converter: o lead vira Cliente e um Projeto é criado automaticamente com os serviços contratados como tarefas.",
  },
];

const GUIA_CLIENTES: Passo[] = [
  { icon: Users, titulo: "Sua base de clientes", descricao: "Aqui ficam todos os clientes. Use “Novo cliente” para cadastrar manualmente — ou eles chegam automaticamente ao converter um lead." },
  { icon: FileText, titulo: "A ficha do cliente", descricao: "Clique num cliente para abrir a ficha: dados de contato, situação comercial, projetos, documentos, compromissos e histórico — tudo num só lugar." },
];

const GUIA_SERVICOS: Passo[] = [
  { icon: Briefcase, titulo: "Catálogo de serviços", descricao: "Os serviços que a MedConsultoria oferece. O lead escolhe no cadastro (site ou manual) e eles aparecem no card." },
  { icon: ListChecks, titulo: "Passos de cada serviço", descricao: "No ícone de lista, defina os passos padrão do serviço por etapa. Eles entram automaticamente no checklist do lead que contratar aquele serviço." },
  { icon: Settings, titulo: "Editar à vontade", descricao: "Crie, renomeie, ative/desative ou remova serviços. As mudanças valem para os próximos cadastros." },
];

const GUIA_PROJETOS: Passo[] = [
  { icon: FolderKanban, titulo: "Projetos por cliente", descricao: "Cada projeto pertence a um cliente. Crie manualmente ou deixe o funil criar ao converter um lead (já com os serviços como tarefas)." },
  { icon: ArrowRightLeft, titulo: "Quadro kanban", descricao: "As tarefas andam pelas colunas (Inbox → A Fazer → Em andamento → Aguardando → Concluído). Arraste os cartões conforme o trabalho avança." },
  { icon: ListChecks, titulo: "Dentro do cartão", descricao: "Cada tarefa tem checklist, prazo, prioridade, responsável e registro de tempo. Atribua responsáveis para todos verem o que é deles." },
];

const GUIA_AGENDA: Passo[] = [
  { icon: CalendarClock, titulo: "Sua agenda", descricao: "Compromissos, reuniões, retornos e lembretes — pessoais ou da empresa. Crie um evento clicando no dia/horário." },
  { icon: Compass, titulo: "5 visões", descricao: "Alterne entre Lista, Dia, Semana, Mês e Ano no seletor do topo, conforme o que você precisa enxergar." },
  { icon: Sparkles, titulo: "Lembretes automáticos", descricao: "O sistema avisa antes dos compromissos. Reuniões com link (Meet/Zoom/Jitsi) aparecem com botão de entrar." },
];

const GUIA_FINANCEIRO: Passo[] = [
  { icon: Wallet, titulo: "A pagar e a receber", descricao: "Nas abas, lance contas a pagar e a receber com valor, vencimento e categoria. Marque como pago quando quitar." },
  { icon: ArrowRightLeft, titulo: "Alertas e resultado", descricao: "O sistema destaca contas vencidas e a vencer, e mostra o resultado (recebido − pago) do mês." },
  { icon: Settings, titulo: "Categorias", descricao: "Organize por categorias para entender de onde vem e para onde vai o dinheiro." },
];

const GUIA_DOCUMENTOS: Passo[] = [
  { icon: FileText, titulo: "Modelos e documentos", descricao: "Na aba Modelos ficam os textos-base (proposta, contrato, briefing, ata) com campos {{como este}}. Na aba Documentos, os gerados." },
  { icon: Sparkles, titulo: "Gerar preenchido", descricao: "Crie um documento a partir de um modelo escolhendo o cliente — os dados dele entram automaticamente. Você ainda pode editar o texto e melhorar com IA." },
  { icon: FileSignature, titulo: "Assinatura digital", descricao: "No documento, clique em Solicitar assinaturas: cliente e MedConsultoria recebem um link, assinam (desenhando ou digitando) e fica registrado com data, hora e código de integridade." },
];

const GUIA_MENSAGENS: Passo[] = [
  { icon: MessageSquare, titulo: "Mensagens internas", descricao: "Converse com a equipe e acompanhe o canal de suporte de cada cliente. As novas mensagens avisam no sino de notificações." },
];

const GUIA_COMUNICACOES: Passo[] = [
  { icon: Mail, titulo: "E-mails e notificações", descricao: "Todos os textos automáticos do sistema ficam aqui, separados por Transacionais, Notificações e Sistema. Edite só o conteúdo — o visual é fixo." },
  { icon: Sparkles, titulo: "Campos automáticos", descricao: "Clique nos “campos automáticos” para inseri-los no texto — o sistema preenche com o dado real no envio (ex.: nome do cliente)." },
  { icon: CheckCircle2, titulo: "Prévia e teste", descricao: "Veja a prévia ao vivo (e-mail e sino) e envie um e-mail de teste antes de salvar. Restaure o padrão quando quiser." },
];

const GUIA_USUARIOS: Passo[] = [
  { icon: UserCog, titulo: "Equipe e acessos", descricao: "Gerencie a equipe interna e os acessos do Portal do Cliente. Convide por e-mail — a pessoa define a própria senha pelo link." },
  { icon: Settings, titulo: "Papéis", descricao: "Cada usuário tem um papel (Funcionário, Administrador, Root) que define o que ele pode ver e fazer." },
];

const GUIA_CONFIG: Passo[] = [
  { icon: Settings, titulo: "Suas configurações", descricao: "Atualize seu nome, e-mail e senha, e escolha quais e-mails automáticos você quer receber. Os de acesso e segurança são sempre enviados." },
];

const GUIA_SISTEMA: Passo[] = [
  { icon: ServerCog, titulo: "Painel do sistema", descricao: "Visível só para o Root: saúde, desempenho, erros, sessões e manutenção da aplicação. Use o Diagnóstico para uma visão rápida." },
];

const OUTRAS: { prefixo: string; guia: Guia }[] = [
  { prefixo: "/leads", guia: { titulo: "Vendas", passos: GUIA_FUNIL } },
  { prefixo: "/clientes", guia: { titulo: "Clientes", passos: GUIA_CLIENTES } },
  { prefixo: "/servicos", guia: { titulo: "Serviços", passos: GUIA_SERVICOS } },
  { prefixo: "/projetos", guia: { titulo: "Projetos", passos: GUIA_PROJETOS } },
  { prefixo: "/agenda", guia: { titulo: "Agenda", passos: GUIA_AGENDA } },
  { prefixo: "/financeiro", guia: { titulo: "Financeiro", passos: GUIA_FINANCEIRO } },
  { prefixo: "/documentos", guia: { titulo: "Documentos", passos: GUIA_DOCUMENTOS } },
  { prefixo: "/mensagens", guia: { titulo: "Mensagens", passos: GUIA_MENSAGENS } },
  { prefixo: "/emails", guia: { titulo: "Comunicações", passos: GUIA_COMUNICACOES } },
  { prefixo: "/usuarios", guia: { titulo: "Usuários", passos: GUIA_USUARIOS } },
  { prefixo: "/configuracoes", guia: { titulo: "Configurações", passos: GUIA_CONFIG } },
  { prefixo: "/sistema", guia: { titulo: "Sistema", passos: GUIA_SISTEMA } },
];

/** Resolve o guia da página a partir da rota atual. */
function guiaDaRota(path: string): Guia {
  if (path === "/") return { titulo: "Visão geral", passos: VISAO_GERAL };
  const achado = OUTRAS.find((o) => path.startsWith(o.prefixo));
  return achado?.guia ?? { titulo: "Visão geral", passos: VISAO_GERAL };
}

/**
 * Guia de instruções por página. O botão "?" do header abre o guia da tela atual:
 * no Dashboard mostra a visão geral (10 passos); nas demais, o passo a passo daquela página.
 */
export function GuiaTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const guia = guiaDaRota(path);
  const passos = guia.passos.filter((p) => !p.minRole || hasRoleLevel(user.role, p.minRole));
  const [i, setI] = useState(0);

  useEffect(() => {
    if (open) setI(0);
  }, [open, path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, passos.length - 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, passos.length, onClose]);

  if (!open || passos.length === 0) return null;
  const passo = passos[Math.min(i, passos.length - 1)]!;
  const Icon = passo.icon;
  const ultimo = i >= passos.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          title="Fechar guia"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Faixa superior — azul escuro da marca (igual o menu) */}
        <div className="flex shrink-0 flex-col items-center gap-2 bg-gradient-to-br from-brand-blueDark to-brand-blueText py-6 sm:py-8">
          {passo.logo ? (
            <div key={i} className="flex items-center gap-3 animate-scale-in">
              <img src="/simbolo.png" alt="MedConsultoria" className="h-14 w-14 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-xl font-bold tracking-tight text-white">MedConsultoria</div>
                <div className="text-xs font-medium text-white/60">Workspace</div>
              </div>
            </div>
          ) : (
            <span key={i} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white animate-scale-in">
              <Icon className="h-8 w-8" />
            </span>
          )}
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">Guia · {guia.titulo}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div key={i} className="min-h-0 flex-1 animate-fade-in overflow-y-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Passo {i + 1} de {passos.length}
            </div>
            <h2 className="mt-1 text-xl font-semibold">{passo.titulo}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.descricao}</p>
          </div>

          {/* Indicadores de progresso */}
          <div className="mt-5 flex shrink-0 flex-wrap items-center justify-center gap-1.5">
            {passos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
                )}
                aria-label={`Ir para o passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Ações */}
          <div className="mt-5 flex shrink-0 items-center justify-between gap-2">
            {i === 0 ? (
              <button onClick={onClose} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Fechar
              </button>
            ) : (
              <button
                onClick={() => setI((v) => Math.max(v - 1, 0))}
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}

            <button
              onClick={() => (ultimo ? onClose() : setI((v) => Math.min(v + 1, passos.length - 1)))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {ultimo ? "Concluir" : "Próximo"}
              {!ultimo && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
