import { describe, it, expect } from "vitest";
import { podeRodarDemoSeed, STAGE_DEFAULTS } from "@app/db";

const LOCAL = "mysql://u:p@127.0.0.1:3307/medconsultoria";
const REMOTO = "mysql://u:p@db.tinehost.com.br:3306/medconsultoria";

describe("trava do demo-seed (dados de exemplo nunca em produção)", () => {
  it("bloqueia quando NODE_ENV=production, mesmo com banco local", () => {
    const r = podeRodarDemoSeed({ NODE_ENV: "production", DATABASE_URL: LOCAL });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toContain("production");
  });

  it("bloqueia banco remoto sem confirmação explícita", () => {
    const r = podeRodarDemoSeed({ NODE_ENV: "development", DATABASE_URL: REMOTO });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toContain("DEMO_SEED_CONFIRMO");
  });

  it("bloqueia quando não dá para provar que o banco é local", () => {
    expect(podeRodarDemoSeed({ DATABASE_URL: undefined }).permitido).toBe(false);
    expect(podeRodarDemoSeed({ DATABASE_URL: "isso-nao-e-url" }).permitido).toBe(false);
  });

  it("permite banco local em desenvolvimento", () => {
    expect(podeRodarDemoSeed({ NODE_ENV: "development", DATABASE_URL: LOCAL }).permitido).toBe(true);
    expect(podeRodarDemoSeed({ DATABASE_URL: "mysql://u:p@localhost:3307/x" }).permitido).toBe(true);
  });

  it("permite o container MySQL da CI", () => {
    expect(podeRodarDemoSeed({ NODE_ENV: "test", DATABASE_URL: "mysql://u:p@mysql:3306/x" }).permitido).toBe(true);
  });

  it("libera banco remoto só com DEMO_SEED_CONFIRMO=1 (escotilha consciente)", () => {
    const r = podeRodarDemoSeed({ DATABASE_URL: REMOTO, DEMO_SEED_CONFIRMO: "1" });
    expect(r.permitido).toBe(true);
    // ...mas nunca em produção, nem com a escotilha.
    expect(podeRodarDemoSeed({ NODE_ENV: "production", DATABASE_URL: REMOTO, DEMO_SEED_CONFIRMO: "1" }).permitido).toBe(
      false,
    );
  });
});

describe("config essencial do funil", () => {
  it("as 5 etapas nascem no seed base, em ordem, sem lacunas", () => {
    expect(STAGE_DEFAULTS.map((s) => s.nome)).toEqual(["Novo", "Qualificação", "Proposta", "Negociação", "Fechado"]);
    expect(STAGE_DEFAULTS.map((s) => s.ordem)).toEqual([0, 1, 2, 3, 4]);
  });
});
