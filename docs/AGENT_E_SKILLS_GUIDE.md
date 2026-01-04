# Guida Agent e Skills per Sviluppo Lemmario

**Data:** 02/01/2026
**Versione:** 1.0
**Scopo:** Definire quali agent Claude Code e skills custom utilizzare per ogni fase del progetto

---

## Indice

1. [Panoramica Agent Disponibili](#1-panoramica-agent-disponibili)
2. [Mapping Fase → Agent](#2-mapping-fase--agent)
3. [Skills Custom Consigliati](#3-skills-custom-consigliati)
4. [Esempi Prompt per Agent](#4-esempi-prompt-per-agent)
5. [Best Practices](#5-best-practices)

---

## 1. Panoramica Agent Disponibili

### 1.1. Agent Built-in Claude Code

#### `general-purpose`
**Descrizione:** Agent generico per task multi-step autonomi
**Strumenti disponibili:** Tutti (Read, Write, Edit, Bash, Grep, Glob, etc.)
**Quando usarlo:**
- Implementazione codice
- Creazione file multipli
- Setup configurazioni
- Script e automazioni
- Ricerca nel codebase quando serve esplorazione iterativa

**Limiti:**
- Non specializzato per task specifici
- Può essere lento per exploration massiva

---

#### `Explore`
**Descrizione:** Agent veloce specializzato per esplorare codebase
**Strumenti disponibili:** Tutti
**Quando usarlo:**
- Trovare file per pattern (es. `src/components/**/*.tsx`)
- Cercare keyword nel codice
- Rispondere domande sul codebase
- Analisi architettura esistente

**Livelli thoroughness:**
- `quick`: search basic
- `medium`: exploration moderata
- `very thorough`: analisi comprehensive

**Prompt esempio:**
```
Esplora il codebase e dimmi:
1. Dove sono definite le Payload Collections
2. Come è strutturato il sistema di permessi
3. Quali hook sono implementati
Thoroughness: medium
```

---

#### `Plan`
**Descrizione:** Software architect agent per design implementation
**Strumenti disponibili:** Tutti
**Quando usarlo:**
- Pianificare strategia implementazione
- Design architetturale
- Identificare file critici
- Valutare trade-off architetturali

**Output:** Step-by-step plan, file list, considerazioni

**Prompt esempio:**
```
Pianifica l'implementazione del sistema multi-lemmario con:
- Payload CMS collections per 13 entità
- Access control basato su lemmario assegnato
- Relazioni complesse (1:N, N:M, auto-ref)
Produci piano dettagliato con file da creare
```

---

### 1.2. Agent NON Utilizzabili per Questo Progetto

❌ **statusline-setup** - Solo per configurazione status line Claude
❌ **claude-code-guide** - Solo per domande su Claude Code stesso

---

## 2. Mapping Fase → Agent

### FASE 1: Setup Infrastruttura Base

#### Task 1.1: Creazione Struttura Repository
**Agent:** `general-purpose`
**Thoroughness:** N/A
**Motivo:** Creazione file multipli, configurazione Git

**Prompt:**
```
Crea la struttura base per un monorepo TypeScript con:

Struttura cartelle:
- packages/payload-cms (backend Payload CMS)
- packages/frontend (frontend Next.js 14)
- scripts/migration (script migrazione dati)
- docs/ (documentazione)

File da creare:
1. package.json root (workspace npm con packages/*)
2. .gitignore completo per Node.js + Docker
3. .env.example con tutte le variabili:
   - DATABASE_URI
   - PAYLOAD_SECRET
   - PAYLOAD_PUBLIC_SERVER_URL
   - Altre necessarie
4. README.md base con istruzioni setup

Non installare dipendenze, solo creare struttura.
```

**Output atteso:**
- Struttura cartelle creata
- File configurazione base
- README documentato

---

#### Task 1.2: Docker Compose Base
**Agent:** `general-purpose`
**Thoroughness:** N/A

**Prompt:**
```
Crea docker-compose.yml con:

Servizi:
1. postgres:
   - Image: postgres:16-alpine
   - Env vars da .env (DB_USER, DB_PASSWORD)
   - Volume persistent: postgres_data
   - Health check: pg_isready
   - Network: lemmario_network

2. payload (placeholder):
   - Build: ./packages/payload-cms
   - Depends on: postgres (with health check)
   - Env: DATABASE_URI, PAYLOAD_SECRET
   - Port: 3000
   - Network: lemmario_network

3. frontend (placeholder):
   - Build: ./packages/frontend
   - Env: NEXT_PUBLIC_API_URL
   - Port: 3001
   - Network: lemmario_network

Includi volumes e networks definitions.
```

---

#### Task 1.3: GitHub Actions CI/CD Base
**Agent:** `general-purpose`

**Prompt:**
```
Crea .github/workflows/ci.yml per:

Trigger: push su branch main e pull requests

Jobs:
1. lint:
   - Node 20
   - npm install (workspaces)
   - npm run lint

2. typecheck:
   - TypeScript check su tutti i packages

3. test:
   - Run tests se esistono

Usa cache per node_modules.
```

---

### FASE 2: Payload CMS Setup

#### Task 2.1: Design Architettura Collections
**Agent:** `Plan` ⭐
**Motivo:** Architettura complessa, serve planning before coding

**Prompt:**
```
Pianifica l'implementazione di Payload CMS Collections per:

Entità (13 totali):
1. Lemmario (container multi-tenancy)
2. Utente (auth + ruoli)
3. UtenteRuoloLemmario (junction table permessi)
4. Lemma (termine + varianti + definizioni)
5. VarianteGrafica (varianti ortografiche)
6. Definizione (significati)
7. LivelliRazionalita (6 livelli predefiniti)
8. Ricorrenza (citazioni)
9. Fonte (bibliografia)
10. RiferimentoIncrociato (CFR, VEDI, etc.)
11. ContenutoStatico (pagine CMS)
12. StoricoModifiche (audit trail)
13. CampoCustomLemmario (optional EAV)

Relazioni:
- Lemmario 1→N Lemma
- Lemma 1→N Definizione
- Definizione 1→N Ricorrenza
- Ricorrenza N→1 Fonte
- RiferimentoIncrociato: auto-referenziale su Lemma (N:M)
- Utente N:M Lemmario (via UtenteRuoloLemmario)

Access Control:
- Super Admin: tutto
- Lemmario Admin: solo lemmari assegnati
- Redattore: CRUD lemmi su lemmari assegnati

Produci:
1. Lista file da creare (uno per collection)
2. Ordine di implementazione
3. Struttura TypeScript per collection Lemmi (la più complessa)
4. Access control logic per multi-tenancy
```

**Output atteso:**
- Piano dettagliato
- File list con priorità
- Template collection esempio
- Considerazioni architetturali

---

#### Task 2.2: Implementare Collections (Iterativo)
**Agent:** `general-purpose`
**Motivo:** Coding effettivo, file multipli

**Prompt (esempio per Lemmari collection):**
```
Implementa Payload Collection "Lemmari" in:
packages/payload-cms/src/collections/Lemmari.ts

Specifiche:
- slug: 'lemmari'
- Admin useAsTitle: 'titolo'
- Access control:
  - create: solo super_admin
  - read: pubblico (tutti)
  - update/delete: solo super_admin

Campi:
1. slug (text, unique, required) - URL identifier
2. titolo (text, required)
3. descrizione (textarea, optional)
4. periodo_storico (text, optional)
5. attivo (checkbox, default true)
6. ordine (number, default 0)
7. configurazione (json, optional) - JSONB per config custom
8. data_pubblicazione (date, optional)

Timestamps: true (createdAt, updatedAt)

Export default CollectionConfig TypeScript.
```

**Ripeti per ogni collection** con prompt specifici.

---

#### Task 2.3: Access Control Logic
**Agent:** `general-purpose`

**Prompt:**
```
Crea helper function per access control multi-lemmario:

File: packages/payload-cms/src/access/lemmarioAccess.ts

Implementa:
1. canAccessLemmario(user, lemmarioId): boolean
   - Super admin → sempre true
   - Altri → check UtenteRuoloLemmario

2. getUserLemmariIds(user): number[]
   - Ritorna array di lemmario_id accessibili

3. filterByLemmario(user): WhereClause
   - Ritorna Payload where clause per filtrare query

Use TypeScript strict, types da payload/types.
```

---

### FASE 3: Business Logic (Hooks)

#### Task 3.1: Hook Bidirezionalità Riferimenti
**Agent:** `general-purpose`

**Prompt:**
```
Implementa Payload hook per bidirezionalità riferimenti incrociati:

File: packages/payload-cms/src/hooks/riferimentiIncrociati.ts

Logica:
1. Hook afterChange su collection "riferimenti-incrociati"
2. Operation "create":
   - Leggi lemma_origine, lemma_destinazione, tipo_riferimento
   - Crea record inverso:
     - lemma_origine = destinazione originale
     - lemma_destinazione = origine originale
     - stesso tipo_riferimento
     - flag auto_creato = true
3. Operation "delete":
   - Trova e elimina record inverso (WHERE auto_creato = true)
4. IMPORTANTE: evita loop infiniti (check auto_creato prima di creare)

Export: createBidirezionalita: CollectionAfterChangeHook

TypeScript strict.
```

---

#### Task 3.2: Audit Trail Hook
**Agent:** `general-purpose`

**Prompt:**
```
Implementa Payload hook per audit trail automatico:

File: packages/payload-cms/src/hooks/auditTrail.ts

Logica:
1. Hook afterChange generico (riutilizzabile)
2. Per ogni operation (create/update/delete):
   - Crea record in collection "storico-modifiche"
   - Campi:
     - tabella: req.collection.config.slug
     - record_id: doc.id
     - operazione: operation.toUpperCase()
     - dati_precedenti: previousDoc (null se create)
     - dati_successivi: doc (null se delete)
     - utente_id: req.user?.id
     - timestamp: new Date()

Export: createAuditTrail: CollectionAfterChangeHook

Gestisci edge case: utente non loggato (sistema automatico).
```

---

### FASE 4: Frontend Next.js

#### Task 4.1: Architettura Routing
**Agent:** `Plan` ⭐

**Prompt:**
```
Progetta l'architettura routing per frontend Next.js 14 (App Router):

Requisiti:
1. Home page: lista lemmari
2. Lemmario home: /[lemmario-slug]
3. Dettaglio lemma: /[lemmario-slug]/lemmi/[termine]
4. Bibliografia: /[lemmario-slug]/bibliografia
5. Search global (header)

Considerazioni:
- SEO important: SSR/ISR
- Dynamic routes: [lemmario-slug], [termine]
- Layout nesting
- Data fetching strategy (server components)
- Metadata generation per SEO

Produci:
1. Struttura cartelle src/app/
2. File da creare (page.tsx, layout.tsx)
3. Data fetching strategy per page
4. Metadata generation approach
```

---

#### Task 4.2: Implementa Pages (Iterativo)
**Agent:** `general-purpose`

**Prompt (esempio Home Page):**
```
Implementa Home Page Next.js:

File: packages/frontend/src/app/page.tsx

Specifiche:
- Server Component (async)
- Fetch da Payload API: GET /api/lemmari?where[attivo][equals]=true
- Ordina per campo "ordine"
- Renderizza grid di cards lemmario con:
  - Titolo
  - Descrizione
  - Periodo storico
  - Link a /[slug]
- Metadata export per SEO:
  - title: "Lemmario - Home"
  - description: "Lemmari storici di terminologia medievale"

TypeScript strict.
Usa Tailwind CSS per styling.
Crea anche component LemmarioCard separato.
```

---

#### Task 4.3: Search Component
**Agent:** `general-purpose`

**Prompt:**
```
Implementa SearchBar component con autocomplete:

File: packages/frontend/src/components/SearchBar.tsx

Specifiche:
- Client Component ('use client')
- Input con debounce (300ms)
- Fetch /api/lemmi?search=${query}&lemmario=${lemmarioSlug}
- Mostra dropdown con risultati
- Evidenzia match
- Keyboard navigation (arrow up/down, enter)
- Accessibilità (ARIA labels)

Props:
- lemmarioSlug: string
- onSelect?: (lemma) => void

TypeScript + Tailwind CSS.
```

---

### FASE 5: Migrazione Dati

#### Task 5.1: Parser HTML Lemmi
**Agent:** `general-purpose`

**Prompt:**
```
Crea parser per file HTML lemmi legacy:

File: scripts/migration/parsers/htmlParser.ts

Input: HTML file path (old_website/lemmi/*.html)
Output: Structured data object

Logica parsing:
1. Estrai termine principale (h1 o title)
2. Trova tutte le varianti grafiche (cerca pattern specifico)
3. Estrai definizioni numerate (1., 2., 3., etc.)
4. Per ogni definizione:
   - Testo definizione
   - Livello razionalità (cerca pattern "1. Concetti astratti")
   - Ricorrenze (cerca tag con class 'bibliografia-link')
5. Estrai attributi data-biblio per mapping fonti
6. Estrai riferimenti CFR (cerca pattern "CFR. LAT. TERMINE")

Use cheerio per HTML parsing.
TypeScript strict con interface LemmaData.
Gestisci errori (log + continue).
```

---

#### Task 5.2: Import Script
**Agent:** `general-purpose`

**Prompt:**
```
Crea script import lemmi in Payload:

File: scripts/migration/01-import-lemmi.ts

Flow:
1. Read all HTML files da old_website/lemmi/
2. Per ogni file:
   - Parse con htmlParser
   - Mappa shorthand_id → fonte_id (da bibliografia pre-imported)
   - POST a Payload API /api/lemmi con:
     - lemmario_id: 1 (Lemmario Razionale)
     - termine, lingua, pubblicato: true
     - varianti array
     - definizioni array nested
3. Log successi e errori
4. Validation post-import:
   - Count: 239 lemmi importati?
   - Orphan records check

Use fetch con authentication (admin token).
Batch processing (10 lemmi alla volta).
TypeScript + error handling robusto.
```

---

### FASE 6: Docker & Deploy

#### Task 6.1: Dockerfile Multi-Stage per Payload
**Agent:** `general-purpose`

**Prompt:**
```
Crea Dockerfile multi-stage per Payload CMS:

File: packages/payload-cms/Dockerfile

Stages:
1. builder:
   - FROM node:20-alpine
   - WORKDIR /app
   - COPY package*.json
   - RUN npm ci
   - COPY src/ tsconfig.json
   - RUN npm run build

2. runtime:
   - FROM node:20-alpine
   - WORKDIR /app
   - COPY package*.json
   - RUN npm ci --only=production
   - COPY --from=builder /app/dist ./dist
   - EXPOSE 3000
   - CMD ["npm", "start"]

Ottimizza per layer caching.
```

---

#### Task 6.2: GitHub Actions Deploy
**Agent:** `general-purpose`

**Prompt:**
```
Crea GitHub Actions workflow per deploy:

File: .github/workflows/deploy.yml

Trigger: push su main

Steps:
1. Checkout code
2. Setup SSH (usa secrets.SSH_PRIVATE_KEY)
3. Deploy via SSH:
   - Connetti a server via VPN
   - cd /path/to/lemmario_ts
   - git pull origin main
   - docker compose down
   - docker compose up -d --build
   - Health check (curl endpoints)
4. Notifica success/failure (optional: Slack webhook)

Use webfactory/ssh-agent@v0.8.0 per SSH.
```

---

## 3. Skills Custom Consigliati

### Skill 1: `/payload-collection`
**Scopo:** Generare template Payload Collection TypeScript

**Implementazione suggerita:**
```typescript
// File: .claude/skills/payload-collection.ts
export default {
  name: 'payload-collection',
  description: 'Genera Payload CMS Collection TypeScript',
  parameters: {
    collectionName: 'string',
    fields: 'array',
    access: 'object (optional)',
  },
  async execute({ collectionName, fields, access }) {
    // Template generation logic
    const template = `
import { CollectionConfig } from 'payload/types'

export const ${collectionName}: CollectionConfig = {
  slug: '${slugify(collectionName)}',
  admin: {
    useAsTitle: '${fields[0].name}',
  },
  access: ${JSON.stringify(access || { read: () => true })},
  fields: [
    ${fields.map(f => generateField(f)).join(',\n    ')}
  ],
  timestamps: true,
}
    `.trim()

    // Write to file
    return template
  }
}
```

**Uso:**
```
/payload-collection collectionName="Lemmi" fields='[{"name":"termine","type":"text","required":true}]'
```

---

### Skill 2: `/nextjs-page`
**Scopo:** Generare Next.js page.tsx con SSR

**Uso:**
```
/nextjs-page route="/[lemmario]/lemmi/[termine]" fetchFrom="/api/lemmi/:id" seo=true
```

---

### Skill 3: `/docker-service`
**Scopo:** Aggiungere servizio a docker-compose.yml

**Uso:**
```
/docker-service name="redis" image="redis:7-alpine" port=6379 network="lemmario_network"
```

---

### Skill 4: `/migration-script`
**Scopo:** Template script migrazione dati

**Uso:**
```
/migration-script from="HTML files" to="Payload API" entity="Lemmi"
```

---

### Skill 5: `/payload-hook`
**Scopo:** Template hook Payload (beforeChange, afterChange, etc.)

**Uso:**
```
/payload-hook type="afterChange" collection="riferimenti-incrociati" logic="create bidirectional"
```

---

## 4. Esempi Prompt per Agent

### Esempio 1: Debugging Issue Complesso
**Scenario:** Access control non funziona come atteso

**Agent:** `Explore` (quick) → `general-purpose` (fix)

**Prompt Explore:**
```
Esplora il codebase e trova:
1. Dove è definita la logica access control per collection "lemmi"
2. Quali helper functions sono usate
3. Come viene recuperato user.lemmari_assegnati

Thoroughness: quick
```

**Prompt general-purpose (dopo Explore):**
```
Ho trovato il problema in src/access/lemmarioAccess.ts.
La query user.lemmari_assegnati ritorna undefined.

Debugging richiesto:
1. Verifica che relation "lemmari_assegnati" sia populated
2. Aggiungi logging in getUserLemmariIds
3. Test con utente di esempio
4. Fixa il bug

Spiega il fix passo per passo.
```

---

### Esempio 2: Refactoring Sicuro
**Scenario:** Voglio refactorare la struttura collections

**Agent:** `Plan` → `general-purpose`

**Prompt Plan:**
```
Voglio refactorare le Payload Collections per:
1. Separare VarianteGrafica e Definizione in collections separate (ora sono nested arrays in Lemmi)
2. Mantenere relazioni 1:N
3. Migrare dati esistenti

Analizza:
- Impatto sulle query esistenti
- Modifiche necessarie frontend
- Script migrazione dati
- Rischi e mitigazioni

Produci piano step-by-step sicuro.
```

---

### Esempio 3: Nuova Feature
**Scenario:** Aggiungere export PDF dei lemmi

**Agent:** `Plan` → `general-purpose` (implementazione) → `general-purpose` (test)

**Prompt Plan:**
```
Progetta feature "Export PDF lemma":

Requisiti:
- Button "Scarica PDF" su pagina dettaglio lemma
- PDF deve includere:
  - Termine + varianti
  - Tutte definizioni
  - Ricorrenze con citazioni
  - Bibliografia
- Layout professionale
- Logo lemmario (se disponibile)

Considerazioni:
- Libreria PDF (puppeteer? jsPDF? react-pdf?)
- Rendering server-side o client-side?
- Performance (cache?)
- Payload endpoint custom o Next.js API route?

Produci piano implementazione.
```

---

## 5. Best Practices

### 5.1. Quando Usare Quale Agent

**Usa `Plan` quando:**
- ✅ Devi progettare architettura nuova feature
- ✅ Refactoring complesso
- ✅ Analisi trade-off
- ✅ Hai bisogno di step-by-step plan prima di codare

**Usa `general-purpose` quando:**
- ✅ Implementazione codice standard
- ✅ Creazione file multipli
- ✅ Setup configurazioni
- ✅ Fix bug specifici
- ✅ Scrittura script

**Usa `Explore` quando:**
- ✅ Devi trovare dove è definita una funzione
- ✅ Cercare pattern nel codebase
- ✅ Analisi struttura progetto esistente
- ✅ Non sai dove iniziare a cercare

---

### 5.2. Chaining Agent

Per task complessi, usa agent in sequenza:

**Pattern 1: Explore → general-purpose**
```
1. Explore (quick): "Trova dove sono i Payload hooks"
2. general-purpose: "Implementa nuovo hook in quella directory"
```

**Pattern 2: Plan → general-purpose → general-purpose**
```
1. Plan: "Progetta feature export PDF"
2. general-purpose: "Implementa backend endpoint"
3. general-purpose: "Implementa frontend button"
```

**Pattern 3: general-purpose → Explore → general-purpose**
```
1. general-purpose: "Implementa feature X"
   → Errore in produzione
2. Explore (medium): "Trova tutte le dipendenze di feature X"
3. general-purpose: "Fix bug trovato"
```

---

### 5.3. Prompt Engineering Tips

**✅ DO:**
- Sii specifico su file paths
- Include context (TypeScript strict, Tailwind, etc.)
- Specifica output atteso
- Dai esempi quando possibile
- Menziona edge cases

**❌ DON'T:**
- Prompt vaghi ("crea un componente")
- Omettere tecnologie usate
- Chiedere troppe cose insieme
- Dimenticare error handling

**Esempio BAD prompt:**
```
Crea un componente per mostrare i lemmi
```

**Esempio GOOD prompt:**
```
Crea React component LemmaCard in packages/frontend/src/components/LemmaCard.tsx

Specifiche:
- TypeScript strict
- Props: { termine: string, descrizione: string, href: string }
- Styling: Tailwind CSS (card shadow, hover effect)
- Accessibilità: semantic HTML
- Link con Next.js Link component

Render:
- Termine (h3)
- Descrizione truncated (2 lines)
- "Vedi dettaglio" link

Export default LemmaCard.
```

---

### 5.4. Gestione Errori Agent

Se un agent fallisce o produce output non corretto:

1. **Review output attentamente**
2. **Raffina prompt** con più dettagli
3. **Prova agent diverso** (es. Plan invece di general-purpose)
4. **Break down task** in sub-task più piccoli
5. **Fornisci esempi** di output desiderato

---

### 5.5. Testing Agent Output

Dopo output di un agent:

1. **Verifica sintassi** (TypeScript errors)
2. **Test funzionalità** (run del codice)
3. **Code review** (best practices)
4. **Integrazione** (funziona con resto del codice?)

**Non accettare output blindly!**

---

## 6. Workflow Suggerito per Sviluppo

### Setup Iniziale
```
1. Plan agent: "Progetta struttura repository"
2. Review plan
3. general-purpose: "Implementa struttura base"
4. Commit: "feat: initial repository structure"
```

### Implementazione Feature
```
1. Plan agent: "Progetta feature X"
2. Review plan, ask questions se unclear
3. general-purpose: "Implementa parte 1 (backend)"
4. Test parte 1
5. general-purpose: "Implementa parte 2 (frontend)"
6. Test integrazione
7. Commit: "feat: implement feature X"
```

### Debugging
```
1. Explore (quick): "Trova dove è il problema"
2. Read file problematico
3. general-purpose: "Fix bug in [file]"
4. Test fix
5. Commit: "fix: resolve issue in [component]"
```

### Refactoring
```
1. Explore (medium): "Analizza codice da refactorare"
2. Plan: "Progetta refactoring sicuro"
3. Review plan
4. general-purpose: "Esegui refactoring step 1"
5. Test
6. general-purpose: "Esegui refactoring step 2"
7. Test
8. Commit: "refactor: improve [component]"
```

---

## 7. Checklist Utilizzo Agent

Prima di invocare agent, verifica:

- [ ] Ho definito chiaramente l'obiettivo?
- [ ] Ho scelto l'agent giusto per il task?
- [ ] Il prompt è specifico e dettagliato?
- [ ] Ho incluso context tecnico (TS, framework, etc.)?
- [ ] Ho specificato file paths dove applicabile?
- [ ] So cosa mi aspetto come output?

Dopo output agent, verifica:

- [ ] L'output è corretto e completo?
- [ ] Ho testato il codice generato?
- [ ] Il codice segue best practices del progetto?
- [ ] Ho capito cosa fa il codice generato?
- [ ] Serve refining o è pronto per commit?

---

**Fine Guida Agent e Skills**
