import { TRPCError } from "@trpc/server";
import { prisma } from "@app/db";
import type { CampoTipo } from "@app/shared";
import { notificar } from "../notificacoes/notificacoes.service.js";
import { equipeDoCliente } from "../arquivos/arquivos.service.js";
import { reconciliarCardsDoServico } from "../projetos/projetos.service.js";

type CampoSeed = { rotulo: string; tipo: CampoTipo; obrigatorio?: boolean; opcoes?: string[]; ajuda?: string };
type FormSeed = { servico: string; titulo: string; descricao: string; campos: CampoSeed[] };

/** Briefings-modelo (formulários online) prontos, ligados aos serviços. Editáveis. */
const SEED: FormSeed[] = [
  {
    servico: "Desenvolvimento de site",
    titulo: "Briefing de site",
    descricao: "Conte pra gente sobre o site que você precisa — quanto mais detalhes, melhor.",
    campos: [
      { rotulo: "Sobre o seu trabalho (o que faz, especialidades)", tipo: "TEXTO_LONGO", obrigatorio: true },
      { rotulo: "Qual o principal objetivo do site?", tipo: "TEXTO_LONGO", obrigatorio: true, ajuda: "Ex.: conseguir mais agendamentos, passar credibilidade…" },
      { rotulo: "Quem é o seu público-alvo?", tipo: "TEXTO_CURTO", obrigatorio: true },
      { rotulo: "Quais páginas você quer?", tipo: "MULTIPLA", opcoes: ["Início", "Sobre", "Serviços", "Blog", "Contato", "Agendamento"] },
      { rotulo: "Já tem domínio (www)?", tipo: "SIM_NAO" },
      { rotulo: "Já tem logotipo / identidade visual?", tipo: "SIM_NAO" },
      { rotulo: "Sites de referência que você gosta", tipo: "TEXTO_LONGO", ajuda: "Cole os links e diga o que gostou em cada um." },
      { rotulo: "Prazo desejado", tipo: "TEXTO_CURTO", ajuda: "Ex.: em 30 dias, sem pressa…" },
      { rotulo: "Algo mais que devemos saber?", tipo: "TEXTO_LONGO" },
    ],
  },
  {
    servico: "Identidade visual (Branding)",
    titulo: "Briefing de identidade visual",
    descricao: "Vamos criar a cara da sua marca. Responda com calma — não existe resposta errada.",
    campos: [
      { rotulo: "Nome da marca / como quer ser chamado(a)", tipo: "TEXTO_CURTO", obrigatorio: true },
      { rotulo: "O que a sua marca representa (valores, personalidade)", tipo: "TEXTO_LONGO", obrigatorio: true },
      { rotulo: "Cores de preferência", tipo: "TEXTO_CURTO" },
      { rotulo: "O que você NÃO quer (cores/estilos a evitar)", tipo: "TEXTO_CURTO" },
      { rotulo: "Referências visuais que você admira", tipo: "TEXTO_LONGO" },
      { rotulo: "Onde a marca será usada?", tipo: "MULTIPLA", opcoes: ["Site", "Redes sociais", "Fachada", "Jaleco/uniforme", "Papelaria", "Materiais impressos"] },
      { rotulo: "Já tem algum material atual (logo, cores)? Descreva.", tipo: "TEXTO_LONGO" },
      { rotulo: "Algo mais que devemos saber?", tipo: "TEXTO_LONGO" },
    ],
  },
  {
    servico: "Gestão de redes sociais",
    titulo: "Briefing de redes sociais",
    descricao: "Para cuidarmos das suas redes do jeito certo (e dentro das normas do CFM).",
    campos: [
      { rotulo: "Perfis atuais (@)", tipo: "TEXTO_CURTO" },
      { rotulo: "Qual o principal objetivo?", tipo: "ESCOLHA", opcoes: ["Autoridade/credibilidade", "Mais agendamentos", "Alcance/seguidores"], obrigatorio: true },
      { rotulo: "Quem é o seu público-alvo?", tipo: "TEXTO_CURTO", obrigatorio: true },
      { rotulo: "Tom de voz desejado", tipo: "TEXTO_CURTO", ajuda: "Ex.: acolhedor, técnico, próximo…" },
      { rotulo: "Frequência de postagem desejada", tipo: "ESCOLHA", opcoes: ["3x por semana", "Diário", "A definir com a equipe"] },
      { rotulo: "Perfis de referência / concorrentes que você acompanha", tipo: "TEXTO_LONGO" },
      { rotulo: "As fotos e vídeos: você fornece ou a gente produz?", tipo: "ESCOLHA", opcoes: ["Eu forneço", "Vocês produzem", "Um pouco de cada"] },
      { rotulo: "Algo mais que devemos saber?", tipo: "TEXTO_LONGO" },
    ],
  },
];

async function seedSeVazio(): Promise<void> {
  if ((await prisma.formulario.count()) > 0) return;
  for (const f of SEED) {
    const form = await prisma.formulario.create({
      data: {
        titulo: f.titulo,
        descricao: f.descricao,
        campos: {
          create: f.campos.map((c, i) => ({
            rotulo: c.rotulo,
            tipo: c.tipo,
            obrigatorio: c.obrigatorio ?? false,
            opcoes: c.opcoes ? JSON.stringify(c.opcoes) : null,
            ajuda: c.ajuda ?? null,
            ordem: i,
          })),
        },
      },
    });
    // Liga um requisito BRIEFING ao serviço-alvo (se ainda não houver), apontando p/ o form.
    const servico = await prisma.servico.findFirst({ where: { nome: f.servico }, select: { id: true } });
    if (servico) {
      const jaTem = await prisma.servicoRequisito.findFirst({ where: { servicoId: servico.id, formularioId: form.id } });
      if (!jaTem) {
        const max = await prisma.servicoRequisito.aggregate({ where: { servicoId: servico.id }, _max: { ordem: true } });
        await prisma.servicoRequisito.create({
          data: { servicoId: servico.id, titulo: f.titulo, tipo: "BRIEFING", obrigatorio: true, formularioId: form.id, ordem: (max._max.ordem ?? -1) + 1 },
        });
      }
    }
  }
}

// ── Gestão dos formulários (admin) ──

export async function listFormularios() {
  await seedSeVazio();
  return prisma.formulario.findMany({
    where: { ativo: true, interno: false }, // internos (informação de 1 pergunta) são geridos pelo requisito
    orderBy: { titulo: "asc" },
    include: { _count: { select: { campos: true } } },
  });
}

function parseCampo<T extends { opcoes: string | null }>(c: T): Omit<T, "opcoes"> & { opcoes: string[] } {
  return { ...c, opcoes: c.opcoes ? (JSON.parse(c.opcoes) as string[]) : [] };
}

export async function getFormulario(id: string) {
  const form = await prisma.formulario.findUnique({
    where: { id },
    include: { campos: { orderBy: { ordem: "asc" } } },
  });
  if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado." });
  return { ...form, campos: form.campos.map(parseCampo) };
}

export function criarFormulario(input: { titulo: string; descricao?: string | null }) {
  return prisma.formulario.create({ data: { titulo: input.titulo.trim(), descricao: input.descricao?.trim() || null } });
}

export function atualizarFormulario(id: string, dados: { titulo?: string; descricao?: string | null; ativo?: boolean }) {
  const data: Record<string, unknown> = {};
  if (dados.titulo !== undefined) data.titulo = dados.titulo.trim();
  if (dados.descricao !== undefined) data.descricao = dados.descricao?.trim() || null;
  if (dados.ativo !== undefined) data.ativo = dados.ativo;
  return prisma.formulario.update({ where: { id }, data });
}

export async function removerFormulario(id: string) {
  await prisma.formulario.update({ where: { id }, data: { ativo: false } });
  return { ok: true };
}

export async function addCampo(input: {
  formularioId: string;
  rotulo: string;
  tipo: CampoTipo;
  obrigatorio: boolean;
  opcoes?: string[];
  ajuda?: string;
}) {
  const max = await prisma.formularioCampo.aggregate({ where: { formularioId: input.formularioId }, _max: { ordem: true } });
  return prisma.formularioCampo.create({
    data: {
      formularioId: input.formularioId,
      rotulo: input.rotulo.trim(),
      tipo: input.tipo,
      obrigatorio: input.obrigatorio,
      opcoes: input.opcoes?.length ? JSON.stringify(input.opcoes) : null,
      ajuda: input.ajuda?.trim() || null,
      ordem: (max._max.ordem ?? -1) + 1,
    },
  });
}

export function atualizarCampo(
  id: string,
  dados: { rotulo?: string; tipo?: CampoTipo; obrigatorio?: boolean; opcoes?: string[]; ajuda?: string },
) {
  const data: Record<string, unknown> = {};
  if (dados.rotulo !== undefined) data.rotulo = dados.rotulo.trim();
  if (dados.tipo !== undefined) data.tipo = dados.tipo;
  if (dados.obrigatorio !== undefined) data.obrigatorio = dados.obrigatorio;
  if (dados.opcoes !== undefined) data.opcoes = dados.opcoes.length ? JSON.stringify(dados.opcoes) : null;
  if (dados.ajuda !== undefined) data.ajuda = dados.ajuda?.trim() || null;
  return prisma.formularioCampo.update({ where: { id }, data });
}

export async function removerCampo(id: string) {
  await prisma.formularioCampo.delete({ where: { id } });
  return { ok: true };
}

export async function reordenarCampos(ids: string[]) {
  await prisma.$transaction(ids.map((id, ordem) => prisma.formularioCampo.update({ where: { id }, data: { ordem } })));
  return { ok: true };
}

// ── Preenchimento (Portal do cliente) ──

/** O formulário de um requisito BRIEFING + a resposta do cliente (se já houver). */
export async function getFormularioDoRequisito(clienteId: string, requisitoId: string) {
  const req = await prisma.servicoRequisito.findUnique({
    where: { id: requisitoId },
    include: { formulario: { include: { campos: { orderBy: { ordem: "asc" } } } } },
  });
  if (!req?.formulario) throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado." });
  const resposta = await prisma.formularioResposta.findFirst({ where: { clienteId, requisitoId } });
  return {
    requisitoId,
    titulo: req.formulario.titulo,
    descricao: req.formulario.descricao,
    campos: req.formulario.campos.map(parseCampo),
    resposta: resposta ? { id: resposta.id, respostas: JSON.parse(resposta.respostas), status: resposta.status } : null,
  };
}

/** Salva (rascunho) ou envia a resposta do cliente. Ao ENVIAR, avisa a equipe. */
export async function salvarResposta(
  clienteId: string,
  requisitoId: string,
  respostas: Record<string, string | string[]>,
  enviar: boolean,
) {
  const req = await prisma.servicoRequisito.findUnique({
    where: { id: requisitoId },
    select: { formularioId: true, servicoId: true, titulo: true },
  });
  if (!req?.formularioId) throw new TRPCError({ code: "BAD_REQUEST", message: "Este item não tem formulário." });

  const existente = await prisma.formularioResposta.findFirst({ where: { clienteId, requisitoId } });
  const data = {
    respostas: JSON.stringify(respostas),
    status: enviar ? "ENVIADO" : "RASCUNHO",
    enviadoEm: enviar ? new Date() : existente?.enviadoEm ?? null,
  };
  const resp = existente
    ? await prisma.formularioResposta.update({ where: { id: existente.id }, data })
    : await prisma.formularioResposta.create({
        data: { ...data, formularioId: req.formularioId, clienteId, requisitoId, servicoId: req.servicoId },
      });

  if (enviar) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } });
    const destinos = await equipeDoCliente(clienteId);
    for (const uid of destinos) {
      await notificar(
        uid,
        "documento_cliente_enviado",
        { cliente: cliente?.nome ?? "Cliente", documento: req.titulo },
        { entidadeTipo: "cliente", entidadeId: clienteId },
      ).catch(() => {});
    }
  }

  // Automação: a entrega do cliente marca o item no card do serviço e move o card sozinho.
  if (req.servicoId) await reconciliarCardsDoServico(clienteId, req.servicoId).catch(() => {});
  return resp;
}

// ── Visualização (equipe, na ficha) ──

/** Resposta completa (formulário + campos + valores) para exibir/baixar. */
export async function getResposta(id: string, clienteScope?: string) {
  const resp = await prisma.formularioResposta.findUnique({
    where: { id },
    include: { formulario: { include: { campos: { orderBy: { ordem: "asc" } } } }, cliente: { select: { nome: true } } },
  });
  if (!resp) throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada." });
  if (clienteScope && resp.clienteId !== clienteScope) throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso." });
  return {
    id: resp.id,
    titulo: resp.formulario.titulo,
    clienteNome: resp.cliente.nome,
    status: resp.status,
    enviadoEm: resp.enviadoEm,
    campos: resp.formulario.campos.map(parseCampo),
    respostas: JSON.parse(resp.respostas) as Record<string, string | string[]>,
  };
}
