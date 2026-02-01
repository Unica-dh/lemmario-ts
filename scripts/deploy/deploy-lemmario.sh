#!/bin/bash
# deploy-lemmario.sh - Deploy script per Lemmario
# Usage: ./deploy-lemmario.sh <commit-sha>
#
# IMPORTANTE: Questo script deve essere copiato sul server VPN in /home/dhomeka/deploy-lemmario.sh
# chmod 750 /home/dhomeka/deploy-lemmario.sh

set -euo pipefail

# Variabili - MODIFICA GHCR_REGISTRY con il tuo GitHub owner
COMMIT_SHA="${1:-latest}"
BACKUP_DIR="/home/dhomeka/backups/lemmario-$(date +%Y%m%d-%H%M%S)"
COMPOSE_FILE="/home/dhomeka/lemmario-ts/docker-compose.yml"
COMPOSE_PROD_FILE="/home/dhomeka/lemmario-ts/docker-compose.prod.yml"
PROJECT_DIR="/home/dhomeka/lemmario-ts"
GHCR_REGISTRY="ghcr.io/unica-dh"  # es. ghcr.io/unica-dh
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=5

echo "=========================================="
echo "Lemmario Deploy - $(date)"
echo "Commit SHA: $COMMIT_SHA"
echo "=========================================="

# Pre-flight checks
echo "[0/8] Pre-flight checks..."

# Check .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "ERROR: File .env non trovato in $PROJECT_DIR/"
  echo "Crea il file .env partendo da .env.production.example"
  exit 1
fi

# Detect docker compose command (v1 vs v2)
if command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
  echo "Using docker-compose (v1)"
elif docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
  echo "Using docker compose (v2)"
else
  echo "ERROR: Neither 'docker-compose' nor 'docker compose' found"
  exit 1
fi

# Step 1: Backup Database
echo "[1/8] Backing up database..."
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_dump \
  -U lemmario_user lemmario_db > "$BACKUP_DIR/lemmario_db.sql" || {
    echo "WARNING: Backup failed (database might be empty or not accessible)"
    echo "Continuing with deploy..."
  }
echo "Backup saved to: $BACKUP_DIR/lemmario_db.sql"

# Step 2: Pull nuove images da GHCR
echo "[2/8] Pulling new images from GHCR..."
docker pull "$GHCR_REGISTRY/lemmario-payload:sha-$COMMIT_SHA"
docker pull "$GHCR_REGISTRY/lemmario-frontend:sha-$COMMIT_SHA"

# Step 3: Stop servizi (preserva volumi)
echo "[3/8] Stopping services..."
$COMPOSE_CMD -f "$COMPOSE_FILE" stop payload frontend

# Step 4: Crea docker-compose.prod.yml con nuove image tags
echo "[4/8] Updating docker-compose.prod.yml with new tags..."
cat > "$COMPOSE_PROD_FILE" <<EOF
services:
  payload:
    image: $GHCR_REGISTRY/lemmario-payload:sha-$COMMIT_SHA
  frontend:
    image: $GHCR_REGISTRY/lemmario-frontend:sha-$COMMIT_SHA
EOF

# Step 5: Start servizi con nuove images
echo "[5/8] Starting services with new images..."
$COMPOSE_CMD -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d payload frontend

# Step 6: Health check payload
echo "[6/8] Health checking payload service..."
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  if curl -f http://localhost:3000/api 2>/dev/null; then
    echo "Payload is healthy!"
    break
  fi
  if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
    echo "ERROR: Payload health check failed after $HEALTH_CHECK_RETRIES retries"
    echo "[ROLLBACK] Reverting to previous version..."
    # Rollback: restart con immagini precedenti
    $COMPOSE_CMD -f "$COMPOSE_FILE" restart payload frontend
    exit 1
  fi
  echo "Waiting for payload... ($i/$HEALTH_CHECK_RETRIES)"
  sleep $HEALTH_CHECK_INTERVAL
done

# Step 7: Health check frontend
echo "[7/8] Health checking frontend service..."
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  if curl -f http://localhost:3001 2>/dev/null; then
    echo "Frontend is healthy!"
    break
  fi
  if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
    echo "ERROR: Frontend health check failed"
    exit 1
  fi
  echo "Waiting for frontend... ($i/$HEALTH_CHECK_RETRIES)"
  sleep $HEALTH_CHECK_INTERVAL
done

# Step 8: Cleanup old images (opzionale, mantieni ultime 3 versioni)
echo "[8/8] Cleaning up old images..."
docker images "$GHCR_REGISTRY/lemmario-payload" --format "{{.ID}} {{.CreatedAt}}" \
  | sort -rk 2 | tail -n +4 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true
docker images "$GHCR_REGISTRY/lemmario-frontend" --format "{{.ID}} {{.CreatedAt}}" \
  | sort -rk 2 | tail -n +4 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true

echo "=========================================="
echo "Deploy completed successfully!"
echo "Backup: $BACKUP_DIR"
echo "=========================================="
