import { z } from "zod";

export const conversaTipoEnum = z.enum(["INDIVIDUAL", "GRUPO", "PROJETO", "CLIENTE"]);
export type ConversaTipo = z.infer<typeof conversaTipoEnum>;

export const chamadoStatusEnum = z.enum(["ABERTO", "EM_ANDAMENTO", "RESOLVIDO"]);
export type ChamadoStatus = z.infer<typeof chamadoStatusEnum>;

export const CHAMADO_STATUS_LABEL: Record<ChamadoStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
};

export const chamadoPrioridadeEnum = z.enum(["BAIXA", "NORMAL", "ALTA"]);
export type ChamadoPrioridade = z.infer<typeof chamadoPrioridadeEnum>;
export const CHAMADO_PRIORIDADE_LABEL: Record<ChamadoPrioridade, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
};

/** Categoria exibida na barra lateral (organização estilo WhatsApp). */
export const conversaCategoriaEnum = z.enum(["direta", "grupo", "cliente", "lead"]);
export type ConversaCategoria = z.infer<typeof conversaCategoriaEnum>;

export const CONVERSA_CATEGORIA_LABEL: Record<ConversaCategoria, string> = {
  direta: "Diretas",
  grupo: "Grupos",
  cliente: "Clientes",
  lead: "Leads",
};

export const startIndividualSchema = z.object({ outroUserId: z.string().min(1) });

export const createGrupoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do grupo"),
  participantIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um participante"),
});

export const sendMensagemSchema = z.object({
  conversaId: z.string().min(1),
  conteudo: z.string().trim().min(1).max(4000),
});
export type SendMensagemInput = z.infer<typeof sendMensagemSchema>;

// ── Gestão de grupo ──────────────────────────────────────
export const renomearGrupoSchema = z.object({ conversaId: z.string().min(1), nome: z.string().trim().min(1).max(80) });
export const gerirParticipanteSchema = z.object({ conversaId: z.string().min(1), userId: z.string().min(1) });
export const addParticipantesSchema = z.object({ conversaId: z.string().min(1), userIds: z.array(z.string().min(1)).min(1) });
export const conversaIdSchema = z.object({ conversaId: z.string().min(1) });

// ── Chamado/ticket (conversa CLIENTE) ────────────────────
export const iniciarChamadoSchema = z.object({
  clienteId: z.string().min(1),
  assunto: z.string().trim().min(1, "Informe o assunto").max(120),
  prioridade: chamadoPrioridadeEnum.optional(),
});
export const setChamadoStatusSchema = z.object({ conversaId: z.string().min(1), status: chamadoStatusEnum });
export const setChamadoResponsavelSchema = z.object({ conversaId: z.string().min(1), responsavelId: z.string().nullable() });
export const setChamadoAssuntoSchema = z.object({ conversaId: z.string().min(1), assunto: z.string().trim().min(1).max(120) });
export const setChamadoPrioridadeSchema = z.object({ conversaId: z.string().min(1), prioridade: chamadoPrioridadeEnum });

// ── Ações de mensagem (editar/apagar a própria) ──────────
export const editarMensagemSchema = z.object({ mensagemId: z.string().min(1), conteudo: z.string().trim().min(1).max(4000) });
export const mensagemIdSchema = z.object({ mensagemId: z.string().min(1) });

// ── Preferências/ações de conversa (por usuário) ─────────
export const togglePreferenciaSchema = z.object({ conversaId: z.string().min(1), ligar: z.boolean() });

// ── Portal (cliente/lead) ────────────────────────────────
export const portalAbrirChamadoSchema = z.object({ assunto: z.string().trim().min(1, "Informe o assunto").max(120), mensagem: z.string().trim().max(4000).optional() });
export const portalEnviarChamadoSchema = z.object({ conversaId: z.string().min(1), corpo: z.string().trim().min(1).max(4000) });
