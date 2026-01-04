# Analisi Correlazioni Entità - Lemma "Abbattere"

**Data:** 4 gennaio 2026  
**Scopo:** Analizzare come le informazioni del lemma "Abbattere" sono strutturate e correlate nel backend Payload CMS

---

## 📊 Informazioni Mostrate nel Frontend

Dal sito legacy, il lemma "Abbattere" mostra:

```
ABBATTERE

1. Detrarre

Ricorrenza:
  • Statuti della Repubblica fiorentina (1355):
    «in questo caso s'intendano essere et sieno tacitamente obligati a questi 
    cotali paganti, abattutene le parti che toccano a questi cotali paganti» 
    - p. 157v.

Livello di razionalità: 2. Operazioni
```

---

## 🔗 Struttura delle Correlazioni nel Backend

### Grafo delle Relazioni

```
┌─────────────────┐
│    LEMMARIO     │ (es. "Lemmario Razionale")
│  (lemmari)      │
└────────┬────────┘
         │
         │ lemmario_id (FK)
         ▼
┌─────────────────┐
│     LEMMA       │
│    (lemmi)      │ 
│                 │
│ • id: 123       │
│ • termine:      │
│   "Abbattere"   │
│ • tipo: volgare │
│ • lemmario: →   │
└────────┬────────┘
         │
         │ lemma_id (FK)
         ▼
┌─────────────────────┐
│   DEFINIZIONE       │
│  (definizioni)      │
│                     │
│ • id: 456           │
│ • lemma: → 123      │
│ • numero: 1         │
│ • testo: "Detrarre" │
└──────────┬──────────┘
           │
           │ definizione_id (FK)
           ▼
┌──────────────────────────┐
│      RICORRENZA          │
│     (ricorrenze)         │
│                          │
│ • id: 789                │
│ • definizione: → 456     │────────┐
│ • fonte: → 111           │        │
│ • testo_originale:       │        │
│   "«in questo caso...»"  │        │
│ • pagina: "p. 157v."     │        │
│ • livello_razionalita:   │        │
│   → 222                  │        │
└──────────────────────────┘        │
           │                        │
           │                        │ fonte_id (FK)
           │                        │
           │                        ▼
           │              ┌───────────────────────┐
           │              │        FONTE          │
           │              │      (fonti)          │
           │              │                       │
           │              │ • id: 111             │
           │              │ • shorthand_id:       │
           │              │   "Firenze.Statuti.   │
           │              │    1355.volg"         │
           │              │ • titolo:             │
           │              │   "Statuti della      │
           │              │    Repubblica         │
           │              │    fiorentina"        │
           │              │ • anno: "1355"        │
           │              │ • riferimento_        │
           │              │   completo: "Gli      │
           │              │   statuti della..."   │
           │              └───────────────────────┘
           │
           │ livello_razionalita_id (FK)
           │
           ▼
┌──────────────────────────┐
│  LIVELLO RAZIONALITÀ     │
│ (livelli-razionalita)    │
│                          │
│ • id: 222                │
│ • lemmario: → 1          │
│ • numero: 2              │
│ • nome: "Operazioni"     │
│ • descrizione: "..."     │
└──────────────────────────┘
```

---

## 📋 Dettaglio delle Collections Coinvolte

### 1. Collection `lemmi`

**Campi rilevanti:**
```typescript
{
  id: number (PK)
  lemmario: relationship → lemmari (FK) ⚠️ REQUIRED
  termine: text = "Abbattere"
  tipo: select = "volgare" | "latino"
  slug: text = "abbattere" (auto-generato)
  pubblicato: boolean = true/false
}
```

**Relazioni:**
- `1 Lemma → N Definizioni` (via `definizioni.lemma`)
- `1 Lemma → 1 Lemmario` (via `lemmi.lemmario`)

---

### 2. Collection `definizioni`

**Campi rilevanti:**
```typescript
{
  id: number (PK)
  lemma: relationship → lemmi (FK) ⚠️ REQUIRED
  numero: number = 1, 2, 3... (per lemmi con più significati)
  testo: textarea = "Detrarre"
}
```

**Relazioni:**
- `N Definizioni → 1 Lemma` (via `lemma` FK)
- `1 Definizione → N Ricorrenze` (via `ricorrenze.definizione`)

**Nota importante:** Nel caso di "Abbattere" c'è **1 sola definizione** (numero 1).

---

### 3. Collection `ricorrenze`

**Campi rilevanti:**
```typescript
{
  id: number (PK)
  definizione: relationship → definizioni (FK) ⚠️ REQUIRED
  fonte: relationship → fonti (FK) ⚠️ REQUIRED
  testo_originale: textarea = "«in questo caso s'intendano essere...»"
  pagina: text = "p. 157v."
  livello_razionalita: relationship → livelli-razionalita (FK) ⚠️ NULLABLE
  note: textarea
}
```

**Relazioni:**
- `N Ricorrenze → 1 Definizione` (via `definizione` FK)
- `N Ricorrenze → 1 Fonte` (via `fonte` FK)
- `N Ricorrenze → 1 Livello Razionalità` (via `livello_razionalita` FK)

**Nota importante:** La ricorrenza collega **definizione + fonte + livello**.

---

### 4. Collection `fonti`

**Campi rilevanti:**
```typescript
{
  id: number (PK)
  shorthand_id: text = "Firenze.Statuti.1355.volg" ⚠️ UNIQUE
  titolo: text = "Statuti della Repubblica fiorentina"
  autore: text = null
  anno: text = "1355"
  riferimento_completo: textarea = "Gli statuti della Repubblica..."
  note: textarea
}
```

**Caratteristiche:**
- **Condivisa tra tutti i lemmari** (no FK lemmario)
- `shorthand_id` è **UNIQUE** e usato per URLs/links
- Relazione **1-to-many** con `ricorrenze`

---

### 5. Collection `livelli-razionalita`

**Campi rilevanti:**
```typescript
{
  id: number (PK)
  lemmario: relationship → lemmari (FK) ⚠️ REQUIRED
  numero: number = 1, 2, 3, 4, 5, 6
  nome: text = "Operazioni"
  descrizione: textarea
}
```

**Caratteristiche:**
- **Specifico per lemmario** (campo custom del "Lemmario Razionale")
- 6 livelli predefiniti (1: Operazioni, 2: Elementi tecnici, ecc.)
- Relazione **1-to-many** con `ricorrenze`

---

## 🔍 Mapping HTML Legacy → Payload Collections

### Dal file `abbattere.html`

```html
<div id="lemma">
    <p class="titolo-lemma">Abbattere</p>                    → lemmi.termine
    <p><strong>1.</strong> Detrarre</p>                      → definizioni.numero + definizioni.testo
    
    <p><strong>Ricorrenza:</strong></p>
    <ul>
        <li>
            <a href="#" class="bibliografia-link" 
               data-biblio="Firenze.Statuti.1355.volg">      → fonti.shorthand_id
                Statuti della Repubblica fiorentina (1355)   → fonti.titolo + fonti.anno
            </a>:
            <p>«in questo caso s'intendano essere...» - p. 157v.</p>
                                                              → ricorrenze.testo_originale
                                                              → ricorrenze.pagina
        </li>
    </ul>

    <p><strong>Livello di razionalità:</strong> 2. Operazioni</p>
                                                              → livelli_razionalita.numero
                                                              → livelli_razionalita.nome
    <hr>
</div>
```

---

## ⚙️ Flusso di Creazione Dati (Migrazione)

### Ordine di Inserimento

1. **LEMMARIO** (se non esiste)
   ```
   POST /api/lemmari
   { "nome": "Lemmario Razionale", "slug": "lemmario-razionale" }
   → ID: 1
   ```

2. **LIVELLI RAZIONALITÀ** (6 record per lemmario)
   ```
   POST /api/livelli-razionalita
   { "lemmario": 1, "numero": 2, "nome": "Operazioni" }
   → ID: 222
   ```

3. **FONTE** (se non esiste)
   ```
   POST /api/fonti
   {
     "shorthand_id": "Firenze.Statuti.1355.volg",
     "titolo": "Statuti della Repubblica fiorentina",
     "anno": "1355",
     "riferimento_completo": "Gli statuti della Repubblica..."
   }
   → ID: 111
   ```

4. **LEMMA**
   ```
   POST /api/lemmi
   {
     "lemmario": 1,
     "termine": "Abbattere",
     "tipo": "volgare",
     "slug": "abbattere",
     "pubblicato": true
   }
   → ID: 123
   ```

5. **DEFINIZIONE**
   ```
   POST /api/definizioni
   {
     "lemma": 123,
     "numero": 1,
     "testo": "Detrarre"
   }
   → ID: 456
   ```

6. **RICORRENZA** (collega tutto)
   ```
   POST /api/ricorrenze
   {
     "definizione": 456,
     "fonte": 111,
     "testo_originale": "«in questo caso s'intendano essere et sieno tacitamente obligati a questi cotali paganti, abattutene le parti che toccano a questi cotali paganti»",
     "pagina": "p. 157v.",
     "livello_razionalita": 222
   }
   → ID: 789
   ```

---

## 🔄 Flusso di Lettura Dati (Frontend)

### Query API per mostrare il lemma completo

```typescript
// 1. GET Lemma
GET /api/lemmi?where[termine][equals]=Abbattere&depth=2

// Risposta (semplificata):
{
  "docs": [{
    "id": 123,
    "termine": "Abbattere",
    "tipo": "volgare",
    "lemmario": {
      "id": 1,
      "nome": "Lemmario Razionale"
    }
  }]
}

// 2. GET Definizioni del lemma
GET /api/definizioni?where[lemma][equals]=123&depth=0

// Risposta:
{
  "docs": [{
    "id": 456,
    "numero": 1,
    "testo": "Detrarre",
    "lemma": 123
  }]
}

// 3. GET Ricorrenze della definizione
GET /api/ricorrenze?where[definizione][equals]=456&depth=2

// Risposta (semplificata):
{
  "docs": [{
    "id": 789,
    "testo_originale": "«in questo caso s'intendano essere...»",
    "pagina": "p. 157v.",
    "fonte": {
      "id": 111,
      "shorthand_id": "Firenze.Statuti.1355.volg",
      "titolo": "Statuti della Repubblica fiorentina",
      "anno": "1355"
    },
    "livello_razionalita": {
      "id": 222,
      "numero": 2,
      "nome": "Operazioni"
    }
  }]
}
```

### Parametro `depth` in Payload

- `depth=0`: Restituisce solo ID delle relazioni
- `depth=1`: Popola 1 livello di relazioni
- `depth=2`: Popola 2 livelli (es. lemma → definizione → ricorrenza → fonte)

---

## ✅ Validazione Integrità Referenziale

### Constraints da Verificare

1. ✅ **Lemma → Lemmario**: Ogni lemma DEVE appartenere a un lemmario
   - `lemmi.lemmario` is REQUIRED
   - Verificare che `lemmario_id` esista in `lemmari`

2. ✅ **Definizione → Lemma**: Ogni definizione DEVE avere un lemma
   - `definizioni.lemma` is REQUIRED
   - Verificare che `lemma_id` esista in `lemmi`

3. ✅ **Ricorrenza → Definizione + Fonte**: Ogni ricorrenza DEVE avere definizione E fonte
   - `ricorrenze.definizione` is REQUIRED
   - `ricorrenze.fonte` is REQUIRED
   - Verificare che gli ID esistano

4. ⚠️ **Ricorrenza → Livello Razionalità**: NULLABLE (non tutti i lemmi hanno livelli)
   - `ricorrenze.livello_razionalita` può essere NULL
   - Valido solo per "Lemmario Razionale"

5. ✅ **Livello Razionalità → Lemmario**: Ogni livello appartiene a un lemmario
   - `livelli_razionalita.lemmario` is REQUIRED

---

## 🧪 Test di Integrità da Eseguire

### Test 1: Query completa lemma "Abbattere"

```bash
# Con Docker running
curl -s http://localhost:3000/api/lemmi?where[termine][equals]=Abbattere&depth=0 | jq
```

**Output atteso:**
```json
{
  "docs": [{
    "id": 123,
    "termine": "Abbattere",
    "tipo": "volgare",
    "lemmario": 1,
    "slug": "abbattere"
  }],
  "totalDocs": 1
}
```

---

### Test 2: Query definizioni

```bash
curl -s "http://localhost:3000/api/definizioni?where[lemma][equals]=123" | jq
```

**Output atteso:**
```json
{
  "docs": [{
    "id": 456,
    "lemma": 123,
    "numero": 1,
    "testo": "Detrarre"
  }],
  "totalDocs": 1
}
```

---

### Test 3: Query ricorrenze (con depth=2 per popolare fonte + livello)

```bash
curl -s "http://localhost:3000/api/ricorrenze?where[definizione][equals]=456&depth=2" | jq
```

**Output atteso:**
```json
{
  "docs": [{
    "id": 789,
    "definizione": {...},
    "fonte": {
      "id": 111,
      "shorthand_id": "Firenze.Statuti.1355.volg",
      "titolo": "Statuti della Repubblica fiorentina",
      "anno": "1355"
    },
    "testo_originale": "«in questo caso s'intendano essere et sieno tacitamente obligati a questi cotali paganti, abattutene le parti che toccano a questi cotali paganti»",
    "pagina": "p. 157v.",
    "livello_razionalita": {
      "id": 222,
      "numero": 2,
      "nome": "Operazioni"
    }
  }],
  "totalDocs": 1
}
```

---

### Test 4: Verifica vincoli di integrità

```sql
-- Da eseguire su PostgreSQL

-- 1. Lemmi orfani (senza lemmario)
SELECT id, termine FROM lemmi WHERE lemmario IS NULL;
-- Risultato atteso: 0 rows

-- 2. Definizioni orfane (senza lemma)
SELECT id FROM definizioni WHERE lemma IS NULL;
-- Risultato atteso: 0 rows

-- 3. Ricorrenze senza definizione o fonte
SELECT id FROM ricorrenze WHERE definizione IS NULL OR fonte IS NULL;
-- Risultato atteso: 0 rows

-- 4. Livelli razionalità senza lemmario
SELECT id, nome FROM livelli_razionalita WHERE lemmario IS NULL;
-- Risultato atteso: 0 rows
```

---

## ⚠️ Problemi Potenziali Identificati

### 1. ❌ Hook Bidirezionalità NON Implementato

**File:** [riferimentiIncrociati.ts](../packages/payload-cms/src/hooks/riferimentiIncrociati.ts)

**Status:** ✅ File creato ma **NON collegato** alle collections

**Problema:** Gli hooks `createBidirezionalita` e `deleteBidirezionalita` NON sono applicati alla collection `RiferimentiIncrociati`.

**Fix necessario:**
```typescript
// packages/payload-cms/src/collections/RiferimentiIncrociati.ts
import { createBidirezionalita, deleteBidirezionalita } from '../hooks/riferimentiIncrociati'

export const RiferimentiIncrociati: CollectionConfig = {
  // ...
  hooks: {
    afterChange: [createBidirezionalita],  // ← MANCA
    afterDelete: [deleteBidirezionalita],  // ← MANCA
  },
}
```

---

### 2. ⚠️ Livello Razionalità su Ricorrenza vs Definizione

**Domanda:** Il livello razionalità è:
- A) Specifico per ogni **ricorrenza** (uso attuale)?
- B) Unico per tutta la **definizione**?

**Struttura attuale:** `ricorrenze.livello_razionalita` (FK)

**Implicazione:** Se un lemma ha la stessa definizione ma ricorrenze in fonti diverse, ogni ricorrenza potrebbe avere livelli diversi?

**Esempio critico:**
```
Lemma: "Abbattere"
Definizione 1: "Detrarre"
  Ricorrenza 1: Statuti 1355 → Livello 2
  Ricorrenza 2: Statuti 1400 → Livello 3 (?)
```

**Verifica necessaria:** Controllare se nel legacy il livello è unico per lemma o varia per ricorrenza.

---

### 3. ⚠️ Access Control Temporaneo

**Status:** Collections hanno `create: public_` per migrazione

**Collections coinvolte:**
- `lemmi`
- `definizioni`
- `ricorrenze`
- `fonti`

**Action Required:** Dopo migrazione, cambiare a:
```typescript
create: hasLemmarioAccess
```

---

### 4. ✅ Univocità Slug Lemmi

**Problema potenziale:** Due lemmari potrebbero avere lo stesso termine (es. "camera" latino e volgare).

**Soluzione attuale:** `slug` è **UNIQUE globale** (non per lemmario)

**Workaround legacy:** Aggiungere suffisso `-lat` ai lemmi latini:
- `camera-lat` (latino)
- `camera` (volgare)

**Verifica:** Controllare che la migrazione applichi questa logica.

---

## 📊 Diagramma ER Semplificato

```
LEMMARI (1) ──────┬──────> LEMMI (N)
                  │            │
                  │            │ (1)
                  │            ▼
                  │        DEFINIZIONI (N)
                  │            │
                  │            │ (1)
                  │            ▼
                  │        RICORRENZE (N)
                  │            │
                  │            │ (N)
                  │            ├──────> FONTI (1)
                  │            │
                  │            │ (N)
                  │            └──────> LIVELLI_RAZIONALITA (1)
                  │                            ▲
                  └────────────────────────────┘ (1)
```

**Legenda:**
- `(1)` = Relazione many-to-one
- `(N)` = Relazione one-to-many

---

## 🎯 Prossimi Passi Consigliati

### Priorità ALTA

1. ✅ **Avviare Docker Compose**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

2. ✅ **Verificare migrazione completata**
   ```bash
   curl http://localhost:3000/api/lemmi?where[termine][equals]=Abbattere
   ```

3. ❌ **Applicare hooks bidirezionalità** (FASE 3)
   - Modificare `RiferimentiIncrociati.ts`
   - Aggiungere `afterChange` e `afterDelete` hooks

4. ❌ **Implementare Collection StoricoModifiche** (FASE 3)
   - Per audit trail completo

5. ⚠️ **Test integrità dati**
   - Eseguire i 4 test SQL sopra riportati
   - Verificare orphan records

### Priorità MEDIA

6. ⚠️ **Correggere Access Control**
   - Rimuovere `public_` da create dopo migrazione
   - Testare permessi con utenti diversi

7. ⚠️ **Validare logica livelli razionalità**
   - Chiarire se livello è per ricorrenza o definizione
   - Eventualmente spostare FK

---

## 📝 Note Finali

**Struttura Payload è corretta?** ✅ SÌ

Le relazioni sono ben definite e rispettano la normalizzazione:
- `lemmi` → `definizioni` (1:N)
- `definizioni` → `ricorrenze` (1:N)
- `ricorrenze` → `fonti` (N:1)
- `ricorrenze` → `livelli_razionalita` (N:1)

**Cosa manca?**
1. Hook bidirezionalità non collegato
2. Access control da correggere post-migrazione
3. Test integrità da eseguire
4. Validazione logica livelli razionalità

**Pronto per FASE 3?** ⚠️ QUASI

È necessario:
1. Avviare Docker e verificare dati migrati
2. Testare query API
3. Solo dopo implementare hooks
