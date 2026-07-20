import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSTITUCIONAL, PENDENTE_THAIS, rodapeInstitucional } from "@app/shared";

const raiz = resolve(__dirname, "../../../..");
const ler = (rel: string) => readFileSync(resolve(raiz, rel), "utf8");

describe("identidade institucional", () => {
  it("o rodapé cliente-facing usa o site PÚBLICO, nunca o workspace interno", () => {
    const rodape = rodapeInstitucional();
    expect(rodape).toContain(INSTITUCIONAL.site);
    expect(rodape).not.toContain("workspace.");
  });

  it("o rodapé traz os dados de contato reais do site", () => {
    const rodape = rodapeInstitucional();
    expect(rodape).toContain("comercial@medconsultoria.com.br");
    expect(rodape).toContain("(11) 94072-3055");
  });

  /**
   * Trava de integridade: um CNPJ/razão social inventado num contrato assinado é um problema
   * jurídico real. Enquanto a Thaís não fornecer, estes campos ficam `null` — quem consome
   * deve OMITIR, nunca preencher com exemplo. Este teste falha se alguém "resolver" o
   * pendente com um valor de mentira.
   */
  it("dados jurídicos não fornecidos continuam nulos (ninguém inventa CNPJ)", () => {
    expect(PENDENTE_THAIS.razaoSocial).toBeNull();
    expect(PENDENTE_THAIS.cnpj).toBeNull();
    expect(PENDENTE_THAIS.enderecoCompleto).toBeNull();
    expect(PENDENTE_THAIS.foro).toBeNull();
  });

  it("nenhum material cliente-facing tem contato solto no código", () => {
    const arquivos = [
      "apps/web/src/features/documentos/DocumentoBranded.tsx",
      "apps/api/src/lib/email-template.ts",
    ];
    for (const arq of arquivos) {
      const fonte = ler(arq);
      // O e-mail antigo (contato@) e a URL interna não podem voltar como texto literal.
      expect(fonte, `${arq} tem e-mail solto`).not.toContain("contato@medconsultoria.com.br");
      expect(fonte, `${arq} vaza a URL interna do workspace`).not.toContain("workspace.medconsultoria.com.br");
    }
  });
});
