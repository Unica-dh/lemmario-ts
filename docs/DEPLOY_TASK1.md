# Deploy in Produzione - Task 1: Ordine ricorrenze + datazione

## Prerequisiti

- Branch: `Fix-bug-25.02-bis`
- Verifiche superate: `pnpm typecheck` e `pnpm lint` OK
- Testato localmente: migrazione DB + re-import completati con successo

---

## Cosa cambia

### Backend (Payload CMS)

| File | Modifica |
|------|----------|
| `packages/payload-cms/src/collections/Ricorrenze.ts` | Nuovo campo `ordine` (type: number) |
| `packages/payload-cms/src/migrations/20260225_150000.ts` | **Nuovo** - Migrazione SQL: `ALTER TABLE "ricorrenze" ADD COLUMN IF NOT EXISTS "ordine" numeric` |

### Script di importazione

| File | Modifica |
|------|----------|
| `scripts/migration/import.ts` | Contatore `ordineRicorrenza` progressivo per definizione (parte da 1, incrementa per ogni ricorrenza) |

### Frontend

| File | Modifica |
|------|----------|
| `packages/frontend/src/types/payload.ts` | Aggiunto `ordine?: number` a interfaccia `Ricorrenza` |
| `packages/frontend/src/lib/payload-api.ts` | Aggiunto `sort: 'ordine'` alla fetch ricorrenze |
| `packages/frontend/src/components/lemma/DefinizioneCard.tsx` | Sort client-side per `ordine` + riga "Datazione: {anno}" sotto la fonte |

---

## Procedura di deploy

### Step 1: Merge su main

```bash
# Da locale
git checkout main
git pull origin main
git merge Fix-bug-25.02-bis
git push origin main
```

Questo attiva la pipeline CI/CD: lint → typecheck → build Docker → push GHCR → deploy su VPN.

### Step 2: Verificare deploy completato

Attendere che la GitHub Action `deploy.yml` completi con successo. Verificare:
- Container `payload` e `frontend` riavviati
- Health check superato

### Step 3: Migrazione DB

```bash
ssh dhruby@90.147.144.147
cd /home/dhruby/lemmario-ts

# Eseguire migrazione (aggiunge colonna 'ordine' alla tabella ricorrenze)
docker compose exec payload pnpm db:migrate
```

**Output atteso:** La migrazione `20260225_150000` viene eseguita. Se la colonna esiste gia (perche `IF NOT EXISTS`), non fa nulla.

### Step 4: Re-import dei dati

Il re-import e necessario perche le ricorrenze esistenti non hanno il campo `ordine` popolato. Lo script di import assegna `ordine` progressivo durante l'inserimento.

```bash
# Sul server VPN
cd /home/dhruby/lemmario-ts

# Preparazione Node.js
source ~/.nvm/nvm.sh && nvm use 22

# OPZIONE A: Re-import completo (consigliato)
# Prima svuota i dati e poi reimporta tutto
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate:full

# OPZIONE B: Solo re-import senza reset
# (funziona solo se le ricorrenze sono state cancellate prima)
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

**Note importanti sul re-import:**

1. `pnpm migrate:full` esegue: reset DB → seed livelli → import dati
2. Lo script di reset richiede che le collection abbiano `delete: public_` oppure autenticazione API. Se fallisce con 403, usare l'accesso diretto al DB:
   ```bash
   docker compose exec postgres psql -U lemmario_user -d lemmario_db -c "
     TRUNCATE TABLE ricorrenze, definizioni, varianti_grafiche,
     riferimenti_incrociati, lemmi, fonti, livelli_razionalita,
     storico_modifiche CASCADE;
   "
   ```
   Poi procedere con:
   ```bash
   cd scripts
   API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm seed:livelli
   API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
   ```

3. L'import puo richiedere piu esecuzioni a causa del rate limiting (500 req/10s). Lo script e idempotente: le esecuzioni successive importano solo i lemmi mancanti. Rieseguire fino a "234 lemmi importati".

4. **LEMMARIO_ID:** in produzione il valore e `2` (in locale era `1`).

### Step 5: Verifica

Dopo il re-import, verificare su https://lemmario.unica.it (o URL produzione):

1. **Ordine ricorrenze**: Aprire un lemma con piu ricorrenze (es. "camera") e verificare che l'ordine corrisponda al file HTML sorgente
2. **Datazione**: Sotto ogni citazione con fonte datata, deve apparire "Datazione: {anno}" in grigio chiaro
3. **Separazione citazioni**: Citazioni multiple dalla stessa fonte devono essere paragrafi separati (era gia funzionante)

---

## Rollback

Se necessario annullare:

```bash
ssh dhruby@90.147.144.147
cd /home/dhruby/lemmario-ts

# 1. Rollback migrazione DB
docker compose exec payload pnpm db:migrate:down

# 2. Rollback codice (tornare al commit precedente)
docker images ghcr.io/<owner>/lemmario-payload  # trovare SHA precedente
/home/dhruby/deploy-lemmario.sh <previous-sha>
```

---

## Riepilogo tempi

| Operazione | Tempo stimato |
|------------|--------------|
| CI/CD pipeline (build + deploy) | ~5-10 min |
| Migrazione DB | < 1 min |
| Re-import completo | ~5-15 min (dipende da rate limiting) |
| Verifica manuale | ~5 min |
