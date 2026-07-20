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

---

## BUG-004 — Página **Configurações** quebrava por inteiro (efeito devolvendo Promise)
- **Status:** 🟢 corrigido
- **Severidade:** **ALTA** — a página não renderizava **nada**, e é onde o usuário troca a própria senha e edita o perfil
- **Módulo/rota:** `/configuracoes` — `apps/web/src/features/configuracoes/ConfiguracoesPage.tsx:333`
- **Perfil/viewport:** todos os perfis · todos os viewports
- **Reprodução:**
  1. Logar (qualquer perfil) e abrir **Configurações** (menu do usuário, rodapé da barra lateral).
  2. A área de conteúdo aparece **em branco** (`main.innerText.length === 0`).
  3. No console: `TypeError: destroy is not a function` + o aviso do React
     *"must not return anything besides a function, which is used for clean-up"*.
- **Causa:** `useEffect(() => window.scrollTo(0, 0), [])`. O arrow function **sem bloco** devolve
  implicitamente o retorno de `scrollTo` — que **nos Chrome atuais é uma `Promise`** (confirmado
  ao vivo: `window.scrollTo(0,0) instanceof Promise === true`). O React trata esse retorno como a
  função de limpeza do efeito, chama-o na desmontagem, estoura `destroy is not a function` e o
  ErrorBoundary derruba a página. Só aparece em navegador que já devolve Promise — por isso passou.
- **Solução:** corpo em **bloco**, para o efeito não devolver nada:
  `useEffect(() => { window.scrollTo(0, 0); }, []);`
- **Regressão:** `e2e/flows-erros-ux.spec.ts` — abre `/configuracoes`, exige o H1 **e** o conteúdo
  real das seções, e falha se qualquer `pageerror` ou `destroy is not a function` aparecer.
- **Revalidação manual:** ao vivo, `main` foi de **0 → 2.217 caracteres**; perfil, foto, senha e
  preferências de e-mail todos visíveis.
- **Observação:** o mesmo padrão existe em `autocomplete.tsx:51` e `combobox.tsx:71`
  (`useEffect(() => setActive(…), […])`), mas ali é seguro — `setState` do React retorna
  `undefined` por contrato. Não mexi (mudança cirúrgica).

---

## BUG-005 — Título da aba duplicava a marca na página 404
- **Status:** 🟢 corrigido
- **Severidade:** baixa (cosmético, visível na aba do navegador)
- **Módulo/rota:** qualquer rota inexistente — `apps/web/src/components/layout/AppLayout.tsx:333`
- **Reprodução:** abrir `/formularios` (rota aposentada pelo ADR-52) ou qualquer URL inválida →
  a aba mostrava **"MedConsultoria · MedConsultoria"**.
- **Causa:** o fallback de `usePageTitle()` já devolve `"MedConsultoria"`, e o `document.title`
  concatenava `· MedConsultoria` por cima. Só o caso `"Início"` era tratado.
- **Solução:** tratar também o fallback como "sem título próprio" → a aba fica só `MedConsultoria`.
- **Regressão:** `e2e/flows-erros-ux.spec.ts` — `await expect(page).toHaveTitle("MedConsultoria")`
  no teste de rota inexistente.

---

## BUG-006 — Login: erro não revelava que o navegador havia preenchido outra conta
- **Status:** 🟢 corrigido
- **Severidade:** média (bloqueia o acesso na prática, embora a autenticação esteja correta)
- **Módulo/rota:** `/login` — `apps/web/src/features/auth/LoginPage.tsx`
- **Relato do dono:** *"Os acessos root e admin não estão funcionando."*
- **Reprodução:**
  1. Ter uma conta antiga salva no gerenciador de senhas do navegador (aqui:
     `cliente@medconsultoria.com.br`, removida pela limpeza de 20/07).
  2. Abrir `/login` — o Chrome **autopreenche** e-mail e senha dessa conta.
  3. Clicar **Entrar** sem reparar no campo → **"E-mail ou senha incorretos"**.
  4. A pessoa jura que digitou o e-mail certo e conclui que "o acesso não funciona".
- **Diagnóstico:** a autenticação **estava correta** o tempo todo — verificado por três caminhos:
  API direta (`/trpc/auth.login` → 200 para ROOT e ADMIN), pelo proxy do front (200 + `Set-Cookie`)
  e pelo **formulário no navegador** (ROOT caiu em "Boa tarde, Root 👋" com o menu Sistema).
  Também descartado throttle de brute-force (é por IP+e-mail, e o contador zera no restart).
- **Causa da confusão:** a mensagem de erro não dizia **qual e-mail** foi enviado. Como o campo
  autopreenchido não chama atenção, não havia como perceber a troca.
- **Solução (2 frentes):**
  1. o erro passa a mostrar o e-mail tentado — *"Tentamos entrar com `X` — confira se é mesmo o
     seu e-mail (o navegador pode ter preenchido outro)"*;
  2. novo comando **`pnpm acessos`** (`scripts/verificar-acessos.ts`): testa o login real de cada
     conta contra a API no ar e imprime o motivo exato de cada falha (inativa, sem senha, senha
     trocada, bloqueio por tentativas).
- **Regressão:** `e2e/auth-flows.spec.ts` — o alerta precisa conter o e-mail tentado e o aviso
  sobre o navegador.
- **Nota:** não há credencial fixa no código do login (`useForm` sem `defaultValues`); o
  preenchimento vem 100% do gerenciador de senhas do navegador.

---

## BUG-007 — Não dava para trocar de conta: `/login` redirecionava em silêncio
- **Status:** 🟢 corrigido
- **Severidade:** **ALTA** — impedia o acesso a uma segunda conta; foi o que travou o dono
- **Módulo/rota:** `/login` com sessão ativa — `apps/web/src/app/router.tsx`
- **Relato do dono:** *"Testei os acessos. Somente o root funcionou (e em janela anônima)."*
- **Reprodução:**
  1. Entrar como **ROOT** (por exemplo numa janela anônima).
  2. Querer entrar como **ADMIN**: navegar para `/login`.
  3. A app **redireciona para `/`** sem dizer nada — o formulário nunca aparece.
  4. Você continua no painel logado como ROOT e conclui que **o ADMIN não funciona**.
- **Diagnóstico:** o ADMIN sempre esteve correto. Verificado por quatro caminhos: API direta
  (200), proxy do front (200 + `Set-Cookie`), formulário no navegador, e `auth.me` retornando
  `Thaís Garcia <thais.garcia@medconsultoria.com.br> ADMIN` com o painel renderizando
  "Boa tarde, Thaís 👋". Também descartadas variações de digitação: maiúsculas e espaços em volta
  **entram** (o schema faz `trim`+`toLowerCase`); só o acento (`thaís.garcia@`) é recusado, mas com
  a mensagem clara "E-mail inválido".
- **Causa:** `beforeLoad: () => { throw redirect({ to: "/" }) }` na rota `/login`. Trocar de conta
  exigia achar o botão "Sair" no rodapé da barra lateral — não havia caminho pelo `/login`.
- **Solução:** a rota passa a renderizar **`JaConectadoPage`**: mostra **quem** está conectado
  (nome, e-mail e papel, sem truncar) e oferece **"Continuar como X"** ou **"Entrar com outra
  conta"** (que faz logout e devolve o formulário). Junto: ao entrar estando em `/login`, a URL
  vira `/` antes de a sessão existir — senão o login caía na própria tela de "já conectado" em vez
  do painel.
- **Regressão:** `e2e/auth-flows.spec.ts` — `/login` autenticado não pode redirecionar, precisa
  identificar o usuário, e o fluxo completo (trocar → entrar → painel) é exercido ponta a ponta.
- **Revalidação manual:** ao vivo, ADMIN → "Entrar com outra conta" → ROOT → painel; e o inverso.

---

## BUG-008 — Login enviava o que o React lembrava, não o que estava na tela (autofill)
- **Status:** 🟢 corrigido
- **Severidade:** **CRÍTICA** — impedia o login de **todas** as contas
- **Módulo/rota:** `/login` e demais formulários de autenticação
- **Relato do dono:** *"não está entrando nem admin e nem root (mensagem diz: E-mail inválido)"*
- **Reprodução (provada ao vivo):**
  1. Abrir `/login` com credenciais salvas no navegador.
  2. O Chrome autopreenche escrevendo **direto no DOM**, sem disparar o evento de input.
  3. Clicar **Entrar** com os campos **visivelmente corretos** na tela.
  4. Resultado: **"E-mail inválido"** (React tinha string vazia) ou **"E-mail ou senha
     incorretos"** com o e-mail de uma tentativa anterior.
- **Prova:** simulando o autofill (setter nativo, sem `dispatchEvent`), o campo mostrava
  `root@medconsultoria.com.br` e o formulário **enviou `cliente@medconsultoria.com.br`** —
  o valor que o `react-hook-form` guardava.
- **Causa:** o `react-hook-form` monta seu estado a partir dos eventos de input. O autofill do
  Chrome não os dispara, então o estado do React e o DOM divergem — e o `handleSubmit` valida e
  envia o **estado**, não a tela.
- **Solução:** helper `apps/web/src/lib/form-autofill.ts::sincronizarAutofill(evento, setValue,
  campos)`, chamado no `onSubmit` **antes** do `handleSubmit`: lê os inputs pelo `name` dentro do
  próprio formulário e reconcilia o estado com o DOM. Aplicado em **Login**, **Esqueci minha
  senha**, **Definir senha** (convite) e **Redefinir senha** — todos com campos que o navegador
  autopreenche.
- **Regressão:** `e2e/auth-flows.spec.ts` — dois testes que reproduzem o autofill (setter nativo,
  sem evento) para ROOT e ADMIN e exigem que o login **conclua sem alerta**.
- **Revalidação manual:** ao vivo, mesma simulação → entra como **Root (ROOT)** e como
  **Thaís Garcia (ADMIN)**, caindo no painel.
