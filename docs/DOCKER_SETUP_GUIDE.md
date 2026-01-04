# Guida Setup Ambiente Docker - Lemmario

Guida completa per configurare e gestire l'ambiente di sviluppo locale con Docker.

---

## 📋 Prerequisiti

- **Docker Engine** 24.0+ e **Docker Compose** v2 (comando `docker compose`, NON `docker-compose`)
- **pnpm** 8.15.1+ (installato globalmente: `npm install -g pnpm@8.15.1`)
- **Node.js** 20 LTS (per sviluppo locale senza Docker)

Verifica versioni:
```bash
docker --version          # >= 24.0
docker compose version    # v2.x
pnpm --version           # >= 8.15.1
node --version           # >= 20.0
```

---

## 🚀 Setup Iniziale (Prima Volta)

### 1. Clona il repository
```bash
git clone https://github.com/Unica-dh/lemmario-ts.git
cd lemmario-ts
```

### 2. Installa dipendenze localmente
**IMPORTANTE**: Le dipendenze devono essere installate **prima** di avviare Docker.

```bash
pnpm install
```

Questo comando:
- Installa dipendenze in `node_modules` root e nelle cartelle `packages/*/node_modules`
- Crea symlink per il workspace pnpm
- Le `node_modules` locali NON vengono montate in Docker (solo codice sorgente)

### 3. Configura variabili d'ambiente
```bash
cp .env.example .env
```

Modifica `.env` se necessario (per sviluppo locale i default vanno bene):
```env
DATABASE_URI=postgres://lemmario_user:lemmario_dev_password_2026@postgres:5432/lemmario_db
PAYLOAD_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 4. Avvia Docker Compose (prima volta)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Questo comando:
- `-f docker-compose.yml`: configurazione base (PostgreSQL, network, porte)
- `-f docker-compose.dev.yml`: override per sviluppo (volumi source code, hot-reload)
- `up -d`: avvia in background (detached mode)
- `--build`: forza rebuild immagini (necessario la prima volta)

**Tempo stimato**: ~30-60 secondi (dipende da cache Docker)

### 5. Verifica servizi attivi
```bash
docker compose ps
```

Output atteso:
```
NAME                STATUS              PORTS
lemmario_db         Up (healthy)        0.0.0.0:5432->5432/tcp
lemmario_payload    Up                  0.0.0.0:3000->3000/tcp
lemmario_frontend   Up                  0.0.0.0:3001->3000/tcp
```

### 6. Esegui migrazioni database
```bash
docker compose exec payload pnpm db:migrate
```

Questo crea tutte le tabelle nel database PostgreSQL.

### 7. (Opzionale) Seed dati di test
```bash
docker compose exec payload pnpm db:seed
```

Questo popola il database con:
- Un utente admin (email: `admin@lemmario.dev`, password: `password`)
- Un lemmario di esempio
- Livelli di razionalità (1-6)

---

## 🔄 Comandi Quotidiani

### Avvio ambiente (dopo setup iniziale)
```bash
# Senza rebuild (più veloce, usa cache)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Verifica log in tempo reale
docker compose logs -f payload
docker compose logs -f frontend
```

### Stop ambiente
```bash
# Stop mantenendo dati DB
docker compose down

# Stop e rimozione volumi (CANCELLA DB)
docker compose down -v
```

### Restart singolo servizio
```bash
docker compose restart payload
docker compose restart frontend
docker compose restart postgres
```

### Accesso shell nei container
```bash
# Shell nel container payload
docker compose exec payload sh

# Shell nel container frontend
docker compose exec frontend sh

# Accesso PostgreSQL
docker compose exec postgres psql -U lemmario_user -d lemmario_db
```

### Visualizzare log
```bash
# Tutti i servizi (ultime 50 righe)
docker compose logs --tail=50

# Singolo servizio con follow
docker compose logs -f payload

# Filtra errori
docker compose logs payload | grep -i error
```

---

## 🗄️ Gestione Database

### Reset completo database (cancella tutto)
```bash
# 1. Stop servizi
docker compose down

# 2. Rimuovi volume PostgreSQL
docker volume rm lemmario_ts_postgres_data

# 3. Riavvia (crea DB vuoto)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. Attendi che PostgreSQL sia pronto (10 secondi)
sleep 10

# 5. Esegui migrazioni
docker compose exec payload pnpm db:migrate

# 6. (Opzionale) Seed
docker compose exec payload pnpm db:seed
```

### Backup database
```bash
# Backup completo
docker compose exec postgres pg_dump -U lemmario_user lemmario_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore da backup
docker compose exec -T postgres psql -U lemmario_user lemmario_db < backup_20260104_123456.sql
```

### Mantenere dati tra restart
```bash
# Stop normale (DB persistito nel volume)
docker compose down

# Riavvio (dati intatti)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

I dati sono salvati nel volume Docker `lemmario_ts_postgres_data`.  
Comando `down` **senza** `-v` mantiene i volumi.

---

## 🧹 Gestione Cache e Rebuild

### Rebuild completo immagini (dopo modifiche a Dockerfile)
```bash
docker compose down
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Rebuild solo backend Payload
```bash
docker compose down payload
docker compose build --no-cache payload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d payload
```

### Rebuild solo frontend Next.js
```bash
docker compose down frontend
docker compose build --no-cache frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

### Pulizia cache Docker completa
```bash
# ATTENZIONE: rimuove TUTTE le immagini/volumi/network inutilizzati
docker system prune -a --volumes

# Poi rebuild da zero
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

---

## 📦 Gestione Dipendenze

### Aggiungere nuova dipendenza
```bash
# 1. Aggiungi localmente (esempio: payload-cms)
cd packages/payload-cms
pnpm add nome-pacchetto

# 2. Rebuild immagine Docker
docker compose build --no-cache payload

# 3. Riavvia
docker compose up -d payload
```

**Nota**: Le `node_modules` Docker sono isolate da quelle locali tramite volumi selettivi.

### Aggiornare dipendenze esistenti
```bash
# 1. Aggiorna localmente
pnpm update nome-pacchetto

# 2. Rebuild Docker
docker compose build --no-cache
docker compose up -d
```

---

## 🔍 Troubleshooting

### Payload restarta in loop (`sh: cross-env: not found`)
**Causa**: `node_modules` non installate nel container.

**Soluzione**:
```bash
docker compose down
docker compose build --no-cache payload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Frontend restarta in loop (`sh: next: not found`)
**Causa**: `node_modules` non installate nel container.

**Soluzione**:
```bash
docker compose down
docker compose build --no-cache frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Errore `sharp` (modulo nativo)
**Causa**: Modulo nativo compilato per sistema operativo sbagliato.

**Soluzione**: Già implementata in Dockerfile.dev con `pnpm rebuild sharp`.

Se persiste:
```bash
docker compose exec payload pnpm rebuild sharp
docker compose restart payload
```

### PostgreSQL non si connette
**Verifica**:
```bash
# Check container attivo
docker compose ps postgres

# Check log PostgreSQL
docker compose logs postgres --tail=50

# Test connessione diretta
docker compose exec postgres psql -U lemmario_user -d lemmario_db -c "SELECT 1"
```

### Hot-reload non funziona
**Causa**: Volumi non montati correttamente.

**Verifica volumi in docker-compose.dev.yml**:
```yaml
volumes:
  - ./packages/payload-cms/src:/workspace/packages/payload-cms/src
  - ./packages/frontend/src:/workspace/packages/frontend/src
```

**Test**:
```bash
# Modifica un file .ts in packages/payload-cms/src/
# Dovresti vedere nei log:
docker compose logs -f payload
# Output: [nodemon] restarting due to changes...
```

### Porte già in uso
```bash
# Verifica cosa usa porta 3000/3001/5432
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5432

# Killa processo o cambia porte in docker-compose.yml
```

---

## 🎯 Scenari Comuni

### Scenario 1: Giornata di sviluppo normale
```bash
# Mattina - avvio
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Lavoro su codice (hot-reload automatico)
# ...

# Sera - stop
docker compose down
```

### Scenario 2: Pull nuove modifiche da Git
```bash
# 1. Pull codice
git pull origin main

# 2. Aggiorna dipendenze (se package.json modificato)
pnpm install

# 3. Rebuild se necessario
docker compose build --no-cache

# 4. Riavvia
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 5. Migrazioni DB (se modificate collections)
docker compose exec payload pnpm db:migrate
```

### Scenario 3: Reset completo per debugging
```bash
# Full reset (DB + cache + rebuild)
docker compose down -v
docker volume rm lemmario_ts_postgres_data
docker system prune -f
pnpm install
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
sleep 15
docker compose exec payload pnpm db:migrate
docker compose exec payload pnpm db:seed
```

### Scenario 4: Eseguire migrazione legacy
```bash
# 1. Assicurati che Payload API sia raggiungibile
curl http://localhost:3000/api/lemmari

# 2. Esegui da workspace scripts
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate

# 3. Monitor log in altra finestra
docker compose logs -f payload
```

---

## 📊 Differenze Tra Comandi

| Comando | DB Reset | Cache | Rebuild | Uso |
|---------|----------|-------|---------|-----|
| `docker compose up -d` | ❌ No | ✅ Usa | ❌ No | Avvio quotidiano |
| `docker compose up -d --build` | ❌ No | ✅ Usa | ✅ Sì | Prima volta |
| `docker compose build --no-cache` | ❌ No | ❌ No | ✅ Sì | Forza rebuild pulito |
| `docker compose down` | ❌ No | ✅ Mantiene | ❌ No | Stop normale |
| `docker compose down -v` | ✅ **SÌ** | ❌ Rimuove | ❌ No | **CANCELLA TUTTO** |
| `docker system prune -a` | ❌ No* | ❌ Rimuove | ❌ No | Pulizia globale Docker |

*Con `--volumes` cancella anche DB

---

## 🌐 URL Servizi

- **Payload Admin**: http://localhost:3000/admin
- **Payload API**: http://localhost:3000/api
- **Frontend Next.js**: http://localhost:3001
- **PostgreSQL**: `localhost:5432` (user: `lemmario_user`, db: `lemmario_db`)

---

## 📝 Note Importanti

### Volumi Docker in Dev Mode
In `docker-compose.dev.yml` sono montati **solo**:
- Cartelle sorgente (`src/`, `app/`)
- File di configurazione (`.json`, `.ts`, `.js`)

**NON** montati:
- `node_modules` (isolate nel container)
- `.next` (build cache Next.js)
- `dist/` (build TypeScript)

### Workflow Hot-Reload
1. Modifichi file in `packages/payload-cms/src/server.ts`
2. Volume monta modifica in `/workspace/packages/payload-cms/src/server.ts`
3. Nodemon rileva change
4. `ts-node` ricompila e riavvia server
5. Vedi nei log: `[nodemon] restarting due to changes...`

### Differenza Prod vs Dev
**Dev** (`docker-compose.dev.yml`):
- Volume mount codice sorgente
- `pnpm dev` (nodemon + ts-node)
- Hot-reload attivo

**Prod** (`docker-compose.yml` da solo):
- Copia codice in immagine
- `pnpm build && pnpm start`
- Processo compilato, ottimizzato

---

## 🆘 Link Utili

- [Documentazione Docker Compose](https://docs.docker.com/compose/)
- [Payload CMS Docs](https://payloadcms.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

Per problemi specifici consulta [docs/MIGRATION.md](./MIGRATION.md) o [docs/PIANO_IMPLEMENTAZIONE.md](./PIANO_IMPLEMENTAZIONE.md).
