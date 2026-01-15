# Piano di Implementazione - Form Lemma Integrato (Multi-Step)

**Data:** 15 gennaio 2026  
**Versione:** 1.0  
**Status:** ✅ IMPLEMENTATO

---

## 📊 Stato Implementazione

| Componente | File | Status |
|------------|------|--------|
| Context Manager | `context.tsx` | ✅ Implementato |
| Hook useSync | `hooks/useSync.ts` | ✅ Implementato |
| StepTabs Component | `components/StepTabs.tsx` | ✅ Implementato |
| BaseStep | `steps/BaseStep.tsx` | ✅ Implementato |
| VariantiStep | `steps/VariantiStep.tsx` | ✅ Implementato |
| DefinizioniStep | `steps/DefinizioniStep.tsx` | ✅ Implementato |
| RiferimentiStep | `steps/RiferimentiStep.tsx` | ✅ Implementato |
| LemmaEditView Main | `index.tsx` | ✅ Implementato |
| Collection Config | `collections/Lemmi.ts` | ⚠️ Richiede configurazione Webpack |

---

## 🎯 Cosa è Stato Implementato

### 1. Architettura Multi-Step Form

```
LemmaEditProvider (Context)
    ↓
LemmaEditView (Main Component)
    ↓
StepTabs (Navigation)
    ├── Step 1: BaseStep (Dati lemma base)
    ├── Step 2: VariantiStep (Varianti grafiche)
    ├── Step 3: DefinizioniStep (Definizioni + Ricorrenze nested)
    └── Step 4: RiferimentiStep (Collegamenti bidirezionali)
```

### 2. State Management (Context API)

**File:** `src/admin/views/LemmaEdit/context.tsx`

**Gestisce:**
- Lemma base (termine, tipo, slug, note, pubblicato)
- Array di Definizioni con Ricorrenze nested
- Array di Varianti Grafiche
- Array di Riferimenti Incrociati
- Stato UI (currentStep, isDirty, isLoading, isSaving, error)

**Actions supportate:**
- `SET_LEMMA`, `UPDATE_LEMMA_FIELD`
- `ADD_DEFINIZIONE`, `UPDATE_DEFINIZIONE`, `DELETE_DEFINIZIONE`
- `ADD_RICORRENZA`, `UPDATE_RICORRENZA`, `DELETE_RICORRENZA`
- `ADD_VARIANTE`, `UPDATE_VARIANTE`, `DELETE_VARIANTE`
- `ADD_RIFERIMENTO`, `UPDATE_RIFERIMENTO`, `DELETE_RIFERIMENTO`
- `SET_STEP`, `MARK_DIRTY`, `MARK_CLEAN`
- `SET_LOADING`, `SET_SAVING`, `SET_ERROR`

### 3. Data Sync Hook

**File:** `src/admin/views/LemmaEdit/hooks/useSync.ts`

**Funzioni principali:**

#### loadLemma(id)
Carica lemma e tutte le entità correlate in parallelo:
1. GET `/api/lemmi/:id` → lemma base
2. GET `/api/definizioni?where[lemma][equals]=id` → definizioni
3. Per ogni definizione: GET `/api/ricorrenze?where[definizione][equals]=defId` → ricorrenze
4. GET `/api/varianti-grafiche?where[lemma][equals]=id` → varianti
5. GET `/api/riferimenti-incrociati?where[lemma_origine][equals]=id&where[auto_creato][equals]=false` → riferimenti

#### saveAll()
Salva tutte le modifiche in modo atomico:
1. PATCH `/api/lemmi/:id` → aggiorna lemma base
2. `syncVarianti()` → CREATE/UPDATE/DELETE varianti
3. `syncDefinizioni()` → CREATE/UPDATE/DELETE definizioni e ricorrenze
4. `syncRiferimenti()` → CREATE/UPDATE/DELETE riferimenti

**Gestione flag `_isNew` e `_isDeleted`:**
- `_isNew: true` → Esegue POST (creazione)
- `_isDeleted: true` → Esegue DELETE (soft delete)
- Altrimenti → Esegue PATCH (update)

### 4. UI Components

#### StepTabs
- Navigation tra step con tab buttons
- Warning quando si cambia tab con modifiche non salvate
- Indicatore step corrente

#### BaseStep
Form per dati base:
- Termine *
- Tipo (latino/volgare) *
- Slug URL
- Ordinamento
- Note redazionali
- Checkbox pubblicato

#### VariantiStep
Gestione varianti grafiche:
- Lista varianti con termine e note
- Bottone "Aggiungi Variante"
- Elimina variante (soft delete)

#### DefinizioniStep (più complesso)
Gestione definizioni con ricorrenze nested:
- Card per ogni definizione
- Dentro ogni card:
  - Numero progressivo
  - Testo definizione
  - Lista ricorrenze:
    - Dropdown fonte *
    - Input pagina/carta
    - Dropdown livello razionalità
    - Textarea testo originale *
  - Bottone "Aggiungi Ricorrenza"
- Bottone "Aggiungi Definizione"

#### RiferimentiStep
Gestione riferimenti incrociati:
- Dropdown tipo riferimento (VEDI, VEDI ANCHE, CFR, SINONIMO, CONTRARIO)
- Dropdown lemma destinazione *
- Note aggiuntive
- Badge "Auto-creato" per riferimenti bidirezionali
- Info box spiega la bidirezionalità automatica

### 5. LemmaEditView (Main)

**Features:**
- Header con titolo lemma e status badge (salvato/non salvato)
- Bottoni Annulla e Salva Tutto
- Warning prima di lasciare pagina con modifiche
- Error banner per errori API
- Multi-step form con StepTabs
- Footer con navigation (Precedente/Successivo) e bottone finale "Salva e Completa"
- Loading spinner durante caricamento
- Error page se lemma non trovato

---

## ⚙️ Configurazione Necessaria

### IMPORTANTE: Webpack Custom Configuration

Payload v2 richiede configurazione Webpack per custom components React.

**File da modificare:** `payload.config.ts`

```typescript
import { webpackBundler } from '@payloadcms/bundler-webpack'
import path from 'path'

export default buildConfig({
  admin: {
    bundler: webpackBundler({
      webpack: (config) => {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...config.resolve?.alias,
              // Alias per import custom views
              '@admin': path.resolve(__dirname, './src/admin'),
            },
          },
        }
      },
    }),
  },
  // ... resto config
})
```

### Aggiornare Collection Lemmi

**File:** `src/collections/Lemmi.ts`

```typescript
import { CollectionConfig } from 'payload/types'
import LemmaEditView from '../admin/views/LemmaEdit'

export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  admin: {
    useAsTitle: 'termine',
    defaultColumns: ['termine', 'tipo', 'lemmario', 'pubblicato', 'updatedAt'],
    group: 'Contenuti',
    description: 'Gestione lemmi (termini del dizionario)',
    components: {
      views: {
        Edit: LemmaEditView, // ← Custom view
      },
    },
  },
  // ... resto config
}
```

---

## 🧪 Testing

### Test 1: Caricamento Lemma Esistente

1. Avvia Docker: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
2. Accedi a Payload Admin: `http://localhost:3000/admin`
3. Vai su "Lemmi" → Seleziona "Abbattere"
4. **Verifica:**
   - ✅ Form multi-step caricato
   - ✅ Step 1 mostra dati base del lemma
   - ✅ Step 2 mostra varianti (se presenti)
   - ✅ Step 3 mostra definizioni con ricorrenze
   - ✅ Step 4 mostra riferimenti incrociati

### Test 2: Navigazione tra Step

1. Dal lemma "Abbattere", clicca su Tab "Varianti Grafiche"
2. Aggiungi variante "abattere"
3. Clicca su Tab "Definizioni"
4. **Verifica:**
   - ⚠️ Alert "Modifiche non salvate. Vuoi davvero cambiare scheda?"
   - ✅ Se confermi, lo stato è preservato (variante ancora presente)

### Test 3: Aggiunta Definizione e Ricorrenza

1. Step 3: Clicca "Aggiungi Definizione"
2. Inserisci testo: "Abbassare"
3. Clicca "Aggiungi Ricorrenza"
4. Seleziona Fonte da dropdown
5. Inserisci:
   - Pagina: "p. 200r"
   - Testo originale: "«...citazione...»"
   - Livello razionalità: "2. Operazioni"
6. **Verifica:**
   - ✅ Form ricorrenza visualizzato
   - ✅ Dropdown fonte popolato
   - ✅ Dropdown livello razionalità popolato (solo per lemmario corrente)

### Test 4: Salvataggio Completo

1. Modifica lemma in vari step:
   - Step 1: Cambia "Note redazionali"
   - Step 2: Aggiungi variante
   - Step 3: Aggiungi definizione + ricorrenza
   - Step 4: Aggiungi riferimento a "Abbattimento"
2. Clicca "💾 Salva Tutto" (header o footer)
3. **Verifica:**
   - ✅ Alert "✅ Lemma salvato con successo!"
   - ✅ Badge status cambia da "⚠️ Non salvato" a "✅ Salvato"
   - ✅ Ricarica pagina e verifica persistenza dati

### Test 5: Bidirezionalità Riferimenti

1. Dal lemma "Abbattere", Step 4
2. Aggiungi riferimento:
   - Tipo: "VEDI ANCHE"
   - Lemma destinazione: "Abbattimento"
3. Salva
4. Vai al lemma "Abbattimento" → Step 4
5. **Verifica:**
   - ✅ Riferimento inverso "Abbattimento → Abbattere" presente
   - ✅ Badge "Auto-creato (bidirezionale)" visualizzato

### Test 6: Eliminazione con Cascade

1. Dal lemma "Abbattere", Step 3
2. Elimina definizione #1 (che ha ricorrenze)
3. Salva
4. **Verifica API:**
   ```bash
   # Verifica che anche le ricorrenze siano eliminate
   curl "http://localhost:3000/api/ricorrenze?where[definizione][equals]=<def_id>"
   # Output: { "docs": [], "totalDocs": 0 }
   ```

---

## 📝 Istruzioni per il Test Manuale

### Prerequisiti

```bash
# 1. Assicurati Docker sia running
docker ps | grep -E "postgres|payload"

# 2. Verifica API Payload raggiungibile
curl http://localhost:3000/api/lemmi | jq '.totalDocs'

# 3. Rebuild Payload (solo se modificato webpack config)
cd packages/payload-cms
pnpm build
pnpm dev
```

### Scenario Test Completo: Creare Lemma "Aggiungere"

**STEP 1: Accedi a Payload Admin**
```
URL: http://localhost:3000/admin
User: (tuo utente admin)
```

**STEP 2: Crea Nuovo Lemma**
1. Sidebar → "Lemmi" → "Create New"
2. Il form multi-step dovrebbe caricarsi

**STEP 3.1: Dati Base**
- Termine: `Aggiungere`
- Tipo: `Volgare (Italiano)`
- Slug: (auto-generato) `aggiungere`
- Pubblicato: ☑️ (checked)
- Note redazionali: `Test form integrato`

**STEP 3.2: Varianti Grafiche**
- Clicca Tab "Varianti Grafiche"
- Aggiungi variante: `agiungere`
- Aggiungi variante: `agionzere`

**STEP 3.3: Definizioni e Ricorrenze**
- Clicca Tab "Definizioni"
- Clicca "Aggiungi Definizione"
  - Numero: 1 (auto)
  - Testo: `Sommare, unire`
  - Clicca "Aggiungi Ricorrenza"
    - Fonte: Seleziona "Statuti..." dal dropdown
    - Pagina: `p. 25v`
    - Livello Razionalità: `2. Operazioni`
    - Testo Originale: `«Et deono aggiungere le quantità...»`

**STEP 3.4: Riferimenti Incrociati**
- Clicca Tab "Riferimenti"
- Clicca "Aggiungi Riferimento"
  - Tipo: `CONTRARIO`
  - Lemma Destinazione: Seleziona "Abbattere"
  - Note: `Opposto di abbattere`

**STEP 4: Salva e Verifica**
1. Clicca "💾 Salva Tutto" (in alto a destra)
2. **Verifica alert:** "✅ Lemma salvato con successo!"
3. **Verifica badge:** "✅ Salvato"

**STEP 5: Verifica Bidirezionalità**
1. Vai a "Lemmi" → "Abbattere"
2. Clicca Tab "Riferimenti"
3. **Verifica presenza:**
   - Riferimento: `CONTRARIO → Aggiungere`
   - Badge: `Auto-creato (bidirezionale)`

**STEP 6: Ricarica e Verifica Persistenza**
1. Ricarica pagina (F5)
2. Naviga tra i tab
3. **Verifica che tutti i dati siano persistiti:**
   - ✅ Dati base
   - ✅ Varianti (2)
   - ✅ Definizioni con ricorrenze (1)
   - ✅ Riferimenti (1)

---

## 🐛 Troubleshooting

### Problema: "Custom view not loading"

**Causa:** Webpack non ha risolto i custom components

**Fix:**
1. Verifica configurazione webpack in `payload.config.ts`
2. Rebuild:
   ```bash
   cd packages/payload-cms
   pnpm build
   rm -rf .cache
   pnpm dev
   ```

### Problema: "Cannot read property 'docs' of undefined"

**Causa:** API response non contiene campo `docs`

**Fix:**
1. Verifica che le API rispondano correttamente:
   ```bash
   curl http://localhost:3000/api/fonti | jq
   ```
2. Controlla console browser per errori CORS

### Problema: "Modifiche non salvate"

**Causa:** Hook `saveAll` fallisce silenziosamente

**Fix:**
1. Apri DevTools → Network
2. Ripeti salvataggio
3. Verifica response 4xx/5xx
4. Controlla logs Payload backend:
   ```bash
   docker logs -f lemmario_ts-payload-cms-1
   ```

### Problema: "Dropdown fonti/livelli vuoti"

**Causa:** Query API non restituisce dati o lemmario ID mancante

**Fix:**
1. Verifica presenza fonti:
   ```bash
   curl "http://localhost:3000/api/fonti?limit=10" | jq '.totalDocs'
   ```
2. Verifica livelli razionalità:
   ```bash
   curl "http://localhost:3000/api/livelli-razionalita" | jq '.totalDocs'
   ```
3. Se mancanti, esegui seed:
   ```bash
   cd packages/payload-cms
   pnpm db:seed
   ```

---

## 📊 Checklist Finale

### Pre-Deploy

- [ ] Rebuild Payload con webpack config aggiornato
- [ ] Test salvataggio lemma esistente
- [ ] Test creazione nuovo lemma completo
- [ ] Test bidirezionalità riferimenti
- [ ] Test eliminazione con cascade
- [ ] Test navigazione con modifiche non salvate
- [ ] Verificare console browser (no errors)
- [ ] Verificare logs backend (no errors)

### Post-Deploy

- [ ] Aggiornare documentazione utente
- [ ] Creare video tutorial (opzionale)
- [ ] Training redattori su nuovo flusso
- [ ] Monitor errori in production

---

## 🎉 Vantaggi Ottenuti

✅ **UX Unificata:** Utente gestisce tutto da un unico form  
✅ **Salvataggio Atomico:** Un click salva tutte le entità  
✅ **Contesto Preservato:** Navigazione tra step mantiene stato  
✅ **Validazione Inline:** Feedback immediato su campi required  
✅ **Bidirezionalità Automatica:** Hook gestisce riferimenti inversi  
✅ **DB Normalizzato:** Struttura dati rimane ottimale  
✅ **Scalabile:** Facile aggiungere nuovi step/entità

---

## 🔜 Future Enhancements

1. **Validazione avanzata:** Zod schema per ogni step
2. **Autosave:** Salvataggio automatico ogni 30s
3. **Preview:** Anteprima rendering pubblico
4. **Bulk operations:** Applica modifiche a più lemmi
5. **Versioning UI:** Visualizza diff tra versioni
6. **Export/Import:** JSON export di lemma completo
7. **Statistiche:** Contatori (def: 3, ric: 5, ecc.)

---

**Implementato da:** GitHub Copilot  
**Data:** 15 gennaio 2026  
**Versione:** 1.0
