import { describe, it, expect } from "vitest";
import { escapeHtml } from "./escape-html";
import { renderMarkdown } from "../features/documentos/DocumentoBranded";

describe("escapeHtml", () => {
  it("escapa caracteres perigosos de HTML", () => {
    expect(escapeHtml(`<script>&"'`)).toBe("&lt;script&gt;&amp;&quot;&#39;");
    expect(escapeHtml(`<img src=x onerror=alert(1)>`)).not.toContain("<img");
  });
  it("aceita nulo/indefinido", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("renderMarkdown — sanitização (DOMPurify) contra payloads XSS", () => {
  const perigosos = [
    "<script>alert(document.cookie)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg/onload=alert(1)>",
    '<a href="javascript:alert(1)">clique</a>',
    "[link](javascript:alert(1))",
    "<iframe src=javascript:alert(1)></iframe>",
    "<body onload=alert(1)>",
    "<style>*{background:url(javascript:alert(1))}</style>",
  ];

  for (const p of perigosos) {
    it(`neutraliza: ${p.slice(0, 40)}`, () => {
      const out = renderMarkdown(p).toLowerCase();
      expect(out).not.toContain("<script");
      expect(out).not.toContain("<iframe");
      expect(out).not.toContain("<svg");
      expect(out).not.toContain("<style");
      expect(out, "nenhum handler on...= como atributo").not.toMatch(/\son\w+\s*=/);
      expect(out, "nenhuma URL javascript: em atributo (href/src)").not.toMatch(/(href|src)\s*=\s*["']?\s*javascript:/);
    });
  }

  it("preserva formatação Markdown segura", () => {
    const out = renderMarkdown("# Título\n\n**forte** e *ênfase*\n\n- item");
    expect(out).toContain("<h1");
    expect(out).toContain("<strong>");
    expect(out).toContain("<li>");
  });

  it("mantém HTML inline seguro e remove o ativo embutido no Markdown", () => {
    const out = renderMarkdown("Texto <b>ok</b> e <script>mau()</script>");
    expect(out).toContain("<b>ok</b>");
    expect(out.toLowerCase()).not.toContain("<script");
  });
});
