# Setup Server di Produzione - Guida Rapida

Questa guida ti aiuta a configurare il server VPN per il primo deploy.

## Prerequisiti Server

- Docker installato (v1 `docker-compose` o v2 `docker compose`)
- Porta SSH: 22
- Porte esposte: 3000 (Payload), 3001 (Frontend), 5432 (PostgreSQL)

## Step 1: Clone Repository

```bash
ssh dhruby@90.147.144.147

cd /home/dhruby
git clone https://github.com/Unica-dh/lemmario-ts.git
cd lemmario-ts
```

## Step 2: Crea File .env di Produzione

```bash
# Copia il template
cp .env.production.example .env

# Modifica con le tue credenziali
nano .env
```

**Valori da modificare:**

```bash
# Database - Scegli password sicura
DB_PASSWORD=TuaPasswordSicura123!

# Payload Secret - Genera stringa random min 32 caratteri
# Esempio: openssl rand -base64 32
PAYLOAD_SECRET=QualcheStringaRandomMoltoLungaESecreta123456

# URLs - Sostituisci con IP/dominio del server
PAYLOAD_PUBLIC_SERVER_URL=http://90.147.144.147:3000
NEXT_PUBLIC_API_URL=http://90.147.144.147:3000/api
NEXT_PUBLIC_SITE_URL=http://90.147.144.147:3001
```

Salva e esci (`Ctrl+X`, `Y`, `Enter`).

## Step 3: Verifica Docker Compose

Controlla quale versione hai:

```bash
# Test v2 (preferito)
docker compose version

# Test v1 (legacy)
docker-compose --version
```

✅ Gli script funzionano con **entrambe le versioni** automaticamente.

## Step 4: Primo Avvio Manuale

**IMPORTANTE**: Il primo avvio deve essere manuale, poi GitHub Actions gestirà i deploy automatici.

```bash
cd /home/dhruby/lemmario-ts

# Se hai docker compose v2
docker compose up -d

# Se hai docker-compose v1
docker-compose up -d
```

Verifica i servizi:

```bash
docker ps

# Output atteso:
# lemmario_db        (postgres)
# lemmario_payload   (backend API)
# lemmario_frontend  (Next.js)
```

Health check:

```bash
curl http://localhost:3000/api    # Payload API
curl http://localhost:3001         # Frontend
```

## Step 5: Setup Script di Deploy

```bash
# Copia script deploy dalla repo
cp /home/dhruby/lemmario-ts/scripts/deploy/deploy-lemmario.sh /home/dhruby/
cp /home/dhruby/lemmario-ts/scripts/deploy/reset-db-lemmario.sh /home/dhruby/

# Rendi eseguibili
chmod 750 /home/dhruby/deploy-lemmario.sh
chmod 750 /home/dhruby/reset-db-lemmario.sh

# Crea directory backups
mkdir -p /home/dhruby/backups
```

## Step 6: Test Deploy Manuale (Opzionale)

Prima di attivare GitHub Actions CD, testa il deploy:

```bash
# Deploy con tag 'latest'
/home/dhruby/deploy-lemmario.sh latest
```

Se tutto va bene, vedrai:

```
========================================
Deploy completed successfully!
Backup: /home/dhruby/backups/lemmario-20260125-164530
========================================
```

## Step 7: Setup GitHub Self-Hosted Runner

Per abilitare il deploy automatico da GitHub Actions, configura un runner:

```bash
# Segui la guida ufficiale GitHub:
# https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners

# Esempio:
cd /home/dhruby
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/Unica-dh/lemmario-ts --token <TUO_TOKEN>
./run.sh
```

**Label richiesto**: `vpn` (lo script si aspetta `runs-on: [self-hosted, Linux, vpn]`)

## Step 8: Verifica Workflow GitHub

Dopo il push su `main`, vai su GitHub:

https://github.com/Unica-dh/lemmario-ts/actions

Verifica che il workflow "CD - Build and Deploy" funzioni.

## Troubleshooting

### Variabili .env non caricate

**Sintomo**: `WARNING: The DB_USER variable is not set`

**Soluzione**:
```bash
# Verifica che .env esista
ls -la /home/dhruby/lemmario-ts/.env

# Verifica contenuto
cat /home/dhruby/lemmario-ts/.env

# Se manca, crealo da template
cp /home/dhruby/lemmario-ts/.env.production.example \
   /home/dhruby/lemmario-ts/.env
nano /home/dhruby/lemmario-ts/.env
```

### Errore "Version unsupported"

**Sintomo**: `ERROR: Version in "./docker-compose.yml" is unsupported`

**Soluzione**: ✅ **Risolto!** I file docker-compose sono stati aggiornati per supportare sia v1 che v2.

Riesegui pull:
```bash
cd /home/dhruby/lemmario-ts
git pull origin main
```

### Servizio non parte

```bash
# Check logs
docker logs lemmario_payload
docker logs lemmario_frontend

# Restart manuale
docker compose restart

# Se necessario, rebuild
docker compose up -d --build
```

### Porta già in uso

```bash
# Verifica porte occupate
ss -tlnp | grep -E '3000|3001|5432'

# Cambia porta in .env o docker-compose.yml se necessario
```

## Manutenzione

### Backup manuale database

```bash
docker exec lemmario_db pg_dump -U lemmario_user lemmario_db \
  > /home/dhruby/backups/manual-backup-$(date +%Y%m%d).sql
```

### Restore backup

```bash
cat /home/dhruby/backups/lemmario-YYYYMMDD-HHMMSS/lemmario_db.sql | \
  docker exec -i lemmario_db psql -U lemmario_user lemmario_db
```

### Reset completo database

```bash
# Con conferma interattiva
/home/dhruby/reset-db-lemmario.sh

# Con seed dati
/home/dhruby/reset-db-lemmario.sh --seed
```

### Cleanup vecchie images Docker

```bash
# Lista images
docker images | grep lemmario

# Rimuovi vecchie (automatico nello script deploy, ma manuale se serve)
docker image prune -a -f
```

## Monitoraggio

```bash
# Servizi attivi
docker ps

# Logs in real-time
docker logs -f lemmario_payload
docker logs -f lemmario_frontend

# Uso risorse
docker stats

# Spazio disco
df -h
docker system df
```

## Link Utili

- **Repository**: https://github.com/Unica-dh/lemmario-ts
- **GitHub Actions**: https://github.com/Unica-dh/lemmario-ts/actions
- **Documentazione CI/CD**: [docs/CI-CD-SETUP.md](../docs/CI-CD-SETUP.md)
- **Deploy Scripts**: [scripts/deploy/README.md](./README.md)
