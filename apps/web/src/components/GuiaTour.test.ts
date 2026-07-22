import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { guiaDaRota, PREFIXOS_GUIA } from "./GuiaTour";

/**
 * Guarda dos guias "?" por página. A dor que originou isto: Ajustes (e Modelos, e E-mails
 * enviados) abriam o guia GENÉRICO do Início, porque não tinham mapeamento próprio — e o de
 * `/emails` estava com o nome errado ("Comunicações" em vez de "Mensagens automáticas").
 *
 * Este teste cruza os guias com as rotas reais do router e falha se uma página abrir o guia de
 * outra, ou se a ordem de prefixos deixar um guia inalcançável.
 */
function rotasDoRouter(): string[] {
  const src = readFileSync(resolve(__dirname, "../app/router.tsx"), "utf8");
  const paths = [...src.matchAll(/path:\s*"(\/[a-z-]*)"/g)].map((m) => m[1]!);
  return [...new Set(paths)].filter((p) => p !== "/login" && p !== "/" && !p.includes("$"));
}

describe("guias por página (botão ?)", () => {
  it("nenhuma página cai no guia genérico do Início por engano", () => {
    // O Início ("Visão geral") é o fallback. Se uma rota real resolver para ele, é porque não
    // tem guia próprio — foi exatamente o bug do Ajustes.
    const semGuiaProprio = rotasDoRouter().filter((rota) => guiaDaRota(rota).titulo === "Visão geral");
    expect(semGuiaProprio, `páginas sem guia próprio (abrem o do Início): ${semGuiaProprio.join(", ")}`).toEqual([]);
  });

  it("Ajustes, Modelos e E-mails enviados têm guia próprio (as que faltavam)", () => {
    expect(guiaDaRota("/ajustes").titulo).toBe("Ajustes");
    expect(guiaDaRota("/modelos").titulo).toBe("Modelos de documento");
    expect(guiaDaRota("/emails-enviados").titulo).toBe("E-mails enviados");
  });

  it("/emails-enviados NÃO cai no guia de /emails (ordem dos prefixos)", () => {
    // `/emails` é prefixo de `/emails-enviados`; se viesse antes, capturaria os dois.
    expect(guiaDaRota("/emails-enviados").titulo).toBe("E-mails enviados");
    expect(guiaDaRota("/emails").titulo).toBe("Mensagens automáticas");
  });

  it("prefixo curto nunca mascara um mais específico (o mais longo vem antes)", () => {
    // `guiaDaRota` usa `path.startsWith(prefixo)` e para no PRIMEIRO match. Logo, se um prefixo
    // que vem ANTES na lista é prefixo de um que vem DEPOIS, o de depois nunca é alcançado.
    // Ex.: "/emails" antes de "/emails-enviados" capturaria os dois — precisa ser o contrário.
    for (let i = 0; i < PREFIXOS_GUIA.length; i++) {
      for (let j = i + 1; j < PREFIXOS_GUIA.length; j++) {
        const antes = PREFIXOS_GUIA[i]!;
        const depois = PREFIXOS_GUIA[j]!;
        expect(
          depois.startsWith(antes),
          `"${antes}" vem antes de "${depois}" e é prefixo dele — "${depois}" nunca seria alcançado`,
        ).toBe(false);
      }
    }
  });

  it("todo guia é COMPLETO: ≥ 2 passos, cada um com título e descrição de verdade", () => {
    for (const rota of rotasDoRouter()) {
      const g = guiaDaRota(rota);
      // ≥ 2 evita guia magro de um passo só (Mensagens/Config/Sistema já eram assim).
      expect(g.passos.length, `${rota} tem menos de 2 passos — guia raso`).toBeGreaterThanOrEqual(2);
      for (const p of g.passos) {
        expect(p.titulo.trim().length, `${rota}: passo sem título`).toBeGreaterThan(2);
        const desc = typeof p.descricao === "string" ? p.descricao.trim().length : 40;
        expect(desc, `${rota}: descrição curta demais`).toBeGreaterThan(30);
      }
    }
  });

  it("não sobrou texto de renomeação '(era …)' nos passos", () => {
    for (const rota of rotasDoRouter()) {
      for (const p of guiaDaRota(rota).passos) {
        const txt = typeof p.descricao === "string" ? p.descricao : "";
        expect(/\(era [""]/.test(txt + p.titulo), `${rota}: resíduo de rename`).toBe(false);
      }
    }
  });
});
