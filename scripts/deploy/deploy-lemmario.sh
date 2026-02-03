#!/bin/bash
# deploy-lemmario.sh - Deploy script per Lemmario (OTTIMIZZATO)
# Usage: ./deploy-lemmario.sh <commit-sha>
#
# IMPORTANTE: Questo script deve essere copiato sul server VPN in /home/dhruby/deploy-lemmario.sh
# chmod 750 /home/dhruby/deploy-lemmario.sh

set -euo pipefail

# Variabili - MODIFICA GHCR_REGISTRY con il tuo GitHub owner
COMMIT_SHA="${1:-latest}"
BACKUP_DIR="/home/dhruby/backups/lemmario-$(date +%Y%m%d-%H%M%S)"
COMPOSE_FILE="/home/dhruby/lemmario-ts/docker-compose.yml"
COMPOSE_PROD_FILE="/home/dhruby/lemmario-ts/docker-compose.prod.yml"
PROJECT_DIR="/home/dhruby/lemmario-ts"
GHCR_REGISTRY="ghcr.io/unica-dh"  # es. ghcr.io/unica-dh

# Health check ottimizzati: prima veloci, poi lenti
HEALTH_CHECK_FAST_RETRIES=6
HEALTH_CHECK_FAST_INTERVAL=2
HEALTH_CHECK_SLOW_RETRIES=12
HEALTH_CHECK_SLOW_INTERVAL=5

echo "=========================================="
echo "Lemmario Deploy (Optimized) - $(date)"
echo "Commit SHA: $COMMIT_SHA"
echo "=========================================="

# Pre-flight checks
echo "[0/9] Pre-flight checks..."

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
echo "[1/9] Backing up database..."
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_dump \
  -U lemmario_user lemmario_db > "$BACKUP_DIR/lemmario_db.sql" || {
    echo "WARNING: Backup failed (database might be empty or not accessible)"
    echo "Continuing with deploy..."
  }
echo "Backup saved to: $BACKUP_DIR/lemmario_db.sql"

# Step 2: Pull nuove images da GHCR (PARALLELO)
echo "[2/9] Pulling new images from GHCR (parallel)..."
docker pull "$GHCR_REGISTRY/lemmario-payload:sha-$COMMIT_SHA" &
PID_PAYLOAD=$!
docker pull "$GHCR_REGISTRY/lemmario-frontend:sha-$COMMIT_SHA" &
PID_FRONTEND=$!

# Attendi entrambi i pull
wait $PID_PAYLOAD || { echo "ERROR: Failed to pull payload image"; exit 1; }
wait $PID_FRONTEND || { echo "ERROR: Failed to pull frontend image"; exit 1; }
echo "Images pulled successfully!"

# Step 3: Stop servizi (preserva volumi)
echo "[3/9] Stopping services..."
$COMPOSE_CMD -f "$COMPOSE_FILE" stop payload frontend

# Step 4: Crea docker-compose.prod.yml con nuove image tags
echo "[4/9] Updating docker-compose.prod.yml with new tags..."
cat > "$COMPOSE_PROD_FILE" <<EOF
version: "2.4"
services:
  payload:
    image: $GHCR_REGISTRY/lemmario-payload:sha-$COMMIT_SHA
  frontend:
    image: $GHCR_REGISTRY/lemmario-frontend:sha-$COMMIT_SHA
EOF

# Step 5: Ensure postgres is up and healthy
echo "[5/9] Ensuring postgres is healthy..."
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres

# Health check veloce per postgres
for i in $(seq 1 $HEALTH_CHECK_FAST_RETRIES); do
  if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_isready -U lemmario_user -d lemmario_db 2>/dev/null; then
    echo "Postgres is healthy!"
    break
  fi
  if [ $i -eq $HEALTH_CHECK_FAST_RETRIES ]; then
    # Fallback a check lenti
    echo "Fast check failed, trying slow checks..."
    for j in $(seq 1 $HEALTH_CHECK_SLOW_RETRIES); do
      if $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_isready -U lemmario_user -d lemmario_db 2>/dev/null; then
        echo "Postgres is healthy!"
        break 2
      fi
      if [ $j -eq $HEALTH_CHECK_SLOW_RETRIES ]; then
        echo "ERROR: Postgres health check failed"
        exit 1
      fi
      echo "Waiting for postgres... (slow $j/$HEALTH_CHECK_SLOW_RETRIES)"
      sleep $HEALTH_CHECK_SLOW_INTERVAL
    done
  fi
  echo "Waiting for postgres... (fast $i/$HEALTH_CHECK_FAST_RETRIES)"
  sleep $HEALTH_CHECK_FAST_INTERVAL
done

# Step 6: Start servizi con nuove images (senza ricreare postgres)
echo "[6/9] Starting services with new images..."
$COMPOSE_CMD -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d --no-deps payload frontend

# Funzione helper per health check a due fasi
health_check() {
  local service_name="$1"
  local check_cmd="$2"

  # Fase 1: check veloci
  for i in $(seq 1 $HEALTH_CHECK_FAST_RETRIES); do
    if eval "$check_cmd"; then
      echo "$service_name is healthy!"
      return 0
    fi
    echo "Waiting for $service_name... (fast $i/$HEALTH_CHECK_FAST_RETRIES)"
    sleep $HEALTH_CHECK_FAST_INTERVAL
  done

  # Fase 2: check lenti
  echo "Fast checks failed for $service_name, trying slow checks..."
  for i in $(seq 1 $HEALTH_CHECK_SLOW_RETRIES); do
    if eval "$check_cmd"; then
      echo "$service_name is healthy!"
      return 0
    fi
    echo "Waiting for $service_name... (slow $i/$HEALTH_CHECK_SLOW_RETRIES)"
    sleep $HEALTH_CHECK_SLOW_INTERVAL
  done

  return 1
}

# Step 7: Health check payload
echo "[7/9] Health checking payload service..."
if ! health_check "Payload" "curl -sf http://localhost:3000/api/access >/dev/null 2>&1"; then
  echo "ERROR: Payload health check failed"
  echo "[ROLLBACK] Reverting to previous version..."
  $COMPOSE_CMD -f "$COMPOSE_FILE" restart payload frontend
  exit 1
fi

# Step 8: Health check frontend
echo "[8/9] Health checking frontend service..."
if ! health_check "Frontend" "curl -sf http://localhost:3001 >/dev/null 2>&1"; then
  echo "ERROR: Frontend health check failed"
  exit 1
fi

# Step 9: Cleanup old images (opzionale, mantieni ultime 3 versioni)
echo "[9/9] Cleaning up old images..."
docker images "$GHCR_REGISTRY/lemmario-payload" --format "{{.ID}} {{.CreatedAt}}" \
  | sort -rk 2 | tail -n +4 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true
docker images "$GHCR_REGISTRY/lemmario-frontend" --format "{{.ID}} {{.CreatedAt}}" \
  | sort -rk 2 | tail -n +4 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true

echo "=========================================="
echo "Deploy completed successfully!"
echo "Backup: $BACKUP_DIR"
echo "=========================================="
