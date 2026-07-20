/**
 * CONFIGURAÇÃO ESSENCIAL — estrutura mínima para a aplicação ser utilizável.
 *
 * Difere dos dados de EXEMPLO (`demo-seed.ts`): isto entra em QUALQUER banco, inclusive
 * produção, porque sem as etapas do funil a página Vendas nasce sem colunas.
 */
export const STAGE_DEFAULTS = [
  { nome: "Novo", ordem: 0, cor: "#2DA8E1" },
  { nome: "Qualificação", ordem: 1, cor: "#003591" },
  { nome: "Proposta", ordem: 2, cor: "#30AD73" },
  { nome: "Negociação", ordem: 3, cor: "#F59E0B" },
  { nome: "Fechado", ordem: 4, cor: "#30AD73" },
];
