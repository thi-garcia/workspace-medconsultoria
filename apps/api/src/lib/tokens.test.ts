import { describe, it, expect } from "vitest";
import { gerarTokenPublico } from "./tokens";

describe("tokens — token público de assinatura (criptográfico)", () => {
  it("gera token base64url de ~43 chars (256 bits) sem caracteres inseguros de URL", () => {
    const t = gerarTokenPublico();
    expect(t.length).toBeGreaterThanOrEqual(42);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/); // base64url: sem +, /, =
  });

  it("gera tokens únicos e imprevisíveis (sem colisão em 5000 amostras)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 5000; i++) set.add(gerarTokenPublico());
    expect(set.size).toBe(5000);
  });

  it("não parece um cuid (cuid começa com 'c' e é curto/sequencial)", () => {
    const t = gerarTokenPublico();
    expect(t.startsWith("c") && t.length <= 25).toBe(false);
  });
});
