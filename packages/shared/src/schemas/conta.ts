import { z } from "zod";
import { recorrenciaEnum } from "./evento";

const textoOpcional = z.string().trim().max(2000).optional().or(z.literal(""));
const idOpcional = z.string().optional().or(z.literal(""));
// Data opcional vinda de <input type="date"> ("" quando vazia).
const dataOpcional = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional());

export const contaTipoEnum = z.enum(["PAGAR", "RECEBER"]);
export type ContaTipo = z.infer<typeof contaTipoEnum>;

export const categoriaTipoEnum = z.enum(["RECEITA", "DESPESA"]);
export type CategoriaTipo = z.infer<typeof categoriaTipoEnum>;

export const CATEGORIA_TIPO_LABEL: Record<CategoriaTipo, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
};

// ── Carteira (Empresa × Pessoal) ─────────────────────────
/** Escopo de uma conta/categoria: livros da empresa (compartilhados) ou finanças pessoais (privadas). */
export const escopoEnum = z.enum(["EMPRESA", "PESSOAL"]);
export type Escopo = z.infer<typeof escopoEnum>;
export const ESCOPO_LABEL: Record<Escopo, string> = {
  EMPRESA: "Empresa",
  PESSOAL: "Pessoal",
};
/** Visão da página: uma carteira específica ou o consolidado das duas. */
export const carteiraEnum = z.enum(["EMPRESA", "PESSOAL", "TUDO"]);
export type Carteira = z.infer<typeof carteiraEnum>;
export const carteiraInputSchema = z.object({ carteira: carteiraEnum.default("EMPRESA") });
export type CarteiraInput = z.infer<typeof carteiraInputSchema>;

// ── Conta ────────────────────────────────────────────────
export const createContaSchema = z.object({
  tipo: contaTipoEnum,
  escopo: escopoEnum.default("EMPRESA"),
  descricao: z.string().trim().min(1, "Informe a descrição"),
  valor: z.coerce.number().positive("O valor deve ser maior que zero"),
  vencimento: z.coerce.date({ message: "Informe o vencimento" }),
  categoriaId: idOpcional,
  clienteId: idOpcional,
  recorrencia: recorrenciaEnum.default("NENHUMA"),
  recorrenciaAte: dataOpcional,
  observacoes: textoOpcional,
});
export type CreateContaInput = z.infer<typeof createContaSchema>;

export const updateContaSchema = createContaSchema.partial().extend({ id: z.string().min(1) });
export type UpdateContaInput = z.infer<typeof updateContaSchema>;

export const listContasSchema = z.object({
  carteira: carteiraEnum.default("EMPRESA"),
  tipo: contaTipoEnum.optional(),
  status: z.enum(["TODAS", "PENDENTES", "PAGAS"]).default("TODAS"),
});
export type ListContasInput = z.infer<typeof listContasSchema>;

export const marcarPagaSchema = z.object({ id: z.string().min(1), pago: z.boolean() });

// ── Categoria ────────────────────────────────────────────
export const listCategoriasSchema = z.object({ escopo: escopoEnum.default("EMPRESA") });
export type ListCategoriasInput = z.infer<typeof listCategoriasSchema>;

export const createCategoriaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  tipo: categoriaTipoEnum,
  escopo: escopoEnum.default("EMPRESA"),
  cor: textoOpcional,
});
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;

export const updateCategoriaSchema = createCategoriaSchema.partial().extend({
  id: z.string().min(1),
});
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
