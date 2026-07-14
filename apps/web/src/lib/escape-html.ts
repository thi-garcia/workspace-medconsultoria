/**
 * Escapa texto para inserção segura em HTML (contexto de conteúdo e de atributo com aspas).
 * Use SEMPRE que interpolar valor vindo do usuário/banco numa string HTML — em especial nas
 * janelas de impressão (`document.write`), que rodam fora do React e não escapam sozinhas.
 * Ver correção de XSS #6 da finalização.
 */
export function escapeHtml(valor: string | null | undefined): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
