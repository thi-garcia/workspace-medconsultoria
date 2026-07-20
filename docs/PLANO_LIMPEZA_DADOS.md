# Plano de Limpeza de Dados de Teste (Bloco 5)

> **Status: PLANO — NADA FOI EXECUTADO.**
> Nenhum registro foi apagado. Este documento é o plano que precisa da sua aprovação
> explícita antes de qualquer execução destrutiva, conforme combinado.
>
> Levantamento: 2026-07-20 · main `38eabd2`

---

## 1. Diagnóstico (medido, não estimado)

### 1.1 Volume atual no banco de **desenvolvimento** (`medconsultoria` @ 3307)

Contagem real feita por script somente-leitura em 2026-07-20:

| Tabela | Total | Marcados como teste (`E2E`/`Guard` no nome) | % sujo (mín.) |
|---|---:|---:|---:|
| `servico` | 21 | 11 | **52%** |
| `cliente` | 25 | 12 | **48%** |
| `lead` | 61 | 14 | 23% |
| `conversa` (chamados) | 33 | 12 | 36% |
| `documento` | 35 | 13 | 37% |
| `conta` (financeiro) | 79 | 13 | 16% |
| `projeto` | 14 | — | — |
| `evento` | 50 | — | — |
| `user` | 22 | — | — |
| `arquivo` | 22 | — | — |

> Os números da coluna "marcados" são o **piso**, não o teto: só contam registros cujo
> nome/título/assunto contém literalmente `E2E` ou `Guard`. Dados criados na validação
> manual (nomes como "Teste", "Cliente Auditoria", emojis) e dados demo (Clínica Bem
> Estar, Hospital Santa Luz…) não entram nessa conta.

### 1.2 Causa-raiz (3 achados)

**Achado A — a suíte E2E local escreve no MESMO banco que você usa.**
`scripts/e2e-fixtures.mjs` lê `DATABASE_URL` do `.env` da raiz. Localmente isso aponta
para `medconsultoria` — o banco que você abre no navegador. Na CI é um container
efêmero (isolado, morre no fim do job). Ou seja: **a poluição é exclusivamente local.**

**Achado B — parte dos specs cria dados não-idempotentes.**
As *fixtures* (`scripts/e2e-fixtures.mjs`) usam ids fixos e se auto-limpam — corretas.
Mas vários **specs** criam registros com nome carimbado por timestamp, ex.:

```ts
const RUN = `SVC${Date.now().toString().slice(-6)}`;  // e2e/flows-servicos.spec.ts
const NOME = `Serviço E2E ${RUN}`;                    // nunca é apagado no fim
```

Cada execução da suíte deixa um novo resíduo. Isso explica os 11 serviços `E2E`/`Guard`.

**Achado C — parte do resíduo é VISÍVEL PARA O CLIENTE no Portal.**
Os chamados e serviços de teste aparecem na interface do Portal do cliente. Hoje isso
é inofensivo (ambiente de dev), mas é exatamente o que não pode sobrar num banco real.

### 1.3 O que está CORRETO hoje (verificado, não mexer)

- ✅ **Demo não roda em produção.** `deploy.sh` executa **só** `prisma migrate deploy`.
  `pnpm db:demo` só é invocado manualmente e no CI (banco efêmero). `docs/DEPLOY.md`
  instrui explicitamente a não rodar demo em produção.
- ✅ **Testes unitários/integração são isolados**: usam `medconsultoria_test`,
  banco separado.
- ✅ **`seed.ts` é essencial e seguro**: cria apenas o usuário ROOT a partir de
  `SEED_ROOT_*` do `.env`. Deve continuar existindo.

### 1.4 Riscos remanescentes (a corrigir no plano)

| # | Risco | Gravidade |
|---|---|---|
| R1 | `demo-seed.ts` **não tem trava de produção** — se alguém rodar `pnpm db:demo` apontando para o banco real, insere clientes fictícios e usuários com senha padrão `medconsultoria123` | 🔴 Alta |
| R2 | Os **estágios do funil** (`PipelineStage`) nascem no `demo-seed`, não no `seed.ts`. Num banco limpo "de verdade", a tela de Vendas nasce **sem colunas** | 🟠 Média |
| R3 | Specs deixam lixo acumulando no banco local a cada rodada | 🟡 Baixa (dev) |

---

## 2. Plano proposto — 4 etapas, da mais segura à destrutiva

### Etapa 1 — Blindagem (**não destrutiva**, faço já se autorizar)

1. **Trava de produção no `demo-seed.ts`**: aborta se `NODE_ENV=production` ou se a
   `DATABASE_URL` não for reconhecidamente local/CI, exigindo `DEMO_SEED_CONFIRMO=1`
   para prosseguir. Resolve **R1**.
2. **Mover config essencial para o `seed.ts`**: `PipelineStage` (Novo → Qualificação →
   Proposta → Negociação → Fechado) passa a ser semeado como **estrutura**, idempotente,
   junto do ROOT. O `demo-seed` deixa de ser pré-requisito para o funil funcionar.
   Resolve **R2**.
3. Teste automatizado cobrindo as duas travas.

> Impacto: **zero registro apagado**. Só código + testes.

### Etapa 2 — Banco de teste próprio para o E2E local (**não destrutiva**)

Passar a suíte E2E local a rodar contra `medconsultoria_e2e` (banco separado, mesmo
servidor MySQL 3307), como já acontece com o Vitest. A partir daí **o seu banco de
desenvolvimento para de sujar sozinho**. Resolve **R3** na raiz, sem depender de os
specs se comportarem.

> Impacto: **zero registro apagado**. Novo banco criado do zero via `migrate deploy`.

### Etapa 3 — `db:demo:clean` (**destrutiva, escopo fechado e reversível**)

Script novo `pnpm db:demo:clean` que remove **apenas** o que é comprovadamente resíduo,
por **lista fechada de critérios** (nunca "apagar tudo"):

- registros cujo nome/título/assunto casa com `E2E` ou `Guard` + carimbo de execução;
- os ids fixos das fixtures (`e2e*`);
- os registros exatos criados pelo `demo-seed` (clientes/leads/contas/eventos daquele
  arquivo, identificados pelos e-mails e nomes literais que ele usa).

Garantias obrigatórias do script:
- **Dry-run por padrão** (`--dry` lista o que apagaria e sai). Só apaga com `--apply`.
- **Dump automático antes** de qualquer `DELETE` (`mysqldump` para `backups/`), para
  reverter. É isso que torna a operação reversível.
- **Idempotente** — rodar duas vezes não quebra.
- **Nunca toca em**: migrations, schema, usuário ROOT, catálogos reais, ou qualquer
  registro fora da lista de critérios.

> Impacto: apaga dados de teste do banco **de desenvolvimento**. Nunca é apontado para
> produção (herda a mesma trava da Etapa 1).

### Etapa 4 — Bootstrap de banco limpo (**não destrutivo**, cria do zero)

`docs/BOOTSTRAP.md` + verificação prática: subir um banco vazio, rodar
`migrate deploy` + `db:seed`, e confirmar que a aplicação abre utilizável (login ROOT,
funil com colunas, menus funcionais) **sem nenhum dado fictício**. É o ensaio do que
será feito quando o banco de produção existir.

---

## 3. O que eu **não** vou fazer sem sua ordem expressa

- Apagar qualquer coisa antes do seu "pode executar".
- Rodar a Etapa 3 sem dump prévio.
- Apontar qualquer script para banco de produção.
- Remover fixtures usadas pelos testes (elas continuam; só passam a viver em banco próprio).
- Substituir dados demo por conteúdo institucional inventado — isso é o Bloco 6 e
  depende de você fornecer o conteúdo real (ver §7.2 do `AUDITORIA_FUNCIONAL_COMPLETA.md`).

---

## 4. Decisão que eu preciso de você

| Opção | O que executo |
|---|---|
| **A — Só blindar** | Etapas 1 e 2. Zero exclusão. O banco atual fica como está, mas para de piorar. |
| **B — Blindar + limpar** (recomendado) | Etapas 1, 2, 3 e 4. Banco de dev limpo, com dump de segurança antes. |
| **C — Adiar** | Nada. Sigo para o Bloco 6 / outras frentes. |

Enquanto não houver decisão, **nada é executado**.
