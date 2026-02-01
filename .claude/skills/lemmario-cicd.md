# Lemmario CI/CD Strategy

Strategia di Continuous Integration e Deployment per il progetto Lemmario.

---

## Quando Usare

Usa questa skill quando:
- Devi configurare o modificare pipeline CI/CD
- Devi capire la differenza tra deploy iniziale e aggiornamento
- Devi eseguire operazioni sul server remoto
- Devi debuggare problemi di deployment

---

## Architettura CI/CD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│                          (main branch)                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CI Workflow  │     │  CD Workflow    │     │  Data Workflows │
│  (ci.yml)     │     │  (deploy.yml)   │     │  (migration/    │
│               │     │                 │     │   reset-db)     │
│  - lint       │     │  - build images │     │                 │
│  - typecheck  │     │  - push GHCR    │     │  - Manual only  │
│  - build      │     │  - deploy VPN   │     │  - Requires     │
│               │     │  - health check │     │    confirmation │
│  Trigger:     │     │                 │     │                 │
│  every push   │     │  Trigger:       │     │                 │
│               │     │  push to main   │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                      ┌─────────────────┐
                      │  VPN Server     │
                      │  (self-hosted   │
                      │   runner)       │
                      │                 │
                      │  90.147.144.147 │
                      │  /home/dhruby/  │
                      │  lemmario-ts/   │
                      └─────────────────┘
```

---

## Tre Tipi di Operazioni

### 1. CI - Continuous Integration

**Trigger:** Ogni push su qualsiasi branch, ogni PR verso main

**Workflow:** `.github/workflows/ci.yml`

**Azioni:**
```bash
pnpm lint       # ESLint
pnpm typecheck  # TypeScript
pnpm build      # Compila tutto
```

**Runner:** `ubuntu-latest` (GitHub-hosted)

**Non tocca:** Database, Server remoto, Docker images

---

### 2. CD - Deploy Aggiornamento

**Trigger:** Push su `main` (dopo merge PR)

**Workflow:** `.github/workflows/deploy.yml`

**Azioni:**
1. Build Docker images (Payload + Frontend)
2. Push a GitHub Container Registry (GHCR)
3. Deploy su server VPN via self-hosted runner

**IMPORTANTE: Preserva tutti i dati**

```bash
# Lo script deploy-lemmario.sh:
# 1. Fa backup del database
# 2. Scarica nuove immagini
# 3. Ferma SOLO payload e frontend
# 4. NON TOCCA il volume postgres_data
# 5. Riavvia con nuove immagini
# 6. Verifica health check
```

**Rollback automatico:** Se health check fallisce, ripristina immagini precedenti.

---

### 3. Zero Deploy - Inizializzazione da Zero

**Quando:** Prima installazione o reset completo

**NON E' UN WORKFLOW AUTOMATICO** - Richiede intervento manuale o workflow separati.

**Sequenza:**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Reset Database (Manuale o reset-db.yml)           │
│  - Rimuove volume postgres_data                             │
│  - Ricrea database vuoto                                    │
│  - Payload crea schema via migrations                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Deploy Applicazione (deploy.yml)                  │
│  - Build e push Docker images                               │
│  - Avvia Payload (crea tabelle automaticamente)             │
│  - Avvia Frontend                                           │
│  - Health checks                                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Creazione Admin + Lemmario (Manuale)              │
│  - Crea utente admin via Admin UI                           │
│  - Crea Lemmario di destinazione                            │
│  - Annota ID del lemmario                                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Migrazione Dati (data-migration.yml)              │
│  - Esegui dry-run prima                                     │
│  - Poi migrate con lemmario_id corretto                     │
│  - Verifica conteggi                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflows GitHub Actions

### ci.yml

```yaml
name: CI
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
```

### deploy.yml

```yaml
name: CD
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push Payload
        uses: docker/build-push-action@v5
        with:
          context: ./packages/payload-cms
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/lemmario-payload:latest
            ghcr.io/${{ github.repository_owner }}/lemmario-payload:sha-${{ github.sha }}
      # ... similar for frontend

  deploy:
    needs: build
    runs-on: [self-hosted, Linux, X64]
    steps:
      - name: Deploy
        run: /home/dhruby/lemmario-ts/scripts/deploy/deploy-lemmario.sh ${{ github.sha }}
```

### reset-db.yml

```yaml
name: Reset Database
on:
  workflow_dispatch:
    inputs:
      confirmation:
        description: 'Scrivi YES_DELETE_DATABASE per confermare'
        required: true
        default: 'NO'

jobs:
  reset:
    if: github.event.inputs.confirmation == 'YES_DELETE_DATABASE'
    runs-on: [self-hosted, Linux, X64]
    environment: production-destructive
    steps:
      - name: Reset database
        run: /home/dhruby/lemmario-ts/scripts/deploy/reset-db-lemmario.sh
```

### data-migration.yml

```yaml
name: Data Migration
on:
  workflow_dispatch:
    inputs:
      lemmario_id:
        description: 'ID del Lemmario'
        required: true
        default: '1'
      mode:
        description: 'Modalita'
        type: choice
        options:
          - dry-run
          - migrate
          - migrate-force

jobs:
  migrate:
    runs-on: [self-hosted, Linux, X64]
    steps:
      - uses: actions/checkout@v4
      - name: Run migration
        env:
          API_URL: http://localhost:3000/api
          LEMMARIO_ID: ${{ inputs.lemmario_id }}
        run: |
          cd scripts
          pnpm install
          pnpm migrate
```

---

## Script di Deploy

### deploy-lemmario.sh

**Percorso remoto:** `/home/dhruby/lemmario-ts/scripts/deploy/deploy-lemmario.sh`

**Funzioni:**

```bash
# 1. Backup database
backup_database() {
  docker exec lemmario_db pg_dump -U lemmario_user lemmario_db > backup_$(date +%Y%m%d_%H%M%S).sql
}

# 2. Pull nuove immagini
pull_images() {
  docker pull ghcr.io/unica-dh/lemmario-payload:sha-$SHA
  docker pull ghcr.io/unica-dh/lemmario-frontend:sha-$SHA
}

# 3. Stop servizi (preserva DB)
stop_services() {
  docker compose stop payload frontend
}

# 4. Update docker-compose con nuovi tag
update_compose() {
  sed -i "s|image:.*lemmario-payload.*|image: ghcr.io/unica-dh/lemmario-payload:sha-$SHA|" docker-compose.prod.yml
}

# 5. Start e health check
start_and_verify() {
  docker compose up -d payload frontend
  # Retry health check 24 volte, ogni 5 secondi
  for i in {1..24}; do
    if curl -s http://localhost:3000/api/access; then
      return 0
    fi
    sleep 5
  done
  return 1
}

# 6. Rollback se fallisce
rollback() {
  # Ripristina immagini precedenti
  sed -i "s|sha-$SHA|sha-$PREV_SHA|" docker-compose.prod.yml
  docker compose up -d payload frontend
}
```

### reset-db-lemmario.sh

**Percorso remoto:** `/home/dhruby/lemmario-ts/scripts/deploy/reset-db-lemmario.sh`

**ATTENZIONE: Operazione distruttiva**

```bash
# 1. Backup finale
backup_final() {
  docker exec lemmario_db pg_dump -U lemmario_user lemmario_db > backup_final_$(date +%Y%m%d_%H%M%S).sql
}

# 2. Stop tutto
docker compose down

# 3. Rimuovi volume database
docker volume rm lemmario-ts_postgres_data

# 4. Ricrea database
docker compose up postgres -d
sleep 10

# 5. Avvia Payload (crea schema)
docker compose up payload -d
# Payload migrations creano automaticamente le tabelle
```

---

## Self-Hosted Runner

### Configurazione

```bash
# Sul server VPN
cd /home/dhruby/actions-runner

# Configurazione iniziale (una tantum)
./config.sh --url https://github.com/<owner>/<repo> --token <TOKEN>

# Avvio come servizio
sudo ./svc.sh install
sudo ./svc.sh start
```

### Labels

```
self-hosted, Linux, X64, vpn
```

### Troubleshooting Runner

```bash
# Status
sudo systemctl status actions.runner.<owner>-<repo>.<runner-name>.service

# Logs
sudo journalctl -u actions.runner.<owner>-<repo>.<runner-name>.service -f

# Restart
sudo systemctl restart actions.runner.<owner>-<repo>.<runner-name>.service
```

---

## Matrice Operazioni

| Operazione | Workflow | Trigger | Distrugge Dati? | Richiede Conferma? |
|------------|----------|---------|-----------------|-------------------|
| Lint/Build | ci.yml | Ogni push | No | No |
| Deploy Update | deploy.yml | Push main | No | No |
| Reset DB | reset-db.yml | Manuale | SI | SI (reviewer) |
| Migrazione | data-migration.yml | Manuale | No* | Si per force |

*La migrazione non distrugge dati esistenti ma puo creare duplicati se eseguita piu volte.

---

## Best Practices

### Prima di un Deploy

1. Verifica CI passa su main
2. Review PR approvata
3. Test locale completato

### Prima di un Reset DB

1. **Backup off-site** del database
2. Conferma che il reset e necessario
3. Prepara lista operazioni post-reset (admin, lemmario, migrazione)

### Prima di una Migrazione

1. Esegui dry-run
2. Verifica conteggi attesi (83 fonti, 234 lemmi)
3. Verifica access control temporaneo impostato
4. Prepara rollback plan (reset DB se fallisce)

---

## Troubleshooting

### Deploy Fallito

```bash
# Verifica logs
ssh dhruby@90.147.144.147
docker logs lemmario_payload --tail 100
docker logs lemmario_frontend --tail 100

# Health check manuale
curl http://localhost:3000/api/access
curl http://localhost:3001/
```

### Runner Non Risponde

```bash
# Sul server VPN
sudo systemctl restart actions.runner.<service-name>.service
```

### Immagini Non Trovate

```bash
# Verifica login GHCR
docker login ghcr.io -u <username>

# Verifica immagini esistono
docker pull ghcr.io/unica-dh/lemmario-payload:latest
```

---

## Checklist Zero Deploy

- [ ] Reset DB eseguito (reset-db.yml con conferma)
- [ ] Deploy eseguito (deploy.yml)
- [ ] Payload raggiungibile su :3000/admin
- [ ] Utente admin creato
- [ ] Lemmario creato (annota ID)
- [ ] Access control temporaneo impostato (se necessario per migrazione API)
- [ ] Migrazione dry-run verificata
- [ ] Migrazione eseguita
- [ ] Conteggi verificati (fonti, lemmi, definizioni)
- [ ] Access control ripristinato
- [ ] Frontend raggiungibile su :3001
- [ ] Test manuale visualizzazione dati
