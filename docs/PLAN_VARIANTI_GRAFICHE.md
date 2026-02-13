# Piano: Importazione Varianti Grafiche dal Sito Legacy

**Status**: Da implementare
**Data inizio**: 12/02/2026
**Data aggiornamento**: 12/02/2026 (Revisione critica post-analisi)
**Owner**: Implementation Team

---

## Executive Summary

Le **varianti grafiche** sono forme alternative di scrittura di un lemma (es. "Libra" / "Livra"). L'infrastruttura backend (collection) e frontend (componente) esiste gia', ma il parser HTML **non estrae** le varianti presenti nel dato legacy.

L'analisi approfondita di **tutti** i 234 file HTML legacy ha rivelato:
- **2 file con varianti grafiche esplicite** nei titoli (pattern: termini separati da virgola)
- **5 collection** con `create: public_` da fixare per security post-migration

**Strategia**:
1. **Fase 1**: Discovery (completata) — identificare dove sono le varianti nel dato legacy
2. **Fase 2**: Implementare estrazione varianti nel parser HTML
3. **Fase 3**: Fix access control (`public_` → policy appropriate)
4. **Fase 4**: Verifica frontend (gia' implementato)
5. **Fase 5**: Re-import + verifica end-to-end

---

## Status Implementazione

### Completato

**Fase 1**: Discovery varianti — completata con revisione critica

**Fase 4**: Frontend (pre-esistente)
- Componente `VariantiGrafiche.tsx` esiste
- `getVariantiByLemma()` presente in payload-api.ts
- Pagina lemma integra il componente (condizionato su `varianti.length > 0`)

### Da fare

- **Fase 2**: Modificare il parser per estrarre varianti dai titoli con virgola
- **Fase 3**: Fix access control su 5 collection
- **Fase 5**: Re-import + verifica end-to-end

---

## Fase 1: Discovery (Completata)

### Risultati della ricerca

Scansione completa di tutti i 234 file HTML in `old_website/lemmi/` (uno per entry in `indice.json`).

**Pattern trovato — Titoli con virgola**:

| File | Titolo HTML | `nome` in indice.json | Variante estratta |
|------|-------------|----------------------|-------------------|
| `libra,_livra.html` | `Libra, Livra` | `libra` | **Livra** |
| `osservagione,_osservazione.html` | `Osservagione, Osservazione` | `observagione` | **Osservazione** |

Convenzione: il `<p class="titolo-lemma">` contiene i termini separati da `, `. Il primo termine e' il principale (coerente con `indice.json`), i successivi sono varianti grafiche.

**Altre osservazioni**:
- `indice.json` non ha un campo dedicato alle varianti
- `bibliografia.json` non ha riferimenti a varianti
- I nomi file con `,_` nel path sono il segnale piu' visibile di varianti
- I `<span class="cfr">` nei titoli sono cross-reference (lat/volg), NON varianti grafiche — gia' gestiti separatamente

### Ubicazione risorse

| Risorsa | Percorso |
|---------|----------|
| Dati legacy | `old_website/` |
| Indice lemmi | `old_website/indice.json` |
| File HTML lemmi | `old_website/lemmi/*.html` |
| Parser HTML | `scripts/migration/parsers/htmlParser.ts` (linea 176-306) |
| Import script | `scripts/migration/import.ts` (linea 223-240 = loop varianti) |
| Collection | `packages/payload-cms/src/collections/VariantiGrafiche.ts` |
| Access control | `packages/payload-cms/src/access/index.ts` |

---

## Fase 2: Backend — Estrazione Varianti nel Parser

### Stato attuale (da fixare)

In `htmlParser.ts` linea 182-186:
```typescript
const varianti: Set<string> = new Set()
// ...
// Il titolo potrebbe contenere varianti
const titolo = $('.titolo-lemma').text().trim()
```

Il `Set<string>` viene creato e mai popolato. Il titolo viene letto ma poi ignorato.

### Modifica richiesta

**File**: `scripts/migration/parsers/htmlParser.ts`

Dopo la linea 186, aggiungere la logica di estrazione varianti dal titolo:

```typescript
// Il titolo potrebbe contenere varianti (es. "Libra, Livra")
const titolo = $('.titolo-lemma').clone().children('span.cfr').remove().end().text().trim()

// Estrai varianti: split su ", " ed escludi il termine principale
if (titolo.includes(', ')) {
  const parti = titolo.split(', ').map(p => p.trim()).filter(Boolean)
  // Il primo termine corrisponde a `termine` (da indice.json)
  // I termini successivi sono varianti grafiche
  for (let i = 1; i < parti.length; i++) {
    varianti.add(parti[i])
  }
}
```

**Punti critici**:
- Rimuovere il `<span class="cfr">` prima di leggere il testo del titolo (altrimenti il testo del cross-reference latino/volgare inquina il titolo)
- Split su `, ` (virgola + spazio), non solo su `,`
- Il primo termine e' il principale, tutti i successivi sono varianti

### Test unitario

Aggiungere in `test-all-fixes.ts` un test per i 2 file noti:

```typescript
// Test: libra,_livra.html → variante "Livra"
const parsedLibra = parseLemmaHTML(
  fs.readFileSync('old_website/lemmi/libra,_livra.html', 'utf-8'),
  'libra', 'volgare'
)
assert(parsedLibra.varianti.length === 1, `Libra: attese 1 variante, trovate ${parsedLibra.varianti.length}`)
assert(parsedLibra.varianti[0] === 'Livra', `Libra: attesa "Livra", trovata "${parsedLibra.varianti[0]}"`)

// Test: osservagione,_osservazione.html → variante "Osservazione"
const parsedOss = parseLemmaHTML(
  fs.readFileSync('old_website/lemmi/osservagione,_osservazione.html', 'utf-8'),
  'observagione', 'volgare'
)
assert(parsedOss.varianti.length === 1, `Osservagione: attese 1 variante, trovate ${parsedOss.varianti.length}`)
assert(parsedOss.varianti[0] === 'Osservazione', `Osservagione: attesa "Osservazione", trovata "${parsedOss.varianti[0]}"`)
```

### Test negativo

Verificare che lemmi con cross-reference nel titolo (es. `Forma (cfr. volg. forma)`) **non** generino false varianti:

```typescript
const parsedForma = parseLemmaHTML(
  fs.readFileSync('old_website/lemmi/forma.html', 'utf-8'),
  'forma', 'latino'
)
assert(parsedForma.varianti.length === 0, `Forma: attese 0 varianti, trovate ${parsedForma.varianti.length}`)
```

---

## Fase 3: Backend — Access Control

### Problema

5 collection hanno ancora `create: public_` (accesso senza autenticazione), lasciato temporaneamente durante la migrazione:

| Collection | File | `create` attuale |
|------------|------|-----------------|
| Lemmi | `collections/Lemmi.ts` | `public_` |
| VariantiGrafiche | `collections/VariantiGrafiche.ts` | `public_` |
| Definizioni | `collections/Definizioni.ts` | `public_` |
| Ricorrenze | `collections/Ricorrenze.ts` | `public_` |
| Fonti | `collections/Fonti.ts` | `public_` |

### Complessita': relazioni indirette

Non tutte le collection hanno un campo `lemmario` diretto. La catena di relazioni e':

```
Lemmario ← Lemma ← VarianteGrafica
Lemmario ← Lemma ← Definizione ← Ricorrenza
Fonte (non ha lemmario — e' condivisa tra lemmari)
```

La funzione `canCreateInLemmario` (in `access/index.ts`) controlla `data?.lemmario`, quindi funziona solo per collection con campo `lemmario` diretto (Lemmi). Per le altre serve una soluzione diversa.

### Strategia di fix

| Collection | Campo diretto | Soluzione proposta |
|------------|---------------|-------------------|
| **Lemmi** | `lemmario` | `canCreateInLemmario` (funziona gia') |
| **Fonti** | nessuno (condivise) | `authenticated` (qualsiasi utente autenticato puo' creare fonti) |
| **VariantiGrafiche** | `lemma` (relazione) | `authenticated` — la validazione multi-tenancy e' garantita dal fatto che il `lemma` referenziato appartiene a un lemmario accessibile |
| **Definizioni** | `lemma` (relazione) | `authenticated` — stessa logica |
| **Ricorrenze** | `definizione` (relazione) | `authenticated` — stessa logica (2 livelli di indirezione) |

**Razionale per `authenticated`**: Creare funzioni di access control che traversano relazioni (lemma → lemmario) richiederebbe query N+1 per ogni operazione di create. Per un CMS interno con utenti fidati, `authenticated` e' sufficiente: impedisce accesso anonimo (il rischio reale) senza aggiungere complessita' non necessaria. L'integrita' multi-tenancy e' garantita dal fatto che i redattori possono selezionare solo lemmi/definizioni del proprio lemmario nell'interfaccia admin.

**Alternativa avanzata** (se necessario in futuro): creare `canCreateViaLemmaRelation` che risolva `data.lemma → lemma.lemmario` e verifichi i permessi. Da implementare solo se emerge un requisito di isolamento piu' stringente.

### Modifiche specifiche

**File**: `packages/payload-cms/src/collections/Lemmi.ts`
```diff
- create: public_,
+ create: canCreateInLemmario,
```

**File**: `packages/payload-cms/src/collections/Fonti.ts`
```diff
- create: public_, // Temporarily allow public creation for migration
+ create: authenticated,
```

**File**: `packages/payload-cms/src/collections/VariantiGrafiche.ts`
```diff
- create: public_, // Temporarily for migration
+ create: authenticated,
```

**File**: `packages/payload-cms/src/collections/Definizioni.ts`
```diff
- create: public_, // Temporarily for migration
+ create: authenticated,
```

**File**: `packages/payload-cms/src/collections/Ricorrenze.ts`
```diff
- create: public_, // Temporarily for migration
+ create: authenticated,
```

### Impatto sulla migrazione

Lo script di migrazione effettua chiamate API senza autenticazione. Dopo il fix, la migrazione richiedera' un API key o un utente autenticato.

**Due opzioni**:
1. **Preferita**: Aggiungere un header di autenticazione allo script di migrazione (es. API key di un super_admin)
2. **Temporanea**: Revertare a `public_` solo durante la migrazione, poi ri-fixare

### Test

- `POST /api/varianti-grafiche` senza auth → 401/403
- `POST /api/lemmi` senza auth → 401/403
- `POST /api/definizioni` senza auth → 401/403
- `POST /api/ricorrenze` senza auth → 401/403
- `POST /api/fonti` senza auth → 401/403
- Migrazione con utente autenticato → successo

---

## Fase 4: Frontend — Verifica (Pre-esistente)

L'infrastruttura frontend e' gia' implementata. Questa fase e' solo di verifica.

### Componenti esistenti

| Componente | File | Status |
|------------|------|--------|
| VariantiGrafiche.tsx | `packages/frontend/src/components/lemma/VariantiGrafiche.tsx` | Esiste |
| getVariantiByLemma() | `packages/frontend/src/lib/payload-api.ts` | Esiste |
| Pagina lemma | `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx` | Integrato |

### Verifica necessaria

- [ ] Componente mostra varianti se `varianti.length > 0`
- [ ] Nessun errore se `varianti.length === 0` (caso maggioritario)
- [ ] Stile coerente con il resto della pagina

### Ricerca Fuzzy (Opzionale — Sprint futuro)

Aggiungere varianti al match di ricerca: cercare "livra" dovrebbe trovare il lemma "libra" tramite la variante. Non bloccante per questo sprint.

---

## Fase 5: Re-Import + Verifica End-to-End

### Pre-condizioni

- [ ] Parser modificato (Fase 2)
- [ ] Access control fixato (Fase 3)
- [ ] Script migrazione con autenticazione (se Fase 3 applicata)

### A. Test locale del parser

```bash
cd scripts
source ~/.nvm/nvm.sh && nvm use 22
npx ts-node migration/test-all-fixes.ts
```

Risultato atteso: test varianti passano (2 varianti estratte da 2 file).

### B. TypeCheck + Lint

```bash
pnpm typecheck
pnpm lint
```

### C. Migrazione locale

```bash
cd scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
```

### D. Verification checklist

- [ ] Report migrazione mostra **Varianti Grafiche: 2 importate** (Livra + Osservazione)
- [ ] DB: `SELECT COUNT(*) FROM varianti_grafiche;` → **2**
- [ ] DB: `SELECT v.variante, l.termine FROM varianti_grafiche v JOIN lemmi l ON v.lemma_id = l.id;` → Libra/Livra + Osservagione/Osservazione (verificare corrispondenza nome effettivo della colonna)
- [ ] Frontend: visita `/[lemmario-slug]/lemmi/libra` → badge "Livra" visibile
- [ ] Frontend: visita lemma senza varianti → nessun badge, nessun errore
- [ ] Access control: POST a collection senza auth → 401/403

### E. Deploy (dopo verifica locale)

```bash
# Via GitHub Actions
gh workflow run data-migration.yml -f lemmario_id=1 -f mode=migrate
```

---

## Timing & Deliverables

| Fase | Stima | Deliverable |
|------|-------|-------------|
| 1 (Discovery) | Completato | 2 varianti identificate nel dato legacy |
| 2 (Parser) | 0.5gg | Parser estrae varianti da titoli con virgola |
| 3 (Access control) | 0.5gg | 5 collection fixate, migrazione autenticata |
| 4 (Frontend verifica) | 0.25gg | Conferma componente funzionante |
| 5 (Re-import + test) | 0.25gg | 2 varianti importate, verifiche end-to-end |
| **TOTALE** | **~1.5gg** | Varianti importate + access control fixato |

---

## Success Criteria

- [ ] Parser estrae varianti da titoli con `, ` (2 file noti: libra, osservagione)
- [ ] Parser NON genera false varianti da titoli con `<span class="cfr">` (test negativo)
- [ ] Migration report mostra **Varianti Grafiche: 2/2 importate**
- [ ] Frontend mostra varianti su lemmi che le hanno (Libra → "Livra")
- [ ] Nessun errore frontend su lemmi senza varianti (232 su 234)
- [ ] `create: public_` rimosso da tutte le 5 collection
- [ ] POST senza autenticazione alle collection → rifiutato

---

## Risk & Mitigations

| Risk | Probabilita' | Impatto | Mitigation |
|------|-------------|---------|------------|
| Il `.clone().children().remove()` di cheerio non rimuove correttamente `span.cfr` | Bassa | Alto (false varianti) | Test negativo con `forma.html` che ha CFR nel titolo |
| Nomi file con virgola causano problemi di path su alcuni OS | Bassa | Medio | I file esistono gia' e funzionano; il parser li legge via `fs.readFileSync` |
| Access control `authenticated` troppo permissivo | Media | Basso | CMS interno con utenti fidati; upgrade a traversal-based policy se necessario |
| Migrazione si rompe dopo fix access control | Media | Medio | Testare migrazione locale con utente autenticato prima del deploy |
| Altre varianti nascoste nel testo delle definizioni | Bassa | Basso | Out of scope: questo sprint gestisce solo le varianti nel titolo |

---

## Note

- Questa feature importa solo **2 varianti grafiche** dal dato legacy — il valore principale e' l'infrastruttura pronta per data entry manuale futuro via CMS admin
- L'access control fix e' **critico per la sicurezza** in produzione, indipendentemente dalle varianti
- I riferimenti incrociati (CFR) sono **gia' implementati** in uno sprint separato (52 importati + 52 inversi auto-creati) — rimossi da questo piano per evitare confusione

---

*Plan v2.0 — Revisione critica post-analisi approfondita del dato legacy*
