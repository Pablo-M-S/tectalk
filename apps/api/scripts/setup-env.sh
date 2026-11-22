#!/usr/bin/env bash
# Cria o apps/api/.env com um JWT_SECRET aleatório.
# Uso: scripts/setup-env.sh "<DATABASE_URL>"
set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "Uso: scripts/setup-env.sh \"<DATABASE_URL>\"" >&2
  exit 1
fi

if [ -f .env ]; then
  echo ".env já existe; nada foi alterado."
  exit 0
fi

DATABASE_URL="$1"
JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"

cat > .env <<ENVFILE
NODE_ENV=development
PORT=3000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN_DAYS=30
CORS_ORIGINS=*
AUDIO_ENABLED=false
ENVFILE

echo ".env criado."
