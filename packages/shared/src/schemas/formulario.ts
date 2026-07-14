import { z } from "zod";

/** Tipos de campo de um formulário/briefing online. */
export const campoTipoEnum = z.enum([
  "TEXTO_CURTO",
  "TEXTO_LONGO",
  "ESCOLHA",
  "MULTIPLA",
  "NUMERO",
  "SIM_NAO",
  "DATA",
]);
export type CampoTipo = z.infer<typeof campoTipoEnum>;
export const CAMPO_TIPO_LABEL: Record<CampoTipo, string> = {
  TEXTO_CURTO: "Texto curto",
  TEXTO_LONGO: "Texto longo",
  ESCOLHA: "Escolha única",
  MULTIPLA: "Múltipla escolha",
  NUMERO: "Número",
  SIM_NAO: "Sim / Não",
  DATA: "Data",
};

export const createFormularioSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título ao formulário").max(120),
  descricao: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CreateFormularioInput = z.infer<typeof createFormularioSchema>;

export const updateFormularioSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().trim().min(1).max(120).optional(),
  descricao: z.string().trim().max(2000).optional().or(z.literal("")),
  ativo: z.boolean().optional(),
});
export type UpdateFormularioInput = z.infer<typeof updateFormularioSchema>;

export const addCampoSchema = z.object({
  formularioId: z.string().min(1),
  rotulo: z.string().trim().min(1, "Escreva a pergunta").max(200),
  tipo: campoTipoEnum.default("TEXTO_CURTO"),
  obrigatorio: z.boolean().default(false),
  opcoes: z.array(z.string().trim().min(1)).optional(),
  ajuda: z.string().trim().max(300).optional().or(z.literal("")),
});
export type AddCampoInput = z.infer<typeof addCampoSchema>;

export const updateCampoSchema = z.object({
  id: z.string().min(1),
  rotulo: z.string().trim().min(1).max(200).optional(),
  tipo: campoTipoEnum.optional(),
  obrigatorio: z.boolean().optional(),
  opcoes: z.array(z.string().trim().min(1)).optional(),
  ajuda: z.string().trim().max(300).optional().or(z.literal("")),
});
export type UpdateCampoInput = z.infer<typeof updateCampoSchema>;

/** Resposta do cliente (respostas = mapa campoId → valor; string ou array de strings). */
export const salvarRespostaSchema = z.object({
  requisitoId: z.string().min(1),
  respostas: z.record(z.union([z.string(), z.array(z.string())])),
  enviar: z.boolean().default(false),
});
export type SalvarRespostaInput = z.infer<typeof salvarRespostaSchema>;
