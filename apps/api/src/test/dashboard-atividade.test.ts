import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guarda do widget "Atividade recente" do Início. Ele mostra atividade de NEGÓCIO (criou
 * cliente, gerou documento…). Os eventos técnicos de autenticação — `login`, `login.falhou`,
 * `login.bloqueado_no_navegador` — poluíam o feed com "Alguém registrou: login bloqueado no
 * navegador". O filtro precisa excluir TODO `login*`, não só o `login` exato.
 */
const fonte = readFileSync(resolve(__dirname, "../modules/dashboard/dashboard.service.ts"), "utf8");

describe("atividade recente do dashboard", () => {
  it("exclui todos os eventos de login (prefixo), não só o login exato", () => {
    // A query da atividade precisa filtrar por prefixo — `startsWith: "login"` cobre
    // login, login.falhou e login.bloqueado_no_navegador de uma vez.
    expect(fonte).toContain('startsWith: "login"');
  });

  it("não voltou ao filtro antigo que deixava passar os eventos de diagnóstico", () => {
    // `acao: "login"` (igualdade) só barrava o login exato — deixava vazar os `login.*`.
    expect(fonte).not.toMatch(/NOT:\s*\{\s*acao:\s*"login"\s*\}/);
  });
});
