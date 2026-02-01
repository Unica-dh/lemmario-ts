# Script Deploy per Server VPN

Questa directory contiene gli script bash necessari per il deploy automatico sul server VPN.

## 📋 File

- **[deploy-lemmario.sh](deploy-lemmario.sh)** - Script principale per deploy automatico
- **[reset-db-lemmario.sh](reset-db-lemmario.sh)** - Script per reset completo database
- **[SETUP_SERVER.md](SETUP_SERVER.md)** - ⭐ **Guida setup iniziale server**

## 🚀 Quick Start

### Prima volta? Leggi prima la guida setup:
👉 **[SETUP_SERVER.md](SETUP_SERVER.md)** 👈

La guida copre:
- Creazione file `.env` di produzione
- Compatibilità Docker Compose v1/v2
- Primo avvio manuale
- Setup GitHub self-hosted runner
- Troubleshooting comuni

## Installazione sul Server

### 1. Copia script sul server VPN

```bash
# Da locale, copia gli script sul server
scp scripts/deploy/deploy-lemmario.sh dhomeka@90.147.144.145:/home/dhomeka/
scp scripts/deploy/reset-db-lemmario.sh dhomeka@90.147.144.145:/home/dhomeka/
```

### 2. SSH sul server e configura permessi

```bash
ssh dhomeka@90.147.144.145

# Rendi eseguibili gli script
chmod 750 /home/dhomeka/deploy-lemmario.sh
chmod 750 /home/dhomeka/reset-db-lemmario.sh

# Verifica ownership
ls -l /home/dhomeka/*.sh
```

### 3. Modifica GHCR_REGISTRY in deploy-lemmario.sh

**IMPORTANTE**: Devi modificare la variabile `GHCR_REGISTRY` nello script deploy con il tuo GitHub owner:

```bash
# Edita il file
nano /home/dhomeka/deploy-lemmario.sh

# Trova la riga (circa linea 15):
GHCR_REGISTRY="ghcr.io/MODIFICA_OWNER_QUI"

# Sostituisci con il tuo GitHub username/org, esempio:
GHCR_REGISTRY="ghcr.io/unica-dh"

# Salva e esci (Ctrl+X, Y, Enter)
```

### 4. Crea directory backups

```bash
mkdir -p /home/dhomeka/backups
```

### 5. Test manuale (opzionale)

Prima di attivare GitHub Actions, puoi testare lo script deploy manualmente:

```bash
# Assicurati che Docker sia in esecuzione
docker ps

# Test deploy con tag 'latest'
/home/dhomeka/deploy-lemmario.sh latest
```

## Utilizzo Script

### deploy-lemmario.sh

Eseguito automaticamente da GitHub Actions workflow CD.

**Sintassi:**
```bash
./deploy-lemmario.sh <commit-sha>
```

**Esempio:**
```bash
./deploy-lemmario.sh ddd4633  # Deploy commit specifico
./deploy-lemmario.sh latest   # Deploy con tag latest
```

**Cosa fa:**
1. Backup database in `/home/dhomeka/backups/lemmario-<timestamp>/`
2. Pull nuove Docker images da GitHub Container Registry
3. Stop servizi (payload e frontend)
4. Crea `docker-compose.prod.yml` con nuovi image tags
5. Start servizi con nuove images
6. Health check su payload (http://localhost:3000/api)
7. Health check su frontend (http://localhost:3001)
8. Rollback automatico se health check fallisce
9. Cleanup images vecchie (mantiene ultime 3 versioni)

**Volumi preservati:**
- ✅ `postgres_data` - NON toccato
- ✅ `payload_media` - NON toccato

### reset-db-lemmario.sh

Eseguito automaticamente da GitHub Actions workflow "Database Reset".

**Sintassi:**
```bash
./reset-db-lemmario.sh [--seed]
```

**Esempio:**
```bash
./reset-db-lemmario.sh           # Reset senza seed
./reset-db-lemmario.sh --seed    # Reset con seed dati
```

**Cosa fa:**
1. Richiede conferma interattiva "YES_DELETE_DATABASE"
2. Backup finale pre-reset in `/home/dhomeka/backups/pre-reset-<timestamp>/`
3. Stop tutti i servizi
4. **Rimuove volume postgres_data** (DATI PERSI!)
5. Ricrea postgres con database vuoto
6. Esegue init-db.sql automaticamente
7. Start payload per migrations
8. Opzionale: esegue `pnpm db:seed`
9. Start frontend

**Volumi preservati:**
- ✅ `payload_media` - SEMPRE preservato
- ❌ `postgres_data` - CANCELLATO

## Troubleshooting

### Script deploy fallisce su pull images

**Problema**: `Error response from daemon: pull access denied`

**Soluzione**:
1. Verifica che le images siano pubbliche su GHCR oppure
2. Login al GHCR sul server:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

### Health check fallisce

**Problema**: Deploy fallisce al passo 6 o 7 (health check)

**Soluzione**:
```bash
# Check logs servizi
docker compose -f /home/dhomeka/lemmario_ts/docker-compose.yml logs payload
docker compose -f /home/dhomeka/lemmario_ts/docker-compose.yml logs frontend

# Verifica porte
ss -tlnp | grep -E '3000|3001'

# Restart manuale
docker compose -f /home/dhomeka/lemmario_ts/docker-compose.yml restart
```

### Volume postgres_data non trovato durante reset

**Problema**: `Error: No such volume: lemmario_ts_postgres_data`

**Soluzione**: Il nome del volume potrebbe essere diverso. Controlla:
```bash
docker volume ls | grep postgres

# Modifica VOLUME_NAME nello script reset-db-lemmario.sh se necessario
```

### Backup directory piena

**Problema**: Disco pieno a causa di troppi backup

**Soluzione**: Cleanup automatico vecchi backup (configura cron):
```bash
# Aggiungi a crontab
crontab -e

# Aggiungi questa riga (cleanup ogni settimana, mantiene ultimi 30 giorni)
0 2 * * 0 find /home/dhomeka/backups/ -type d -mtime +30 -exec rm -rf {} +
```

## Sicurezza

- ✅ Script eseguibili solo da owner (permessi 750)
- ✅ Backup automatico prima di ogni operazione
- ✅ Conferma interattiva per reset DB
- ✅ Rollback automatico su failure
- ✅ Non committa mai `.env` o secrets

## Rollback Manuale

Se il deploy automatico fallisce e vuoi fare rollback manualmente:

```bash
# 1. SSH sul server
ssh dhomeka@90.147.144.145

# 2. Trova SHA commit precedente
docker images ghcr.io/<owner>/lemmario-payload

# Output esempio:
# REPOSITORY                              TAG         IMAGE ID       CREATED
# ghcr.io/unica-dh/lemmario-payload      sha-abc123  xxx            2 hours ago
# ghcr.io/unica-dh/lemmario-payload      sha-def456  yyy            1 day ago

# 3. Rideploy versione precedente
/home/dhomeka/deploy-lemmario.sh def456

# 4. (Opzionale) Restore backup database se necessario
cat /home/dhomeka/backups/lemmario-20260123-150000/lemmario_db.sql | \
  docker compose -f /home/dhomeka/lemmario_ts/docker-compose.yml \
  exec -T postgres psql -U lemmario_user lemmario_db
```

## Monitoraggio

### Verifica stato servizi
```bash
docker ps --filter "name=lemmario"
```

### Logs in real-time
```bash
docker compose -f /home/dhomeka/lemmario_ts/docker-compose.yml logs -f
```

### Health check manuale
```bash
curl http://localhost:3000/api    # Payload backend
curl http://localhost:3001         # Frontend
```

### Lista backup disponibili
```bash
ls -lht /home/dhomeka/backups/
```
