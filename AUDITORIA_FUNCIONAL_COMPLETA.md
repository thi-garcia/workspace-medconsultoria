# AUDITORIA FUNCIONAL COMPLETA — Workspace MedConsultoria

> Rastreador **vivo** da validação funcional real (UI + fluxos completos via Playwright),
> por perfil e por viewport. Complementa o `AUDITORIA_INICIAL_PROJETO.md` (auditoria estática).
> **Regra:** um item só é APROVADO com **evidência** do teste executado (não basta a página carregar).

**Início:** 2026-07-17 · **Responsável técnico:** condução autônoma (Claude) · **Branch base:** `main` @ `de71e07`

---

## Legenda de estados

| Estado | Significado |
|--------|-------------|
| ⬜ **NÃO TESTADO** | ainda não exercido |
| 🟨 **EM TESTE** | em execução/parcial |
| ✅ **APROVADO** | fluxo completo exercido com evidência |
| ❌ **REPROVADO** | defeito reproduzido (vira item de correção) |
| ⛔ **BLOQUEADO** | não testável agora (dependência/pré-requisito) |

**Evidência** = ação executada + resultado observado (screenshot, resposta HTTP, estado após refresh). Registrada na coluna/nota do item.

---

## Perfis validados

| Perfil | Onde atua | Acesso |
|--------|-----------|--------|
| **ROOT** | App interno + painel Sistema | tudo, incl. `/sistema` |
| **ADMIN** | App interno | tudo exceto `/sistema` (ROOT) |
| **FUNCIONARIO** | App interno | operação; **sem** Financeiro/Serviços/Equipe/Ajustes/E-mails/Sistema |
| **CLIENTE** | Portal do Cliente | só o próprio Portal; bloqueado nas rotas internas |

`Role` (enum Prisma): `ROOT · ADMIN · FUNCIONARIO · CLIENTE`. Hierarquia estrita.

## Viewports validados

- **Desktop** (referência 1920×1080)
- **Tablet 768×1024**
- **Celular 390×844**
- **Celular 360×800**

---

## 1. Inventário de rotas internas (equipe) + RBAC de rota

Fonte: `apps/web/src/app/router.tsx` (guards `RoleGuard`). "Equipe" = ROOT/ADMIN/FUNCIONARIO (CLIENTE é redirecionado ao Portal).

| # | Rota | Página (menu) | Papel mínimo | Estado |
|---|------|---------------|--------------|--------|
| 1 | `/` | Início (Dashboard) | equipe | ⬜ |
| 2 | `/clientes` | Clientes (lista) | equipe | ⬜ |
| 3 | `/clientes/$id` | Cliente (ficha) | equipe | ⬜ |
| 4 | `/leads` | Vendas (Funil) | equipe | ⬜ |
| 5 | `/servicos` | Serviços | **ADMIN** | ⬜ |
| 6 | `/projetos` | Projetos (lista) | equipe | ⬜ |
| 7 | `/projetos/$id` | Projeto (quadro) | equipe | ⬜ |
| 8 | `/agenda` | Agenda | equipe | ⬜ |
| 9 | `/financeiro` | Financeiro | **ADMIN** | ⬜ |
| 10 | `/mensagens` | Mensagens | equipe | ⬜ |
| 11 | `/documentos` | Documentos | equipe | ⬜ |
| 12 | `/documentos/$id` | Documento (detalhe) | equipe | ⬜ |
| 13 | `/modelos` | Modelos | **ADMIN** | ⬜ |
| 14 | `/modelos/$id` | Modelo (detalhe) | **ADMIN** | ⬜ |
| 15 | `/configuracoes` | Configurações (perfil) | equipe | ⬜ |
| 16 | `/usuarios` | Equipe (Usuários) | **ADMIN** | ⬜ |
| 17 | `/emails` | E-mails (admin) | **ADMIN** | ⬜ |
| 18 | `/emails-enviados` | Monitor de e-mails | **ADMIN** | ⬜ |
| 19 | `/ajustes` | Ajustes | **ADMIN** | ⬜ |
| 20 | `/sistema` | Sistema | **ROOT** | ⬜ |
| — | `/login` | (redireciona p/ `/` se logado) | — | ⬜ |

## 2. Sub-abas e seções por página (detalhe)

Fonte: `apps/web/src/components/layout/AppLayout.tsx` (`NAV_GROUPS`) + páginas em `features/`.

**Menu (sidebar)** — 2 grupos:
- **Dia a dia:** Início `/` · Vendas `/leads` · Clientes `/clientes` · Projetos `/projetos` · Agenda `/agenda` · Mensagens `/mensagens` · Documentos `/documentos` · Financeiro `/financeiro` (ADMIN)
- **Configuração:** Ajustes `/ajustes` (ADMIN) · Sistema `/sistema` (ROOT)
- **Ocultas do menu** (acessíveis via Ajustes/fichas, "iluminam" Ajustes): `/servicos`, `/modelos`, `/emails`, `/emails-enviados`, `/usuarios`, `/configuracoes`.
- Header: busca global/Command Palette (Ctrl/⌘K, com IA quando disponível), sino de notificações, Guia (`?`), menu do usuário, recolher sidebar, breadcrumbs.

| Página | Sub-abas / seções | Ações-chave |
|--------|-------------------|-------------|
| **Início** | grid de widgets configurável ("Meu dia" / "Gestão"); "Personalizar" | Ações rápidas, chips de atenção, plano do dia (IA), KPIs, listas |
| **Vendas (Funil)** | Kanban por etapas dinâmicas | Novo lead, painel do lead (editar/converter/perdido/Portal), **Origens** (diálogo staging, ADMIN), **Perdidos** (reabrir), Link de captação |
| **Clientes** | lista Cards↔Tabela; filtros Todos/Ativos/Inativos + responsável + busca | Novo cliente, Enviar acesso Portal, abrir ficha |
| **Cliente (ficha)** | seções empilhadas (não abas): Serviços, Suporte, Projetos, Documentos Med, Documentos do cliente, Anotações + sidebar (Ficha/Contatos/Financeiro[ADMIN]/E-mails) | Resumir IA, Nova oportunidade, Editar/Remover/Ativar-Desativar |
| **Serviços** (ADMIN) | lista por categoria (drag) | **Configurar** → modal 4 abas (ver §2.1) |
| **Projetos** | lista Cards↔Tabela; filtros status+responsável | Novo projeto, editar/remover |
| **Projeto (quadro)** | Kanban de cartões (5 status), drag | Novo cartão, Participantes, `CardPanel` (checklist/comentário/timer) |
| **Agenda** | modos Lista/Dia/Semana/Mês/Ano; filtros escopo/tipo/responsável | Novo evento, editar/remover, banner de conflito, Resumo IA |
| **Financeiro** (ADMIN) | carteira Empresa/Pessoal/Tudo; abas A receber/A pagar | **Categorias** (diálogo staging), Nova conta, marcar paga, editar/remover |
| **Mensagens** | categorias Todas/Direta/Grupo/Cliente/Lead; Ativas↔Histórico | Nova conversa, resolver/reabrir chamado, fixar/silenciar/arquivar/apagar, editar msg |
| **Documentos** | faixa "Precisa de atenção"; filtros cliente/tipo/situação | Novo documento (`NovoDocumentoDialog`) |
| **Documento (detalhe)** | fluxo Rascunho→Revisão→Aprovado→Enviado; cards por tipo | Assinaturas/Aceite (conforme tipo), Melhorar IA, exportar PDF/Word |
| **Modelos** (ADMIN) | grupos por finalidade; briefings à parte | Novo modelo/briefing, editar perguntas |
| **Modelo (detalhe)** (ADMIN) | editor + preview A4 | Salvar/Remover |
| **Configurações (perfil)** | cards: Perfil, Senha, Notificações, Meus e-mails | trocar senha, toggles |
| **Equipe/Usuários** (ADMIN) | tabela única | Convidar, editar, excluir (com reatribuição), reenviar convite |
| **E-mails (admin)** | abas Transacionais/Notificações/Sistema | Salvar template, Enviar teste, Restaurar padrão, prévia ao vivo |
| **Monitor de e-mails** (ADMIN) | KPIs + filtros status/tipo/período | Carregar mais |
| **Ajustes** | **hub raso** de atalhos: Automações (Serviços/Modelos/E-mails) + Administração (Equipe/E-mails enviados) | — (só navegação) |
| **Sistema** (ROOT) | **8 abas**: Visão geral, Incidentes, Desempenho, Banco, Erros, Sessões, Atividade, Manutenção | Diagnóstico IA, varredura, resolver/revogar |

### 2.1 `Serviços > Configurar` (foco do dono) e o padrão de Salvar/Cancelar
Modal `ServicoConfigDialog` (`ServicosPage.tsx`) tem **4 abas**: **Detalhes**, **Para vender** (passos), **O cliente envia** (exigências), **A equipe faz** (roteiro). ✅ **CORRIGIDO (Bloco 1a, PR #4):** Detalhes e Roteiro agora têm **Cancelar** + **Salvar** desabilitado sem mudança; trocar de aba/fechar com pendência **pede confirmação** ("Descartar alterações?"); rodapé **"Concluído" → "Fechar"**. Passos/Exigências seguem auto-save. Elimina a perda silenciosa de dados.

### 2.2 Achado de organização (UX) — descoberta de catálogos
"Categorias", "Origens" e "Operadoras" **não estão em Ajustes**: Categorias vive dentro de `/financeiro`, Origens dentro de `/leads`, Operadoras só no fluxo de proposta de credenciamento em Documentos (sem entrada no menu). Um usuário que procure "onde configuro Categorias/Origens/Operadoras" **não acha em Ajustes**. → gap de organização (§8).

## 3. Portal do Cliente + telas públicas/auth

> _Em levantamento (explorador do Portal). Incluirá: telas/abas do Portal, ações do CLIENTE
> (documentos, aceite de proposta, briefing, suporte, upload, editar perfil, cancelar/retomar
> serviço), login/logout, definir senha (convite), reset de senha, páginas com token (proposta/aceite)._ ⏳

## 4. Matriz RBAC real (backend)

Fonte: `apps/api/src/trpc/trpc.ts` + `apps/api/src/modules/*/*.router.ts`. Hierarquia (`packages/shared`): `CLIENTE(0) < FUNCIONARIO(1) < ADMIN(2) < ROOT(3)`.

**Procedures:** `publicProcedure` (nada) · `protectedProcedure` (logado, qualquer role, só sobre si) · `funcionarioProcedure` (≥FUNCIONARIO, exclui CLIENTE) · `adminProcedure` (≥ADMIN) · `rootProcedure` (ROOT) · `portalProcedure` (só CLIENTE, `clienteId` da sessão).

| Módulo | Nível predominante | Notas |
|--------|--------------------|-------|
| agenda, busca, cards, dashboard, pipeline, projetos | FUNCIONARIO | operação da equipe |
| clientes | FUNCIONARIO | inclui `remove` e `removerArquivo` (⚠️ ver §4.1) |
| documentos (docs+modelos+operadoras) | FUNCIONARIO | inclui `modelos.remove`/`operadoras.remover` (⚠️) |
| leads | FUNCIONARIO (+ `capturar` público) | captação pública do site |
| mensagens | FUNCIONARIO + checagem fina no service | defesa em profundidade (participante/criador/admin) ✅ |
| ia | FUNCIONARIO; `diagnostico/explicar*` ROOT | |
| servicos | **ADMIN** (+ `publicos` público, `ativos` FUNCIONARIO) | catálogo |
| origens, formularios | **ADMIN** (+ leitura FUNCIONARIO) | catálogo |
| financeiro | **ADMIN** (tudo, incl. leitura) | carteira Pessoal isolada por dono ✅ (mais rígido) |
| emails (templates) | **ADMIN** | |
| enviados | `meus` protected · `doLead/doCliente` FUNCIONARIO · `resumo/todos` ADMIN | |
| usuarios | **ADMIN** (+ `equipe` FUNCIONARIO) | edita a si/abaixo; exclui só abaixo |
| sistema | **ROOT** | painel de operação/dev |
| auth | público (+ `updateProfile/changePassword` protected) | throttle de brute force, anti-enumeração |
| assinaturas, propostas | FUNCIONARIO + **público por token** | página de assinatura/aceite |
| notificacoes | protected (inclui CLIENTE) | escopado a `ctx.user.id` |
| portal | **portalProcedure** (só CLIENTE) | isolado por `ctx.clienteId` da sessão ✅ |
| uploads (REST, fora do tRPC) | sessão; CLIENTE só o próprio arquivo | `/upload`, `/arquivos/:id`, `/transcrever`, `/avatar` |

### 4.1 Inconsistências de RBAC a decidir (não são bugs de segurança evidentes — são **decisões de produto**)
1. ⚠️ **`clientes.remove` / `clientes.removerArquivo` = FUNCIONARIO**: qualquer funcionário apaga cadastro/arquivos de qualquer cliente (dado sensível/LGPD), sem exigir ADMIN nem 2ª aprovação. `usuarios.remove` e `financeiro.*` exigem ADMIN. → **confirmar com o dono** se é intencional (CRM operado por toda a equipe) ou se deve subir para ADMIN.
2. ⚠️ **`documentos.modelos.remove` / `documentos.operadoras.remover` = FUNCIONARIO**, enquanto catálogos equivalentes (`servicos`/`origens`/`formularios`) exigem ADMIN. → alinhar limiar (subir p/ ADMIN) ou documentar a exceção.
3. ℹ️ **`POST /upload` (REST)** reimplementa a checagem de role manualmente (não reusa `funcionarioProcedure`); aceita `clienteId` arbitrário da equipe. Risco baixo hoje, mas fora do padrão central — se a hierarquia mudar, este arquivo não acompanha.
4. ℹ️ **`cards.removeComentario`** passa a autorização como booleano do router ao service — padrão diferente do resto (autorização na procedure ou 100% no service).

**Nenhuma rota mutável exposta como pública indevidamente** — as públicas são as esperadas (login/reset, captura, aceite/assinatura por token, catálogo público). ✅

## 5. Checklist de validação por perfil (a exercer em cada viewport)

Para **cada perfil** (ROOT, ADMIN, FUNCIONARIO, CLIENTE) e **cada viewport**:

- [ ] login e logout
- [ ] permissões: acesso permitido **e** acesso negado (URL direta)
- [ ] menus e navegação
- [ ] criação · visualização · edição · exclusão (CRUD)
- [ ] busca · filtros · paginação
- [ ] uploads · downloads
- [ ] mensagens · notificações
- [ ] erros · estados vazios
- [ ] persistência após refresh
- [ ] responsividade (sem overflow, controles acessíveis)

_Matriz detalhada (perfil × módulo × estado) será montada após o inventário das seções §2–§4._

---

## 6. Estratégia de dados e ambientes (auditoria)

Fonte: `packages/db/prisma/{seed.ts,demo-seed.ts}`, `.github/workflows/ci.yml`, `docs/DEPLOY.md`, `e2e/`.

### 6.1 Classificação das origens de dados

| # | Categoria | Origem | Vai p/ produção? |
|---|-----------|--------|------------------|
| 1 | **Fixtures de teste** | `e2e/.auth/*.json`, `e2e/fixtures-helper.ts`, setup `seed fixtures` | ❌ nunca (banco de teste isolado) |
| 2 | **Seed de dev/base** | `seed.ts` → **só cria o usuário ROOT** (de `SEED_ROOT_*`, idempotente) | ✅ necessário (1º ROOT, passo manual) |
| 3 | **Dados demonstrativos** | `demo-seed.ts` (`pnpm db:demo`): equipe fictícia (Thaís ADMIN, "Funcionário Exemplo"), estágios do funil, clientes/leads/eventos/contas de exemplo, 1 usuário de Portal `cliente@medconsultoria.com.br` | ❌ **não** rodar em produção |
| 4 | **Hardcoded (front/back)** | _em levantamento (§7 inventário de conteúdo)_ | varia |
| 5 | **Dados atuais do banco local (dev)** | banco de dev com dados de teste **acumulados** (contagem 2026-07-17): 21 users (1 ROOT · 1 ADMIN · 4 FUNCIONARIO · 15 CLIENTE), 24 clientes, 56 leads, 13 projetos, 104 cards, 33 documentos, 19 modelos, 12 serviços, 46 eventos, 70 contas, 31 conversas, 62 mensagens, 27 formulários, 253 e-mails registrados, 5 estágios de funil | ❌ é dev, não prod |

### 6.2 Isolamento de banco — estado atual

- ✅ **Testes/CI usam banco isolado**: `medconsultoria_test` (Vitest deriva `_test`; CI cria e migra o `_test` à parte). Confirmado nesta fase.
- ✅ **Demo NÃO roda automaticamente**: `demo-seed` é invocado só no **CI** (banco isolado) e manualmente (`pnpm db:demo`). O **deploy** (`deploy.sh`) roda **apenas** `prisma migrate deploy` — sem seed/demo. `docs/DEPLOY.md` instrui explicitamente a **não** rodar demo em produção.
- ⛔ **Homologação com banco próprio**: _a definir_ (ainda não há ambiente de homologação configurado).
- ⛔ **Produção com banco próprio**: _a definir na fase de deploy_ (fora do escopo desta fase, por instrução).

### 6.3 Ponto de atenção identificado

- ⚠️ **Estágios do funil (`PipelineStage`) nascem no `demo-seed`, não no `seed.ts`.** Num banco "limpo" para uso real (só ROOT), o funil de Vendas pode ficar **sem colunas**. Antes de preparar um banco real, é preciso separar "config essencial" (estágios do funil, categorias, catálogo de serviços reais) de "dados de exemplo" (clientes/leads Acme). → vira item do plano.

### 6.4 Estratégia segura de limpeza de demo (a apresentar antes de executar)

> **Nenhuma limpeza destrutiva será executada sem plano aprovado.** Rascunho da abordagem:
> 1. **Marcar** dados demo na origem (ex.: flag/prefixo/`origem="DEMO"`) para remoção seletiva — em vez de `TRUNCATE`.
> 2. Script `db:demo:clean` **idempotente e reversível** que remove só o que o `demo-seed` cria (por e-mails/ids conhecidos), preservando estrutura, migrations e config essencial.
> 3. **Nunca** tocar em fixtures de teste nem no banco de teste.
> 4. Rodar só contra dev/homologação, com dump de segurança antes.
> _(Detalhamento e aprovação em etapa própria.)_

---

## 7. Inventário de conteúdo (textos/dados visíveis)

Varredura de `apps/web/src` (interno + Portal + auth/públicas) por lorem ipsum, TODO/FIXME, "em breve/construção", botões sem ação, telas-esqueleto.

**Resultado geral: nenhum texto de preenchimento (lorem ipsum), nenhum botão sem ação, nenhuma tela "em construção"/stub encontrados** nas telas revisadas. Os textos de produto estão finalizados em PT-BR, com estados de carregamento/erro/vazio e feedback de sucesso. Os únicos "placeholders" são **exemplos de formato em campos de formulário** (UX normal, não bug): `voce@medconsultoria.com.br` (Login/Esqueci senha), `voce@exemplo.com.br` (editar perfil no Portal), `voce@email.com` (captura de lead).

**O "conteúdo fictício" real do sistema é o conjunto de DADOS DEMO** (não texto de UI hardcoded), que só aparece se `pnpm db:demo` for rodado:
- Equipe demo: **Thaís** (`thais.garcia@medconsultoria.com.br`, ADMIN) e **"Funcionário Exemplo"** (`func@medconsultoria.com.br`), senha `medconsultoria123`.
- Cliente de Portal demo: `cliente@medconsultoria.com.br`.
- Clientes/leads/eventos/contas de exemplo (ex.: "Acme").
→ Removível com segurança (§6.4). **Não** é texto embutido no código.

### 7.1 Correções automáticas (farei sem pedir; sem inventar conteúdo real)
Erros de português · inconsistências de nomenclatura · textos técnicos inadequados expostos ao usuário · mensagens de erro pouco claras · problemas objetivos de UX (ex.: o Salvar/Cancelar do §2.1). _Itens concretos serão listados aqui à medida que a validação por tela (§5) os encontrar._

## 7.2 Conteúdo real necessário

> **Nada aqui pode ser inventado** — depende de informação real da MedConsultoria, fornecida por você/Thaís. Enquanto não vier, seguem os dados **demo isolados** (não substituídos, fixtures preservadas). Lista expandida à medida que a validação (§5) revela campos que exibem dados reais.

- **Identidade institucional:** razão social, CNPJ, endereço, telefone(s) oficiais, e-mail público de contato, site, logotipo definitivo — usados em contratos/propostas/recibos/rodapés e assinatura de e-mails.
- **Equipe e usuários:** nome, e-mail e papel de cada pessoa real da equipe (substitui a equipe demo Thaís/Funcionário Exemplo). Quem é ROOT/ADMIN/FUNCIONARIO.
- **Serviços e subserviços:** catálogo oficial (nomes, descrições, preços de referência, recorrência, cláusulas de contrato por serviço). Hoje há 12 no dev (real + teste misturados).
- **Operadoras:** lista real de operadoras/convênios para o credenciamento.
- **Hospitais:** se o negócio credencia junto a hospitais, a lista oficial (hoje **não há** catálogo de hospitais no sistema — confirmar se é necessário criar).
- **Categorias e origens:** categorias financeiras padrão (Empresa/Pessoal) e origens de lead reais (canais de aquisição da Med).
- **Modelos de documentos:** texto final oficial de Contrato, Proposta, Escopo, Recibo, Onboarding, Ata, Pauta, etc. (19 modelos atuais precisam de revisão de conteúdo).
- **Modelos de e-mails / Mensagens automáticas:** revisão dos textos dos e-mails transacionais e avisos (assunto/corpo/assinatura), e confirmação do remetente/assinatura padrão.
- **Formulários e briefings:** perguntas oficiais dos briefings por serviço (hoje há exemplos de teste).
- **Informações jurídicas e de privacidade:** texto de LGPD/privacidade, cláusulas jurídicas padrão, política de tratamento de dados, termos de aceite — para Portal, contratos e páginas públicas.
- **Estágios do funil:** confirmar nomes/cores oficiais (hoje: Novo/Qualificação/Proposta/Negociação/Fechado, vindos do demo-seed).

---

---

## 8. Plano de execução (blocos)

Cada bloco: escopo → correção → teste de regressão (quando aplicável) → `lint`/`typecheck`/`test`/`build` → commit → push → **CI real verde** → segue. PRs separados por bloco.

### Bloco 1 — UX de CRUD: Salvar/Cancelar impecável _(prioridade do dono; começo por aqui)_
Alvo P0 primeiro (risco de **perda silenciosa de dados**):
- **P0a** `ServicoConfigDialog` (`ServicosPage.tsx`): abas **Detalhes** e **Roteiro** perdem edição ao trocar de aba/fechar sem salvar. → mover Salvar para o rodapé fixo do `Modal`, adicionar **Cancelar/Descartar**, rastrear `dirty`, e **confirmar via `useConfirm()`** antes de trocar de aba/fechar com pendências.
- **P0b** Botão **"Concluído"** ambíguo → "Fechar"/"Salvar e fechar" conforme estado (não sugerir "salvo" quando há pendência).
- **P1** `EmailsAdminPage.tsx`: adicionar **Cancelar/Descartar** edição de template (padrão `isDirty` de `ConfiguracoesPage`).
- **P2** Padronizar rótulo de fechar-sem-salvar em todo o app (reservar "Concluído" só para diálogos 100% auto-save).
- **Regressão:** specs Playwright que editam Detalhes/Roteiro, trocam de aba e conferem que os dados **não** se perdem (ou que há confirmação).

### Bloco 2 — Organização/descoberta em Ajustes _(UX)_
- Expor **Categorias**, **Origens** e **Operadoras** dentro de **Ajustes** (hoje só em Financeiro/Vendas/Documentos), mantendo os atalhos contextuais. Deixa o "onde configuro X" óbvio.

### Bloco 3 — Validação funcional ao vivo (Playwright), por perfil × viewport
O grosso da fase. Sub-blocos por módulo (Início, Vendas, Clientes/Ficha, Serviços, Projetos, Agenda, Financeiro, Mensagens, Documentos/Modelos, Configurações, Equipe, E-mails, Sistema, Portal, Auth/públicas). Para cada: os 4 perfis, os 4 viewports, e os itens do checklist §5 (CRUD real, filtros, uploads/downloads, permissões negadas por URL, persistência após refresh, estados vazios/erro). Cada tela vira uma linha rastreada (§1/§2) com estado + evidência. Defeitos encontrados → ciclo de correção (§ "Correções e regressões").

### Bloco 4 — Decisões de RBAC _(requer seu aval — §4.1)_
Confirmar com o dono: `clientes.remove`/`removerArquivo` e `documentos.modelos.remove`/`operadoras.remover` devem exigir **ADMIN**? Após decisão, alinhar limiares + testes de RBAC.

### Bloco 5 — Estratégia de dados e banco limpo _(plano antes de qualquer execução destrutiva)_
- Separar **config essencial** (estágios do funil, catálogo real de serviços, categorias/operadoras oficiais) de **dados de exemplo**.
- Criar `db:demo:clean` **idempotente e reversível** (remove só o que o `demo-seed` cria, por e-mails/ids conhecidos), sem tocar em fixtures/estrutura.
- Garantir **bootstrap de banco limpo** para uso real (ROOT + config essencial, sem clientes demo).
- **Nada executado destrutivamente sem plano aprovado** (limite obrigatório).

### Bloco 6 — Conteúdo
- Aplicar correções automáticas (§7.1) encontradas na validação.
- Consolidar a lista de conteúdo real a fornecer (§7.2) e substituir dados demo por reais **quando você fornecer**.

**Ordem sugerida:** 1 → 2 → 3 (contínuo) → 4/5/6 conforme dependências e seus insumos.

---

## 9. Estado dos blocos

| Bloco | Descrição | Estado |
|-------|-----------|--------|
| 0 | Merge PR #2 + CI verde na main | ✅ APROVADO (`de71e07`) |
| 0 | Inventário (rotas, nav, Portal, RBAC, dados) + este documento | ✅ APROVADO (PR #3) |
| 1a | **Serviços → Configurar: Salvar/Cancelar sem perda silenciosa** | ✅ **APROVADO** (PR #4, `cd645ad`) |
| 1b | **`EmailsAdminPage`: Cancelar + aviso antes de descartar edição** | ✅ **APROVADO** (PR #6) |
| 1c | P2 padronizar rótulo fechar-sem-salvar | ✅ resolvido no 1a (único ofensor real era Serviços; "Concluído" restante é auto-save, correto) |
| 2 | **Descoberta de catálogos em Ajustes (Categorias/Origens/Operadoras)** | ✅ **APROVADO** (PR #7) |
| 3 | Validação funcional ao vivo (perfil × viewport) | 🟨 EM ANDAMENTO |
| 4 | **RBAC de exclusão/administração (clientes/arquivos/modelos/operadoras)** | ✅ **APROVADO** (PR #9, backend + 11 testes) |
| 5 | Estratégia de dados / banco limpo | ⬜ plano a apresentar |
| 6 | Conteúdo real | 🟨 seção §7.2 mantida e estruturada; aguarda insumos do dono/Thaís |

### Bloco 4 — regras de RBAC aplicadas (decisões do dono, 2026-07-17)
Implementado **no backend** (não só escondendo botões) + testes `apps/api/src/test/rbac-permissoes.integration.test.ts` (11):
- **Clientes:** arquivar (soft-delete lógico) e desativar = **ADMIN+**; **excluir definitivo** (físico) = **ROOT**, e **bloqueado se houver vínculos** (projetos/documentos/financeiro/serviços/agenda/acessos/arquivos/conversas/respostas/leads) → preserva histórico. FUNCIONARIO não arquiva/desativa/exclui.
- **Arquivos:** remover = **ADMIN+** (soft-delete + `activityLog` de quem removeu e quando); FUNCIONARIO envia/atualiza, não exclui.
- **Modelos:** administrar (criar/editar/remover) = **ADMIN+**; FUNCIONARIO usa (list/get).
- **Operadoras:** administrar = **ADMIN+**; FUNCIONARIO consulta (list).
- **Frontend alinhado:** botões Arquivar/Desativar (ficha) e Excluir-arquivo (ficha + cards) ocultos para FUNCIONARIO; rótulo "Remover cliente" → "Arquivar" (texto honesto: preserva histórico).
- Testes cobrem: acesso permitido, acesso negado, **tentativa direta pela API** (`createCaller`), preservação de dados vinculados e comportamento de arquivamento/inativação.

### Bloco 3 — validação ao vivo (em andamento)
Método: dirigir o app real no navegador (Playwright/MCP) por perfil × viewport, além da suíte E2E (62+ testes) como espinha dorsal reproduzível. Cada tela → estado + evidência.

**Já validado ao vivo (2026-07-17):**

*ROOT · desktop 1920×1080*
- **Início/Dashboard:** carrega completo — widgets "Meu dia" + "Gestão da empresa" (Saúde do sistema, Financeiro, Funil, Projetos, Carga da equipe, Clientes, Docs em revisão, Atividade). ✅
- **Ajustes → "Catálogos" (Bloco 2):** 3 cards novos consistentes; screenshot conferido. ✅
- **Serviços → Configurar → Detalhes (Bloco 1a):** ao abrir sem edição → `Salvar` **disabled**, `Cancelar` **disabled**, `Fechar` ok. ✅
- **Vendas (Funil):** KPIs, busca, filtro por responsável, Kanban 5 etapas, estados vazios, ações por card. Modal **Novo lead** abre completo; **validação de obrigatório** ("Informe o nome") confirmada ao clicar Criar vazio. ✅

*FUNCIONARIO · desktop (validação de RBAC — Bloco 4)*
- **Menu:** só Início/Vendas/Clientes/Projetos/Agenda/Mensagens/Documentos — **sem Financeiro/Ajustes/Sistema**. ✅
- **/financeiro por URL direta → "Acesso restrito"** (RoleGuard), sem vazar conteúdo. ✅
- **Ficha do cliente:** **sem** botões Arquivar/Desativar (só Resumir IA/Nova oportunidade/Editar). ✅
- **API direta** (`clientes.remove`/`setAtivo`) → **403 FORBIDDEN "Sem permissão"** — backend bloqueia mesmo contornando a UI. ✅

*Responsividade (ADMIN/todas) · 360 / 390 / 768 / 1920*
- **Ficha do cliente:** ⚠️→✅ **BUG-001 encontrado e corrigido** (ver abaixo). Após fix: sem overflow horizontal em 360/390/768. ✅

### Situações-limite validadas ao vivo (2026-07-17)
- **Charset (emoji 🚑 + acentos + símbolos) + nome de 178 chars:** criar lead → **round-trip idêntico** (DB utf8mb4); após **refresh** persiste; **sem overflow** de layout. ✅
- **XSS:** nome com `<b>ol</b>` é exibido como **texto literal** (React escapa) — não injeta HTML. ✅
- **404 de rota** (`/rota-inexistente`): "Página não encontrada" + "Voltar ao início", dentro do shell. ✅
- **404 de recurso** (`/clientes/idInexistente`): API 404 NOT_FOUND; UI **antes** mostrava erro de conexão (**BUG-002**) → **corrigido** para "Cliente não encontrado". ✅
- **Token inválido** (`/proposta/{tokenRuim}`): "Link inválido… peça um novo" (público, sem crash). ✅
- **RBAC por API direta** (FUNCIONARIO): `clientes.remove`/`setAtivo` → **403 FORBIDDEN**. ✅

_Ver histórico completo de bugs em [BUG_TRACKER.md](BUG_TRACKER.md)._

### Bugs encontrados e corrigidos
- **BUG-002 — 404 de recurso mostrava "erro de conexão / tentar de novo"** nas 4 páginas de detalhe (Cliente/Projeto/Documento/Modelo). Corrigido com `isNotFoundError` → cai no estado "não encontrado". Regressão `flows-erros-ux.spec.ts`. PR #12.
- **BUG-001 — overflow horizontal na ficha do cliente no mobile.** O grid `grid gap-6 lg:grid-cols-3` (`ClienteDetailPage`) não tinha `grid-cols-1` no default: no mobile o único track virava `min-content` e esticava para ~696px em viewport de 390 → scroll horizontal. **Corrigido** com `grid-cols-1` (Tailwind = `minmax(0,1fr)`) + `min-w-0` na coluna principal. **Regressão:** `responsive.spec.ts` agora inclui `/clientes/$id` (a ficha) nos 5 viewports. Reproduzido ao vivo (696px pré-fix → 0 pós-fix). PR #10.

**Próximo:** continuar a varredura módulo a módulo (ADMIN/CLIENTE + os demais módulos), repetindo por viewport; incluindo verificar o mesmo anti-padrão de grid nas páginas Configurações/Documento/Modelo quando percorridas.

### Evidências
- **Bloco 1a** (PR #4): `e2e/flows-servicos.spec.ts` — "Configurar > Detalhes: Salvar/Cancelar e aviso antes de descartar ao trocar de aba" (verde no navegador real + CI e2e). Salvar inicia desabilitado; editar habilita; trocar de aba com pendência dispara "Descartar alterações?"; "Continuar editando" preserva; "Cancelar" reverte. Verificado: lint 0 · typecheck 5/5 · vitest 52 · e2e flows-servicos 8/8.

---

## Registro de evidências

_(Preenchido à medida que cada item é APROVADO.)_
