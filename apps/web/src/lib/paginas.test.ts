import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PAGINAS, paginaCasa, normalizar } from "./paginas";

/**
 * Guarda do catálogo de busca. A dor que originou isto: Sistema e Modelos existiam no app mas
 * NÃO apareciam no Ctrl+K, porque a paleta tinha uma lista à mão que divergia das rotas reais.
 * Este teste cruza o catálogo com as rotas do router e falha se uma página navegável ficar de
 * fora — ou se o catálogo apontar para uma rota que não existe.
 */

// Rotas de PÁGINA declaradas no router (exclui login, rotas públicas e detalhes com `$`).
function rotasDoRouter(): Set<string> {
  const src = readFileSync(resolve(__dirname, "../app/router.tsx"), "utf8");
  const paths = [...src.matchAll(/path:\s*"(\/[a-z-]*)"/g)].map((m) => m[1]!);
  const fora = new Set(["/login"]); // pública, não entra na busca
  return new Set(paths.filter((p) => !fora.has(p) && !p.includes("$")));
}

describe("catálogo de páginas (busca do Ctrl+K)", () => {
  it("toda rota de página do router está no catálogo (nada fica de fora da busca)", () => {
    const noCatalogo = new Set(PAGINAS.map((p) => p.to));
    const faltando = [...rotasDoRouter()].filter((r) => !noCatalogo.has(r));
    expect(faltando, `rotas navegáveis ausentes da busca: ${faltando.join(", ")}`).toEqual([]);
  });

  it("nenhuma entrada do catálogo aponta para rota inexistente", () => {
    const doRouter = rotasDoRouter();
    const mortas = PAGINAS.map((p) => p.to).filter((to) => !doRouter.has(to));
    expect(mortas, `rotas no catálogo que não existem no router: ${mortas.join(", ")}`).toEqual([]);
  });

  it("Sistema e Modelos estão na busca (as duas que faltavam)", () => {
    expect(PAGINAS.some((p) => p.to === "/sistema")).toBe(true);
    expect(PAGINAS.some((p) => p.to === "/modelos")).toBe(true);
  });

  it("busca sem acento e por palavra-chave encontra a página certa", () => {
    const acha = (q: string) => PAGINAS.filter((p) => paginaCasa(p, q)).map((p) => p.to);
    expect(acha("saude")).toContain("/sistema"); // keyword, sem acento
    expect(acha("funil")).toContain("/leads"); // keyword
    expect(acha("Serviços")).toContain("/servicos"); // com acento na consulta
    expect(acha("usuarios")).toContain("/usuarios"); // keyword ≠ rótulo ("Equipe e acessos")
    expect(acha("kanban")).toContain("/projetos");
  });

  it("consulta vazia devolve todas; consulta sem match devolve nenhuma", () => {
    expect(PAGINAS.filter((p) => paginaCasa(p, "")).length).toBe(PAGINAS.length);
    expect(PAGINAS.filter((p) => paginaCasa(p, "xpto-nada-aqui"))).toEqual([]);
  });

  it("rótulos e rotas são únicos (sem duplicata)", () => {
    expect(new Set(PAGINAS.map((p) => p.to)).size).toBe(PAGINAS.length);
    expect(new Set(PAGINAS.map((p) => p.label)).size).toBe(PAGINAS.length);
  });

  it("normalizar remove acento e caixa", () => {
    expect(normalizar("Saúde Ações")).toBe("saude acoes");
  });
});
