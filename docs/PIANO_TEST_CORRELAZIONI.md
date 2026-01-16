# Piano di Test - Correlazioni Entità Lemma "Abbattere"

**Data:** 4 gennaio 2026  
**Obiettivo:** Verificare integrità e correttezza delle correlazioni tra entità per il lemma "Abbattere"

---

## ✅ VERIFICA PRELIMINARE: Hooks Implementati

### Status Hook Bidirezionalità

**File:** [packages/payload-cms/src/hooks/riferimentiIncrociati.ts](../packages/payload-cms/src/hooks/riferimentiIncrociati.ts)

✅ **IMPLEMENTATO CORRETTAMENTE**

- Hook `createBidirezionalita`: ✅ Presente
- Hook `deleteBidirezionalita`: ✅ Presente  
- Hook `updateBidirezionalita`: ⚠️ Presente ma non implementato (TODO)

**File:** [packages/payload-cms/src/collections/RiferimentiIncrociati.ts](../packages/payload-cms/src/collections/RiferimentiIncrociati.ts)

✅ **HOOKS COLLEGATI CORRETTAMENTE**

```typescript
hooks: {
  afterChange: [
    createBidirezionalita, // ✅ OK
    createAuditTrail,
  ],
  afterDelete: [
    deleteBidirezionalita, // ✅ OK
    createAuditTrailDelete,
  ],
},
```

---

## 🧪 TEST SUITE

### FASE 1: Setup Ambiente (PREREQUISITI)

#### Test 1.1: Docker Running
```bash
docker ps | grep -E "postgres|payload|frontend"
```

**Output atteso:**
```
CONTAINER ID   IMAGE              STATUS    PORTS
xxxxx          postgres:15        Up        0.0.0.0:5432->5432/tcp
xxxxx          payload-cms        Up        0.0.0.0:3000->3000/tcp
xxxxx          frontend           Up        0.0.0.0:3001->3001/tcp
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 1.2: API Payload Raggiungibile
```bash
curl -s http://localhost:3000/api/lemmari | jq '.docs | length'
```

**Output atteso:** `1` (o numero di lemmari presenti)

**Status:** ⚠️ DA ESEGUIRE

---

### FASE 2: Test Dati Migrati

#### Test 2.1: Verifica Lemma "Abbattere" Esiste
```bash
curl -s "http://localhost:3000/api/lemmi?where[termine][equals]=Abbattere" \
  | jq '.docs[] | {id, termine, tipo, lemmario}'
```

**Output atteso:**
```json
{
  "id": 123,
  "termine": "Abbattere",
  "tipo": "volgare",
  "lemmario": 1
}
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 2.2: Verifica Definizione "Detrarre"
```bash
# Assumendo lemma_id = 123
curl -s "http://localhost:3000/api/definizioni?where[lemma][equals]=123" \
  | jq '.docs[] | {id, numero, testo, lemma}'
```

**Output atteso:**
```json
{
  "id": 456,
  "numero": 1,
  "testo": "Detrarre",
  "lemma": 123
}
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 2.3: Verifica Fonte "Statuti Firenze 1355"
```bash
curl -s "http://localhost:3000/api/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg" \
  | jq '.docs[] | {id, shorthand_id, titolo, anno}'
```

**Output atteso:**
```json
{
  "id": 111,
  "shorthand_id": "Firenze.Statuti.1355.volg",
  "titolo": "Statuti della Repubblica fiorentina",
  "anno": "1355"
}
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 2.4: Verifica Livello Razionalità "Operazioni"
```bash
# Assumendo lemmario_id = 1
curl -s "http://localhost:3000/api/livelli-razionalita?where[numero][equals]=2&where[lemmario][equals]=1" \
  | jq '.docs[] | {id, numero, nome, lemmario}'
```

**Output atteso:**
```json
{
  "id": 222,
  "numero": 2,
  "nome": "Operazioni",
  "lemmario": 1
}
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 2.5: Verifica Ricorrenza (JOIN completo)
```bash
# Assumendo definizione_id = 456
curl -s "http://localhost:3000/api/ricorrenze?where[definizione][equals]=456&depth=2" \
  | jq '.docs[] | {
      id,
      testo_originale: .testo_originale[0:50],
      pagina,
      fonte: .fonte.titolo,
      livello: .livello_razionalita.nome
    }'
```

**Output atteso:**
```json
{
  "id": 789,
  "testo_originale": "«in questo caso s'intendano essere et sieno tacita",
  "pagina": "p. 157v.",
  "fonte": "Statuti della Repubblica fiorentina",
  "livello": "Operazioni"
}
```

**Status:** ⚠️ DA ESEGUIRE

---

### FASE 3: Test Integrità Referenziale (SQL)

#### Test 3.1: Lemmi Orfani (senza lemmario)
```sql
-- Connessione al database
docker exec -it lemmario_ts-postgres-1 psql -U postgres -d lemmario_db

-- Query
SELECT id, termine, lemmario 
FROM payload_lemmi 
WHERE lemmario IS NULL;
```

**Output atteso:** `0 rows`

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 3.2: Definizioni Orfane (senza lemma)
```sql
SELECT id, testo, lemma 
FROM payload_definizioni 
WHERE lemma IS NULL;
```

**Output atteso:** `0 rows`

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 3.3: Ricorrenze Senza FK Obbligatori
```sql
SELECT id, definizione, fonte 
FROM payload_ricorrenze 
WHERE definizione IS NULL OR fonte IS NULL;
```

**Output atteso:** `0 rows`

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 3.4: Livelli Razionalità Orfani
```sql
SELECT id, nome, numero, lemmario 
FROM payload_livelli_razionalita 
WHERE lemmario IS NULL;
```

**Output atteso:** `0 rows`

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 3.5: Count Totale per Collection
```sql
-- Panoramica generale
SELECT 
  'lemmi' as collection, COUNT(*) as total FROM payload_lemmi
UNION ALL
SELECT 'definizioni', COUNT(*) FROM payload_definizioni
UNION ALL
SELECT 'ricorrenze', COUNT(*) FROM payload_ricorrenze
UNION ALL
SELECT 'fonti', COUNT(*) FROM payload_fonti
UNION ALL
SELECT 'livelli_razionalita', COUNT(*) FROM payload_livelli_razionalita
UNION ALL
SELECT 'riferimenti_incrociati', COUNT(*) FROM payload_riferimenti_incrociati
ORDER BY collection;
```

**Output atteso:** Numeri coerenti con la migrazione

**Status:** ⚠️ DA ESEGUIRE

---

### FASE 4: Test Hooks Bidirezionalità

#### Test 4.1: Creazione Riferimento A→B (genera B→A)

**Prerequisito:** Trovare due lemmi esistenti
```bash
# Trova ID di due lemmi
curl -s "http://localhost:3000/api/lemmi?limit=2" \
  | jq '.docs[] | {id, termine}'
```

**Output esempio:**
```json
{"id": 123, "termine": "Abbattere"}
{"id": 124, "termine": "Abbattimento"}
```

---

**Azione:** Crea riferimento `Abbattere → Abbattimento`
```bash
curl -X POST http://localhost:3000/api/riferimenti-incrociati \
  -H "Content-Type: application/json" \
  -d '{
    "lemma_origine": 123,
    "tipo_riferimento": "VEDI ANCHE",
    "lemma_destinazione": 124,
    "note": "Test bidirezionalità"
  }' \
  | jq '{id, lemma_origine, lemma_destinazione, auto_creato}'
```

**Output atteso:**
```json
{
  "id": 1001,
  "lemma_origine": 123,
  "lemma_destinazione": 124,
  "auto_creato": false
}
```

---

**Verifica:** Controlla che sia stato creato anche B→A
```bash
curl -s "http://localhost:3000/api/riferimenti-incrociati?where[lemma_origine][equals]=124&where[lemma_destinazione][equals]=123" \
  | jq '.docs[] | {id, auto_creato, note}'
```

**Output atteso:**
```json
{
  "id": 1002,
  "auto_creato": true,
  "note": "[Auto] Test bidirezionalità"
}
```

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 4.2: Eliminazione Riferimento A→B (elimina B→A)

**Azione:** Elimina il riferimento originale
```bash
# Assumendo id = 1001
curl -X DELETE http://localhost:3000/api/riferimenti-incrociati/1001
```

**Verifica:** Controlla che anche B→A sia stato eliminato
```bash
curl -s "http://localhost:3000/api/riferimenti-incrociati?where[auto_creato][equals]=true&where[lemma_origine][equals]=124&where[lemma_destinazione][equals]=123" \
  | jq '.totalDocs'
```

**Output atteso:** `0` (nessun documento trovato)

**Status:** ⚠️ DA ESEGUIRE

---

#### Test 4.3: Evita Loop Infinito

**Scenario:** L'hook deve riconoscere `auto_creato=true` e non creare ulteriori riferimenti

**Verifica:** Controlla che non esistano duplicati
```bash
curl -s "http://localhost:3000/api/riferimenti-incrociati?limit=100" \
  | jq '.docs | group_by(.lemma_origine) | map(select(length > 1)) | length'
```

**Output atteso:** `0` (nessun gruppo duplicato per stessa origine)

**Status:** ⚠️ DA ESEGUIRE

---

### FASE 5: Test Access Control (Post-Migrazione)

#### Test 5.1: Utente Non Autenticato → Solo Lemmi Pubblicati
```bash
# Senza token JWT
curl -s "http://localhost:3000/api/lemmi" \
  | jq '.docs[] | {termine, pubblicato}'
```

**Output atteso:** TUTTI i lemmi hanno `"pubblicato": true`

**Status:** ⚠️ DA ESEGUIRE (dopo aver cambiato access control)

---

#### Test 5.2: Utente Redattore → Solo Propri Lemmari
```bash
# Con token JWT di un redattore
# (Richiede autenticazione implementata)
```

**Status:** ⚠️ DA ESEGUIRE (FASE 3 completa)

---

## 📊 Scorecard Test

| Test | Status | Note |
|------|--------|------|
| **1.1** Docker Running | ⚠️ | Prerequisito essenziale |
| **1.2** API Raggiungibile | ⚠️ | Prerequisito essenziale |
| **2.1** Lemma Abbattere | ⚠️ | Verifica migrazione |
| **2.2** Definizione Detrarre | ⚠️ | Verifica relazione |
| **2.3** Fonte Statuti 1355 | ⚠️ | Verifica fonte |
| **2.4** Livello Razionalità | ⚠️ | Verifica lookup |
| **2.5** Ricorrenza JOIN | ⚠️ | **TEST CRITICO** |
| **3.1-3.5** Integrità SQL | ⚠️ | Validazione database |
| **4.1** Hook Create Bidirezionalità | ⚠️ | **TEST CRITICO** |
| **4.2** Hook Delete Bidirezionalità | ⚠️ | **TEST CRITICO** |
| **4.3** Evita Loop Infinito | ⚠️ | **TEST CRITICO** |
| **5.1-5.2** Access Control | ⚠️ | Post FASE 3 |

**Legenda:**
- ✅ Passato
- ❌ Fallito
- ⚠️ Da eseguire

---

## 🚀 Sequenza di Esecuzione

### Step 1: Avvia Ambiente
```bash
cd /home/ale/docker/lemmario_ts
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
sleep 10  # Attendi avvio completo
```

### Step 2: Verifica Prerequisiti
```bash
# Test 1.1
docker ps | grep -E "postgres|payload"

# Test 1.2
curl -s http://localhost:3000/api/lemmari | jq
```

### Step 3: Test Dati (2.1-2.5)
Eseguire i comandi nell'ordine indicato sopra.

### Step 4: Test SQL (3.1-3.5)
```bash
docker exec -it lemmario_ts-postgres-1 psql -U postgres -d lemmario_db -f /path/to/test.sql
```

### Step 5: Test Hooks (4.1-4.3)
Seguire gli esempi curl nell'ordine.

---

## 📝 Report Template

Al completamento, compilare:

```markdown
## Test Report - Lemma Abbattere

**Data esecuzione:** __________
**Esecutore:** __________
**Ambiente:** Docker Compose Development

### Risultati

- ✅/❌ FASE 1: Setup Ambiente
  - Note: _________________

- ✅/❌ FASE 2: Dati Migrati
  - Lemma ID: _______
  - Definizione ID: _______
  - Ricorrenza ID: _______
  - Note: _________________

- ✅/❌ FASE 3: Integrità SQL
  - Orfani trovati: _______
  - Note: _________________

- ✅/❌ FASE 4: Hooks Bidirezionalità
  - Riferimento A→B ID: _______
  - Riferimento B→A ID: _______
  - Auto-eliminazione: ✅/❌
  - Note: _________________

### Problemi Riscontrati

1. __________
2. __________

### Azioni Correttive

1. __________
2. __________
```

---

## 🎯 Prossimi Passi Dopo Test

1. ✅ Se tutti i test passano → **FASE 3 COMPLETATA**
2. ⚠️ Se test 2.x falliscono → **Ripetere migrazione**
3. ❌ Se test 4.x falliscono → **Debug hooks**
4. ⚠️ Implementare `updateBidirezionalita` (attualmente TODO)
5. ⚠️ Correggere Access Control (rimuovere `public_`)
