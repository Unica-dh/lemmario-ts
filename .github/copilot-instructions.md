# Copilot Instructions

## Project Architecture

**Multi-tenancy lexicon platform** for historical Italian terminology dictionaries. Monorepo with Payload CMS backend + Next.js 14 frontend.

### Structure
- **Backend**: [packages/payload-cms](packages/payload-cms) - Payload CMS 2.x with Express, PostgreSQL via `@payloadcms/db-postgres`
- **Frontend**: [packages/frontend](packages/frontend) - Next.js 14 App Router with route groups: `(global)` for site-wide pages, `[lemmario-slug]` for per-dictionary routes
- **Migration**: [scripts/migration](scripts/migration) - Import scripts from legacy HTML/JSON in [old_website](old_website)
- **Deploy**: [scripts/deploy](scripts/deploy) - Production deployment scripts for VPN server at `/home/dhruby/lemmario-ts` (NOT `/home/dhruby/docker/`)

### Key Documentation
- Commands & setup: [README.md](README.md) and [CLAUDE.md](CLAUDE.md)
- Data model (13 collections): [docs/Lemmario - Requisiti struttura dati - AGGIORNATO.md](docs/Lemmario%20-%20Requisiti%20struttura%20dati%20-%20AGGIORNATO.md)
- Implementation plan: [docs/PIANO_IMPLEMENTAZIONE.md](docs/PIANO_IMPLEMENTAZIONE.md)
- Migration flow: [docs/MIGRATION.md](docs/MIGRATION.md)

## Development Workflow

### Local Development (No Docker)
```bash
pnpm dev              # Both backend (3000) + frontend (3001)
pnpm dev:payload      # Backend only with nodemon hot-reload
pnpm dev:frontend     # Frontend only with Next.js dev server
```

### Docker Compose
```bash
# Development with volume mounts
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Services: postgres:5432, payload:3000, frontend:3001
# Database reset: docker compose down -v && docker compose up postgres -d
```

### Quality Checks
```bash
pnpm build       # Build all packages (TypeScript → dist/)
pnpm typecheck   # Type check across monorepo
pnpm lint        # ESLint all packages (fails on react/no-unescaped-entities)
pnpm clean       # Remove dist/, .next/, node_modules/.cache
```

## Multi-Tenancy & Access Control

**Core principle**: All data scoped by `lemmario_id`. Users assigned to specific lemmari via `UtenteRuoloLemmari` junction (admin/redattore/lettore roles).

### Access Control Helpers ([packages/payload-cms/src/access/index.ts](packages/payload-cms/src/access/index.ts))
- `superAdminOnly` - Global admin check (user.ruolo === 'super_admin')
- `hasLemmarioAccess` - Filter results by user's assigned lemmari
- `canCreateInLemmario` - Verify user can create in target lemmario via `data.lemmario`
- `getUserLemmari(userId, payload)` - Returns lemmario IDs user can access

**Pattern**: Collections use `hasLemmarioAccess` for read, `canCreateInLemmario` for create/update to enforce multi-tenancy boundaries.

### Migration Access Override
During data import, collections temporarily use `create: public_` in access control. **Must revert to `canCreateInLemmario` after migration** to prevent unauthorized creation.

## Backend Collections & Hooks

### Collections ([packages/payload-cms/src/collections/](packages/payload-cms/src/collections/))
13 collections: `Lemmari`, `Lemmi`, `VariantiGrafiche`, `Definizioni`, `Ricorrenze`, `Fonti`, `RiferimentiIncrociati`, `LivelliRazionalita`, `ContenutiStatici`, `Utenti`, `UtentiRuoliLemmari`, `StoricoModifiche`, plus legacy `CampiCustomLemmario`.

**Relationships**:
- `Lemma` → N `Definizioni` → N `Ricorrenze` → 1 `Fonte`
- `Lemma` → N `VariantiGrafiche`
- `Lemma` ↔ `Lemma` via `RiferimentiIncrociati` (bidirectional self-reference)
- `Definizione` → 1 `LivelliRazionalita` (6 fixed levels: codes 1-6)

### Hooks ([packages/payload-cms/src/hooks/](packages/payload-cms/src/hooks/))
- **Audit trail** (`auditTrail.ts`): Auto-log all create/update/delete to `StoricoModifiche` with before/after snapshots. Used by `Lemmi`, `Definizioni`, `Fonti`, `RiferimentiIncrociati`.
- **Bidirectional refs** (`riferimentiIncrociati.ts`): When creating A→B reference, auto-create B→A. Delete both when one removed.

**Hook registration pattern**:
```typescript
export const MyCollection: CollectionConfig = {
  hooks: {
    afterChange: [createAuditTrail],
    afterDelete: [createAuditTrailDelete],
  },
}
```

## Frontend Patterns

### Route Structure
- `app/(global)/page.tsx` - Home page listing all lemmari
- `app/[lemmario-slug]/lemmi/[termine]/page.tsx` - Lemma detail page
- `app/[lemmario-slug]/pagine/[slug]/page.tsx` - Static content pages

**Dynamic params**: `params['lemmario-slug']` and `params.termine` (NOT `params.lemmario` or `params.slug`).

### Data Fetching ([packages/frontend/src/lib/payload-api.ts](packages/frontend/src/lib/payload-api.ts))
```typescript
// Server-side API calls to NEXT_PUBLIC_PAYLOAD_URL
getLemmarioBySlug(slug) → Lemmario
getLemmaBySlug(termine, lemmarioId) → Lemma
getDefinizioniByLemma(lemmaId) → Definizione[]
getVariantiByLemma(lemmaId) → VarianteGrafica[]
```

**Pattern**: Fetch lemmario first to validate access, then query child entities filtered by `lemmario.id`. Use `Promise.all()` for parallel relation fetching.

### ESLint Gotcha
**Common failure**: Unescaped quotes in JSX violate `react/no-unescaped-entities`. Use HTML entities `&ldquo;` / `&rdquo;` instead of `"` in text content.

## Migration Scripts

### Environment Setup
```bash
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

**Required env**: `API_URL` (Payload API endpoint), `LEMMARIO_ID` (target dictionary ID).

### Import Flow ([scripts/migration/import.ts](scripts/migration/import.ts))
1. Parse [old_website/bibliografia.json](old_website/bibliografia.json) → create `Fonti` (keep `shorthand_id` for URL compatibility)
2. Parse [old_website/indice.json](old_website/indice.json) → map filenames
3. For each HTML in [old_website/lemmi/](old_website/lemmi/):
   - Parse with `cheerio`
   - Create `Lemma` (add `-lat` suffix to Latin terms to avoid slug collisions)
   - Extract `Definizioni` (split on `<hr>` tag)
   - Extract `Ricorrenze` (parse `data-biblio` attribute for fonte link)
   - Parse rationality level via regex patterns

**Rate limiting**: 100ms delay per lemma to avoid 429 errors. Do not remove without testing.

### Seed Scripts
```bash
pnpm seed:livelli     # Create 6 LivelliRazionalita records
pnpm reset:db         # Delete all data across collections (DESTRUCTIVE)
pnpm migrate:full     # Full reset + seed + import pipeline
```

## CI/CD Pipeline

### GitHub Actions ([.github/workflows/](https://github.com/Unica-dh/lemmario-ts/tree/main/.github/workflows))
- **ci.yml**: Lint + typecheck on push
- **deploy.yml**: Build Docker images → push to GHCR → deploy to VPN server
  - Uses self-hosted runner with label `vpn`
  - Calls [scripts/deploy/deploy-lemmario.sh](scripts/deploy/deploy-lemmario.sh) on server
  - Server path: `/home/dhruby/lemmario-ts` (NOT `/home/dhruby/docker/`)

### Deploy Script Requirements
- Must update `GHCR_REGISTRY` variable with GitHub owner (lowercase)
- Requires `.env` file at `/home/dhruby/lemmario-ts/.env` with production secrets
- See [scripts/deploy/SETUP_SERVER.md](scripts/deploy/SETUP_SERVER.md) for initial server setup

## Data Conventions

- **Ordering**: Preserve `ordine` field on `Definizioni` and `VariantiGrafiche` for display sequence
- **Slugs**: Auto-generated from `termine`; Latin terms get `-lat` suffix
- **JSONB config**: Use `Lemmario.configurazione` for dictionary-specific feature flags
- **Unique constraints**: `Fonte.shorthand_id` unique, `(utente_id, lemmario_id)` unique on `UtentiRuoliLemmari`

## Environment Variables

### Backend ([packages/payload-cms/](packages/payload-cms))
- `DATABASE_URI` - PostgreSQL connection string (e.g., `postgres://user:pass@localhost:5432/lemmario`)
- `PAYLOAD_SECRET` - Secret key for JWT signing (min 32 chars, use `openssl rand -hex 24`)
- `PAYLOAD_PUBLIC_SERVER_URL` - Public backend URL for client-side API calls (e.g., `http://localhost:3000`)
- `NODE_ENV` - `development` or `production`

### Frontend ([packages/frontend/](packages/frontend))
- `NEXT_PUBLIC_PAYLOAD_URL` - API endpoint for server-side fetches (e.g., `http://localhost:3000/api`)
- `NEXT_PUBLIC_SITE_URL` - Frontend canonical URL (e.g., `http://localhost:3001`)
- `NODE_ENV` - `development` or `production`

### Migration Scripts ([scripts/migration/](scripts/migration))
- `API_URL` - Payload API endpoint (e.g., `http://localhost:3000/api`, defaults to this)
- `LEMMARIO_ID` - Target dictionary ID for import (required)
- `PAYLOAD_API_KEY` - Optional API key for authenticated requests

### Development Setup
Default `.env` includes sensible dev values. For production, copy `.env.example` and override secrets.

## Database Migrations

### Schema Changes (Payload Introspection)
Payload CMS handles schema generation via `@payloadcms/db-postgres`. Changes are applied:
1. **Collection definitions** ([packages/payload-cms/src/collections/](packages/payload-cms/src/collections)) - Schema auto-syncs on startup
2. **Field additions** - Add to collection config and restart backend; Payload applies migrations automatically
3. **Manual migrations** - Run `pnpm db:migrate` in payload package if needed

### Seed Data
- **Livelli Razionalita** (6 fixed levels): `scripts/migration/seed-livelli-razionalita.ts`
  - Run before full migration: `cd scripts && pnpm seed:livelli`
  - Ensure API running and `LEMMARIO_ID` set
- **Legacy data import**: `scripts/migration/import.ts` - parses old_website HTML/JSON and creates records

### Database Reset (Development)
```bash
# Hard reset (deletes all data)
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm reset:db

# Full reset + seed + import pipeline
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate:full

# Via Docker (faster)
docker compose down -v
docker compose up postgres -d
```

## Testing Strategy

### Current State
No automated tests exist in monorepo. QA is manual + CI linting/typecheck.

### Recommended Approach for New Code
- **Backend (Payload)**: Add Jest tests in [packages/payload-cms](packages/payload-cms) for:
  - Access control helpers ([packages/payload-cms/src/access/](packages/payload-cms/src/access))
  - Hook logic ([packages/payload-cms/src/hooks/](packages/payload-cms/src/hooks))
  - Data validation on collections
- **Frontend (Next.js)**: Add Vitest for:
  - Page generation logic (SSR/ISR)
  - Component rendering ([packages/frontend/src/components/](packages/frontend/src/components))
  - API integration ([packages/frontend/src/lib/payload-api.ts](packages/frontend/src/lib/payload-api.ts))
- **Migration**: Add e2e validation:
  - Verify import counts match expected lemma/definition/occurrence counts
  - Check relationship integrity post-import

### Manual Testing Workflows
- **Local dev**: `pnpm dev` → test UI + API locally before push
- **Pre-deployment**: Run `pnpm lint`, `pnpm typecheck` locally; fix ESLint errors (especially unescaped HTML entities)
- **Post-migration**: Validate data integrity via Payload admin UI or custom SQL queries

## Performance Considerations

### Frontend (Next.js)
- **Static generation**: Use `revalidate` on routes (ISR) where data changes infrequently
  - Lemmari list: revalidate ~3600s (1 hour)
  - Lemma detail pages: revalidate ~1800s (30 min)
- **Dynamic rendering**: Use `force-dynamic` on routes needing real-time data
- **Parallel fetching**: Use `Promise.all()` for independent API calls ([packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx](packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx) pattern)
- **Image optimization**: Use Next.js `<Image>` component for external images
- **Bundle size**: Monitor with `next/bundle-analyzer` if adding large dependencies

### Backend (Payload)
- **Query filtering**: Always filter by `lemmario_id` for multi-tenancy (enforce via `hasLemmarioAccess` helper)
- **Pagination**: Implement on collection list endpoints to avoid N+1 on large datasets
- **Hook performance**: Keep hooks lightweight; offload heavy work to background jobs if needed
- **Database indexes**: Ensure indexes on `lemmario_id`, `slug`, `shorthand_id` for common queries

### Migration Scripts
- **Rate limiting**: Intentional 100ms delay per lemma prevents 429 errors; adjust only with server confirmation
- **Memory**: For large imports (1000+ lemmas), consider batch processing to avoid heap overflow
- **Retry logic**: Implement exponential backoff for transient network failures (e.g., connection drops)

## Common Issues

1. **Build fails in CI**: Check for ESLint errors (especially unescaped quotes). Run `pnpm lint` locally first.
2. **Migration 429 errors**: Rate limiting too aggressive. Verify `delay(100)` exists between API calls.
3. **Access denied during import**: Temporarily set collection `create: public_`, then revert after migration.
4. **Missing livelli**: Run `pnpm seed:livelli` before migration to populate lookup table.
