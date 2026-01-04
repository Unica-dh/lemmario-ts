# Lemmario - Multi-Tenancy Platform

Piattaforma multi-lemmario per la gestione di dizionari storici della terminologia matematica ed economica italiana, basata su **Payload CMS** e **Next.js 14**.

> **Nota storica**: La cartella `/old_website` contiene il codice sorgente del sito web https://lemmario.netlify.app/ che rappresenta l'applicazione in versione "statica" che si intende far evolvere e migrare su questa piattaforma dinamica.

## Architettura

- **Backend**: Payload CMS 2.x (TypeScript headless CMS)
- **Frontend**: Next.js 14 con App Router
- **Database**: PostgreSQL 16
- **Monorepo**: pnpm workspace
- **Deployment**: Docker Compose

## Struttura del Progetto

```
lemmario_ts/
├── packages/
│   ├── payload-cms/          # Backend Payload CMS
│   │   ├── src/
│   │   │   ├── collections/  # Payload Collections (entità)
│   │   │   ├── access/       # Access control logic
│   │   │   ├── hooks/        # Lifecycle hooks
│   │   │   └── server.ts     # Express server
│   │   └── Dockerfile
│   └── frontend/             # Frontend Next.js
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── components/   # React components
│       │   └── lib/          # Utilities
│       └── Dockerfile
├── scripts/                  # Database init scripts
├── docker-compose.yml        # Production compose
├── docker-compose.dev.yml    # Development compose
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

## URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Payload Admin**: http://localhost:3000/admin
- **Database**: localhost:5432

## Script Disponibili

### Root

```bash
pnpm dev              # Avvia tutti i packages in dev mode
pnpm dev:payload      # Avvia solo il backend
pnpm dev:frontend     # Avvia solo il frontend
pnpm build            # Build di tutti i packages
pnpm typecheck        # Type checking TypeScript
pnpm lint             # Lint di tutto il codice
pnpm clean            # Pulisce build artifacts
```

### Payload CMS

```bash
cd packages/payload-cms
pnpm dev              # Development mode con hot reload
pnpm build            # Build per produzione
pnpm start            # Avvia build di produzione
pnpm db:migrate       # Esegui migrations database
pnpm db:seed          # Popola database con dati di esempio
```

### Frontend

```bash
cd packages/frontend
pnpm dev              # Development mode con hot reload
pnpm build            # Build per produzione
pnpm start            # Avvia build di produzione
```

## Database

### Accesso diretto a PostgreSQL

```bash
docker exec -it lemmario_db psql -U lemmario_user -d lemmario_db
```

### Reset database

```bash
docker compose down -v          # Rimuove containers e volumes
docker compose up postgres -d   # Ricrea database da zero
```

## Stato Implementazione

### ✅ FASE 1: Setup Infrastruttura Base (COMPLETATA)

- [x] Setup monorepo con pnpm workspace
- [x] Configurazione PostgreSQL 16 con Docker Compose
- [x] Inizializzazione Payload CMS package
- [x] Inizializzazione Next.js 14 frontend package
- [x] Setup environment variables
- [ ] Verifica connettività database (prossimo step)

### 🚧 FASE 2: Payload CMS Collections (Prossima)

- [ ] Implementazione Collection Lemmario
- [ ] Implementazione Collection Utente
- [ ] Implementazione Collection UtenteRuoloLemmario
- [ ] Implementazione Collection Lemma
- [ ] Implementazione altre 9 collections

## Migrazione Dati Legacy

Il progetto include script per importare i dati dal vecchio sito statico:

```bash
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

La migrazione importa:

- 83 fonti bibliografiche
- 234 lemmi (italiano e latino)
- Definizioni multiple per lemma
- Ricorrenze (citazioni) con riferimenti alle fonti

Per dettagli completi, vedi [docs/MIGRATION.md](docs/MIGRATION.md).

## Documentazione

- [PIANO_IMPLEMENTAZIONE.md](PIANO_IMPLEMENTAZIONE.md) - Piano dettagliato 6 fasi
- [docs/MIGRATION.md](docs/MIGRATION.md) - Guida alla migrazione dati legacy
- [AGENT_E_SKILLS_GUIDE.md](AGENT_E_SKILLS_GUIDE.md) - Guida agent Claude Code
- [Lemmario - Requisiti struttura dati - AGGIORNATO.md](Lemmario%20-%20Requisiti%20struttura%20dati%20-%20AGGIORNATO.md) - Specifiche entità (13 entità)
- [CLAUDE.md](CLAUDE.md) - Overview progetto

## Troubleshooting

### Errore connessione database

```bash
# Verifica che PostgreSQL sia in esecuzione
docker ps | grep lemmario_db

# Controlla i logs
docker logs lemmario_db
```

### Port già in uso

```bash
# Modifica le porte in docker-compose.yml o .env
# Oppure termina i processi che occupano le porte
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Reinstallare dipendenze

```bash
pnpm clean
rm -rf node_modules packages/*/node_modules
pnpm install
```

## Deployment

Il deployment in produzione utilizza GitHub Actions con SSH deployment su server VPN.

La configurazione CI/CD sarà implementata nella FASE 6.

## Licenza

Copyright 2026 - Progetto Lemmario