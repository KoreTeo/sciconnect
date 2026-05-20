#!/bin/sh
set -ex

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set in .env}"

export DATABASE_URL="postgresql://sciconnect:${POSTGRES_PASSWORD}@db:5432/sciconnect"

echo "==> Alembic migrations..."
cd /srv/backend
alembic upgrade head

echo "==> Starting uvicorn..."
cd /srv/backend/app
exec uvicorn main:app --host 0.0.0.0 --port 8000
