# Guida Setup CI/CD per Lemmario

Questa guida descrive come configurare il sistema completo di CI/CD per deploy automatico dell'applicazione Lemmario su server VPN.

## Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Prerequisiti](#prerequisiti)
3. [Setup Fase 1: Self-Hosted Runner](#setup-fase-1-self-hosted-runner)
4. [Setup Fase 2: Configurazione GitHub](#setup-fase-2-configurazione-github)
5. [Setup Fase 3: Test Workflow CI](#setup-fase-3-test-workflow-ci)
6. [Setup Fase 4: Attivazione Deploy Automatico](#setup-fase-4-attivazione-deploy-automatico)
7. [Setup Fase 5: Workflow Reset Database](#setup-fase-5-workflow-reset-database)
8. [Verifica End-to-End](#verifica-end-to-end)
9. [Operazioni Comuni](#operazioni-comuni)
10. [Troubleshooting](#troubleshooting)

## Panoramica Sistema

Il sistema CI/CD implementato include:

- **3 GitHub Actions Workflow**:
  - **CI**: Lint, typecheck e build su ogni push/PR
  - **CD**: Build Docker images, push a GHCR, deploy automatico su main
  - **Reset DB**: Reset database manuale con conferme di sicurezza

- **Self-Hosted Runner** sul server VPN per accesso diretto

- **GitHub Container Registry (GHCR)** per hosting Docker images

- **Script bash** sul server per deploy e reset DB con:
  - Backup automatico database
  - Health checks
  - Rollback automatico su failure

## Prerequisiti

Prima di iniziare, assicurati di avere:

- ✅ Accesso SSH al server VPN: `dhruby@90.147.144.147`
- ✅ Docker e docker-compose installati e funzionanti sul server
- ✅ Permessi admin sul repository GitHub
- ✅ Utente `dhruby` nel gruppo `docker` sul server
- ✅ Applicazione Lemmario funzionante con docker-compose

## Setup Fase 1: Self-Hosted Runner

### 1.1 Connessione al Server

```bash
ssh dhruby@90.147.144.147
```

### 1.2 Installazione Runner

```bash
# Crea directory per runner
mkdir -p /home/dhruby/actions-runner
cd /home/dhruby/actions-runner

# Scarica ultima versione runner (controlla https://github.com/actions/runner/releases per versione aggiornata)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Estrai archivio
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### 1.3 Ottieni Token di Registrazione

Sul repository GitHub:

1. Vai su **Settings** > **Actions** > **Runners**
2. Clicca **New self-hosted runner**
3. Seleziona **Linux** come sistema operativo
4. Copia il comando `./config.sh` mostrato (contiene il token temporaneo)

### 1.4 Configura Runner

```bash
# Esegui il comando copiato da GitHub (esempio):
./config.sh --url https://github.com/<owner>/<repo> --token <RUNNER_TOKEN>

# Durante la configurazione, rispondi:
# - Enter the name of the runner group: [Invio] (usa Default)
# - Enter the name of runner: lemmario-vpn-runner
# - Enter any additional labels: vpn
# - Enter name of work folder: [Invio] (usa _work default)
```

**Output atteso:**
```
✓ Runner successfully added
✓ Runner connection is good
```

### 1.5 Installa Runner come Servizio Systemd

```bash
# Installa servizio (richiede sudo)
sudo ./svc.sh install dhruby

# Avvia servizio
sudo ./svc.sh start

# Verifica stato
sudo ./svc.sh status
```

**Output atteso:**
```
● actions.runner.<owner-repo>.<runner-name>.service - GitHub Actions Runner
   Loaded: loaded
   Active: active (running)
```

### 1.6 Verifica Runner su GitHub

Torna su **Settings** > **Actions** > **Runners**. Dovresti vedere:

- Nome: `lemmario-vpn-runner`
- Status: **Idle** (verde)
- Labels: `self-hosted`, `Linux`, `X64`, `vpn`

### 1.7 Verifica Permessi Docker

```bash
# Aggiungi utente dhruby al gruppo docker (se non già fatto)
sudo usermod -aG docker dhruby

# Applica cambiamenti gruppo (o logout/login)
newgrp docker

# Testa accesso Docker
docker ps
docker compose version
```

### 1.8 Installa Script Deploy

```bash
# Copia script dal repository (da locale)
scp scripts/deploy/deploy-lemmario.sh dhruby@90.147.144.147:/home/dhruby/
scp scripts/deploy/reset-db-lemmario.sh dhruby@90.147.144.147:/home/dhruby/

# Torna su SSH server
# Imposta permessi
chmod 750 /home/dhruby/deploy-lemmario.sh
chmod 750 /home/dhruby/reset-db-lemmario.sh

# Crea directory backup
mkdir -p /home/dhruby/backups
```

### 1.9 Configura GHCR Registry negli Script

**IMPORTANTE**: Modifica la variabile `GHCR_REGISTRY` nello script deploy:

```bash
nano /home/dhruby/deploy-lemmario.sh

# Trova la riga (circa linea 15):
GHCR_REGISTRY="ghcr.io/MODIFICA_OWNER_QUI"

# Sostituisci con il tuo GitHub username o organization, esempio:
GHCR_REGISTRY="ghcr.io/unica-dh"

# Salva: Ctrl+X, Y, Enter
```

### 1.10 Test Script Deploy (Opzionale)

Prima di attivare GitHub Actions, testa lo script manualmente:

```bash
# Verifica Docker compose funzionante
cd /home/dhruby/lemmario-ts
docker compose ps

# Test deploy con tag latest (usa images già presenti localmente)
/home/dhruby/deploy-lemmario.sh latest
```

✅ **Fase 1 Completata!** Il runner è installato e pronto a ricevere job da GitHub Actions.

---

## Setup Fase 2: Configurazione GitHub

### 2.1 Configura Workflow Permissions

Nel repository GitHub:

1. Vai su **Settings** > **Actions** > **General**
2. Scorri fino a **Workflow permissions**
3. Seleziona: ☑️ **Read and write permissions**
4. Abilita (opzionale): ☑️ **Allow GitHub Actions to create and approve pull requests**
5. Clicca **Save**

Questo permette ai workflow di:
- Pushare Docker images a GHCR (`packages: write`)
- Leggere codice repository (`contents: read`)

### 2.2 Configura Environments (Opzionale ma Raccomandato)

#### Environment: production

1. Vai su **Settings** > **Environments** > **New environment**
2. Nome: `production`
3. (Opzionale) Aggiungi **Protection rules**:
   - **Required reviewers**: Seleziona 1+ utenti che devono approvare deploy
   - **Wait timer**: Es. 5 minuti prima di eseguire
4. Clicca **Save protection rules**

#### Environment: production-destructive

1. Vai su **Settings** > **Environments** > **New environment**
2. Nome: `production-destructive`
3. **RACCOMANDATO** - Aggiungi **Protection rules**:
   - **Required reviewers**: Seleziona almeno 1 admin
   - Questo previene reset DB accidentali
4. Clicca **Save protection rules**

### 2.3 Verifica Package Settings

Dopo il primo push di images a GHCR:

1. Vai su **Packages** (dal profilo GitHub o organization)
2. Trova `lemmario-payload` e `lemmario-frontend`
3. Clicca su ciascun package > **Package settings**
4. Verifica **Visibility**:
   - **Private**: Solo collaboratori possono fare pull (più sicuro)
   - **Public**: Chiunque può fare pull (più semplice per runner)
5. Se Private, assicurati che il runner abbia accesso (login Docker sul server):
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
   ```

✅ **Fase 2 Completata!** GitHub è configurato per CI/CD.

---

## Setup Fase 3: Test Workflow CI

Il workflow CI è già presente in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Testiamolo.

### 3.1 Crea Branch Test

```bash
# Da locale
git checkout -b feature/test-ci-cd
```

### 3.2 Modifica File Test

```bash
# Modifica file di test (es. README.md)
echo "\n<!-- Test CI/CD -->" >> README.md
git add README.md
git commit -m "test: verifica workflow CI"
```

### 3.3 Push Branch

```bash
git push origin feature/test-ci-cd
```

### 3.4 Verifica Workflow CI

1. Vai su **Actions** tab nel repository
2. Dovresti vedere workflow **"CI - Lint, Typecheck, Build"** in esecuzione
3. Clicca sul workflow per vedere logs
4. Aspetta completamento (~3-5 minuti)

**Jobs attesi:**
- ✅ **lint-and-typecheck**: Esegue `pnpm lint` e `pnpm typecheck`
- ✅ **build**: Esegue `pnpm build` per entrambi i package

### 3.5 Crea Pull Request (Opzionale)

Crea PR verso `main` per verificare che CI si esegua anche su PR:

1. Vai su **Pull requests** > **New pull request**
2. Base: `main`, Compare: `feature/test-ci-cd`
3. Crea PR
4. Verifica che CI si esegua automaticamente

✅ **Fase 3 Completata!** Il workflow CI funziona correttamente.

---

## Setup Fase 4: Attivazione Deploy Automatico

Il workflow CD è in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Si attiva automaticamente su push a `main`.

### 4.1 Merge Test Branch su Main

```bash
# Opzione 1: Merge via PR (raccomandato)
# Completa il merge della PR creata nella Fase 3

# Opzione 2: Merge diretto (se non hai creato PR)
git checkout main
git pull origin main
git merge feature/test-ci-cd
git push origin main
```

### 4.2 Monitora Primo Deploy

1. Vai su **Actions** tab
2. Clicca sul workflow **"CD - Build and Deploy"** appena avviato
3. Vedrai 2 job:

#### Job 1: build-and-push (~5-7 minuti)

- Build Docker image per `payload`
- Build Docker image per `frontend`
- Push entrambi a GHCR con tags `latest` e `sha-<commit>`

**Logs attesi:**
```
✓ Checkout repository
✓ Set up Docker Buildx
✓ Log in to GitHub Container Registry
✓ Extract metadata and commit SHA
✓ Build and push Payload image
  => exporting to image
  => pushing layers
  => pushing manifest for ghcr.io/<owner>/lemmario-payload:latest
✓ Build and push Frontend image
  => pushing manifest for ghcr.io/<owner>/lemmario-frontend:latest
```

#### Job 2: deploy (~3-5 minuti)

- Eseguito su **self-hosted runner** (lemmario-vpn-runner)
- Esegue script `/home/dhruby/deploy-lemmario.sh`

**Logs attesi:**
```
==========================================
Lemmario Deploy - Thu Jan 23 18:30:00 2026
Commit SHA: abc1234
==========================================
[1/8] Backing up database...
Backup saved to: /home/dhruby/backups/lemmario-20260123-183000/lemmario_db.sql
[2/8] Pulling new images from GHCR...
sha-abc1234: Pulling from <owner>/lemmario-payload
...
[3/8] Stopping services...
[4/8] Updating docker-compose.prod.yml with new tags...
[5/8] Starting services with new images...
[6/8] Health checking payload service...
Payload is healthy!
[7/8] Health checking frontend service...
Frontend is healthy!
[8/8] Cleaning up old images...
==========================================
Deploy completed successfully!
Backup: /home/dhruby/backups/lemmario-20260123-183000
==========================================
```

### 4.3 Verifica Applicazione

```bash
# SSH sul server
ssh dhruby@90.147.144.147

# Verifica servizi running
docker ps --filter "name=lemmario"

# Test endpoint
curl http://localhost:3000/api
curl http://localhost:3001
```

### 4.4 Verifica Images su GHCR

1. Vai su `https://github.com/<owner>?tab=packages`
2. Dovresti vedere:
   - **lemmario-payload** con tags `latest` e `sha-<commit>`
   - **lemmario-frontend** con tags `latest` e `sha-<commit>`

### 4.5 Verifica Backup Creato

```bash
ssh dhruby@90.147.144.147
ls -lh /home/dhruby/backups/
```

Dovresti vedere directory con timestamp del deploy.

✅ **Fase 4 Completata!** Deploy automatico funzionante!

Da ora in poi, **ogni push su `main` farà deploy automatico** su server VPN.

---

## Setup Fase 5: Workflow Reset Database

Il workflow per reset DB è in [`.github/workflows/reset-db.yml`](.github/workflows/reset-db.yml). È **manuale** (non si attiva automaticamente).

### 5.1 Test Reset DB (CON CAUTELA)

⚠️ **ATTENZIONE**: Questo workflow **cancella tutti i dati** del database!

1. Vai su **Actions** > **Database Reset (DESTRUCTIVE)**
2. Clicca **Run workflow**
3. Seleziona branch: `main`
4. Input:
   - **confirmation**: Seleziona `YES_DELETE_DATABASE` (NON "NO")
   - **run_seed**: ✅ Spunta per eseguire seed dopo reset
5. Clicca **Run workflow**
6. Se hai configurato environment `production-destructive` con reviewers, dovrai attendere approvazione

### 5.2 Monitora Execution

Workflow esegue:
1. Verifica conferma input
2. Esegue `/home/dhruby/reset-db-lemmario.sh --seed`
3. Verifica servizi dopo reset

**Logs attesi:**
```
✓ Verify confirmation
✓ Execute database reset
  ==========================================
  Lemmario Database Reset - Thu Jan 23 19:00:00 2026
  Run seed: true
  ==========================================
  [1/9] Creating final backup...
  [2/9] Stopping all services...
  [3/9] Removing postgres container...
  [4/9] Removing postgres_data volume...
  [5/9] Starting postgres with fresh database...
  [6/9] Waiting for postgres to be healthy...
  Postgres is ready!
  [7/9] Starting payload to run migrations...
  [8/9] Running database seed...
  [9/9] Starting frontend...
  ==========================================
  Database reset completed successfully!
✓ Verify services after reset
```

### 5.3 Verifica Database Resettato

Accedi al Payload admin panel e verifica che database sia vuoto (o con dati seed se hai abilitato).

✅ **Fase 5 Completata!** Tutti i workflow sono configurati e testati.

---

## Verifica End-to-End

### Test Completo Deploy Pipeline

1. **Crea branch feature**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Modifica codice**:
   ```bash
   # Es. modifica README
   echo "Nuova feature" >> README.md
   git add README.md
   git commit -m "feat: nuova feature test"
   git push origin feature/new-feature
   ```

3. **Verifica CI eseguito su branch**:
   - Actions > CI workflow deve essere ✅ verde

4. **Crea Pull Request**:
   - PR verso `main`
   - Verifica CI si esegue su PR

5. **Merge PR**:
   - Approva e mergia PR su `main`

6. **Deploy automatico**:
   - Actions > CD workflow si avvia automaticamente
   - Monitora build e deploy
   - Dopo 8-12 minuti, verifica applicazione aggiornata

7. **Verifica backup**:
   ```bash
   ssh dhruby@90.147.144.147
   ls -lh /home/dhruby/backups/
   ```

✅ **Pipeline End-to-End Funzionante!**

---

## Operazioni Comuni

### Deploy Manuale

Se vuoi fare deploy senza pushare su `main`:

1. Actions > **CD - Build and Deploy**
2. **Run workflow**
3. Seleziona branch da deployare
4. Clicca **Run workflow**

### Rollback a Versione Precedente

#### Opzione 1: Rollback via Script (Più Veloce)

```bash
# SSH sul server
ssh dhruby@90.147.144.147

# Trova SHA commit precedente
docker images ghcr.io/<owner>/lemmario-payload

# Output:
# REPOSITORY                              TAG         CREATED
# ghcr.io/<owner>/lemmario-payload       sha-abc123  2 hours ago
# ghcr.io/<owner>/lemmario-payload       sha-def456  1 day ago

# Rideploy versione precedente
/home/dhruby/deploy-lemmario.sh def456
```

#### Opzione 2: Rollback via Git Revert

```bash
# Trova commit da revertire
git log --oneline

# Revert commit
git revert <commit-sha>
git push origin main

# CD workflow si attiverà e deployerà versione revertita
```

### Restore Backup Database

Se devi ripristinare un backup:

```bash
ssh dhruby@90.147.144.147

# Lista backup disponibili
ls -lh /home/dhruby/backups/

# Restore backup
cat /home/dhruby/backups/lemmario-20260123-150000/lemmario_db.sql | \
  docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml \
  exec -T postgres psql -U lemmario_user lemmario_db
```

### Visualizza Logs Deploy

#### Da GitHub Actions

1. Actions > Workflow run
2. Clicca su job "deploy"
3. Espandi step "Deploy with script"

#### Da Server

```bash
ssh dhruby@90.147.144.147

# Logs Docker Compose
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml logs -f

# Logs singolo servizio
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml logs -f payload
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml logs -f frontend
```

### Cleanup Backup Vecchi

Configura cleanup automatico con cron:

```bash
ssh dhruby@90.147.144.147

# Apri crontab
crontab -e

# Aggiungi (cleanup ogni domenica alle 2 AM, mantiene ultimi 30 giorni)
0 2 * * 0 find /home/dhruby/backups/ -type d -mtime +30 -exec rm -rf {} + 2>/dev/null
```

### Cleanup Images Docker Vecchie

Il deploy script già pulisce automaticamente, ma puoi farlo manualmente:

```bash
ssh dhruby@90.147.144.147

# Rimuovi images non utilizzate
docker image prune -a -f

# Rimuovi images specifiche vecchie
docker images ghcr.io/<owner>/lemmario-payload --format "{{.ID}} {{.CreatedAt}}" \
  | sort -rk 2 | tail -n +6 | awk '{print $1}' | xargs docker rmi
```

---

## Troubleshooting

### Runner non appare su GitHub

**Problema**: Runner non visibile in Settings > Actions > Runners

**Soluzione**:
```bash
ssh dhruby@90.147.144.147

# Verifica servizio
sudo systemctl status actions.runner.*

# Restart servizio
sudo /home/dhruby/actions-runner/svc.sh restart

# Check logs
journalctl -u actions.runner.* -f
```

### Build fallisce: "failed to push to registry"

**Problema**: GitHub Actions non riesce a pushare su GHCR

**Causa**: Workflow permissions non configurate

**Soluzione**:
1. Settings > Actions > General > Workflow permissions
2. Seleziona: "Read and write permissions"
3. Save

### Deploy fallisce: "Health check failed"

**Problema**: Deploy script fallisce al health check

**Soluzione**:
```bash
ssh dhruby@90.147.144.147

# Check logs payload
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml logs payload

# Verifica porte
ss -tlnp | grep -E '3000|3001'

# Verifica se servizio è up ma non risponde
docker ps

# Restart manuale
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml restart
```

### Deploy fallisce: "permission denied" su script

**Problema**: Script deploy non eseguibile

**Soluzione**:
```bash
ssh dhruby@90.147.144.147
chmod 750 /home/dhruby/deploy-lemmario.sh
```

### Runner non ha accesso a Docker

**Problema**: Job fallisce con "permission denied" su docker commands

**Soluzione**:
```bash
ssh dhruby@90.147.144.147

# Aggiungi utente dhruby a gruppo docker
sudo usermod -aG docker dhruby

# Restart servizio runner
sudo /home/dhruby/actions-runner/svc.sh restart

# Verifica
docker ps
```

### GHCR pull access denied dal server

**Problema**: Script deploy non riesce a pullare images private da GHCR

**Soluzione**: Login Docker al GHCR sul server
```bash
ssh dhruby@90.147.144.147

# Crea Personal Access Token su GitHub con scope 'read:packages'
# Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate

# Login
echo <GITHUB_TOKEN> | docker login ghcr.io -u <username> --password-stdin
```

### Database connection error post-reset

**Problema**: Dopo reset DB, payload non si connette al database

**Soluzione**:
```bash
ssh dhruby@90.147.144.147

# Verifica volume postgres_data esiste
docker volume ls | grep postgres

# Restart postgres
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml restart postgres

# Verifica logs
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml logs postgres

# Se necessario, ricrea database
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml down
docker volume rm lemmario_ts_postgres_data
docker compose -f /home/dhruby/lemmario-ts/docker-compose.yml up -d
```

### Disco pieno su server

**Problema**: Backup e images riempiono disco

**Soluzione**:
```bash
ssh dhruby@90.147.144.147

# Check spazio disco
df -h /home/dhruby
docker system df

# Cleanup backup vecchi (>30 giorni)
find /home/dhruby/backups/ -type d -mtime +30 -exec rm -rf {} +

# Cleanup images Docker non usate
docker system prune -a -f

# Cleanup build cache
docker builder prune -a -f
```

---

## Badge CI/CD nel README

Aggiungi badge nel README.md per mostrare status CI/CD:

```markdown
![CI Status](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
![CD Status](https://github.com/<owner>/<repo>/actions/workflows/deploy.yml/badge.svg)
```

---

## Risorse

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## Supporto

Per problemi o domande:

1. Verifica [Troubleshooting](#troubleshooting) in questa guida
2. Controlla logs GitHub Actions e server
3. Consulta [scripts/deploy/README.md](../scripts/deploy/README.md)
4. Apri issue su GitHub repository

---

**Setup completato! 🎉**

Il sistema CI/CD è ora completamente configurato e funzionante. Ogni push su `main` deployerà automaticamente l'applicazione sul server VPN con backup del database e rollback automatico in caso di problemi.
