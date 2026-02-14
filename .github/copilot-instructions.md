# Copilot Instructions for Lemmario

**Lemmario** is a multi-tenancy digital humanities platform for managing historical Italian mathematical and economic terminology dictionaries. Built with Payload CMS 2.x (headless CMS) + Next.js 14, it enables multiple independent research dictionaries (lemmari) to coexist with role-based access control. Migrated from static site (https://lemmario.netlify.app/) to dynamic platform using TypeScript monorepo.

## Architecture & Key Paths

**Monorepo structure (pnpm workspace):**
- [packages/payload-cms](packages/payload-cms) - Backend: Payload CMS 2.x + Express + PostgreSQL
- [packages/frontend](packages/frontend) - Frontend: Next.js 14 App Router
- [scripts/migration](scripts/migration) - Data import from legacy [old_website](old_website) HTML/JSON
- [scripts/deploy](scripts/deploy) - Deployment to `/home/dhruby/lemmario-ts` (NOT `/home/dhruby/docker/`)

## Essential Commands & Setup

**Development (all ports: backend 3000, frontend 3001, postgres 5432):**
```bash
pnpm install                          # Monorepo deps
pnpm dev                              # Both backend + frontend
pnpm dev:payload / pnpm dev:frontend  # Selective dev
pnpm typecheck && pnpm lint           # Pre-commit checks
pnpm build                            # Production build
```

**Docker mode (recommended for consistency):**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose down -v && docker compose up postgres -d  # DB reset
```

**Data operations:**
```bash
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate  # Import legacy data
pnpm seed:livelli  # Create 6 rationality levels (run before first migration)
pnpm migrate:full  # Full reset + seed + import pipeline
```

**Payload CMS specifics:**
```bash
cd packages/payload-cms
pnpm payload build-types  # Regenerate types after schema changes
pnpm db:migrate / db:seed # Database operations
```

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

**Core principle**: All data scoped by `lemmario_id`. Users assigned to specific lemmari via `UtentiRuoliLemmari` junction (super_admin/lemmario_admin/redattore/lettore roles).

### Access Control Helpers ([packages/payload-cms/src/access/index.ts](packages/payload-cms/src/access/index.ts))
- `superAdminOnly` - Super admin check only
- `hasLemmarioAccess` - Filter results by user's assigned lemmari; **CRITICAL:** assumes direct `lemmario` relationship field exists
- `canCreateInLemmario` - Verify `data.lemmario` set before create (denies if missing, unless super_admin)
- `getUserLemmari(userId)` - Returns array of lemmario IDs user can access

**Important gotchas:**
- `hasLemmarioAccess` assumes collection has direct `lemmario` field; won't work on indirect relationships (e.g., via Lemma)
- `canCreateInLemmario` requires `lemmario` in create payload; will deny 403 if missing
- During migration, collections temporarily use `create: public_`; **MUST revert to `canCreateInLemmario` afterward**

## Backend Collections & Hooks

### Collections Overview ([packages/payload-cms/src/collections/](packages/payload-cms/src/collections/))
13 collections modeling complete lexicographic domain with multi-tenancy:

**Multi-tenancy/Auth:**
- `Lemmari` - Dictionary instances (e.g., "Lemmario di Matematica")
- `Utenti` - Users with global roles (super_admin, lemmario_admin, redattore, lettore)
- `UtentiRuoliLemmari` - Junction assigning per-dictionary roles

**Core lexicon:**
- `Lemmi` - Dictionary entries; has `tipo` ("latino"/"volgare"), auto-generates `slug` from `termine`, `pubblicato` flag
- `VariantiGrafiche` - Alternate spellings; ordered via `ordine` (e.g., "camara" for "camera")
- `Definizioni` - Multiple numbered definitions per lemma; ordered via `ordine`; link to `LivelliRazionalita`
- `Livelli di Razionalità` - Fixed 6-level taxonomy (codes 1-6) for mathematical concepts
- `Ricorrenze` - Source citations with `testo_originale` (medieval text excerpt)
- `Fonti` - Bibliographic sources; **critical field:** `shorthand_id` (e.g., "Stat.fornai.1339") for legacy URL compatibility
- `RiferimentiIncrociati` - Bidirectional cross-references (CFR, VEDI, VEDI_ANCHE); auto-creates inverse with `auto_creato` flag

**System:**
- `ContenutiStatici` - Static pages (about, methodology)
- `StoricoModifiche` - Audit trail: tracks create/update/delete with before/after snapshots, user, IP, timestamp

### Database Schema Pattern
In PostgreSQL, multi-tenancy relationships (e.g., `lemmario` on `LivelliRazionalita`) are stored in `*_rels` junction tables, NOT in the base table. Direct SQL seeding must update both base row AND `_rels` row to set relationships correctly.

### Hooks ([packages/payload-cms/src/hooks/](packages/payload-cms/src/hooks/))

Lifecycle hooks automate business logic:

- **Audit trail** (`auditTrail.ts`):
  - Auto-logs all create/update/delete operations to `StoricoModifiche`
  - Stores before/after snapshots + user/IP/timestamp
  - Used by: `Lemmi`, `Definizioni`, `Fonti`, `RiferimentiIncrociati`

- **Bidirectional references** (`riferimentiIncrociati.ts`):
  - When creating A→B reference, automatically creates B→A with `auto_creato: true`
  - When deleting A→B, deletes auto-created B→A (prevents duplicate deletion via flag)
  - **Important:** Check `auto_creato` flag to prevent infinite loops

**Hook registration pattern**:
```typescript
export const MyCollection: CollectionConfig = {
  hooks: {
    afterChange: [createAuditTrail],
    afterDelete: [createAuditTrailDelete],
  },
}
```

**Hook best practices:**
- Keep hooks synchronous and fast (they block operations)
- Use `operation` parameter to differentiate create vs update logic
- Check prevention flags (like `auto_creato`) to avoid infinite loops
- Log errors but don't throw to avoid blocking main operation

## Frontend Patterns

### Route Structure
- `app/(global)/page.tsx` - Home page listing all lemmari
- `app/[lemmario-slug]/(global)/page.tsx` - Dictionary-specific home
- `app/[lemmario-slug]/lemmi/[termine]/page.tsx` - Lemma detail page (e.g., `/matematica/lemmi/additio`)
- `app/[lemmario-slug]/pagine/[slug]/page.tsx` - Static content pages (e.g., methodology, bibliography)
- `app/[lemmario-slug]/ricerca/page.tsx` - Dictionary search interface

**Dynamic params**: `params['lemmario-slug']` and `params.termine` (NOT `params.lemmario` or `params.slug`). Route groups use `(global)` for site-wide pages.

### Rendering Strategy
- **SSR with ISR**: Most routes use `revalidate` for incremental static regeneration (avoid unnecessary dynamic rendering)
  - Lemmari list: revalidate ~3600s (data changes infrequently)
  - Lemma pages: revalidate ~1800s when definitions edited
- **Force dynamic**: Use `force-dynamic` sparingly on search/filter routes needing real-time data

### Frontend Script Integration
Scripts (like Google Analytics) are added via Next.js `<Script>` component in [packages/frontend/src/app/layout.tsx](packages/frontend/src/app/layout.tsx):
```typescript
import Script from 'next/script'

<Script
  src="https://www.example.com/script.js?id=ID"
  strategy="afterInteractive"  // Doesn't block page rendering
/>
```

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

## Custom Admin UI

### Integrated Lemma Edit Form
Location: [packages/payload-cms/src/admin/views/LemmaEdit/](packages/payload-cms/src/admin/views/LemmaEdit/)

Payload's default UI requires navigating between separate collections (update Lemma, then switch to VariantiGrafiche, then Definizioni, etc.). This project implements a **unified multi-step edit form** integrating all related entities:

**Architecture:**
- Step-based navigation: DatiBase → Varianti → Definizioni → RiferimentiIncrociati
- Uses `useSync` hook to load cross-referenced data with proper filtering (excludes auto_creato references to avoid duplication)
- Components in `/components/` directory for each step
- Registered in Lemmi collection via `admin.components.views.Edit`

**Why it exists:** UX efficiency for lexicographers editing complex entries with multiple variants, definitions, and cross-references in a single workflow.



## Operational Guardrails

Critical rules derived from development patterns to prevent common errors:

### Database & Schema
- **ALWAYS** use Payload CMS migration system for schema changes — **NEVER** add columns manually or extract SQL directly
- **NEVER** use `push: true` on schema operations — always use the migration workflow
- Before importing data, verify ALL required columns exist: `storico_modifiche`, `livelli_razionalita_id`, `ricorrenze`, Draft status fields
- For Drizzle interactive prompts: use non-interactive flags or pre-generate migrations

### Remote Server Access
- **ALWAYS** confirm VPN is active before SSH attempts
- Pay careful attention to LOCAL vs REMOTE paths — underscore vs dash:
  - **Local**: `/home/ale/docker/lemmario_ts` (underscore)
  - **Remote**: `/home/dhruby/lemmario-ts` (dash)
  - `/home/dhruby/docker/` **does NOT exist** on remote server

### TypeScript & Code Quality
- **ALWAYS** run `pnpm typecheck` after code changes, before committing
- Run `pnpm lint` before pushing (fails on unescaped HTML entities in JSX)
- If TypeScript errors in frontend: regenerate Payload types with `pnpm payload build-types`

### Payload CMS Quirks
- Complex filter queries (`exists`, `equals`, `where by slug`) are unreliable — prefer fetching broader and filtering client-side
- When translating labels or modifying Payload config: do a COMPLETE sweep of ALL collections, globals, and fields — partial coverage causes iteration loops
- Before implementing ANY Payload modification: explain the approach, which APIs/filters will be used, and the fallback if it fails

### CI/CD & Docker
- GHCR image tags **MUST** use lowercase repository owner — never uppercase
- Always verify self-hosted runner labels match workflow file before pushing
- After fixing deploy issues: run a complete end-to-end deploy cycle before considering it resolved
- Test Docker build locally (`docker compose build`) before pushing to CI
- Deploy debug approach: (1) fix TypeScript errors, (2) verify CI config, (3) test Docker build, (4) verify runner

## CI/CD Pipeline

### GitHub Actions Workflows ([.github/workflows/](https://github.com/Unica-dh/lemmario-ts/tree/main/.github/workflows))
- **ci.yml**: Lint + typecheck on push/PR
- **deploy.yml**: Build Docker images → GHCR → deploy to VPN server (self-hosted runner with label `vpn`)
  - Calls [scripts/deploy/deploy-lemmario.sh](scripts/deploy/deploy-lemmario.sh) on server
  - Server path: `/home/dhruby/lemmario-ts` (NOT `/home/dhruby/docker/`)
  - Includes automatic DB backup and health checks with rollback on failure
- **data-migration.yml**: Manual workflow for running data import from legacy system (requires `LEMMARIO_ID` input)
- **reset-db.yml**: Manual workflow to destructively reset database (requires confirmation via `YES_DELETE_DATABASE` input)
- **setup-admin.yml**: Manual workflow to initialize admin user (idempotent)

### Deploy Script Requirements
- Must update `GHCR_REGISTRY` variable with GitHub owner (lowercase)
- Requires `.env` file at `/home/dhruby/lemmario-ts/.env` with production secrets
- See [scripts/deploy/SETUP_SERVER.md](scripts/deploy/SETUP_SERVER.md) for initial server setup

## Development Conventions

### Code Style & Naming
- **TypeScript strict mode** enabled across monorepo
- Use **snake_case** for database fields (e.g., `livello_razionalita`, `note_redazionali`, `riferimento_fonte`)
- Use **slug fields** for URL-friendly identifiers (auto-generated from human-readable names, typically via Payload)
- Preserve **`ordine` fields** on `Definizioni` and `VariantiGrafiche` for maintaining display sequence

### Critical Database Fields (Multi-Tenancy Pattern)
```typescript
// Always filter by lemmario for multi-tenancy enforcement
const lemmi = await payload.find({
  collection: 'lemmi',
  where: {
    lemmario: { equals: lemmarioId },      // CRITICAL: tenant isolation
    pubblicato: { equals: true },           // Control visibility
  },
})

// Other important fields:
// - shorthand_id (Fonti): Preserved from legacy system for URL compatibility
// - auto_creato (RiferimentiIncrociati): Flag prevents infinite hook loops
// - slug (Lemmi): Auto-generated from termine, unique identifier
// - ordine: Maintains display sequence on variants/definitions
```

### Payload Types
- Use auto-generated types from `payload-types.ts` in backend
- Regenerate types after schema changes: `pnpm payload build-types`

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep lemmario

# View logs
docker logs lemmario_postgres

# Reset database (WARNING: data loss)
docker compose down -v
docker compose up postgres -d
```

### Port Conflicts
```bash
# Kill processes occupying ports
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Build / Lint Failures
**ESLint error on unescaped quotes:**
```
react/no-unescaped-entities: "text content has unescaped entities"
```
Solution: Use HTML entities in JSX text content:
```tsx
// ❌ Wrong
<p>Vedi la "Critica della ragione pura"</p>

// ✅ Correct
<p>Vedi la &ldquo;Critica della ragione pura&rdquo;</p>
```

**Access denied during import:** 
Collections have `create: public_` temporarily during migration. Must revert to `canCreateInLemmario` afterward to prevent unauthorized creation.

**Migration 429 errors:**
Rate limiting intentional (~100ms delay per lemma). Do not remove without server confirmation.

### Clean Installation
```bash
pnpm clean
rm -rf node_modules packages/*/node_modules
pnpm install
```

## Common Issues

1. **Build fails in CI**: Run `pnpm lint` locally first; fix unescaped HTML entities in JSX
2. **Migration 429 errors**: Rate limiting is intentional (100ms delay). Don't remove without testing
3. **Access denied during import**: Temporarily use `create: public_` on collections, then revert
4. **Missing livelli**: Run `pnpm seed:livelli` before migration
5. **Type errors in frontend**: Regenerate payload types with `pnpm payload build-types` after backend schema changes
6. **Forgot to close bidirectional refs**: Check `auto_creato` flag when querying `RiferimentiIncrociati` to avoid duplicates

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