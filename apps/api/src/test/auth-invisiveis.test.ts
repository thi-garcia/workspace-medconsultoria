import { describe, it, expect } from "vitest";
import { loginSchema } from "@app/shared";

/**
 * Trava do BUG-012: o dono não conseguia entrar porque copiava o e-mail do `docs/ACESSOS.md`,
 * que trazia **espaços de largura zero** (U+200B) grudados. Na tela lia-se
 * `root@medconsultoria.com.br`; o que chegava era `​​root@…​`, e o validador
 * recusava com "E-mail inválido" — sem nenhuma pista do porquê, nem em aba anônima.
 *
 * Estes testes protegem a limpeza. Se alguém "limpar" a classe de caracteres invisíveis do
 * schema (ela parece um colchete quase vazio), eles falham.
 */
const ZWSP = "​";
const BOM = "﻿";
const NBSP = " ";
const RLM = "‏";

describe("login tolera caracteres invisíveis colados", () => {
  it("aceita o e-mail exatamente como veio do documento (o caso real)", () => {
    const r = loginSchema.safeParse({
      email: `${ZWSP}${ZWSP}root@medconsultoria.com.br${ZWSP}`,
      password: "senha-dummy", // o schema só exige não-vazio; o valor real não importa aqui
    });
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues)).toBe(true);
    if (r.success) expect(r.data.email).toBe("root@medconsultoria.com.br");
  });

  it("limpa BOM, espaço rígido e marca de direção", () => {
    for (const lixo of [BOM, NBSP, RLM]) {
      const r = loginSchema.safeParse({
        email: `${lixo}thais.garcia@medconsultoria.com.br${lixo}`,
        password: "x",
      });
      expect(r.success, `falhou com ${JSON.stringify(lixo)}`).toBe(true);
      if (r.success) expect(r.data.email).toBe("thais.garcia@medconsultoria.com.br");
    }
  });

  it("também limpa a senha (gerenciadores colam BOM/espaço rígido na ponta)", () => {
    const r = loginSchema.safeParse({ email: "root@medconsultoria.com.br", password: `${ZWSP}senha${BOM}` });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.password).toBe("senha");
  });

  it("continua normalizando: espaços comuns e maiúsculas", () => {
    const r = loginSchema.safeParse({ email: "  ROOT@MedConsultoria.com.BR  ", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("root@medconsultoria.com.br");
  });

  it("e-mail de verdade inválido continua sendo recusado", () => {
    for (const ruim of ["sem-arroba", "@sodominio.com", "espaco no meio@x.com", ""]) {
      expect(loginSchema.safeParse({ email: ruim, password: "x" }).success, ruim).toBe(false);
    }
  });

  it("senha vazia continua sendo recusada (a limpeza não pode mascarar campo em branco)", () => {
    const r = loginSchema.safeParse({ email: "root@medconsultoria.com.br", password: `${ZWSP}${NBSP}` });
    expect(r.success).toBe(false);
  });
});
