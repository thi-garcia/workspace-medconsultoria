# BUG TRACKER — Workspace MedConsultoria

Histórico de bugs encontrados na auditoria funcional (Bloco 3+). Para cada um: reprodução, PR, commit, solução e regressão.

**Legenda:** 🔴 aberto · 🟢 corrigido · ⚪ não reproduz / inválido

| ID | Status | Título | Encontrado em | PR | Commit |
|----|--------|--------|---------------|----|----|
| BUG-001 | 🟢 corrigido | Overflow horizontal na ficha do cliente no mobile | 2026-07-17 (validação ao vivo, celular 390) | #10 | `4c8f455` |
| BUG-002 | 🟢 corrigido | 404 de recurso mostrava "erro de conexão / tentar de novo" (páginas de detalhe) | 2026-07-17 (edge: URL de recurso inexistente) | #12 | _(pendente merge)_ |

---

## BUG-001 — Overflow horizontal na ficha do cliente no mobile
- **Status:** 🟢 corrigido
- **Severidade:** média (UX mobile; sem perda de dados)
- **Módulo/rota:** Clientes → ficha (`/clientes/$id`), `apps/web/src/features/crm/clientes/ClienteDetailPage.tsx`
- **Perfil/viewport:** todos · celular 390×844 e 360×800
- **Reprodução:**
  1. Login (qualquer perfil da equipe), abrir a ficha de um cliente com conteúdo (ex.: Acme Saúde).
  2. Redimensionar para 390×844.
  3. Observar barra de rolagem horizontal; `document.documentElement.scrollWidth` ≈ 696 num viewport de 380.
- **Causa:** o grid `grid gap-6 lg:grid-cols-3` não declarava `grid-cols-1` no default. Sem colunas explícitas no mobile, o único track vira `auto` (min-content) e estica até o filho mais largo (~680px).
- **Solução:** `grid grid-cols-1 gap-6 lg:grid-cols-3` (o `grid-cols-1` do Tailwind é `minmax(0,1fr)`, que limita o track ao container) + `min-w-0` na coluna principal.
- **Regressão:** `e2e/responsive.spec.ts` passou a incluir `/clientes/$id` nos 5 viewports (a lacuna que deixou o bug passar).
- **Revalidação manual:** medido ao vivo 696px → 0 de overflow em 360/390/768 após o fix.

---

## BUG-002 — 404 de recurso mostrava erro genérico de conexão (páginas de detalhe)
- **Status:** 🟢 corrigido
- **Severidade:** baixa (UX; sem perda de dados, sem risco de segurança)
- **Módulo/rota:** páginas de detalhe — `ClienteDetailPage`, `ProjetoDetailPage`, `DocumentoDetailPage`, `ModeloDetailPage`
- **Perfil/viewport:** todos (equipe)
- **Reprodução:**
  1. Logar na equipe, abrir uma URL de recurso inexistente, ex.: `/clientes/idinexistente000000000000`.
  2. A API responde **404 NOT_FOUND** (correto), mas a UI mostrava **"Não foi possível carregar — Verifique a conexão e tente de novo"** com botão **"Tentar de novo"**.
- **Impacto:** enganoso — sugere falha transitória de rede; retentar um 404 nunca resolve.
- **Causa:** `if (query.isError) return <QueryError/>` capturava **qualquer** erro, inclusive NOT_FOUND, antes de cair no bloco "[Entidade] não encontrado" que já existia para `!data`.
- **Solução:** helper `apps/web/src/lib/trpc-error.ts::isNotFoundError(err)`; nas 4 páginas, `if (isError && !isNotFoundError(error))` — assim o 404 cai no estado terminal "não encontrado" (com link de voltar).
- **Regressão:** `e2e/flows-erros-ux.spec.ts` — 404 de recurso mostra "Cliente não encontrado" e **não** "Tentar de novo"; + 404 de rota ("Página não encontrada") e token de proposta inválido ("Link inválido").
- **Revalidação manual:** ao vivo, a mesma URL passou a exibir "Cliente não encontrado. ← Voltar para clientes".

---

## BUG-003 — "Atividade recente" gerava frases sem verbo ("Thaís arquivo removido")
- **Status:** 🟢 corrigido
- **Severidade:** baixa (texto visível ao usuário; sem perda de dados)
- **Módulo/rota:** Início → widget "Atividade recente" (`apps/web/src/features/dashboard/DashboardPage.tsx`)
- **Perfil/viewport:** ADMIN e ROOT (o widget é da camada de gestão) · todos os viewports
- **Reprodução:**
  1. Logar como ADMIN ou ROOT e abrir o **Início**.
  2. No widget **Atividade recente**, procurar uma linha de remoção de arquivo.
  3. Aparecia **"Thaís arquivo removido"** — sem verbo — enquanto as vizinhas liam
     corretamente ("Thaís aprovou um documento").
- **Causa:** o mapa `ACAO_LABEL` cobria só 30 das **39** chaves que o backend realmente grava em
  `activityLog`. O fallback era `acao.replace(/[._]/g, " ")`, que transforma `arquivo.removido`
  em "arquivo removido" — a chave crua com espaços, não uma frase.
- **Chaves que faltavam (9 + as montadas em runtime):** `arquivo.removido`,
  `cliente.dados_atualizados_portal`, `cliente.excluido_definitivo`, `documento.assinado`,
  `documento.assinatura_solicitada`, `documento.contrato_auto`, `documento.ia_pauta`,
  `documento.proposta_auto`, `documento.proposta_gerada` (o mapa tinha só a forma masculina
  `_gerado`), `lead.servicos_portal`, `proposta.aceite_habilitado`, `servico.contratado`,
  `servico.cancelado`, `servico.sincronizado_aceite` e `login`.
- **Solução:** rótulos completos + função `acaoLabel()` com dois fallbacks que **sempre começam
  por verbo**: documentos gerados por modelo (`documento.<tipo>_gerado`, montado em tempo de
  execução em `documentos.service.ts:699` — não dá para listar todos) viram
  "gerou um documento (escopo)"; qualquer chave nova vira "registrou: …".
- **Regressão:** `apps/web/src/features/dashboard/atividade-label.test.ts` (5 testes) — cruza a
  lista real de ações do backend contra os rótulos e falha se alguma cair no fallback genérico.
- **Revalidação manual:** ao vivo no navegador, a linha passou a ler **"Thaís removeu um arquivo"**.
