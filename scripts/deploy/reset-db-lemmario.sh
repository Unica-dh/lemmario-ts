#!/bin/bash
# reset-db-lemmario.sh - Reset completo database Lemmario
# Usage: ./reset-db-lemmario.sh [--seed]
#
# IMPORTANTE: Questo script deve essere copiato sul server VPN in /home/dhomeka/reset-db-lemmario.sh
# chmod 750 /home/dhomeka/reset-db-lemmario.sh

set -euo pipefail

BACKUP_DIR="/home/dhomeka/backups/pre-reset-$(date +%Y%m%d-%H%M%S)"
COMPOSE_FILE="/home/dhomeka/docker/lemmario_ts/docker-compose.yml"
PROJECT_DIR="/home/dhomeka/docker/lemmario_ts"
VOLUME_NAME="lemmario_ts_postgres_data"
RUN_SEED=false

# Parse arguments
if [[ "${1:-}" == "--seed" ]]; then
  RUN_SEED=true
fi

echo "=========================================="
echo "Lemmario Database Reset - $(date)"
echo "Run seed: $RUN_SEED"
echo "=========================================="
echo ""
echo "WARNING: This will DELETE ALL DATABASE DATA!"
echo "A backup will be created at: $BACKUP_DIR"
echo ""
read -p "Type 'YES_DELETE_DATABASE' to confirm: " CONFIRMATION

if [[ "$CONFIRMATION" != "YES_DELETE_DATABASE" ]]; then
  echo "Reset cancelled."
  exit 0
fi

# Step 1: Backup finale
echo "[1/9] Creating final backup..."
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U lemmario_user lemmario_db \
  > "$BACKUP_DIR/lemmario_db_before_reset.sql" 2>/dev/null || echo "WARNING: Backup failed (DB might be empty)"
echo "Backup saved (if DB exists): $BACKUP_DIR/lemmario_db_before_reset.sql"

# Step 2: Stop servizi
echo "[2/9] Stopping all services..."
docker compose -f "$COMPOSE_FILE" stop

# Step 3: Rimuovi container postgres (per sbloccare volume)
echo "[3/9] Removing postgres container..."
docker compose -f "$COMPOSE_FILE" rm -f postgres

# Step 4: Rimuovi volume postgres_data
echo "[4/9] Removing postgres_data volume..."
docker volume rm "$VOLUME_NAME" 2>/dev/null || echo "Volume already removed or doesn't exist"

# Step 5: Ricrea postgres service (volume verrà ricreato automaticamente)
echo "[5/9] Starting postgres with fresh database..."
docker compose -f "$COMPOSE_FILE" up -d postgres

# Step 6: Attendi che postgres sia healthy
echo "[6/9] Waiting for postgres to be healthy..."
for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec postgres pg_isready -U lemmario_user 2>/dev/null; then
    echo "Postgres is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: Postgres failed to start"
    exit 1
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# init-db.sql viene eseguito automaticamente da entrypoint Postgres

# Step 7: Start payload per eseguire migrations
echo "[7/9] Starting payload to run migrations..."
docker compose -f "$COMPOSE_FILE" up -d payload
echo "Waiting for payload to complete migrations..."
sleep 10  # Attendi che payload esegua migrations

# Step 8: Seed (opzionale)
if [ "$RUN_SEED" = true ]; then
  echo "[8/9] Running database seed..."
  docker compose -f "$COMPOSE_FILE" exec payload pnpm db:seed
else
  echo "[8/9] Skipping seed (not requested)"
fi

# Step 9: Start frontend
echo "[9/9] Starting frontend..."
docker compose -f "$COMPOSE_FILE" up -d frontend

echo "=========================================="
echo "Database reset completed successfully!"
echo "Backup: $BACKUP_DIR"
echo "Volume payload_media was PRESERVED"
echo "=========================================="
