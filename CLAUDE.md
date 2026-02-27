# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lemmario** is a multi-tenancy platform for managing historical Italian mathematical and economic terminology dictionaries. Built with Payload CMS (headless CMS) and Next.js 14, it enables multiple independent dictionaries (lemmari) to coexist on the same infrastructure with role-based access control.

The project migrated from a static website (https://lemmario.netlify.app/) to this dynamic TypeScript platform. Legacy data is in [old_website/](old_website/).

## Architecture

**Stack:**
- Backend: Payload CMS 2.x (TypeScript headless CMS) with Express
- Frontend: Next.js 14 with App Router
- Database: PostgreSQL 16
- Monorepo: pnpm workspace
- Deployment: Docker Compose + GitHub Actions CI/CD

**Structure:**
```
packages/
├── payload-cms/         # Backend API + Admin UI
│   ├── src/
│   │   ├── collections/  # 12 Payload collections (data entities)
│   │   ├── access/       # Multi-tenancy access control helpers
│   │   ├── hooks/        # Lifecycle hooks (audit trail, bidirectional refs)
│   │   ├── admin/        # Custom admin UI components
│   │   └── seed/         # Seed scripts (create-admin, initial data)
│   ├── Dockerfile        # Production
│   └── Dockerfile.dev    # Development
├── frontend/            # Public-facing Next.js app
│   ├── src/app/         # App Router pages
│   ├── e2e/             # Playwright E2E tests
│   ├── Dockerfile       # Production
│   └── Dockerfile.dev   # Development
scripts/
└── migration/           # Legacy data import scripts
```

## IMPORTANTE: Percorsi del Progetto

**ATTENZIONE:** I percorsi locali e remoti sono DIVERSI. Non confonderli!

| Ambiente | Percorso |
|----------|----------|
| **Locale (sviluppo)** | `/home/ale/docker/lemmario_ts` |
| **Remoto (server VPN)** | `/home/dhruby/lemmario-ts` |

- **Server VPN**: `dhruby@90.147.144.147`
- **NON esiste** `/home/dhruby/docker/` sul server remoto
- Gli script in `scripts/deploy/` usano i percorsi REMOTI (`/home/dhruby/lemmario-ts`)
- Il file `.env` sul server deve essere in `/home/dhruby/lemmario-ts/.env`

## Common Commands

### Development (Root)
```bash
pnpm install                # Install dependencies
pnpm dev                    # Runs both payload and frontend
pnpm dev:payload            # Backend only (port 3000)
pnpm dev:frontend           # Frontend only (port 3001)
pnpm build                  # Build all packages
pnpm typecheck              # TypeScript check all packages
pnpm lint                   # Lint all packages
pnpm clean                  # Remove build artifacts
```

### Docker Compose
```bash
# Development mode (with volume mounts)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production mode
docker compose up -d

# Individual services
docker compose up postgres -d       # Database only
docker compose up payload -d        # Backend only
docker compose up frontend -d       # Frontend only

# Reset database (WARNING: data loss)
docker compose down -v
docker compose up postgres -d
```

### Payload CMS (packages/payload-cms)
```bash
cd packages/payload-cms

pnpm dev                    # Hot reload with nodemon
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run production build
pnpm typecheck              # TypeScript validation
pnpm lint                   # ESLint
pnpm clean                  # Remove dist/

# Database operations
pnpm db:migrate             # Run Payload migrations
pnpm db:seed                # Seed initial data
pnpm db:seed:static         # Seed static content pages
```

### Frontend (packages/frontend)
```bash
cd packages/frontend

pnpm dev                    # Development server (port 3001)
pnpm build                  # Production build
pnpm start                  # Serve production build
pnpm lint                   # Next.js linting
pnpm typecheck              # TypeScript validation
pnpm clean                  # Remove .next/

# E2E Testing (Playwright)
pnpm test:e2e               # Run Playwright tests (headless)
pnpm test:e2e:ui            # Playwright UI mode (interactive)
pnpm test:e2e:headed        # Run tests in headed browser
```

### Data Migration (scripts)
```bash
cd scripts

# Full migration from legacy data
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate

# Convenience script (uses localhost:3000, LEMMARIO_ID=2)
pnpm migrate:test

# Seed rationality levels (must run before first migration)
pnpm seed:livelli

# Full reset + seed + import pipeline
pnpm migrate:full           # reset:db → seed:livelli → migrate

# Move data between lemmari
pnpm move-data

# Reset all data (DESTRUCTIVE)
pnpm reset:db
```

**Note:** Migration scripts use `ts-node` (not `tsx`) and require Node.js 22+ (`source ~/.nvm/nvm.sh && nvm use 22`) due to undici/File dependency.

## URLs & Services

When running with Docker Compose or locally:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Payload Admin**: http://localhost:3000/admin
- **PostgreSQL**: localhost:5432 (user: lemmario_user, db: lemmario_db)

## Data Model

The system uses **12 Payload collections** modeling a complex lexicographic domain with multi-tenancy:

### Multi-Tenancy Collections
- **Lemmari**: Dictionary instances (e.g., "Lemmario di Matematica")
- **Utenti**: Users with global roles (super_admin, lemmario_admin, redattore, lettore)
- **UtentiRuoliLemmari**: Junction table assigning per-dictionary roles to users

### Core Lexicon Collections
- **Lemmi**: Dictionary entries/terms. Has `tipo` ("latino"/"volgare"), auto-generates `slug` from `termine`, `pubblicato` flag for visibility
- **VariantiGrafiche**: Alternate spellings of a lemma (e.g., "camara" for "camera"), ordered via `ordine`
- **Definizioni**: Multiple numbered definitions per lemma, linked to `livello_razionalita`, ordered via `ordine`
- **Livelli di Razionalita**: Fixed 6-level taxonomy (codes 1-6) for classifying mathematical concepts
- **Ricorrenze**: Occurrences/citations from historical sources with `testo_originale` (medieval text excerpt), links to Fonte
- **Fonti**: Bibliographic sources with `shorthand_id` (e.g., "Stat.fornai.1339") preserved for legacy URL compatibility
- **RiferimentiIncrociati**: Bidirectional cross-references between lemmi (CFR, VEDI, VEDI_ANCHE). Hook auto-creates inverse with `auto_creato` flag

### System Collections
- **ContenutiStatici**: Static pages (about, methodology, etc.)
- **StoricoModifiche**: Audit trail for all changes
  - Tracks create/update/delete operations
  - Stores before/after snapshots
  - Records user, IP, timestamp

### Key Relationships
```
Lemmario 1→N Lemmi
Lemma 1→N VariantiGrafiche
Lemma 1→N Definizioni
Definizione 1→N Ricorrenze
Ricorrenza N→1 Fonte
Definizione N→1 LivelloRazionalita
Lemma N→N Lemma (via RiferimentiIncrociati)
```

## Access Control Pattern

The project uses sophisticated multi-tenancy access control (see [packages/payload-cms/src/access/index.ts](packages/payload-cms/src/access/index.ts)):

**Access helpers:**
- `superAdminOnly`: Super admin access
- `hasLemmarioAccess`: Users can only access content from their assigned lemmari
- `canCreateInLemmario`: Create only in lemmari where user is admin/redattore
- `public_`: Public read access (used temporarily during migration)

**Pattern for content collections:**
```typescript
access: {
  create: canCreateInLemmario,
  read: hasLemmarioAccess,  // Or public for pubblicato=true content
  update: hasLemmarioAccess,
  delete: hasLemmarioAccess,
}
```

**Important:** Some collections temporarily use `create: public_` during migration. Revert to `canCreateInLemmario` afterward.

## Hooks System

The project uses Payload lifecycle hooks for automated business logic (see [packages/payload-cms/src/hooks/README.md](packages/payload-cms/src/hooks/README.md)):

### Audit Trail Hook
Automatically logs all changes to StoricoModifiche collection:
```typescript
import { createAuditTrail, createAuditTrailDelete } from '../hooks'

hooks: {
  afterChange: [createAuditTrail],
  afterDelete: [createAuditTrailDelete],
}
```

Used by: Lemmi, Definizioni, Fonti, RiferimentiIncrociati

### Bidirectional References Hook
Auto-creates inverse cross-references:
- When creating A→B reference, automatically creates B→A with `auto_creato: true`
- When deleting A→B, automatically deletes the auto-created B→A
- Prevents infinite loops via auto_creato flag

```typescript
import { createBidirezionalita, deleteBidirezionalita } from '../hooks'

hooks: {
  afterChange: [createBidirezionalita],
  afterDelete: [deleteBidirezionalita],
}
```

Used by: RiferimentiIncrociati

## Custom Admin UI

### Integrated Lemma Edit Form
The project has a **custom multi-step edit form** for Lemmi that integrates all related entities (variants, definitions, occurrences, cross-references) in a single unified interface.

Location: [packages/payload-cms/src/admin/views/LemmaEdit/](packages/payload-cms/src/admin/views/LemmaEdit/)

**Architecture:**
- Step-based navigation (DatiBase → Varianti → Definizioni → RiferimentiIncrociati)
- Uses `useSync` hook to load cross-referenced data with proper filters (excludes auto_creato references)
- Components in `components/` directory for each step
- Registered in Lemmi collection via `admin.components.views.Edit`

**Why it exists:** Default Payload UI requires navigating between separate collections to edit related entities. This form provides a streamlined workflow for lexicographers.

### Database Export (Dashboard Component)

A custom `afterDashboard` component that renders a "Scarica Database SQL" button, visible **only to `super_admin` users**.

Location: [packages/payload-cms/src/admin/components/ExportDatabase.tsx](packages/payload-cms/src/admin/components/ExportDatabase.tsx)

**How it works:**

- The component fetches `/api/utenti/me` to check the user's role (avoids importing `payload/components/utilities` which crashes ts-node due to SVG loading in the barrel export)
- Clicking the button navigates to `GET /api/admin/export/database`
- The Express endpoint in [server.ts](packages/payload-cms/src/server.ts) authenticates via Payload JWT, then runs `pg_dump` via `child_process.spawn` and streams the SQL dump as a file download
- Requires `postgresql-client` installed in the Docker container (added to both Dockerfile and Dockerfile.dev)

**Access control:** `super_admin` only (403 for all other roles and unauthenticated requests)

### Database Export - Local Import Procedure

To replicate the production database locally:

```bash
# 1. Download the dump from the admin dashboard (super_admin only)
#    or via curl:
TOKEN=$(curl -s -X POST "https://glossari.dh.unica.it/api/utenti/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lemmario.dev","password":"password"}' | jq -r '.token')

curl -o lemmario_backup.sql "https://glossari.dh.unica.it/api/admin/export/database" \
  -H "Authorization: JWT $TOKEN"

# 2. Stop the local Payload container (to avoid conflicts)
docker compose stop payload

# 3. Import the dump into the local PostgreSQL
docker compose exec -T postgres psql -U lemmario_user -d lemmario_db < lemmario_backup.sql

# 4. Restart Payload
docker compose start payload
```

## Frontend

### Route Structure ([packages/frontend/src/app/](packages/frontend/src/app/))
```
app/(global)/page.tsx                              # Home page listing all lemmari
app/[lemmario-slug]/(global)/page.tsx              # Dictionary home
app/[lemmario-slug]/lemmi/[termine]/page.tsx       # Lemma detail
app/[lemmario-slug]/pagine/[slug]/page.tsx         # Static content pages
app/[lemmario-slug]/ricerca/page.tsx               # Search interface
app/[lemmario-slug]/bibliografia/page.tsx          # Bibliography
```

**Dynamic params**: Use `params['lemmario-slug']` and `params.termine` (NOT `params.lemmario`). Route groups use `(global)` for site-wide pages.

### Rendering Strategy
- Most routes use `revalidate` for ISR (lemmari list ~3600s, lemma pages ~1800s)
- `force-dynamic` only on search/filter routes needing real-time data
- Use `Promise.all()` for parallel API calls when fetching related data

### API Client ([packages/frontend/src/lib/payload-api.ts](packages/frontend/src/lib/payload-api.ts))
```typescript
getLemmarioBySlug(slug) → Lemmario
getLemmaBySlug(termine, lemmarioId) → Lemma
getDefinizioniByLemma(lemmaId) → Definizione[]
getVariantiByLemma(lemmaId) → VarianteGrafica[]
```
Pattern: Fetch lemmario first, then query child entities filtered by `lemmario.id`.

### E2E Testing
Playwright configured in `packages/frontend/playwright.config.ts`:
- Test directory: `packages/frontend/e2e/`
- Base URL: `E2E_BASE_URL` env var or `http://localhost:3001`
- Auto-starts dev server in non-CI mode
- Chromium only, HTML reporter, screenshots on failure

## Data Migration

Legacy data import via TypeScript scripts in [scripts/migration/](scripts/migration/).

**Source data:**
- [old_website/bibliografia.json](old_website/bibliografia.json) → Fonti collection
- [old_website/indice.json](old_website/indice.json) → List of lemmi to import
- [old_website/lemmi/*.html](old_website/lemmi/) → Lemmi + Definizioni + Ricorrenze

**Key import rules:**
1. Preserve `shorthand_id` on Fonti for legacy URL compatibility
2. Latin lemma slugs get `-lat` suffix to avoid collisions with Italian variants
3. Definitions split on `<hr>` tags in HTML
4. Rationality levels parsed via regex from HTML
5. Occurrences extract fonte references from `data-biblio` attributes
6. Rate limiting: ~100ms pause per lemma to avoid 429 errors - do not remove

Ensure collections have temporary `create: public_` access during migration.

## Development Conventions

### Code Style
- TypeScript strict mode enabled
- Use Payload's generated types from `payload-types.ts` (regenerate after schema changes: `pnpm payload build-types`)
- ESLint + Prettier configured
- Node 20+ for main project, Node 22+ for migration scripts

### Field Naming
- Use snake_case for database fields (e.g., `livello_razionalita`, `note_redazionali`)
- Use slug fields for URL-friendly identifiers (auto-generated from human-readable names)
- Preserve `ordine` fields for maintaining display sequence

### Critical Database Fields
- `shorthand_id` on Fonti: Legacy compatibility, must remain unique
- `auto_creato` on RiferimentiIncrociati: Flag for hook-created inverse references
- `pubblicato` on Lemmi: Controls public visibility
- `lemmario` relationship: Present on all content collections for multi-tenancy filtering

### Multi-Tenancy Query Pattern
Always filter by lemmario:
```typescript
const lemmi = await payload.find({
  collection: 'lemmi',
  where: {
    lemmario: { equals: lemmarioId },
    pubblicato: { equals: true },
  },
})
```

### Hooks Best Practices
- Hooks block operations - keep them fast
- Check for flags (like `auto_creato`) to prevent infinite loops
- Log errors but don't throw (to avoid blocking the main operation)
- Use `operation` parameter to differentiate create/update logic

### ESLint Gotcha
Unescaped quotes in JSX violate `react/no-unescaped-entities`. Use HTML entities `&ldquo;`/`&rdquo;` instead of `"` in text content.

## Operational Guardrails

Regole operative derivate dall'analisi delle sessioni di sviluppo per prevenire errori ricorrenti.

### Database & Migrations

- **SEMPRE** usare il sistema di migrazione Payload CMS per modifiche schema — **MAI** aggiungere colonne manualmente o estrarre SQL direttamente
- Workflow: `pnpm payload migrate:create` → `pnpm payload migrate`
- **MAI** usare `push: true` nelle operazioni schema — usare sempre il workflow di migrazione
- Prima di importare dati, verificare che TUTTE le colonne richieste esistano (storico_modifiche, livelli_razionalita_id, ricorrenze, campi draft status)
- Per prompt interattivi di Drizzle: usare flag non-interattivi o pre-generare le migrations

### CI/CD & Deployment

- I tag GHCR (GitHub Container Registry) **DEVONO** usare lowercase per il repository owner — **MAI** uppercase
- Verificare **SEMPRE** che la label del self-hosted runner corrisponda al workflow file prima di pushare
- Dopo aver fixato problemi di deploy, eseguire un ciclo deploy completo end-to-end prima di considerare risolto
- Testare il container Docker localmente (`docker compose build`) prima di pushare alla CI
- Approccio step-by-step per debug deploy: (1) fix errori TypeScript, (2) verifica config CI, (3) test Docker build, (4) verifica runner

### Payload CMS Quirks

- I query filter Payload CMS (`exists`, `equals`, `where by slug`) sono **inaffidabili** per filtri complessi — preferire fetch ampio e filtro client-side
- Quando si traducono label o si modifica la config Payload, fare uno sweep **COMPLETO** di TUTTE le collection, globals e fields — copertura parziale causa iterazioni ripetute
- Prima di implementare qualsiasi modifica Payload: spiegare l'approccio, quali API/filtri verranno usati, e quale fallback se non funziona

### Remote Server Access

- **SEMPRE** confermare che la VPN è attiva prima di tentativi SSH
- Controllare attentamente i percorsi remoti — attenzione a underscore vs trattino:
  - **Locale**: `/home/ale/docker/lemmario_ts` (underscore)
  - **Remoto**: `/home/dhruby/lemmario-ts` (trattino)
- **NON ESISTE** `/home/dhruby/docker/` sul server remoto

### TypeScript & Code Quality

- Eseguire **SEMPRE** `pnpm typecheck` dopo modifiche al codice, prima di commitare
- Eseguire `pnpm lint` prima di pushare
- In caso di errori TypeScript nel frontend: rigenerare i tipi Payload con `pnpm payload build-types`

### MCP Server Configuration

- Dopo aver aggiunto o modificato configurazione MCP server, **SEMPRE** riavviare la sessione Claude Code
- Verificare con `claude mcp list` che la configurazione sia stata rilevata

## Environment Variables

Required variables (see [.env.example](.env.example), [.env.production.example](.env.production.example)):

```bash
# Database
DATABASE_URI=postgres://lemmario_user:password@postgres:5432/lemmario_db
DB_USER=lemmario_user
DB_PASSWORD=your_password
DB_NAME=lemmario_db
DB_PORT=5432

# Payload CMS
PAYLOAD_SECRET=your-secret-min-32-chars
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
NODE_ENV=development

# Next.js Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Migration (scripts only)
API_URL=http://localhost:3000/api
LEMMARIO_ID=2

# E2E Testing (optional)
E2E_BASE_URL=http://localhost:3001
```

**Security:** Never commit `.env` file. Use `.env.example` as template.

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep lemmario_db

# View logs
docker logs lemmario_db

# Reset database
docker compose down -v
docker compose up postgres -d
```

### Port Conflicts
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL

# Or modify ports in docker-compose.yml or .env
```

### Clean Install
```bash
pnpm clean
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Common Issues
1. **Build fails in CI**: Run `pnpm lint` locally; fix unescaped HTML entities in JSX
2. **Migration 429 errors**: Rate limiting intentional (~100ms delay). Don't remove
3. **Access denied during import**: Temporarily use `create: public_` on collections, revert after
4. **Missing livelli**: Run `pnpm seed:livelli` before migration
5. **Type errors in frontend**: Regenerate payload types with `pnpm payload build-types`
6. **Duplicate cross-references**: Filter `auto_creato` when querying `RiferimentiIncrociati`

## CI/CD

GitHub Actions con self-hosted runner per CI e deployment automatico.

### Workflows ([.github/workflows/](.github/workflows/))

1. **CI** (`ci.yml`): Push su qualsiasi branch / PR verso main → `pnpm lint`, `pnpm typecheck`, `pnpm build`
2. **CD** (`deploy.yml`): Push su `main` → Build Docker images → GHCR → deploy su server VPN con backup DB e health checks + rollback automatico
3. **Database Reset** (`reset-db.yml`): Manual, richiede `YES_DELETE_DATABASE` per conferma
4. **Setup Admin** (`setup-admin.yml`): Manual, inizializza utente admin e lemmario (idempotente)
5. **Data Migration** (`data-migration.yml`): Manual, con modalità dry-run/migrate/migrate-force

### Deploy
Ogni push su `main` attiva: CI → Build Docker → Push GHCR → Deploy VPN → Health checks.

Il database (`postgres_data`) e media files (`payload_media`) sono preservati durante tutti i deploy.

Script deploy in [scripts/deploy/](scripts/deploy/): `deploy-lemmario.sh` (con rollback automatico), `reset-db-lemmario.sh`.

Per setup dettagliato: [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md), [scripts/deploy/README.md](scripts/deploy/README.md).

### Rollback
```bash
ssh dhruby@90.147.144.147
docker images ghcr.io/<owner>/lemmario-payload  # Trova SHA precedente
/home/dhruby/deploy-lemmario.sh <previous-sha>
```

## Documentation

Key docs in [docs/](docs/):
- [PIANO_IMPLEMENTAZIONE.md](docs/PIANO_IMPLEMENTAZIONE.md): 6-phase implementation plan
- [MIGRATION.md](docs/MIGRATION.md): Detailed migration guide with mapping rules
- [Lemmario - Requisiti struttura dati - AGGIORNATO.md](docs/Lemmario%20-%20Requisiti%20struttura%20dati%20-%20AGGIORNATO.md): Complete data model specification
- [IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md](docs/IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md): Custom admin form architecture
- [CI-CD-SETUP.md](docs/CI-CD-SETUP.md): Guida completa setup CI/CD

## Project Domain

This is a specialized digital humanities project dealing with:
- Historical Italian (medieval/Renaissance) economic and mathematical terminology
- Latin legal and commercial texts
- Historical lexicography and corpus linguistics
- Multi-tenancy for hosting multiple independent research dictionaries

The interface language is **Italian**, though source texts contain medieval Italian and Latin.
