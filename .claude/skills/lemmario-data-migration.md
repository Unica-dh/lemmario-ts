# Lemmario Data Migration

Procedura di ferro per ricreare l'ambiente Lemmario da zero con migrazione dati completa.

---

## Quando Usare

Usa questa skill quando:
- Devi inizializzare un nuovo ambiente (locale o remoto)
- Devi ricreare il database da zero dopo problemi
- Devi eseguire la migrazione dati legacy
- Devi verificare/debuggare la procedura di migrazione

---

## Prerequisiti

**Locale:**
- Docker e Docker Compose installati
- pnpm installato globalmente
- Accesso alla directory `old_website/` con dati legacy

**Remoto (VPN Server):**
- Self-hosted runner GitHub Actions configurato
- Accesso SSH a `dhruby@90.147.144.147`
- Script deploy in `/home/dhruby/lemmario-ts/scripts/deploy/`

---

## Procedura Completa (Locale)

### Step 1: Reset Database

```bash
# Stop tutti i servizi
docker compose down

# Rimuovi volume database (ATTENZIONE: cancella tutti i dati)
docker volume rm lemmario_ts_postgres_data || true

# Ricrea database vuoto
docker compose up postgres -d

# Attendi che postgres sia pronto (circa 10 secondi)
sleep 10

# Verifica connessione
docker exec lemmario_db psql -U lemmario_user -d lemmario_db -c "SELECT 1"
```

### Step 2: Inizializza Schema con Payload

```bash
# Avvia Payload CMS (crea automaticamente le tabelle via migrations)
docker compose up payload -d

# Attendi che Payload sia pronto
sleep 30

# Verifica health check
curl -s http://localhost:3000/api/access | jq
```

**Cosa succede:**
1. Payload legge le collection definitions in `packages/payload-cms/src/collections/`
2. Esegue le migrations per creare le 13 tabelle
3. Admin UI diventa disponibile su http://localhost:3000/admin

### Step 3: Crea Utente Admin

**Via Admin UI:**
1. Vai a http://localhost:3000/admin
2. Crea primo utente (diventa automaticamente super_admin)
3. Email: `admin@lemmario.it`
4. Password: sicura (min 8 caratteri)

**Via API (alternativa):**
```bash
curl -X POST http://localhost:3000/api/utenti \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lemmario.it",
    "password": "your-secure-password",
    "nome": "Admin",
    "cognome": "Lemmario",
    "ruolo_globale": "super_admin"
  }'
```

### Step 4: Crea Lemmario di Destinazione

```bash
# Crea il lemmario "Matematica" (o altro)
curl -X POST http://localhost:3000/api/lemmari \
  -H "Content-Type: application/json" \
  -d '{
    "titolo": "Lemmario di Matematica",
    "slug": "matematica",
    "descrizione": "Dizionario storico di termini matematici italiani",
    "attivo": true
  }'
```

**Annota l'ID restituito** - serve per la migrazione (tipicamente `1` o `2`).

### Step 5: Configura Access Control (Temporaneo)

Per la migrazione, le collection devono avere `create: public_`:

**File:** `packages/payload-cms/src/collections/Lemmi.ts`
```typescript
access: {
  create: public_,  // Temporaneo per migrazione
  read: hasLemmarioAccess,
  update: hasLemmarioAccess,
  delete: hasLemmarioAccess,
}
```

Applica a: `Lemmi`, `Definizioni`, `Fonti`, `Ricorrenze`, `VariantiGrafiche`, `RiferimentiIncrociati`

```bash
# Rebuild Payload dopo modifiche
cd packages/payload-cms && pnpm build
docker compose restart payload
```

### Step 6: Esegui Migrazione

```bash
cd scripts

# Installa dipendenze
pnpm install

# Esegui migrazione
API_URL=http://localhost:3000/api LEMMARIO_ID=1 pnpm migrate
```

**Output atteso:**
```
=== FASE 1: Importazione Fonti ===
Importate 83 fonti su 83

=== FASE 2: Importazione Lemmi ===
Importando: additio (1/234)
...
Importati 234 lemmi su 234

=== Report Finale ===
Fonti: 83
Lemmi: 234
Definizioni: ~500
Ricorrenze: ~1200
```

### Step 7: Verifica Migrazione

```bash
# Conta records per collection
curl -s "http://localhost:3000/api/fonti?limit=1" | jq '.totalDocs'
curl -s "http://localhost:3000/api/lemmi?limit=1" | jq '.totalDocs'
curl -s "http://localhost:3000/api/definizioni?limit=1" | jq '.totalDocs'
curl -s "http://localhost:3000/api/ricorrenze?limit=1" | jq '.totalDocs'

# Verifica un lemma con definizioni
curl -s "http://localhost:3000/api/lemmi?where[termine][equals]=additio&depth=2" | jq
```

### Step 8: Ripristina Access Control

**IMPORTANTE:** Rimuovi `public_` dalle collection dopo la migrazione:

```typescript
access: {
  create: canCreateInLemmario,  // Ripristinato
  read: hasLemmarioAccess,
  update: hasLemmarioAccess,
  delete: hasLemmarioAccess,
}
```

```bash
cd packages/payload-cms && pnpm build
docker compose restart payload
```

---

## Procedura Remota (GitHub Actions)

### Workflow 1: Reset Database

**File:** `.github/workflows/reset-db.yml`

```bash
# Trigger manuale con conferma
gh workflow run reset-db.yml \
  -f confirmation=YES_DELETE_DATABASE \
  -f run_seed=false
```

**Richiede:** Environment `production-destructive` con reviewer approval

### Workflow 2: Data Migration

**File:** `.github/workflows/data-migration.yml`

```bash
# Dry run (simulazione)
gh workflow run data-migration.yml \
  -f lemmario_id=1 \
  -f mode=dry-run

# Migrazione reale (solo su DB vuoto)
gh workflow run data-migration.yml \
  -f lemmario_id=1 \
  -f mode=migrate

# Migrazione forzata (sovrascrive dati esistenti)
gh workflow run data-migration.yml \
  -f lemmario_id=1 \
  -f mode=migrate-force \
  -f confirm_force=CONFIRM_FORCE
```

---

## Troubleshooting

### Errore 429 (Rate Limiting)

Lo script ha un delay di 500ms tra lemmi. Se ancora insufficiente:

```typescript
// In scripts/migration/import.ts
const DELAY_BETWEEN_LEMMI = 1000  // Aumenta a 1 secondo
```

### Fonti Non Trovate

Se ricorrenze non linkano le fonti:
1. Verifica che `shorthand_id` sia preservato in Fonti
2. Controlla mapping in `htmlParser.ts` (`data-biblio` attribute)

### Duplicati

Lo script salta automaticamente:
- Fonti con stesso `shorthand_id`
- Lemmi con stesso `termine` + `tipo` + `lemmario`

Per forzare re-import: usa `migrate-force` mode.

### Rollback

Non esiste rollback automatico. Per ripristinare:

```bash
# Locale
docker compose down -v
# Ripeti procedura da Step 1

# Remoto
gh workflow run reset-db.yml -f confirmation=YES_DELETE_DATABASE
```

---

## File Chiave

| File | Scopo |
|------|-------|
| [scripts/init-db.sql](scripts/init-db.sql) | Extensions PostgreSQL e grants |
| [scripts/migration/import.ts](scripts/migration/import.ts) | Script migrazione principale |
| [scripts/migration/parsers/htmlParser.ts](scripts/migration/parsers/htmlParser.ts) | Parser HTML legacy |
| [old_website/bibliografia.json](old_website/bibliografia.json) | 83 fonti bibliografiche |
| [old_website/indice.json](old_website/indice.json) | 234 lemmi da importare |
| [old_website/lemmi/](old_website/lemmi/) | File HTML per ogni lemma |

---

## Checklist Migrazione

- [ ] Database PostgreSQL avviato e raggiungibile
- [ ] Payload CMS avviato con migrations completate
- [ ] Utente admin creato
- [ ] Lemmario di destinazione creato (annota ID)
- [ ] Access control temporaneamente impostato a `public_`
- [ ] Migrazione eseguita con successo
- [ ] Verifica conteggi: 83 fonti, 234 lemmi
- [ ] Access control ripristinato a `canCreateInLemmario`
- [ ] Frontend verifica visualizzazione dati
