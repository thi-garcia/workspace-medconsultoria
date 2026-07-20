/**
 * IDENTIDADE INSTITUCIONAL — fonte única da verdade.
 *
 * Tudo aqui foi **transcrito** de fontes verificadas (o site público
 * https://medconsultoria.com.br e a pasta `brand/`), nunca inventado. Documentos, e-mails e
 * telas cliente-facing devem importar destas constantes em vez de repetir texto solto —
 * assim, quando a Thaís revisar um dado, ele muda em um lugar só.
 *
 * ⚠️ Campos ainda NÃO fornecidos (razão social completa, CNPJ, endereço) estão em
 * `PENDENTE_THAIS` e **não têm valor padrão de propósito**: um CNPJ inventado num contrato
 * seria um problema jurídico real. Ver "Conteúdo real necessário" no
 * AUDITORIA_FUNCIONAL_COMPLETA.md.
 */
export const INSTITUCIONAL = {
  /** Nome fantasia, como aparece na marca. */
  nome: "MedConsultoria",
  /** Posicionamento do site: "gestão estratégica para clínicas". */
  tagline: "Gestão estratégica para clínicas e consultórios",
  /** Site público — é este que vai em documento/e-mail para o cliente. */
  site: "medconsultoria.com.br",
  siteUrl: "https://medconsultoria.com.br",
  /** E-mail comercial divulgado no site. */
  email: "comercial@medconsultoria.com.br",
  telefone: "(11) 94072-3055",
  cidade: "São Paulo, SP",
  instagram: "@med.consultoria",
  instagramUrl: "https://instagram.com/med.consultoria",
  /** Endereço do workspace interno — NUNCA usar em material cliente-facing. */
  workspaceUrl: "https://workspace.medconsultoria.com.br",
} as const;

/**
 * Dados que só a Thaís pode fornecer. Enquanto forem `null`, quem consome deve OMITIR o campo
 * — jamais preencher com exemplo. Um CNPJ fictício num contrato assinado é um risco jurídico.
 */
export const PENDENTE_THAIS = {
  razaoSocial: null,
  cnpj: null,
  enderecoCompleto: null,
  /** Foro de eleição dos contratos. */
  foro: null,
} as const;

/** Linha de rodapé para documentos e e-mails: só dados verificados, na ordem de leitura. */
export function rodapeInstitucional(): string {
  return [INSTITUCIONAL.nome, INSTITUCIONAL.email, INSTITUCIONAL.telefone, INSTITUCIONAL.site].join(" · ");
}

/** Marcador visível para dado que só a Thaís pode preencher. Nunca some silenciosamente. */
const aPreencher = (campo: string) => `**[A PREENCHER: ${campo}]**`;

/**
 * Qualificação da CONTRATADA para contratos.
 *
 * Um contrato precisa qualificar **as duas** partes — hoje só a CONTRATANTE era qualificada
 * (nome, documento, e-mail) e a CONTRATADA aparecia como um nome solto. O que já é conhecido
 * entra; o que falta aparece como marcador **visível em negrito**, para a Thaís enxergar
 * exatamente o que preencher antes de assinar (em vez de o campo sumir sem ninguém notar).
 */
export function qualificacaoContratada(): string {
  return [
    `a ${PENDENTE_THAIS.razaoSocial ?? aPreencher("RAZÃO SOCIAL")}`,
    `nome fantasia **${INSTITUCIONAL.nome}**`,
    `inscrita no CNPJ sob o nº ${PENDENTE_THAIS.cnpj ?? aPreencher("CNPJ")}`,
    `com sede em ${PENDENTE_THAIS.enderecoCompleto ?? aPreencher("ENDEREÇO COMPLETO")}, ${INSTITUCIONAL.cidade}`,
    `e-mail ${INSTITUCIONAL.email}`,
    `telefone ${INSTITUCIONAL.telefone}`,
  ].join(", ");
}
