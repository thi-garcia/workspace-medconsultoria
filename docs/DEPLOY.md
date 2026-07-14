# DEPLOY.md — Publicar em produção (TineHost / DirectAdmin)

Guia para colocar o Workspace no ar em **https://workspace.medconsultoria.com.br**.
O app é **um único processo Node** (`server.js`) que serve, na mesma porta: a API tRPC, o WebSocket (Socket.IO) e o site (SPA) já buildado. O deploy envia um **artefato auto-contido** por SSH (a TineHost tem SSH, mas não Git).

> ✅ O artefato de produção já foi **testado localmente** (um processo servindo `/health`, o SPA, o fallback de rotas e o tRPC com MySQL). O pipeline está pronto — falta só você me passar os dados da hospedagem.

---

## 1. O que preciso que você busque na TineHost (uma vez)

No painel DirectAdmin da TineHost (ou com o suporte deles), reúna:

**Acesso SSH**
- [ ] **Host** SSH (ex.: `ssh.seudominio.com.br` ou um IP).
- [ ] **Usuário** do DirectAdmin.
- [ ] **Porta** SSH (geralmente 22; a TineHost às vezes usa outra).
- [ ] Preferir **chave SSH** (mais seguro que senha). Se não tiver, eu te ajudo a gerar uma e cadastrar.

**Banco de dados MySQL (de produção)**
- [ ] Criar um **banco** e um **usuário** MySQL no painel (ex.: banco `medconsult_prod`, usuário `medconsult_app`).
- [ ] Anotar **host** (normalmente `localhost`), **porta** (3306), **nome do banco**, **usuário** e **senha**.
- [ ] Isso vira a `DATABASE_URL` de produção (ver §3).

**Node / hospedagem**
- [ ] Qual **versão do Node** a TineHost oferece? Precisa ser **≥ 20**.
- [ ] O painel usa **Passenger** ou **Nginx Unit** para apps Node? (muda o comando de restart e o "startup file").
- [ ] O caminho da pasta do app (algo como `/home/SEU_USUARIO/domains/workspace.medconsultoria.com.br/app`).
- [ ] A rede de saída (outbound) está liberada? (necessário só se for usar a **IA/OpenAI** em produção.)

Assim que você me mandar isso (ou preencher você mesmo), o resto é quase automático.

---

## 2. Configurar o `.env.deploy` (na sua máquina — NÃO commitado)

Copie `.env.deploy.example` para `.env.deploy` e preencha com os dados de SSH (não segredos do banco):

```bash
DEPLOY_HOST="ssh.seudominio.com.br"
DEPLOY_USER="seu-usuario"
DEPLOY_PATH="/home/seu-usuario/domains/workspace.medconsultoria.com.br/app"
DEPLOY_SSH_PORT="22"
DEPLOY_SSH_KEY="C:/Users/Desktop/.ssh/id_ed25519"
# Se a TineHost usar Nginx Unit (não Passenger), defina o restart adequado:
# DEPLOY_RESTART_CMD="..."
```

---

## 3. Configurar o `.env` de **produção** (no servidor)

Este arquivo fica **no servidor**, na pasta do app (ao lado do `server.js`) — o app já procura o `.env` ali. Nunca vai para o git. Conteúdo:

```bash
NODE_ENV="production"
API_PORT="3000"                 # a porta que o Passenger/Unit espera (confirmar no painel)
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/BANCO"
SESSION_SECRET="<gere um aleatório de 32+ bytes>"   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WEB_ORIGIN="https://workspace.medconsultoria.com.br"
# Opcional — liga a IA (assistente de busca + geração de documentos):
# OPENAI_API_KEY="sk-..."
```

> **SESSION_SECRET** deve ser forte e único (não reutilize o de dev). **Nunca** comite este arquivo.

---

## 4. Configurar o app Node no painel DirectAdmin

- **Startup file / arquivo de entrada:** `server.js` (dentro de `DEPLOY_PATH`).
- **App root:** a pasta `DEPLOY_PATH`.
- **Node version:** ≥ 20.
- **Domínio:** `workspace.medconsultoria.com.br` com **SSL/HTTPS** (Let's Encrypt do próprio painel).

---

## 5. Deploy

O script `deploy.sh` faz tudo: build + bundle auto-contido + rsync + instalar deps + gerar Prisma + migrations + restart.

```bash
./deploy.sh
```

O que ele executa:
1. `pnpm build:deploy` → gera `apps/api/dist/` com **`server.js` + `public/` (o SPA) + `prisma/` + `package.json` de produção**.
2. `rsync` desse `dist/` para o servidor (preserva o `.env` de produção que já está lá).
3. No servidor: `npm install --omit=dev` → `npm run prisma:generate` → `npm run prisma:deploy` (migrations) → **restart**.

> **1º deploy:** garanta antes que o **`.env` de produção já existe no servidor** (§3) e que o **banco foi criado** (§1). Sem isso, as migrations falham.

---

## 6. Smoke test (validar que subiu)

- [ ] `https://workspace.medconsultoria.com.br/health` → `{"status":"ok"}`.
- [ ] Abrir o site → tela de **login**.
- [ ] Criar/rodar o **seed do 1º ROOT** (uma vez): no servidor, `npm run prisma:generate` já roda; para o usuário inicial use um seed ou crie direto (posso te passar o comando). Depois, **login** e navegar por uma tela autenticada.

---

## 7. Riscos a validar no 1º deploy (e planos B)

| Item | Risco | Plano B |
|------|-------|---------|
| **`@node-rs/argon2` (nativo)** | Hash de senha usa binário nativo; hospedagem compartilhada pode não ter binário compatível (glibc/plataforma). | Trocar por `argon2` (WASM) ou `@node-rs/bcrypt`; ou pré-compilar. **Testar login logo no 1º deploy.** |
| **Versão do Node** | Precisa ≥ 20. | Pedir upgrade à TineHost ou usar o selector de versão do painel. |
| **Passenger vs Nginx Unit** | Muda o restart e o proxy do WebSocket. | Ajustar `DEPLOY_RESTART_CMD`; confirmar que o WS (Socket.IO) passa pelo proxy. |
| **CSP do Helmet** | Hoje `contentSecurityPolicy: false` (para não quebrar o SPA). | Ligar e afinar `script-src` testando o SPA buildado (o Vite injeta um pequeno script de módulo). |
| **Pool do MySQL** | Limite de conexões do plano. | Ajustar `connection_limit` na `DATABASE_URL` do Prisma. |
| **Rede outbound (OpenAI)** | Pode estar bloqueada. | Só afeta a IA; sem a chave, o app funciona igual. |
| **PDF de documentos** | — | Já é client-side (`window.print`/blob), **sem** puppeteer. Sem risco. |

---

## 8. Backup & rollback

- **Backup do MySQL:** agende um dump periódico (`mysqldump`) no painel ou via cron. Guardar fora do servidor.
- **Rollback de código:** mantenha o `apps/api/dist` anterior (o `rsync --delete` substitui; se quiser rollback fácil, versione os artefatos em pastas `releases/<data>` e aponte um symlink — posso adaptar o `deploy.sh` para isso quando formos publicar).

---

## 9. Resumo do fluxo

```
[sua máquina]  pnpm build:deploy → apps/api/dist (server.js + public + prisma + package.json)
                     │ rsync (SSH)
                     ▼
[TineHost]     npm install --omit=dev → prisma generate → migrate deploy → restart
                     ▼
            https://workspace.medconsultoria.com.br  (1 processo: API + WS + SPA)
```

> Quando você me passar os dados do §1, eu preencho o `.env.deploy`, ajusto o restart conforme Passenger/Unit, e conduzo o 1º deploy com você — validando o smoke test e o login.

---

## 10. Preflight de produção (rodar no servidor ANTES de publicar)

A app **não é considerada compatível com a TineHost até o preflight passar** (ver decisão #3/#4/#22 da finalização). Depois de subir o bundle e rodar `npm install --omit=dev`, execute na pasta do app:

```bash
node scripts/preflight.mjs        # ou: node preflight.mjs (se copiado para a raiz do bundle)
```

Ele verifica, com base na stack real (exit ≠ 0 se alguma verificação **CRÍTICA** falhar):

| Verificação | Nível | O que garante |
|---|---|---|
| Node ≥ 20 | crítico | versão suportada |
| **Argon2id (hash+verify)** | crítico | o binário nativo `@node-rs/argon2` roda na hospedagem — **se falhar, o login não funciona** |
| Plano B `bcryptjs` | aviso | fallback portátil disponível |
| **UPLOADS_DIR** | crítico | caminho **absoluto** em produção + escrita/leitura reais |
| **Conexão MySQL** (Prisma) | crítico | `DATABASE_URL` válida |
| **Migrations aplicadas** | crítico | `_prisma_migrations` populada (rode `prisma migrate deploy` se divergir) |
| Env obrigatórias + `SESSION_SECRET` forte | crítico | segredo ≥ 16 chars |
| `NODE_ENV=production` | aviso | cookies `secure`, e-mail/CSP reais |
| DNS de `WEB_ORIGIN`, rede OpenAI/SMTP | aviso | outbound liberado onde necessário |
| WebSocket (Socket.IO) | aviso | lembrete: o proxy precisa permitir *upgrade* de WebSocket |

Se o Argon2 nativo falhar no plano de hospedagem: a app tem **Plano B portátil (`bcryptjs`)** — a abstração `apps/api/src/lib/password.ts` identifica o algoritmo pelo prefixo do hash, então argon2 e bcrypt coexistem; no login bem-sucedido, hashes legados são **reescritos (rehash)** para Argon2id quando ele estiver disponível.

## 11. Uploads persistentes (obrigatório configurar)

`UPLOADS_DIR` **deve** apontar para uma pasta **fora** do diretório do deploy (o `rsync --delete` apaga tudo que está no destino). Em produção deve ser **caminho absoluto** — o boot da API valida isso e **recusa subir** se for relativo ou sem permissão de escrita (`validarPastaUploads` em `apps/api/src/lib/storage.ts`).

- Exemplo (ajustar ao caminho real da TineHost): `UPLOADS_DIR="/home/SEU_USUARIO/uploads-medconsultoria"` — **[PREENCHER com o caminho real do servidor]**.
- **Backup:** incluir essa pasta no backup periódico (junto com o dump do MySQL).
- **Restauração:** restaurar a pasta no mesmo caminho antes de subir a app; os registros no banco (`Arquivo.caminho`) são relativos a `UPLOADS_DIR`.
- Os arquivos **sobrevivem a restart e redeploy** porque ficam fora do diretório substituído pelo rsync.
