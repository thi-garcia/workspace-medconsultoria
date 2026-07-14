import { describe, it, expect } from "vitest";
import { hasRoleLevel, ROLE_LEVEL } from "@app/shared";
import { assertPodeAtribuir } from "./usuarios.service";

describe("RBAC — hierarquia de papéis", () => {
  it("ROOT > ADMIN > FUNCIONARIO > CLIENTE", () => {
    expect(ROLE_LEVEL.ROOT).toBeGreaterThan(ROLE_LEVEL.ADMIN);
    expect(ROLE_LEVEL.ADMIN).toBeGreaterThan(ROLE_LEVEL.FUNCIONARIO);
    expect(ROLE_LEVEL.FUNCIONARIO).toBeGreaterThan(ROLE_LEVEL.CLIENTE);
  });

  it("hasRoleLevel: papel maior atende exigência menor, e o contrário não", () => {
    expect(hasRoleLevel("ROOT", "ADMIN")).toBe(true);
    expect(hasRoleLevel("ADMIN", "FUNCIONARIO")).toBe(true);
    expect(hasRoleLevel("FUNCIONARIO", "FUNCIONARIO")).toBe(true);
    expect(hasRoleLevel("FUNCIONARIO", "ADMIN")).toBe(false);
    expect(hasRoleLevel("CLIENTE", "FUNCIONARIO")).toBe(false);
  });
});

describe("RBAC — anti-escalonamento (assertPodeAtribuir)", () => {
  it("só permite atribuir papéis ESTRITAMENTE abaixo do próprio", () => {
    // ROOT pode atribuir ADMIN/FUNCIONARIO/CLIENTE
    expect(() => assertPodeAtribuir("ROOT", "ADMIN")).not.toThrow();
    expect(() => assertPodeAtribuir("ROOT", "FUNCIONARIO")).not.toThrow();
    // ADMIN pode atribuir FUNCIONARIO/CLIENTE
    expect(() => assertPodeAtribuir("ADMIN", "FUNCIONARIO")).not.toThrow();
    expect(() => assertPodeAtribuir("ADMIN", "CLIENTE")).not.toThrow();
  });

  it("bloqueia atribuir papel igual ou superior ao próprio", () => {
    expect(() => assertPodeAtribuir("ADMIN", "ADMIN")).toThrow(); // par
    expect(() => assertPodeAtribuir("ADMIN", "ROOT")).toThrow(); // superior
    expect(() => assertPodeAtribuir("FUNCIONARIO", "FUNCIONARIO")).toThrow();
    expect(() => assertPodeAtribuir("FUNCIONARIO", "ADMIN")).toThrow();
    expect(() => assertPodeAtribuir("CLIENTE", "CLIENTE")).toThrow();
  });
});
