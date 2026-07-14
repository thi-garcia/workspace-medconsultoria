import { z } from "zod";

const textoOpcional = z.string().trim().max(2000).optional().or(z.literal(""));
const idOpcional = z.string().optional().or(z.literal(""));
const dataHoraOpcional = z.preprocess(
  (v) => (v === "" || v === null ? null : v),
  z.coerce.date().nullable().optional(),
);

export const eventoTipoEnum = z.enum(["COMPROMISSO", "RETORNO", "REUNIAO", "LEMBRETE", "PESSOAL"]);
export type EventoTipo = z.infer<typeof eventoTipoEnum>;

export const eventoEscopoEnum = z.enum(["PESSOAL", "EMPRESA"]);
export type EventoEscopo = z.infer<typeof eventoEscopoEnum>;

export const recorrenciaEnum = z.enum(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]);
export type Recorrencia = z.infer<typeof recorrenciaEnum>;

export const EVENTO_TIPO_LABEL: Record<EventoTipo, string> = {
  COMPROMISSO: "Compromisso",
  RETORNO: "Retorno",
  REUNIAO: "Reunião",
  LEMBRETE: "Lembrete",
  PESSOAL: "Pessoal",
};
export const RECORRENCIA_LABEL: Record<Recorrencia, string> = {
  NENHUMA: "Não repete",
  DIARIA: "Diariamente",
  SEMANAL: "Semanalmente",
  MENSAL: "Mensalmente",
};

const eventoBase = z.object({
  titulo: z.string().trim().min(1, "Informe o título"),
  descricao: textoOpcional,
  tipo: eventoTipoEnum.default("COMPROMISSO"),
  escopo: eventoEscopoEnum.default("EMPRESA"),
  inicio: z.coerce.date({ message: "Informe a data/hora de início" }),
  fim: dataHoraOpcional,
  diaInteiro: z.boolean().default(false),
  local: textoOpcional,
  linkReuniao: z.union([z.string().trim().url("Link inválido"), z.literal("")]).optional(),
  recorrencia: recorrenciaEnum.default("NENHUMA"),
  recorrenciaAte: dataHoraOpcional,
  clienteId: idOpcional,
  projetoId: idOpcional,
  // Membros da equipe convidados (além do dono). Cada um vê na agenda e recebe lembrete.
  participanteIds: z.array(z.string()).optional(),
});

// Guarda contra erro do usuário: o fim (quando informado, e não é dia inteiro) tem de ser
// depois do início. Vale no create e no update (server-side = autoritativo; o form também mostra).
const MSG_FIM = "O horário de término deve ser depois do início.";

export const createEventoSchema = eventoBase.refine(
  (v) => v.diaInteiro || !v.fim || v.fim > v.inicio,
  { message: MSG_FIM, path: ["fim"] },
);
export type CreateEventoInput = z.infer<typeof createEventoSchema>;

export const updateEventoSchema = eventoBase
  .partial()
  .extend({ id: z.string().min(1) })
  .refine((v) => v.diaInteiro || !v.fim || !v.inicio || v.fim > v.inicio, { message: MSG_FIM, path: ["fim"] });
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>;

export const listEventosSchema = z.object({
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
});
export type ListEventosInput = z.infer<typeof listEventosSchema>;

/** Verificação de conflito de horário (para avisar ao criar/editar). */
export const conflitoEventoSchema = z.object({
  inicio: z.coerce.date(),
  fim: dataHoraOpcional,
  ignorarId: z.string().optional(),
  participanteIds: z.array(z.string()).optional(),
});
export type ConflitoEventoInput = z.infer<typeof conflitoEventoSchema>;

/** Resumo da agenda por IA (do dia/semana). */
export const resumoAgendaSchema = z.object({
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
  rotulo: z.string().max(60).optional(),
});
export type ResumoAgendaInput = z.infer<typeof resumoAgendaSchema>;
