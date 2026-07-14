import { z } from "zod";

const textoOpcional = z.string().trim().max(5000).optional().or(z.literal(""));
// "" ou null → null (limpar explicitamente); ausente → undefined (não mexer no campo).
const dataOpcional = z.preprocess(
  (v) => (v === "" || v === null ? null : v),
  z.coerce.date().nullable().optional(),
);

export const projetoStatusEnum = z.enum(["ATIVO", "PAUSADO", "CONCLUIDO"]);
export type ProjetoStatus = z.infer<typeof projetoStatusEnum>;

export const cardStatusEnum = z.enum([
  "A_FAZER",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_TERCEIROS",
  "CONCLUIDO",
]);
export type CardStatus = z.infer<typeof cardStatusEnum>;

export const prioridadeEnum = z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]);
export type Prioridade = z.infer<typeof prioridadeEnum>;

/**
 * Colunas do kanban de projeto — fluxo de trabalho em etapas, fonte única da UI.
 * A fazer → Em andamento → (Aguardando cliente | Aguardando terceiros) → Concluído.
 */
export const CARD_STATUS_ORDER: CardStatus[] = [
  "A_FAZER",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_TERCEIROS",
  "CONCLUIDO",
];
export const CARD_STATUS_LABEL: Record<CardStatus, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  AGUARDANDO_TERCEIROS: "Aguardando terceiros",
  CONCLUIDO: "Concluído",
};
export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

// ── Projeto ──────────────────────────────────────────────
export const createProjetoSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente"),
  nome: z.string().trim().min(1, "Informe o nome"),
  descricao: textoOpcional,
  previsaoFim: dataOpcional,
  responsavelId: z.string().optional().or(z.literal("")),
});
export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;

export const updateProjetoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1).optional(),
  descricao: textoOpcional,
  status: projetoStatusEnum.optional(),
  previsaoFim: dataOpcional,
  responsavelId: z.string().optional().or(z.literal("")),
});
export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;

/** Define a lista de participantes (membros) do projeto — substitui o conjunto. */
export const setParticipantesSchema = z.object({
  projetoId: z.string().min(1),
  userIds: z.array(z.string()),
});
export type SetParticipantesInput = z.infer<typeof setParticipantesSchema>;

// ── Card ─────────────────────────────────────────────────
export const createCardSchema = z.object({
  projetoId: z.string().min(1),
  titulo: z.string().trim().min(1, "Informe o título"),
  descricao: textoOpcional,
  status: cardStatusEnum.optional(),
  prioridade: prioridadeEnum.default("MEDIA"),
  prazo: dataOpcional,
  // Vazio = atribui ao criador (definido no serviço).
  responsavelId: z.string().optional().or(z.literal("")),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().trim().min(1).optional(),
  descricao: textoOpcional,
  prioridade: prioridadeEnum.optional(),
  prazo: dataOpcional,
  responsavelId: z.string().optional().or(z.literal("")),
});
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export const moveCardSchema = z.object({
  id: z.string().min(1),
  status: cardStatusEnum,
  ordem: z.number().int().nonnegative(),
});
export type MoveCardInput = z.infer<typeof moveCardSchema>;

// ── Checklist ────────────────────────────────────────────
export const addChecklistSchema = z.object({
  cardId: z.string().min(1),
  texto: z.string().trim().min(1, "Escreva o item"),
});
export type AddChecklistInput = z.infer<typeof addChecklistSchema>;
