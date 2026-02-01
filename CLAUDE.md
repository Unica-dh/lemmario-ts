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
- Deployment: Docker Compose

**Structure:**
```
packages/
├── payload-cms/         # Backend API + Admin UI
│   ├── src/
│   │   ├── collections/  # 13 Payload collections (data entities)
│   │   ├── access/       # Multi-tenancy access control helpers
│   │   ├── hooks/        # Lifecycle hooks (audit trail, bidirectional refs)
│   │   └── admin/        # Custom admin UI components
│   └── Dockerfile
├── frontend/            # Public-facing Next.js app
│   ├── src/app/         # App Router pages
│   └── Dockerfile
scripts/
└── migration/           # Legacy data import scripts
```

## IMPORTANTE: Percorsi del Progetto

**ATTENZIONE:** I percorsi locali e remoti sono DIVERSI. Non confonderli!

| Ambiente | Percorso |
|----------|----------|
| **Locale (sviluppo)** | `/home/ale/docker/lemmario_ts` |
| **Remoto (server VPN)** | `/home/dhomeka/lemmario-ts` |

- **Server VPN**: `dhomeka@90.147.144.145`
- **NON esiste** `/home/dhomeka/docker/` sul server remoto
- Gli script in `scripts/deploy/` usano i percorsi REMOTI (`/home/dhomeka/lemmario-ts`)
- Il file `.env` sul server deve essere in `/home/dhomeka/lemmario-ts/.env`

## Common Commands

### Development (Root)
```bash
# Install dependencies
pnpm install

# Start all services locally (no Docker)
pnpm dev                    # Runs both payload and frontend
pnpm dev:payload            # Backend only (port 3000)
pnpm dev:frontend           # Frontend only (port 3001)

# Build & type checking
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

# Development
pnpm dev                    # Hot reload with nodemon
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run production build

# Database operations
pnpm db:migrate             # Run Payload migrations
pnpm db:seed                # Seed initial data

# Maintenance
pnpm typecheck              # TypeScript validation
pnpm lint                   # ESLint
pnpm clean                  # Remove dist/
```

### Frontend (packages/frontend)
```bash
cd packages/frontend

pnpm dev                    # Development server
pnpm build                  # Production build
pnpm start                  # Serve production build
pnpm lint                   # Next.js linting
pnpm typecheck              # TypeScript validation
pnpm clean                  # Remove .next/
```

### Data Migration (scripts)
```bash
cd scripts

# Full migration from legacy data
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate

# Test single lemma import
pnpm test:lemma

# Move data between lemmari
pnpm move-data
```

## URLs & Services

When running with Docker Compose or locally:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Payload Admin**: http://localhost:3000/admin
- **PostgreSQL**: localhost:5432 (user: lemmario_user, db: lemmario_db)

## Data Model Essentials

The system uses **13 Payload collections** modeling a complex lexicographic domain with multi-tenancy:

### Multi-Tenancy Collections
- **Lemmari**: Dictionary instances (e.g., "Lemmario di Matematica")
- **Utenti**: Users with global roles (super_admin, lemmario_admin, redattore, lettore)
- **UtentiRuoliLemmari**: Junction table assigning per-dictionary roles to users

### Core Lexicon Collections
- **Lemmi**: Dictionary entries/terms (e.g., "additio", "camera")
  - Belongs to one Lemmario
  - Has tipo: "latino" or "volgare" (Italian)
  - Auto-generates slug from termine field
  - Has pubblicato flag for visibility control
- **VariantiGrafiche**: Alternate spellings of a lemma (e.g., "camara", "chamera")
- **Definizioni**: Multiple numbered definitions per lemma
  - Links to livello_razionalita (rationality level)
  - Has ordine field for display sequence
- **Livelli di Razionalità**: Fixed 6-level taxonomy (codes 1-6) for classifying mathematical concepts
- **Ricorrenze**: Occurrences/citations from historical sources
  - Contains testo_originale (medieval Italian/Latin excerpt)
  - Links to Fonte via riferimento_fonte
  - Has pagina field for source location
- **Fonti**: Bibliographic sources
  - Has shorthand_id (e.g., "Stat.fornai.1339") preserved from legacy system for URLs and citations
  - Used by Ricorrenze to link citations to sources
- **RiferimentiIncrociati**: Cross-references between lemmi
  - Bidirectional: when A→B created, hook auto-creates B→A
  - Has auto_creato flag to prevent infinite loops
  - Types: CFR (confer), VEDI (see), VEDI_ANCHE (see also)

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

## Frontend Routing

Next.js App Router structure (see [packages/frontend/src/app/](packages/frontend/src/app/)):

```
/                                    # Home page
/[lemmario-slug]/                    # Dictionary home (e.g., /matematica)
/[lemmario-slug]/lemmi/[termine]     # Lemma detail page
/[lemmario-slug]/bibliografia        # Bibliography for dictionary
```

**SSR/ISR:** Frontend emphasizes Server-Side Rendering for SEO. Uses `force-dynamic` for real-time data.

**API client:** Functions in [packages/frontend/src/lib/payload-api.ts](packages/frontend/src/lib/payload-api.ts) fetch from Payload REST API.

## Data Migration

Legacy data import is handled by TypeScript scripts in [scripts/migration/](scripts/migration/).

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
6. Rate limiting: ~100ms pause per lemma to avoid 429 errors

**Running migration:**
```bash
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

Ensure collections have temporary `create: public_` access during migration.

## Development Conventions

### Code Style
- TypeScript strict mode enabled
- Use Payload's generated types from `payload-types.ts`
- ESLint + Prettier configured
- Node 20+ compatibility required

### Field Naming
- Use snake_case for database fields (e.g., `livello_razionalita`, `note_redazionali`)
- Use slug fields for URL-friendly identifiers (auto-generated from human-readable names)
- Preserve `ordine` fields for maintaining display sequence

### Important Database Fields
- **shorthand_id on Fonti**: Legacy compatibility field, must remain unique
- **auto_creato on RiferimentiIncrociati**: Flag for hook-created inverse references
- **pubblicato on Lemmi**: Controls public visibility
- **lemmario relationship**: Present on all content collections for multi-tenancy filtering
- **slug on Lemmi**: Unique URL identifier, auto-generated from termine field

### Multi-Tenancy Query Pattern
When querying content, always filter by lemmario:
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
- Hooks run synchronously and block operations - keep them fast
- Check for flags (like `auto_creato`) to prevent infinite loops
- Log errors but don't throw (to avoid blocking the main operation)
- Use `operation` parameter to differentiate create/update logic

## Environment Variables

Required variables (see [.env.example](.env.example)):

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

### Migration Rate Limiting
If hitting 429 errors during migration, the script has built-in ~100ms delays. Don't remove these - they're intentional to respect rate limits.

## Testing

The project includes an end-to-end test script for validating the full data flow:
```bash
cd scripts
./test-e2e.sh
```

This tests: Bibliografia import → Lemma creation → Definition creation → Ricorrenza creation with proper linking.

## CI/CD

Il progetto utilizza GitHub Actions con self-hosted runner per continuous integration e deployment automatico.

### Workflow

Sono presenti 3 workflow in [.github/workflows/](.github/workflows/):

1. **CI** ([ci.yml](.github/workflows/ci.yml)):
   - Trigger: push su qualsiasi branch, PR verso main
   - Esegue: `pnpm lint`, `pnpm typecheck`, `pnpm build`
   - Runner: `ubuntu-latest` (GitHub-hosted)

2. **CD** ([deploy.yml](.github/workflows/deploy.yml)):
   - Trigger: push su `main`, manual workflow_dispatch
   - Build Docker images per payload e frontend
   - Push a GitHub Container Registry (GHCR) con tags `latest` e `sha-<commit>`
   - Deploy automatico su server VPN (90.147.144.145) tramite self-hosted runner
   - Esegue script `/home/dhomeka/deploy-lemmario.sh` con backup DB e health checks

3. **Database Reset** ([reset-db.yml](.github/workflows/reset-db.yml)):
   - Trigger: manual workflow_dispatch con conferma obbligatoria
   - Operazione distruttiva: cancella e ricrea database
   - Richiede input `YES_DELETE_DATABASE` per conferma
   - Environment `production-destructive` con required reviewers

### Self-Hosted Runner

Il runner GitHub Actions è installato sul server VPN in `/home/dhomeka/actions-runner/`:
- Nome: `lemmario-vpn-runner`
- Labels: `self-hosted`, `Linux`, `X64`, `vpn`
- Servizio systemd: `actions.runner.<owner-repo>.<runner-name>.service`
- Accesso diretto a Docker per deploy

### Script Deploy

Script bash in [scripts/deploy/](scripts/deploy/) da copiare sul server:

1. **[deploy-lemmario.sh](scripts/deploy/deploy-lemmario.sh)**:
   - Backup database pre-deploy
   - Pull nuove images da GHCR
   - Stop servizi (preserva volumi)
   - Update `docker-compose.prod.yml` con nuovi image tags
   - Start servizi e health checks
   - Rollback automatico su failure
   - Cleanup images vecchie

2. **[reset-db-lemmario.sh](scripts/deploy/reset-db-lemmario.sh)**:
   - Backup finale pre-reset
   - Cancella volume `postgres_data`
   - Ricrea database con `init-db.sql` e migrations
   - Opzionale: seed dati
   - Preserva SEMPRE `payload_media`

### GitHub Container Registry

Images Docker ospitate su GHCR:
- `ghcr.io/<owner>/lemmario-payload:latest` e `sha-<commit>`
- `ghcr.io/<owner>/lemmario-frontend:latest` e `sha-<commit>`

### Deployment

Ogni push su `main` attiva automaticamente:
1. Build e test con CI workflow
2. Build Docker images (~5-7 min)
3. Push a GHCR
4. Deploy su server VPN (~3-5 min)
5. Backup database automatico
6. Health checks con rollback automatico su failure

Il database (`postgres_data`) e media files (`payload_media`) sono **preservati** durante tutti i deploy.

### Documentazione Completa

Per setup dettagliato, troubleshooting e operazioni comuni, consulta:
- [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md) - Guida completa setup CI/CD
- [scripts/deploy/README.md](scripts/deploy/README.md) - Documentazione script deploy

### Rollback

**Automatico**: Script deploy fa rollback automatico se health check fallisce

**Manuale**:
```bash
ssh dhomeka@90.147.144.145
docker images ghcr.io/<owner>/lemmario-payload  # Trova SHA precedente
/home/dhomeka/deploy-lemmario.sh <previous-sha>
```

## Documentation

Key docs in [docs/](docs/):
- [PIANO_IMPLEMENTAZIONE.md](docs/PIANO_IMPLEMENTAZIONE.md): 6-phase implementation plan with current status
- [MIGRATION.md](docs/MIGRATION.md): Detailed migration guide with mapping rules
- [Lemmario - Requisiti struttura dati - AGGIORNATO.md](docs/Lemmario%20-%20Requisiti%20struttura%20dati%20-%20AGGIORNATO.md): Complete data model specification (13 entities)
- [IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md](docs/IMPLEMENTAZIONE_FORM_LEMMA_INTEGRATO.md): Custom admin form architecture
- [AGENT_E_SKILLS_GUIDE.md](docs/AGENT_E_SKILLS_GUIDE.md): Guide for AI agent usage

## Project Domain

This is a specialized digital humanities project dealing with:
- Historical Italian (medieval/Renaissance) economic and mathematical terminology
- Latin legal and commercial texts
- Historical lexicography and corpus linguistics
- Multi-tenancy for hosting multiple independent research dictionaries

The interface language is **Italian**, though source texts contain medieval Italian and Latin.
