import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { algoritmoDoHash, hashPassword, verifyPassword, precisaRehash, diagnosticoSenha } from "./password";

describe("password — abstração de hash (Argon2id primário + Plano B bcrypt por prefixo)", () => {
  it("gera hash Argon2id para novas senhas", async () => {
    const h = await hashPassword("senha-forte-123");
    expect(algoritmoDoHash(h)).toBe("argon2id");
    expect(h.startsWith("$argon2")).toBe(true);
  });

  it("verifica a senha correta e rejeita a incorreta (Argon2)", async () => {
    const h = await hashPassword("MinhaSenha!2026");
    expect(await verifyPassword(h, "MinhaSenha!2026")).toBe(true);
    expect(await verifyPassword(h, "senha-errada")).toBe(false);
  });

  it("identifica o algoritmo pelo prefixo do hash", () => {
    expect(algoritmoDoHash("$argon2id$v=19$m=19456,t=2,p=1$abc")).toBe("argon2id");
    expect(algoritmoDoHash("$2b$12$abcdefghijklmnopqrstuv")).toBe("bcrypt");
    expect(algoritmoDoHash("$2a$10$abcdefghijklmnopqrstuv")).toBe("bcrypt");
    expect(algoritmoDoHash("texto-qualquer")).toBe("desconhecido");
  });

  it("verifica hashes bcrypt legados (coexistência por prefixo)", async () => {
    const legado = await bcrypt.hash("senha-antiga", 8);
    expect(algoritmoDoHash(legado)).toBe("bcrypt");
    expect(await verifyPassword(legado, "senha-antiga")).toBe(true);
    expect(await verifyPassword(legado, "outra")).toBe(false);
  });

  it("nega hash de formato desconhecido sem lançar", async () => {
    expect(await verifyPassword("nao-e-um-hash", "qualquer")).toBe(false);
  });

  it("precisaRehash: falso para Argon2, verdadeiro para bcrypt (quando Argon2 disponível)", async () => {
    const argon = await hashPassword("x");
    expect(await precisaRehash(argon)).toBe(false);
    const legado = await bcrypt.hash("y", 8);
    // Neste ambiente o Argon2 carrega, então um hash bcrypt deve ser reescrito no login.
    expect(await precisaRehash(legado)).toBe(true);
  });

  it("diagnóstico de compatibilidade passa neste ambiente", async () => {
    const d = await diagnosticoSenha();
    expect(d.algoritmoPrimario).toBe("argon2id");
    expect(d.planoBDisponivel).toBe(true);
    expect(d.ok).toBe(true);
    // Todos os checks de argon2 verdes:
    for (const c of d.checks.filter((x) => x.nome.startsWith("argon2"))) {
      expect(c.ok, `${c.nome}: ${c.detalhe}`).toBe(true);
    }
    expect(d.node).toMatch(/^v\d+/);
  });
});
