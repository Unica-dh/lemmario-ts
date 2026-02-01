# Lemmario Frontend Development

Guida allo sviluppo del frontend Next.js per visualizzare i dati del dizionario storico.

---

## Quando Usare

Usa questa skill quando:
- Devi implementare nuove pagine o componenti frontend
- Devi completare la visualizzazione delle 13 collections
- Devi implementare la ricerca full-text
- Devi migliorare UI/UX esistente

---

## Stato Attuale

### Implementato (20%)

| Route | Status | Note |
|-------|--------|------|
| `/` | OK | Redirect al primo lemmario attivo |
| `/[lemmario-slug]/` | OK | Lista lemmi paginata (24/pagina) |
| `/[lemmario-slug]/lemmi/[termine]/` | INCOMPLETO | Solo header, mancano definizioni/ricorrenze |
| `/ricerca/` | STUB | Pagina vuota |

### Da Implementare (80%)

**Componenti Mancanti:**
- `DefinitionDisplay` - Visualizza definizioni numerate
- `OccurrenceDisplay` - Visualizza ricorrenze con citazioni
- `VariantsDisplay` - Visualizza varianti grafiche
- `CrossReferencesDisplay` - Visualizza riferimenti incrociati
- `SourceDisplay` - Visualizza fonte bibliografica
- `SearchForm` - Form di ricerca
- `SearchResults` - Risultati ricerca

**Pagine Mancanti:**
- `/[lemmario-slug]/bibliografia` - Lista fonti del lemmario
- `/[lemmario-slug]/fonti/[shorthand]` - Dettaglio fonte
- Contenuti statici (about, metodologia, etc.)

---

## Architettura

### Stack

```
packages/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lemmario-slug]/   # Route dinamiche per lemmario
│   │   │   ├── page.tsx       # Lista lemmi
│   │   │   ├── lemmi/
│   │   │   │   └── [termine]/
│   │   │   │       └── page.tsx  # Dettaglio lemma
│   │   │   ├── bibliografia/
│   │   │   │   └── page.tsx   # DA CREARE
│   │   │   └── fonti/
│   │   │       └── [shorthand]/
│   │   │           └── page.tsx  # DA CREARE
│   │   ├── ricerca/
│   │   │   └── page.tsx       # DA COMPLETARE
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/            # React components
│   │   ├── Header.tsx         # OK
│   │   ├── Footer.tsx         # OK
│   │   └── lemma/             # DA CREARE
│   │       ├── DefinitionDisplay.tsx
│   │       ├── OccurrenceDisplay.tsx
│   │       ├── VariantsDisplay.tsx
│   │       └── CrossReferencesDisplay.tsx
│   ├── lib/
│   │   └── payload-api.ts     # API client (COMPLETO)
│   └── types/
│       └── payload.ts         # TypeScript types (COMPLETO)
```

### API Client

**Tutte le funzioni API sono gia implementate** in [payload-api.ts](packages/frontend/src/lib/payload-api.ts):

```typescript
// Lemmari
getLemmari(options?)
getLemmarioBySlug(slug)
getLemmarioById(id)

// Lemmi
getLemmi(options?)
getLemmaBySlug(slug, lemmarioId?)
getLemmaById(id, depth?)
searchLemmi(query, lemmarioId?)

// Relazioni
getDefinizioniByLemma(lemmaId)
getRicorrenzeByDefinizione(definizioneId)
getVariantiByLemma(lemmaId)
getRiferimentiByLemma(lemmaId)

// Fonti
getFonteById(id)
getFonteByShorthand(shorthandId)

// Altri
getLivelliRazionalita(lemmarioId)
getContenutoStaticoBySlug(slug, lemmarioId?)
```

---

## Task 1: Completare Lemma Detail Page

**File:** `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx`

### Struttura Dati

```typescript
// Lemma con relazioni
interface LemmaWithRelations {
  id: number
  termine: string
  tipo: 'latino' | 'volgare'
  etimologia?: string
  note_redazionali?: string
  varianti: VarianteGrafica[]
  definizioni: DefinizioneWithRicorrenze[]
  riferimenti: RiferimentoIncrociato[]
}

interface DefinizioneWithRicorrenze extends Definizione {
  ricorrenze: Ricorrenza[]
}
```

### Fetch Data Pattern

```typescript
// In page.tsx
export default async function LemmaPage({ params }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) notFound()

  const lemma = await getLemmaBySlug(params.termine, lemmario.id)
  if (!lemma) notFound()

  // Fetch relazioni in parallelo
  const [varianti, definizioni, riferimenti] = await Promise.all([
    getVariantiByLemma(lemma.id),
    getDefinizioniByLemma(lemma.id),
    getRiferimentiByLemma(lemma.id),
  ])

  // Fetch ricorrenze per ogni definizione
  const definizioniWithRicorrenze = await Promise.all(
    definizioni.map(async (def) => ({
      ...def,
      ricorrenze: await getRicorrenzeByDefinizione(def.id),
    }))
  )

  return (
    <div>
      <LemmaHeader lemma={lemma} lemmario={lemmario} />
      <VariantsDisplay varianti={varianti} />
      <DefinitionsSection definizioni={definizioniWithRicorrenze} />
      <CrossReferencesDisplay riferimenti={riferimenti} />
    </div>
  )
}
```

### Componente DefinitionDisplay

```typescript
// components/lemma/DefinitionDisplay.tsx
interface Props {
  definizione: Definizione
  ricorrenze: Ricorrenza[]
}

export function DefinitionDisplay({ definizione, ricorrenze }: Props) {
  const livello = definizione.livello_razionalita as LivelloRazionalita | null

  return (
    <article className="border-l-4 border-primary-500 pl-4 mb-6">
      {/* Numero definizione */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-bold text-primary-600">
          {definizione.numero_definizione}.
        </span>
        {livello && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
            Livello {livello.livello}: {livello.nome}
          </span>
        )}
      </div>

      {/* Testo definizione */}
      <p className="text-gray-800 mb-4">{definizione.testo_definizione}</p>

      {/* Contesto d'uso */}
      {definizione.contesto_uso && (
        <p className="text-sm text-gray-600 italic mb-4">
          Contesto: {definizione.contesto_uso}
        </p>
      )}

      {/* Ricorrenze */}
      {ricorrenze.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Ricorrenze ({ricorrenze.length})
          </h4>
          <ul className="space-y-3">
            {ricorrenze.map((ric) => (
              <OccurrenceDisplay key={ric.id} ricorrenza={ric} />
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
```

### Componente OccurrenceDisplay

```typescript
// components/lemma/OccurrenceDisplay.tsx
interface Props {
  ricorrenza: Ricorrenza
}

export function OccurrenceDisplay({ ricorrenza }: Props) {
  const fonte = ricorrenza.fonte as Fonte | null

  return (
    <li className="bg-amber-50 border border-amber-200 rounded p-3">
      {/* Citazione originale (in corsivo) */}
      <blockquote className="italic text-gray-800 mb-2">
        "{ricorrenza.citazione_originale}"
      </blockquote>

      {/* Trascrizione moderna (se presente) */}
      {ricorrenza.trascrizione_moderna && (
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Trascrizione:</span>{' '}
          {ricorrenza.trascrizione_moderna}
        </p>
      )}

      {/* Riferimento fonte */}
      {fonte && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {fonte.shorthand_id}
          </span>
          {ricorrenza.pagina_riferimento && (
            <span>p. {ricorrenza.pagina_riferimento}</span>
          )}
        </div>
      )}

      {/* Note filologiche */}
      {ricorrenza.note_filologiche && (
        <p className="text-xs text-gray-500 mt-2 italic">
          Nota: {ricorrenza.note_filologiche}
        </p>
      )}
    </li>
  )
}
```

---

## Task 2: Implementare Pagina Ricerca

**File:** `packages/frontend/src/app/ricerca/page.tsx`

### Requisiti

1. **Search form** con input testo
2. **Filtri**: tipo lemma (latino/volgare), lemmario
3. **Risultati**: lista lemmi con preview definizione
4. **URL params**: `/ricerca?q=additio&tipo=latino`

### Implementazione

```typescript
// app/ricerca/page.tsx
import { searchLemmi, getLemmari } from '@/lib/payload-api'
import SearchForm from '@/components/search/SearchForm'
import SearchResults from '@/components/search/SearchResults'

interface Props {
  searchParams: {
    q?: string
    tipo?: 'latino' | 'volgare'
    lemmario?: string
  }
}

export default async function RicercaPage({ searchParams }: Props) {
  const lemmari = await getLemmari({ limit: 100 })

  let results: Lemma[] = []
  if (searchParams.q && searchParams.q.length >= 2) {
    results = await searchLemmi(
      searchParams.q,
      searchParams.lemmario ? parseInt(searchParams.lemmario) : undefined
    )

    // Filtra per tipo se specificato
    if (searchParams.tipo) {
      results = results.filter(l => l.tipo === searchParams.tipo)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ricerca</h1>

      <SearchForm
        lemmari={lemmari.docs}
        initialQuery={searchParams.q}
        initialTipo={searchParams.tipo}
        initialLemmario={searchParams.lemmario}
      />

      {searchParams.q && (
        <SearchResults
          results={results}
          query={searchParams.q}
        />
      )}
    </div>
  )
}
```

### SearchForm Component

```typescript
// components/search/SearchForm.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

interface Props {
  lemmari: Lemmario[]
  initialQuery?: string
  initialTipo?: string
  initialLemmario?: string
}

export default function SearchForm({ lemmari, initialQuery, initialTipo, initialLemmario }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    // ... altri filtri

    startTransition(() => {
      router.push(`/ricerca?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un termine..."
          className="flex-1 px-4 py-2 border rounded-lg"
          minLength={2}
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {isPending ? 'Cercando...' : 'Cerca'}
        </button>
      </div>
    </form>
  )
}
```

---

## Task 3: Pagina Bibliografia

**File:** `packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx`

```typescript
import { getLemmarioBySlug } from '@/lib/payload-api'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: { 'lemmario-slug': string }
}

export default async function BibliografiaPage({ params }: Props) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) notFound()

  // Fetch fonti del lemmario
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fonti?where[lemmario][equals]=${lemmario.id}&sort=shorthand_id&limit=200`
  )
  const { docs: fonti } = await response.json()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bibliografia - {lemmario.titolo}</h1>

      <div className="space-y-4">
        {fonti.map((fonte: Fonte) => (
          <article key={fonte.id} className="border-b pb-4">
            <p className="font-mono text-sm text-primary-600 mb-1">
              {fonte.shorthand_id}
            </p>
            <p className="font-semibold">{fonte.titolo}</p>
            {fonte.autore && <p className="text-gray-600">{fonte.autore}</p>}
            {fonte.anno && <p className="text-gray-500">{fonte.anno}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}
```

---

## Convenzioni UI

### Colori

```css
/* Tailwind classes */
primary-600: #2563eb  /* Link, bottoni */
amber-50: #fffbeb     /* Background citazioni */
gray-800: #1f2937     /* Testo principale */
gray-600: #4b5563     /* Testo secondario */
```

### Typography

- **Termine lemma**: `text-4xl font-bold`
- **Numero definizione**: `text-xl font-bold text-primary-600`
- **Citazione**: `italic` in `blockquote`
- **Shorthand fonte**: `font-mono text-xs bg-gray-100`

### Responsive

- Mobile-first approach
- Grid 1-2-4 colonne per lista lemmi
- Stack verticale per dettaglio lemma

---

## Checklist Implementazione

### Lemma Detail Page
- [ ] Creare `components/lemma/DefinitionDisplay.tsx`
- [ ] Creare `components/lemma/OccurrenceDisplay.tsx`
- [ ] Creare `components/lemma/VariantsDisplay.tsx`
- [ ] Creare `components/lemma/CrossReferencesDisplay.tsx`
- [ ] Aggiornare `[termine]/page.tsx` con fetch completo
- [ ] Test con lemmi reali (dopo migrazione)

### Ricerca
- [ ] Creare `components/search/SearchForm.tsx` (client component)
- [ ] Creare `components/search/SearchResults.tsx`
- [ ] Completare `app/ricerca/page.tsx`
- [ ] Implementare filtri per tipo e lemmario

### Bibliografia
- [ ] Creare `app/[lemmario-slug]/bibliografia/page.tsx`
- [ ] Aggiungere link in navigation

### Bonus
- [ ] Aggiungere `generateStaticParams` per SSG
- [ ] Implementare OpenGraph metadata
- [ ] Aggiungere sitemap.xml
- [ ] Mobile navigation menu
