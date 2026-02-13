# Glossari - Piattaforma Multi-Tenancy per Glossari Storici

[![CI Status](https://github.com/Unica-dh/lemmario_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/Unica-dh/lemmario_ts/actions/workflows/ci.yml)
[![CD Status](https://github.com/Unica-dh/lemmario_ts/actions/workflows/deploy.yml/badge.svg)](https://github.com/Unica-dh/lemmario_ts/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-v.0.1-blue.svg)](https://github.com/Unica-dh/lemmario_ts/releases/tag/v.0.1)

**Glossari** è una piattaforma multi-tenancy di umanistica digitale per la gestione di glossari storici della terminologia italiana medievale e rinascimentale. Basata su **Payload CMS** e **Next.js 14**, permette a ricercatori e studiosi di creare, gestire e pubblicare dizionari specialistici con controllo granulare degli accessi e funzionalità avanzate di ricerca.

Il primo glossario ospitato è il **"Glossario dei termini su Ordine, Calcolo e Ragione nell'Italia"**, sviluppato nell'ambito del progetto PRIN in collaborazione con l'Università di Cagliari e l'Università di Firenze.

> **Nota storica**: La cartella `/old_website` contiene il codice sorgente del sito web legacy https://lemmario.netlify.app/ che rappresenta l'applicazione in versione "statica" che è stata migrata ed evoluta in questa piattaforma dinamica.

## Architettura

**Glossari** è una piattaforma moderna per la lessicografia digitale costruita con:

- **Backend**: Payload CMS 2.x (TypeScript headless CMS) con API REST completa
- **Frontend**: Next.js 14 con App Router e Server-Side Rendering (SSR)
- **Database**: PostgreSQL 16 per dati strutturati e relazionali
- **Monorepo**: pnpm workspace per gestione efficiente dei pacchetti
- **Deployment**: Docker Compose con CI/CD automatizzato su GitHub Actions

## Struttura del Progetto

```
glossari/
├── packages/
│   ├── payload-cms/          # Backend Payload CMS
│   │   ├── src/
│   │   │   ├── collections/  # 12 Collections (entità dati)
│   │   │   ├── access/       # Controllo accessi multi-tenancy
│   │   │   ├── hooks/        # Lifecycle hooks (audit, bidirezionalità)
│   │   │   ├── admin/        # Custom admin UI (form integrato)
│   │   │   └── server.ts     # Express server
│   │   └── Dockerfile
│   └── frontend/             # Frontend Next.js
│       ├── src/
│       │   ├── app/          # App Router pages con route dinamiche
│       │   ├── components/   # React components riutilizzabili
│       │   └── lib/          # Utilities e API client
│       └── Dockerfile
├── scripts/                  # Script migrazione e validazione dati
│   ├── migration/            # Import da sito legacy
│   ├── validation/           # Validazione integrità dati
│   └── deploy/               # Script deployment produzione
├── old_website/              # Sito legacy (HTML statico)
├── docker-compose.yml        # Configurazione produzione
├── docker-compose.dev.yml    # Configurazione development
└── .env                      # Environment variables
```

## Prerequisiti

- **Node.js**: 20.x LTS
- **pnpm**: 8.x
- **Docker**: 24.x+
- **Docker Compose**: 2.x+

## Setup Iniziale

### 1. Installare pnpm

```bash
npm install -g pnpm@8.15.1
```

### 2. Installare dipendenze

```bash
pnpm install
```

### 3. Configurare environment variables

Il file `.env` è già configurato con valori di sviluppo. Per produzione, copia `.env.example` e modifica i valori:

```bash
cp .env.example .env.production
```

**IMPORTANTE**: Modifica questi valori in produzione:
- `DB_PASSWORD`: password sicura per PostgreSQL
- `PAYLOAD_SECRET`: stringa random di almeno 32 caratteri
- `PAYLOAD_PUBLIC_SERVER_URL`: URL pubblico del backend
- `NEXT_PUBLIC_SITE_URL`: URL pubblico del frontend

### 4. Avviare con Docker Compose (Development)

```bash
# Avvia tutti i servizi in modalità development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Oppure singolarmente
docker compose up postgres -d        # Solo database
docker compose up payload -d         # Backend
docker compose up frontend -d        # Frontend
```
 
### 5. Avviare in locale (senza Docker)

```bash
# Avvia solo PostgreSQL con Docker
docker compose up postgres -d

# In un terminale - Backend
cd packages/payload-cms
pnpm dev

# In un altro terminale - Frontend
cd packages/frontend
pnpm dev
```

## URLs di Sviluppo

- **Frontend Pubblico**: http://localhost:3001
- **API REST**: http://localhost:3000/api
- **Pannello Amministrativo**: http://localhost:3000/admin
- **Database PostgreSQL**: localhost:5432 (utente: `lemmario_user`, database: `lemmario_db`)

## Comandi Principali

### Sviluppo

```bash
pnpm dev              # Avvia backend (3000) + frontend (3001) in parallelo
pnpm dev:payload      # Avvia solo il backend con hot-reload
pnpm dev:frontend     # Avvia solo il frontend con hot-reload
pnpm build            # Build produzione di tutti i packages
pnpm typecheck        # Type checking TypeScript su monorepo
pnpm lint             # Lint ESLint di tutto il codice
pnpm clean            # Rimuove dist/, .next/, cache
```

### Backend (Payload CMS)

```bash
cd packages/payload-cms
pnpm dev              # Development con nodemon hot-reload
pnpm build            # Build TypeScript → dist/
pnpm start            # Avvia server produzione
pnpm payload          # Payload CLI (migrations, users, etc.)
```

### Frontend (Next.js)

```bash
cd packages/frontend
pnpm dev              # Development con Fast Refresh
pnpm build            # Build produzione (SSR + SSG)
pnpm start            # Avvia server produzione
pnpm lint             # ESLint con react/no-unescaped-entities
```

### Script Migrazione

```bash
cd scripts/migration
pnpm seed:livelli     # Crea 6 livelli di razionalità
pnpm migrate          # Import dati da old_website/
pnpm migrate:full     # Reset DB + seed + import completo
pnpm reset:db         # ATTENZIONE: Cancella tutti i dati!
```

## Gestione Database

### Accesso diretto a PostgreSQL

```bash
# Via container Docker
docker exec -it lemmario_db psql -U lemmario_user -d lemmario_db

# Query di esempio
\dt                              # Lista tutte le tabelle
SELECT * FROM lemmari;          # Visualizza glossari
SELECT COUNT(*) FROM lemmi;     # Conta lemmi totali
```

### Reset database (ATTENZIONE: operazione distruttiva!)

```bash
# Reset completo con perdita dati
docker compose down -v                    # Rimuove containers e volumes
docker compose up postgres -d             # Ricrea database vuoto

# Oppure via GitHub Actions (produzione)
# Workflow manuale: .github/workflows/reset-db.yml
```

### Backup e Restore

```bash
# Backup manuale
docker exec lemmario_db pg_dump -U lemmario_user lemmario_db > backup_$(date +%Y%m%d).sql

# Restore da backup
docker exec -i lemmario_db psql -U lemmario_user -d lemmario_db < backup_20260212.sql
```

## Funzionalità Principali

### ✨ Caratteristiche Implementate

#### Backend (Payload CMS)
- ✅ **12 Collections** complete per modellare il dominio lessicografico
- ✅ **Multi-tenancy** con isolamento dati per glossario
- ✅ **Controllo accessi** granulare (super_admin, admin, redattore, lettore)
- ✅ **Form integrato multi-step** per editing lemmi con entità correlate
- ✅ **Audit trail automatico** per tracciare tutte le modifiche
- ✅ **Riferimenti incrociati bidirezionali** tra lemmi
- ✅ **API REST completa** per tutte le entità
- ✅ **Anteprima lemmi** nel pannello amministrativo

#### Frontend (Next.js 14)
- ✅ **Routing dinamico** per glossari multipli
- ✅ **Pagine lemmi** con definizioni, varianti grafiche e ricorrenze
- ✅ **Ricerca** con autocompletamento
- ✅ **Filtri** per lingua (volgare/latino)
- ✅ **Design responsive** ispirato a dizionari classici
- ✅ **SEO ottimizzato** con metadata dinamici

#### DevOps & Qualità
- ✅ **CI/CD completo** con GitHub Actions
- ✅ **Docker Compose** per sviluppo e produzione
- ✅ **Backup automatico** database pre-deploy
- ✅ **Health checks** con rollback automatico
- ✅ **Script migrazione** da sito legacy (234 lemmi, 83 fonti)

## Stato Implementazione

**Versione corrente**: `v.0.1` (Gennaio 2026)

| Fase | Completamento | Stato |
|------|--------------|-------|
| **FASE 1**: Setup Infrastruttura | 100% | ✅ Completata |
| **FASE 2**: Payload CMS Collections | 100% | ✅ Completata |
| **FASE 3**: Hooks & Business Logic | 100% | ✅ Completata |
| **FASE 4**: Frontend Next.js | 70% | ⚠️ Avanzato |
| **FASE 5**: Migrazione Dati Legacy | 100% | ✅ Completata |
| **FASE 6**: Docker & Deploy | 90% | ✅ Quasi completa |
| **FASE EXTRA**: Form Lemma Integrato | 100% | ✅ Completata |
| **TOTALE PROGETTO** | **~82%** | 🚧 Produzione Beta |

### Prossimi Sviluppi

- [ ] Indice alfabetico A-Z per navigazione
- [ ] Link ipertestuali tra lemmi correlati (latino ↔ volgare)
- [ ] Visualizzazione livelli di razionalità nel frontend
- [ ] Completamento pagine istituzionali e documentazione
- [ ] Integrazione loghi università (Cagliari, Firenze, PRIN)

## Migrazione Dati Legacy

Il progetto include script completi per importare i dati dal vecchio sito statico:

```bash
cd scripts/migration
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

**Dati migrati con successo**:

- ✅ **83 fonti bibliografiche** con metadati completi
- ✅ **234 lemmi** (italiano volgare e latino)
- ✅ **Definizioni multiple** per ogni lemma con numerazione
- ✅ **Ricorrenze** (citazioni testuali) con riferimenti alle fonti
- ✅ **Varianti grafiche** per terminologia storica
- ✅ **Livelli di razionalità** (6 livelli fissi)
- ✅ **Riferimenti incrociati** tra lemmi correlati

**Report di validazione**:
- Integrità referenziale verificata al 100%
- Nessun riferimento orfano rilevato
- Tutti i lemmi collegati correttamente alle fonti

Per dettagli completi, vedi:
- [docs/MIGRATION.md](docs/MIGRATION.md) - Guida migrazione
- [report_migration/](report_migration/) - Report dettagliati con statistiche

## Documentazione

### Guide Principali
- [docs/PIANO_IMPLEMENTAZIONE.md](docs/PIANO_IMPLEMENTAZIONE.md) - Piano implementazione 6 fasi con stato avanzamento
- [docs/MIGRATION.md](docs/MIGRATION.md) - Guida completa migrazione dati legacy
- [docs/Lemmario - Requisiti struttura dati - AGGIORNATO.md](docs/Lemmario%20-%20Requisiti%20struttura%20dati%20-%20AGGIORNATO.md) - Modello dati (12 collections)
- [CLAUDE.md](CLAUDE.md) - Overview architettura e convenzioni

### Guide Tecniche
- [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md) - Setup completo CI/CD con GitHub Actions
- [docs/DOCKER_SETUP_GUIDE.md](docs/DOCKER_SETUP_GUIDE.md) - Guida Docker Compose
- [docs/IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md](docs/IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md) - Form multi-step custom
- [docs/PIANO_SEO_IMPLEMENTATION.md](docs/PIANO_SEO_IMPLEMENTATION.md) - Strategia SEO

### Sviluppo e Contributi
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Linee guida per sviluppatori
- [docs/New_task_12.02.2026.md](docs/New_task_12.02.2026.md) - Ultime decisioni progettuali

## Troubleshooting

### Errori comuni e soluzioni

#### 1. Errore connessione database

```bash
# Verifica che PostgreSQL sia in esecuzione
docker ps | grep lemmario

# Controlla i logs per errori
docker logs lemmario_db
docker logs lemmario_payload

# Testa la connessione
docker exec lemmario_db psql -U lemmario_user -d lemmario_db -c "SELECT 1;"
```

#### 2. Porte già in uso

```bash
# Identifica processi che occupano le porte
lsof -i:3000  # Backend
lsof -i:3001  # Frontend  
lsof -i:5432  # PostgreSQL

# Termina i processi (esempio)
lsof -ti:3000 | xargs kill -9

# Oppure modifica le porte in .env:
# PAYLOAD_PORT=3010
# FRONTEND_PORT=3011
# DB_PORT=5433
```

#### 3. Build TypeScript fallisce

```bash
# Rigenera i tipi Payload dopo modifiche schema
cd packages/payload-cms
pnpm payload generate:types

# Type check completo
pnpm typecheck
```

#### 4. ESLint errori `react/no-unescaped-entities`

```tsx
// ❌ Errato: virgolette non escapate
<p>Visualizza la "definizione" del lemma</p>

// ✅ Corretto: usa HTML entities
<p>Visualizza la &ldquo;definizione&rdquo; del lemma</p>
```

#### 5. Reinstallazione pulita

```bash
# Rimuovi tutto e reinstalla
pnpm clean
rm -rf node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install

# Rebuild completo
pnpm build
```

#### 6. Problemi con migrazione dati

```bash
# Verifica che i livelli di razionalità esistano
cd scripts/migration
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm seed:livelli

# Controlla rate limiting (429 errors)
# Gli script hanno delay 100ms intenzionale per evitare sovraccarico
```

## Deployment e CI/CD

La piattaforma **Glossari** utilizza un sistema completo di **Continuous Integration** e **Continuous Deployment** con GitHub Actions.

### Pipeline Automatizzata

#### 1. Continuous Integration (su ogni push/PR)

```yaml
✓ Lint (ESLint)
✓ Type checking (TypeScript)
✓ Build test (backend + frontend)
```

#### 2. Continuous Deployment (su push a `main`)

```yaml
1. Build Docker images (payload + frontend)
2. Push a GitHub Container Registry (GHCR)
3. Deploy automatico su server VPN
4. Backup database pre-deploy
5. Health checks post-deploy
6. Rollback automatico su failure
```

### Workflow Disponibili

| Workflow | Trigger | Descrizione |
|----------|---------|-------------|
| **ci.yml** | Push/PR | Lint, typecheck, build |
| **deploy.yml** | Push `main` | Deploy completo in produzione |
| **setup-admin.yml** | Manuale | Inizializza utente admin |
| **reset-db.yml** | Manuale | Reset database (con conferma) |
| **data-migration.yml** | Manuale | Import dati legacy |

### Deployment Manuale

```bash
# SSH sul server produzione
ssh dhruby@90.147.144.147

# Deploy versione specifica
cd /home/dhruby/lemmario-ts
./scripts/deploy/deploy-lemmario.sh <commit-sha>

# Rollback a versione precedente
docker images ghcr.io/unica-dh/lemmario-payload  # Lista versioni
./scripts/deploy/deploy-lemmario.sh <previous-sha>
```

### Monitoraggio e Logs

```bash
# Logs in tempo reale
docker logs -f lemmario_payload
docker logs -f lemmario_frontend

# Stato servizi
docker ps
docker compose ps

# Health check manuale
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

### Documentazione Completa

Per setup server, troubleshooting e operazioni avanzate:

- **[docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md)** - Guida completa CI/CD e GitHub Actions
- **[scripts/deploy/README.md](scripts/deploy/README.md)** - Documentazione script deployment
- **[scripts/deploy/SETUP_SERVER.md](scripts/deploy/SETUP_SERVER.md)** - Setup iniziale server produzione

## Crediti e Collaborazioni

**Glossari** è sviluppato nell'ambito del progetto PRIN in collaborazione con:

- **Università degli Studi di Cagliari** - Dipartimento di Lettere, Lingue e Beni Culturali
- **Università degli Studi di Firenze** - Dipartimento di Lettere e Filosofia
- **Progetto PRIN** - Programma di Ricerca di Rilevante Interesse Nazionale

### Team di Sviluppo

Piattaforma realizzata con il supporto dell'Università di Cagliari - Digital Humanities Lab.

### Glossario Pilota

Il primo glossario ospitato, **"Glossario dei termini su Ordine, Calcolo e Ragione nell'Italia"**, è frutto della ricerca sui testi medievali italiani (XIII-XVI secolo) riguardanti terminologia matematica, economica e della razionalità nelle fonti tardo-medievali.

## Licenza

Copyright 2026 - Progetto Glossari

Per informazioni su licenze e riuso dei contenuti, contattare le università partner.