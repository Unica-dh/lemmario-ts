# Piano Dettagliato di Implementazione - Lemmario Multi-Tenancy con Payload CMS

**Data:** 02/01/2026
**Versione:** 1.0
**Architettura:** Payload CMS + Frontend Next.js + PostgreSQL + Docker Compose

---

## Indice

1. [Panoramica Architettura](#1-panoramica-architettura)
2. [Fasi di Implementazione](#2-fasi-di-implementazione)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Struttura Repository](#4-struttura-repository)
5. [Agent e Skills Necessari](#5-agent-e-skills-necessari)
6. [Timeline e Milestone](#6-timeline-e-milestone)
7. [Rischi e Mitigazioni](#7-rischi-e-mitigazioni)

---

## 1. Panoramica Architettura

### 1.1. Architettura Generale (Opzione A - Payload CMS Backend Principale)

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐                                       │
│  │   PostgreSQL     │                                       │
│  │   Database       │                                       │
│  │   - Port: 5432   │                                       │
│  └────────┬─────────┘                                       │
│           │                                                 │
│           │ Connection                                      │
│           │                                                 │
│  ┌────────▼─────────────────────────────────────┐          │
│  │         Payload CMS (Backend)                │          │
│  │  - Node.js 20 + TypeScript                   │          │
│  │  - Port: 3000                                │          │
│  │  ┌──────────────────────────────────────┐   │          │
│  │  │  Admin Panel (/admin)                │   │          │
│  │  │  - Gestione Lemmi                    │   │          │
│  │  │  - Gestione Lemmari                  │   │          │
│  │  │  - Gestione Utenti/Permessi          │   │          │
│  │  │  - Editor WYSIWYG                    │   │          │
│  │  └──────────────────────────────────────┘   │          │
│  │  ┌──────────────────────────────────────┐   │          │
│  │  │  REST API (/api)                     │   │          │
│  │  │  - GET /api/lemmari                  │   │          │
│  │  │  - GET /api/lemmi?lemmario=X         │   │          │
│  │  │  - GET /api/lemmi/:id                │   │          │
│  │  │  - Full-text search                  │   │          │
│  │  │  - Authentication (JWT)              │   │          │
│  │  └──────────────────────────────────────┘   │          │
│  │  ┌──────────────────────────────────────┐   │          │
│  │  │  Hooks & Custom Logic                │   │          │
│  │  │  - Bidirezionalità riferimenti       │   │          │
│  │  │  - Audit trail automatico            │   │          │
│  │  │  - Access Control per lemmario       │   │          │
│  │  └──────────────────────────────────────┘   │          │
│  └──────────────────┬───────────────────────────┘          │
│                     │                                       │
│                     │ REST API Calls                        │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────┐          │
│  │       Frontend Next.js (Public Site)         │          │
│  │  - Port: 3001                                │          │
│  │  ┌──────────────────────────────────────┐   │          │
│  │  │  Public Pages                        │   │          │
│  │  │  - Home (lista lemmari)              │   │          │
│  │  │  - /[lemmario-slug]                  │   │          │
│  │  │  - /[lemmario-slug]/lemmi/[termine]  │   │          │
│  │  │  - /[lemmario-slug]/bibliografia     │   │          │
│  │  │  - Search & Filters                  │   │          │
│  │  └──────────────────────────────────────┘   │          │
│  │  ┌──────────────────────────────────────┐   │          │
│  │  │  SSR/ISR with Next.js                │   │          │
│  │  │  - SEO optimization                  │   │          │
│  │  │  - Static generation dove possibile  │   │          │
│  │  └──────────────────────────────────────┘   │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Nginx Reverse Proxy (Opzionale)            │           │
│  │  - Port 80/443                               │           │
│  │  - /admin/* → Payload :3000                 │           │
│  │  - /api/* → Payload :3000                   │           │
│  │  - /* → Next.js :3001                       │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. Flusso Dati

**Utente Pubblico:**
1. Visita `/lemmario-razionale` (Next.js)
2. Next.js chiama `GET /api/lemmi?lemmario=lemmario-razionale` (Payload)
3. Payload query PostgreSQL con ACL
4. Ritorna JSON
5. Next.js renderizza SSR/ISR

**Redattore:**
1. Login su `/admin` (Payload)
2. Payload verifica credenziali + ruolo lemmario (UtenteRuoloLemmario)
3. Interfaccia admin mostra solo lemmi dei lemmari assegnati
4. Modifica lemma → Payload hook → Crea bidirezionalità riferimenti + audit trail
5. Salva su PostgreSQL

---

## 2. Fasi di Implementazione

### FASE 1: Setup Infrastruttura Base (Settimana 1)

#### 1.1. Setup Repository e Docker
**Deliverables:**
- Repository Git inizializzato
- Docker Compose configurato (PostgreSQL + servizi placeholder)
- Struttura cartelle base
- GitHub Actions workflow base

**Tasks:**
- [ ] Creare struttura repository (monorepo)
- [ ] Setup Docker Compose con PostgreSQL
- [ ] Configurare variabili ambiente (.env template)
- [ ] Setup GitHub Actions per CI/CD
- [ ] Configurare lint/prettier/husky

**Files da creare:**
```
lemmario_ts/
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── packages/
│   ├── payload-cms/
│   └── frontend/
├── scripts/
│   └── setup.sh
└── docs/
```

**Agent consigliato:** `general-purpose` per setup iniziale repository

---

#### 1.2. Setup PostgreSQL Base
**Deliverables:**
- PostgreSQL container funzionante
- Database `lemmario_db` creato
- User e permessi configurati

**Tasks:**
- [ ] Configurare PostgreSQL in Docker
- [ ] Setup backup automatico (volume)
- [ ] Script init.sql per database iniziale
- [ ] Test connessione

---

### FASE 2: Payload CMS Core Setup (Settimana 2-3)

#### 2.1. Installazione e Configurazione Payload
**Deliverables:**
- Payload CMS installato e funzionante
- Connessione a PostgreSQL attiva
- Admin panel accessibile

**Tasks:**
- [ ] `npx create-payload-app@latest packages/payload-cms`
- [ ] Configurare `payload.config.ts`
- [ ] Setup database adapter PostgreSQL
- [ ] Configurare autenticazione
- [ ] Test admin panel base

**Configurazione Base payload.config.ts:**
```typescript
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'utenti',
    meta: {
      titleSuffix: '- Lemmario Admin',
      favicon: '/assets/favicon.ico',
    },
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  collections: [
    // Da definire in Fase 2.2
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    disable: true, // Solo REST API
  },
})
```

**Agent consigliato:** `Plan` per progettare configurazione Payload

---

#### 2.2. Definizione Collections Payload (CORE)
**Deliverables:**
- Collections per tutte le 13 entità
- Relazioni definite
- Campi validati

**Collections da implementare (ordine di priorità):**

**1. Collection: Lemmari** (Priorità: ALTA)
```typescript
// packages/payload-cms/src/collections/Lemmari.ts
import { CollectionConfig } from 'payload/types'

export const Lemmari: CollectionConfig = {
  slug: 'lemmari',
  admin: {
    useAsTitle: 'titolo',
    defaultColumns: ['titolo', 'slug', 'attivo', 'data_pubblicazione'],
  },
  access: {
    // Solo super_admin può creare lemmari
    create: ({ req: { user } }) => user?.ruolo === 'super_admin',
    read: () => true, // Pubblico
    update: ({ req: { user } }) => user?.ruolo === 'super_admin',
    delete: ({ req: { user } }) => user?.ruolo === 'super_admin',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (es. "lemmario-razionale")',
      },
    },
    {
      name: 'titolo',
      type: 'text',
      required: true,
    },
    {
      name: 'descrizione',
      type: 'textarea',
    },
    {
      name: 'periodo_storico',
      type: 'text',
      admin: {
        placeholder: 'es. "XIV-XV secolo"',
      },
    },
    {
      name: 'attivo',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'ordine',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Ordinamento nella home page',
      },
    },
    {
      name: 'configurazione',
      type: 'json',
      admin: {
        description: 'Configurazioni JSONB (es. has_livelli_razionalita)',
      },
    },
    {
      name: 'data_pubblicazione',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true, // Aggiunge createdAt, updatedAt
}
```

**2. Collection: Utenti** (Priorità: ALTA)
```typescript
export const Utenti: CollectionConfig = {
  slug: 'utenti',
  auth: true, // Abilita autenticazione
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Solo super_admin può gestire utenti
    create: ({ req: { user } }) => user?.ruolo === 'super_admin',
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.ruolo === 'super_admin',
    delete: ({ req: { user } }) => user?.ruolo === 'super_admin',
  },
  fields: [
    {
      name: 'nome',
      type: 'text',
      required: true,
    },
    {
      name: 'cognome',
      type: 'text',
      required: true,
    },
    {
      name: 'ruolo',
      type: 'select',
      required: true,
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Redattore', value: 'redattore' },
      ],
      defaultValue: 'redattore',
    },
    {
      name: 'attivo',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'lemmari_assegnati',
      type: 'relationship',
      relationTo: 'utente-ruolo-lemmario',
      hasMany: true,
      admin: {
        description: 'Lemmari a cui questo utente ha accesso',
      },
    },
    {
      name: 'ultimo_accesso',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
}
```

**3. Collection: UtenteRuoloLemmario** (Junction Table)
```typescript
export const UtenteRuoloLemmario: CollectionConfig = {
  slug: 'utente-ruolo-lemmario',
  admin: {
    useAsTitle: 'assegnazione_id',
  },
  fields: [
    {
      name: 'utente',
      type: 'relationship',
      relationTo: 'utenti',
      required: true,
    },
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      required: true,
    },
    {
      name: 'ruolo',
      type: 'select',
      required: true,
      options: [
        { label: 'Amministratore Lemmario', value: 'lemmario_admin' },
        { label: 'Redattore', value: 'redattore' },
        { label: 'Lettore', value: 'lettore' },
      ],
    },
    {
      name: 'assegnato_da',
      type: 'relationship',
      relationTo: 'utenti',
    },
  ],
  timestamps: true,
}
```

**4. Collection: Lemmi** (Priorità: ALTA)
```typescript
export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  admin: {
    useAsTitle: 'termine',
    defaultColumns: ['termine', 'lingua', 'lemmario', 'pubblicato'],
  },
  access: {
    // Access control basato su lemmario assegnato
    read: () => true, // Pubblico se pubblicato
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      // Check se ha accesso al lemmario
      return { lemmario: { in: user.lemmari_assegnati } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.ruolo === 'super_admin') return true
      return { lemmario: { in: user.lemmari_assegnati } }
    },
  },
  fields: [
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'termine',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'lingua',
      type: 'select',
      required: true,
      options: [
        { label: 'Latino', value: 'latino' },
        { label: 'Volgare', value: 'volgare' },
      ],
    },
    {
      name: 'pubblicato',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Se false, il lemma non è visibile al pubblico',
      },
    },
    {
      name: 'varianti',
      type: 'array',
      fields: [
        {
          name: 'testo',
          type: 'text',
          required: true,
        },
        {
          name: 'is_principale',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'ordine',
          type: 'number',
          defaultValue: 1,
        },
      ],
      admin: {
        description: 'Varianti grafiche del lemma (max 30)',
      },
    },
    {
      name: 'definizioni',
      type: 'array',
      fields: [
        {
          name: 'testo_definizione',
          type: 'richText',
          required: true,
        },
        {
          name: 'ordine',
          type: 'number',
          required: true,
        },
        {
          name: 'livello_razionalita',
          type: 'relationship',
          relationTo: 'livelli-razionalita',
        },
        {
          name: 'ricorrenze',
          type: 'array',
          fields: [
            {
              name: 'citazione',
              type: 'textarea',
              required: true,
            },
            {
              name: 'posizione_citazione',
              type: 'text',
              admin: {
                placeholder: 'es. "colonna 413, rubrica 42"',
              },
            },
            {
              name: 'fonte',
              type: 'relationship',
              relationTo: 'fonti',
              required: true,
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
```

**5-13. Altre Collections:** Fonti, LivelliRazionalita, RiferimentiIncrociati, ContenutoStatico, StoricoModifiche

**Agent consigliato:** `general-purpose` per implementazione collections

---

#### 2.3. Implementazione Access Control Logic
**Deliverables:**
- Logica permessi multi-lemmario funzionante
- Test permessi per vari ruoli

**Tasks:**
- [ ] Implementare access control per ogni collection
- [ ] Helper function `getUserLemmari(user)`
- [ ] Test permissions con diversi utenti
- [ ] Documentare logica permessi

**Helper Permissions:**
```typescript
// packages/payload-cms/src/access/lemmarioAccess.ts
import { Access } from 'payload/types'

export const canAccessLemmario: Access = ({ req: { user } }) => {
  if (!user) return false

  // Super admin può tutto
  if (user.ruolo === 'super_admin') return true

  // Filtra per lemmari assegnati
  return {
    lemmario: {
      in: user.lemmari_assegnati?.map(lr => lr.lemmario) || [],
    },
  }
}
```

---

### FASE 3: Hooks e Business Logic (Settimana 4)

#### 3.1. Hook: Bidirezionalità Riferimenti Incrociati
**Deliverable:** Quando si crea A→B, si crea automaticamente B→A

```typescript
// packages/payload-cms/src/hooks/riferimentiIncrociati.ts
import { CollectionAfterChangeHook } from 'payload/types'

export const createBidirezionalita: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    // Crea riferimento inverso
    const { lemma_origine, lemma_destinazione, tipo_riferimento } = doc

    await req.payload.create({
      collection: 'riferimenti-incrociati',
      data: {
        lemma_origine: lemma_destinazione,
        lemma_destinazione: lemma_origine,
        tipo_riferimento: tipo_riferimento,
        auto_creato: true,
      },
    })
  }

  if (operation === 'delete') {
    // Elimina riferimento inverso
    await req.payload.delete({
      collection: 'riferimenti-incrociati',
      where: {
        lemma_origine: { equals: doc.lemma_destinazione },
        lemma_destinazione: { equals: doc.lemma_origine },
      },
    })
  }

  return doc
}
```

**Agent consigliato:** `general-purpose` per implementazione hooks

---

#### 3.2. Hook: Audit Trail Automatico
**Deliverable:** Popolare StoricoModifiche per ogni modifica

```typescript
// packages/payload-cms/src/hooks/auditTrail.ts
export const createAuditTrail: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  await req.payload.create({
    collection: 'storico-modifiche',
    data: {
      tabella: req.collection.config.slug,
      record_id: doc.id,
      operazione: operation.toUpperCase(),
      dati_precedenti: previousDoc || null,
      dati_successivi: doc,
      utente_id: req.user?.id,
      timestamp: new Date(),
    },
  })

  return doc
}
```

---

### FASE 4: Frontend Next.js (Settimana 5-6)

#### 4.1. Setup Next.js Base
**Deliverables:**
- Next.js app funzionante
- Connessione API a Payload
- Routing base

**Tasks:**
- [ ] `npx create-next-app@latest packages/frontend`
- [ ] Configurare TypeScript
- [ ] Setup Tailwind CSS
- [ ] Configurare API client per Payload
- [ ] Implementare layout base

**Struttura:**
```
packages/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home (lista lemmari)
│   │   ├── [lemmario]/
│   │   │   ├── page.tsx                # Home lemmario
│   │   │   ├── lemmi/
│   │   │   │   └── [termine]/page.tsx  # Dettaglio lemma
│   │   │   ├── bibliografia/page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── LemmarioCard.tsx
│   │   ├── LemmaDetail.tsx
│   │   ├── SearchBar.tsx
│   │   └── Navigation.tsx
│   ├── lib/
│   │   ├── payloadClient.ts            # API client
│   │   └── types.ts                    # TypeScript types
│   └── styles/
└── next.config.js
```

**Agent consigliato:** `Plan` per architettura frontend

---

#### 4.2. Implementazione Pagine Pubbliche
**Pages da implementare:**

1. **Home Page (`/`):**
   - Lista di tutti i lemmari attivi
   - Ordinati per campo `ordine`
   - Card con titolo, descrizione, periodo storico

2. **Lemmario Home (`/[lemmario-slug]`):**
   - Lista lemmi del lemmario
   - Filtri: Latino/Volgare
   - Search bar con autocomplete
   - Paginazione

3. **Dettaglio Lemma (`/[lemmario-slug]/lemmi/[termine]`):**
   - Termine principale
   - Varianti grafiche (sotto il termine)
   - Definizioni numerate
   - Ricorrenze con citazioni
   - Livello di razionalità
   - Riferimenti incrociati

4. **Bibliografia (`/[lemmario-slug]/bibliografia`):**
   - Lista fonti con `mostra_in_bibliografia = true`
   - Ordinata alfabeticamente

**Agent consigliato:** `general-purpose` per implementazione componenti

---

#### 4.3. Implementazione Search e Autocomplete
**Deliverable:** Ricerca full-text funzionante

**API Endpoint Payload:**
```typescript
// GET /api/lemmi?search=additio&lemmario=lemmario-razionale
```

**Frontend Component:**
```typescript
// packages/frontend/src/components/SearchBar.tsx
'use client'
import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@/hooks/useDebounce'

export function SearchBar({ lemmarioSlug }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetch(`/api/lemmi?search=${debouncedQuery}&lemmario=${lemmarioSlug}`)
        .then(res => res.json())
        .then(data => setResults(data.docs))
    }
  }, [debouncedQuery])

  return (
    // UI component
  )
}
```

---

### FASE 5: Migrazione Dati Legacy (Settimana 7)

#### 5.1. Script Migrazione
**Deliverables:**
- Parser HTML per lemmi
- Importer JSON per bibliografia
- Script completo di migrazione

**Tasks:**
- [ ] Parser per old_website/lemmi/*.html
- [ ] Parser per old_website/bibliografia.json
- [ ] Parser per old_website/indice.json
- [ ] Mappare shorthand_id → fonte_id
- [ ] Script di import in Payload via API
- [ ] Validation script

**Struttura Script:**
```
scripts/
├── migration/
│   ├── 01-import-fonti.ts          # Bibliografia → Fonti
│   ├── 02-import-lemmi.ts          # HTML → Lemmi
│   ├── 03-import-definizioni.ts    # HTML → Definizioni
│   ├── 04-import-ricorrenze.ts     # HTML → Ricorrenze
│   ├── 05-import-riferimenti.ts    # CFR → RiferimentiIncrociati
│   ├── parsers/
│   │   ├── htmlParser.ts
│   │   └── jsonParser.ts
│   └── validators/
│       └── dataValidator.ts
```

**Agent consigliato:** `general-purpose` per script migrazione

---

### FASE 6: Docker & Deploy (Settimana 8)

#### 6.1. Docker Compose Finale
**Deliverable:** Stack completo funzionante

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: lemmario_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: lemmario_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - lemmario_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  payload:
    build:
      context: ./packages/payload-cms
      dockerfile: Dockerfile
    container_name: lemmario_payload
    environment:
      DATABASE_URI: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/lemmario_db
      PAYLOAD_SECRET: ${PAYLOAD_SECRET}
      PAYLOAD_PUBLIC_SERVER_URL: ${PAYLOAD_URL}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - lemmario_network
    volumes:
      - ./packages/payload-cms:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    container_name: lemmario_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://payload:3000/api
    ports:
      - "3001:3000"
    depends_on:
      - payload
    networks:
      - lemmario_network
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:

networks:
  lemmario_network:
    driver: bridge
```

**Agent consigliato:** `general-purpose` per configurazione Docker

---

#### 6.2. GitHub Actions CI/CD
**Deliverable:** Pipeline automatizzata

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Deploy via SSH
        run: |
          ssh -o StrictHostKeyChecking=no user@server << 'EOF'
            cd /path/to/lemmario_ts
            git pull origin main
            docker-compose down
            docker-compose up -d --build
          EOF
```

---

## 3. Stack Tecnologico

### Backend (Payload CMS)
- **Runtime:** Node.js 20 LTS
- **Framework:** Payload CMS 2.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 16
- **ORM:** Built-in Payload adapter
- **Auth:** Payload Auth (JWT)
- **Validation:** Built-in Payload validation

### Frontend (Next.js)
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **UI Components:** shadcn/ui (optional)
- **State:** React Context / Zustand
- **API Client:** fetch / axios

### Infrastructure
- **Container:** Docker & Docker Compose
- **Reverse Proxy:** Nginx (opzionale)
- **CI/CD:** GitHub Actions
- **Hosting:** Self-hosted (VPS via VPN SSH)
- **SSL:** Let's Encrypt / Certbot

---

## 4. Struttura Repository

```
lemmario_ts/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Test e lint
│       └── deploy.yml              # Deploy automatico
├── docs/
│   ├── PIANO_IMPLEMENTAZIONE.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
├── packages/
│   ├── payload-cms/
│   │   ├── src/
│   │   │   ├── collections/
│   │   │   │   ├── Lemmari.ts
│   │   │   │   ├── Utenti.ts
│   │   │   │   ├── Lemmi.ts
│   │   │   │   ├── Fonti.ts
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   ├── riferimentiIncrociati.ts
│   │   │   │   └── auditTrail.ts
│   │   │   ├── access/
│   │   │   │   └── lemmarioAccess.ts
│   │   │   └── payload.config.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx
│       │   │   ├── [lemmario]/
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   ├── lib/
│       │   └── styles/
│       ├── Dockerfile
│       ├── package.json
│       └── next.config.js
├── scripts/
│   ├── migration/
│   │   ├── 01-import-fonti.ts
│   │   └── ...
│   └── setup.sh
├── old_website/                    # Dati legacy
│   ├── lemmi/
│   ├── bibliografia.json
│   └── indice.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json                    # Root package per monorepo
└── README.md
```

---

## 5. Agent e Skills Necessari

### 5.1. Agent Consigliati per Ogni Fase

#### **FASE 1: Setup Infrastruttura**
**Agent:** `general-purpose`
**Motivo:** Task multipli: Docker, Git, file system
**Skills custom suggeriti:**
- `/docker-init` - Genera docker-compose.yml base
- `/repo-structure` - Crea struttura cartelle monorepo

**Prompt esempio:**
```
Crea la struttura base del repository per un'applicazione monorepo con:
- Docker Compose per PostgreSQL
- Cartelle packages/payload-cms e packages/frontend
- GitHub Actions per CI/CD
- File .env.example con tutte le variabili necessarie
```

---

#### **FASE 2: Payload CMS Setup**
**Agent:** `Plan` per design, poi `general-purpose` per implementazione
**Motivo:** Architettura complessa, molte collections interrelate

**Sub-tasks:**
1. **Design Collections** → `Plan` agent
2. **Implementare Collections** → `general-purpose`
3. **Access Control** → `general-purpose`

**Skills custom suggeriti:**
- `/payload-collection` - Genera template collection Payload
- `/payload-acl` - Genera access control logic

**Prompt esempio per Plan:**
```
Progetta le Payload Collections per un sistema multi-tenancy con:
- 13 entità (Lemmario, Lemma, Definizione, etc.)
- Access control basato su ruolo utente e lemmario assegnato
- Relazioni complesse (1:N, N:M, auto-referenziali)
Produci la struttura TypeScript per ogni collection
```

---

#### **FASE 3: Business Logic (Hooks)**
**Agent:** `general-purpose`
**Motivo:** Logica custom specifica, hooks Payload

**Skills custom suggeriti:**
- `/payload-hook` - Template per hooks Payload

**Prompt esempio:**
```
Implementa un hook Payload afterChange che:
1. Quando si crea un RiferimentoIncrociato da A→B
2. Crei automaticamente il riferimento inverso B→A
3. Quando si elimina A→B, elimini anche B→A
4. Gestisci edge cases (evita loop infiniti)
```

---

#### **FASE 4: Frontend Next.js**
**Agent:** `Plan` per architettura, `general-purpose` per componenti
**Motivo:** Routing dinamico, SSR, componenti React

**Sub-tasks:**
1. **Architettura routing** → `Plan`
2. **Componenti UI** → `general-purpose`
3. **API integration** → `general-purpose`

**Skills custom suggeriti:**
- `/nextjs-page` - Genera page.tsx con SSR/ISR
- `/react-component` - Template componente React TypeScript

**Prompt esempio:**
```
Crea una pagina Next.js 14 (App Router) che:
- URL: /[lemmario]/lemmi/[termine]
- Fetch dati da Payload API (SSR)
- Mostra: termine, varianti, definizioni, ricorrenze
- Include SEO metadata
- TypeScript strict
```

---

#### **FASE 5: Migrazione Dati**
**Agent:** `general-purpose`
**Motivo:** Parsing file, chiamate API, validazione

**Skills custom suggeriti:**
- `/html-parser` - Parser per HTML legacy
- `/data-validator` - Validazione dati migrati

**Prompt esempio:**
```
Crea uno script TypeScript che:
1. Parsa tutti i file HTML in old_website/lemmi/
2. Estrae: termine, definizioni, ricorrenze, attributi data-biblio
3. Mappa shorthand_id da bibliografia.json a fonte_id
4. Importa in Payload via REST API
5. Log di errori e successi
```

---

#### **FASE 6: Docker & Deploy**
**Agent:** `general-purpose`
**Motivo:** Configurazione infrastruttura, DevOps

**Skills custom suggeriti:**
- `/docker-optimize` - Ottimizza Dockerfile multi-stage
- `/github-action` - Template GitHub Actions workflow

**Prompt esempio:**
```
Crea un docker-compose.yml production-ready con:
- PostgreSQL 16 con persistent volume
- Payload CMS (build from source)
- Next.js frontend (build optimized)
- Nginx reverse proxy
- Health checks per tutti i servizi
- Network isolation
```

---

### 5.2. Skills Custom da Creare

Suggerisco di creare questi **custom skills** per accelerare lo sviluppo:

#### 1. `/payload-collection`
**Descrizione:** Genera template Payload Collection
**Input:** Nome entità, campi, relazioni
**Output:** File TypeScript collection completo

#### 2. `/payload-hook`
**Descrizione:** Genera template hook Payload
**Input:** Tipo hook (beforeChange, afterChange, etc.)
**Output:** File TypeScript hook con types

#### 3. `/nextjs-page`
**Descrizione:** Genera Next.js page con SSR
**Input:** Route, data fetching logic
**Output:** page.tsx completo

#### 4. `/docker-service`
**Descrizione:** Aggiunge servizio a docker-compose
**Input:** Nome servizio, immagine, configurazione
**Output:** Snippet docker-compose.yml

#### 5. `/migration-script`
**Descrizione:** Template script migrazione dati
**Input:** Fonte dati, destinazione
**Output:** Script TypeScript con error handling

---

## 6. Timeline e Milestone

### Milestone 1: Infrastruttura Base (Settimana 1)
**Deliverables:**
- ✅ Repository configurato
- ✅ Docker Compose funzionante
- ✅ PostgreSQL operativo
- ✅ GitHub Actions base

**Criteri successo:**
- `docker-compose up` avvia tutti i servizi
- PostgreSQL accettabile connessioni
- CI pipeline esegue lint e test

---

### Milestone 2: Payload CMS Core (Settimana 2-3)
**Deliverables:**
- ✅ Payload installato e configurato
- ✅ 13 collections implementate
- ✅ Access control funzionante
- ✅ Admin panel accessibile

**Criteri successo:**
- Login come super_admin funziona
- Creare lemmario da admin panel
- Creare lemma con definizioni e ricorrenze
- Redattore vede solo lemmari assegnati

---

### Milestone 3: Business Logic (Settimana 4)
**Deliverables:**
- ✅ Hook bidirezionalità riferimenti
- ✅ Audit trail automatico
- ✅ Validazioni custom

**Criteri successo:**
- Creare riferimento A→B genera B→A
- Ogni modifica appare in StoricoModifiche
- Vincoli di business rispettati

---

### Milestone 4: Frontend Public (Settimana 5-6)
**Deliverables:**
- ✅ Next.js app funzionante
- ✅ Tutte le pagine pubbliche implementate
- ✅ Search e autocomplete funzionanti
- ✅ Design responsive

**Criteri successo:**
- Home page mostra tutti i lemmari
- Pagina lemma mostra tutti i dati correttamente
- Search restituisce risultati in <500ms
- Mobile-friendly

---

### Milestone 5: Migrazione Completata (Settimana 7)
**Deliverables:**
- ✅ Script migrazione funzionanti
- ✅ Tutti i 239 lemmi legacy importati
- ✅ Bibliografia completa importata
- ✅ Riferimenti incrociati mappati

**Criteri successo:**
- 100% lemmi importati senza errori
- Tutti i shorthand_id mappati correttamente
- Dati validati (nessun orphan record)

---

### Milestone 6: Production Ready (Settimana 8)
**Deliverables:**
- ✅ Docker Compose production
- ✅ Deploy automatizzato
- ✅ Backup configurato
- ✅ Monitoring base

**Criteri successo:**
- Deploy via GitHub Actions funziona
- Applicazione accessibile da internet
- SSL configurato
- Backup giornalieri attivi

---

## 7. Rischi e Mitigazioni

### Rischio 1: Performance Search Full-Text
**Probabilità:** Media
**Impatto:** Alto

**Mitigazione:**
- Utilizzare PostgreSQL full-text search con `to_tsvector`
- Indicizzare campi searchable
- Implementare caching con Redis (se necessario)
- Pagination obbligatoria

---

### Rischio 2: Complessità Access Control Multi-Lemmario
**Probabilità:** Alta
**Impatto:** Alto

**Mitigazione:**
- Testare ACL in isolamento prima di integrare
- Creare unit test per ogni scenario permessi
- Documentare logica chiaramente
- Usare helper functions riutilizzabili

---

### Rischio 3: Migrazione Dati Legacy Incompleta
**Probabilità:** Media
**Impatto:** Medio

**Mitigazione:**
- Validazione pre-import (check tutti gli shorthand_id esistono)
- Import incrementale (per blocchi)
- Logging dettagliato
- Rollback plan (backup pre-import)

---

### Rischio 4: Payload CMS Limiti Scalabilità
**Probabilità:** Bassa
**Impatto:** Alto

**Mitigazione:**
- Benchmarking early (Milestone 2)
- Identificare bottleneck
- Plan B: separare API custom per frontend pubblico
- PostgreSQL ottimizzato (indexes, vacuum)

---

### Rischio 5: Deploy SSH via VPN Complicato
**Probabilità:** Media
**Impatto:** Medio

**Mitigazione:**
- Testare connessione SSH da GitHub Actions early
- Setup SSH key correttamente
- Fallback: deploy manuale documentato
- Monitoring deploy (health checks)

---

## Prossimi Passi Immediati

1. **Approvare questo piano** ✅
2. **Creare skills custom** (optional, accelera sviluppo)
3. **Iniziare FASE 1** - Setup repository e Docker
4. **Review dopo Milestone 1** - Validare approccio

---

**Fine Piano di Implementazione**
