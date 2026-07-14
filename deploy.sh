#!/usr/bin/env bash
# Deploy para TineHost/DirectAdmin via SSH + rsync (sem Git no servidor).
# Uso: ./deploy.sh
# Pré-requisitos: .env.deploy local (NUNCA commitado) com DEPLOY_HOST/USER/PATH,
# chave SSH configurada, e o .env de PRODUÇÃO já presente no servidor (ver docs/DEPLOY.md).
#
# Envia um artefato AUTO-CONTIDO (apps/api/dist com server.js + public/ + prisma/
# + package.json de produção). No servidor: instala deps, gera o Prisma Client,
# aplica migrations e reinicia (Passenger `touch tmp/restart.txt`).
# ⚠️ O mecanismo de restart pode variar (Passenger vs Nginx Unit) — ajuste RESTART_CMD.
set -euo pipefail

# Carrega credenciais do .env.deploy (gitignored). Veja .env.deploy.example.
if [ -f .env.deploy ]; then
  set -a; . ./.env.deploy; set +a
fi

: "${DEPLOY_HOST:?defina DEPLOY_HOST (em .env.deploy)}"
: "${DEPLOY_USER:?defina DEPLOY_USER (em .env.deploy)}"
: "${DEPLOY_PATH:?defina DEPLOY_PATH (em .env.deploy)}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
# Comando de restart no servidor. Passenger é o padrão do DirectAdmin;
# se for Nginx Unit, troque por ex.: "curl -X GET --unix-socket /path/control.sock ...".
RESTART_CMD="${DEPLOY_RESTART_CMD:-mkdir -p tmp && touch tmp/restart.txt}"

# Monta as opções de SSH (usa chave se informada).
SSH_OPTS="-p ${DEPLOY_SSH_PORT}"
[ -n "${DEPLOY_SSH_KEY:-}" ] && SSH_OPTS="${SSH_OPTS} -i ${DEPLOY_SSH_KEY}"
RSYNC_SSH="ssh ${SSH_OPTS}"

echo "==> Build de produção + bundle auto-contido"
pnpm install --frozen-lockfile
pnpm build:deploy

echo "==> Enviando artefato (apps/api/dist) via rsync"
# --delete mantém o destino idêntico; preserva um .env já existente no servidor.
rsync -az --delete --exclude ".env" -e "${RSYNC_SSH}" \
  apps/api/dist/ \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> Servidor: deps de produção + Prisma Client + migrations + restart"
# shellcheck disable=SC2087
ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" "cd '${DEPLOY_PATH}' && \
  (npm ci --omit=dev || npm install --omit=dev) && \
  npm run prisma:generate && \
  npm run prisma:deploy && \
  ${RESTART_CMD} && \
  echo 'Deploy concluído.'"

echo "==> Feito. Smoke test: abra https://workspace.medconsultoria.com.br e /health"
