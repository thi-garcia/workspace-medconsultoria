import { createHash } from "node:crypto";

/** SHA-256 (hex) do conteúdo — prova de integridade de documentos assinados. */
export function hashConteudo(conteudo: string): string {
  return createHash("sha256").update(conteudo, "utf8").digest("hex");
}
