# Soluzione UX: Form Integrato per Lemmi Multi-Entità

**Data:** 15 gennaio 2026  
**Scopo:** Analizzare e proporre soluzione per gestire Lemma + Definizioni + Ricorrenze in un unico form  
**Contesto:** Payload CMS - Backend Lemmario Razionale

---

## 📋 Requisito

> **Quando l'utente inserisce o modifica un lemma, deve poter anche gestire, nello stesso form, i dati relativi alle varianti grafiche, definizioni, fonti, ricorrenze, livelli di razionalità senza perdere il contesto.**

---

## 🔍 Analisi del Problema

### Stato Attuale (Problema)

```
User Flow Frammentato:
┌─────────────────────┐
│   Form LEMMI        │ ← Crea "Abbattere"
│   • termine         │
│   • tipo            │
│   • lemmario        │
└──────────┬──────────┘
           │ Salva
           ▼
    Lemma creato (ID 123)
           │
    ┌──────┴──────┬────────────┬──────────────┐
    ▼             ▼            ▼              ▼
┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│DEFINIZ. │  │VARIANTI  │  │RICORRZ. │  │RIFERIM.  │
│Nuovo    │  │Nuovo     │  │Nuovo    │  │Nuovo     │
│Lemma=123│  │Lemma=123 │  │Lemma=123│  │Lemma=123 │
└─────────┘  └──────────┘  └─────────┘  └──────────┘
```

**Problemi:**
1. ❌ Utente deve saltare tra 5+ form diversi
2. ❌ Perde contesto (quale lemma stava editando?)
3. ❌ Salvataggi multipli = rischi di inconsistenza
4. ❌ UX frammentata e poco efficiente
5. ❌ Errore: dimentica di collegare entità correlate

### Requisito Ideale (Soluzione)

```
User Flow Unificato:
┌──────────────────────────────────────┐
│      FORM LEMMA COMPLETO             │
├──────────────────────────────────────┤
│  SEZIONE 1: Dati Lemma Base          │
│  • Termine: Abbattere                │
│  • Tipo: Volgare                     │
│  • Lemmario: Lemmario Ragioneria     │
├──────────────────────────────────────┤
│  SEZIONE 2: Varianti Grafiche        │
│  ┌──────────────────────────────────┐│
│  │ + Aggiungi Variante               ││
│  │ • abattere                        ││
│  │ • abbattire                       ││
│  └──────────────────────────────────┘│
├──────────────────────────────────────┤
│  SEZIONE 3: Definizioni              │
│  ┌──────────────────────────────────┐│
│  │ [1] Detrarre                      ││
│  │     ┌────────────────────────────┐││
│  │     │ RICORRENZE per questa def. │││
│  │     │ + Aggiungi Ricorrenza       │││
│  │     │ • Statuti 1355, p. 157v     │││
│  │     │   Fonte: [dropdown]         │││
│  │     │   Testo: «in questo caso..»│││
│  │     │   Livello: 2. Operazioni    │││
│  │     └────────────────────────────┘││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ [2] Abbassare                     ││
│  │     (zero ricorrenze)             ││
│  └──────────────────────────────────┘│
├──────────────────────────────────────┤
│  SEZIONE 4: Riferimenti Incrociati   │
│  ┌──────────────────────────────────┐│
│  │ + Aggiungi Riferimento            ││
│  │ • Vedi anche: Abbattimento       ││
│  │ • Contrario: Aggiungere           ││
│  └──────────────────────────────────┘│
├──────────────────────────────────────┤
│ [SALVA TUTTO] - Un solo clic         │
└──────────────────────────────────────┘
```

**Vantaggi:**
- ✅ Utente resta nel contesto del lemma
- ✅ Un solo salvataggio per tutto
- ✅ UX intuitiva e coerente
- ✅ Riduce errori di correlazione
- ✅ Efficiente e veloce

---

## 🏗️ Soluzioni Architetturali

### SOLUZIONE 1: Array Fields (Semplice, Limitato)

**Descrizione:**  
Usare array nested di oggetti dentro il lemma per definizioni e ricorrenze.

**Implementazione:**
```typescript
// Lemmi.ts
{
  name: 'definizioni',
  type: 'array',
  fields: [
    {
      name: 'numero',
      type: 'number',
    },
    {
      name: 'testo',
      type: 'textarea',
    },
    {
      name: 'ricorrenze',
      type: 'array',
      fields: [
        {
          name: 'fonte',
          type: 'relationship',
          relationTo: 'fonti',
        },
        {
          name: 'testo_originale',
          type: 'textarea',
        },
        {
          name: 'pagina',
          type: 'text',
        },
        {
          name: 'livello_razionalita',
          type: 'relationship',
          relationTo: 'livelli-razionalita',
        },
      ],
    },
  ],
}
```

**Struttura DB Risultante:**

```json
{
  "id": 123,
  "termine": "Abbattere",
  "lemmario": 1,
  "definizioni": [
    {
      "_id": "d1",
      "numero": 1,
      "testo": "Detrarre",
      "ricorrenze": [
        {
          "_id": "r1",
          "fonte": 111,
          "testo_originale": "«in questo caso...»",
          "pagina": "p. 157v.",
          "livello_razionalita": 222
        }
      ]
    }
  ]
}
```

**Pro:**
- ✅ Semplice da implementare
- ✅ Form integrato in Payload
- ✅ Un salvataggio atomico
- ✅ Dati sempre correlati al lemma

**Contro:**
- ❌ Dati denormalizzati (difficile query su ricorrenze globali)
- ❌ Non rispetta normalizzazione DB
- ❌ Difficile aggiornare definizione condivisa
- ❌ Performance: array grandi = problemi
- ❌ Non puoi avere ricorrenze senza lemma
- ❌ Richiede migrazione completa dati

**Complessità:** ⭐⭐ (Bassa)  
**Adatto per:** Progetti piccoli, dati semplici

**Verdict:** ❌ **NON CONSIGLIATO** - Viola normalizzazione

---

### SOLUZIONE 2: Tab Panel + Related Items (Payload Native)

**Descrizione:**  
Payload CMS supporta tab panel. Ogni tab contiene una sezione con campi correlati gestiti via hooks.

**Implementazione:**

```typescript
// Lemmi.ts
import { CollectionConfig } from 'payload/types'

export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  fields: [
    // SEZIONE 1: Dati Base (Tab 1)
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Generale',
          fields: [
            {
              name: 'lemmario',
              type: 'relationship',
              relationTo: 'lemmari',
              required: true,
            },
            {
              name: 'termine',
              type: 'text',
              required: true,
            },
            {
              name: 'tipo',
              type: 'select',
              options: ['latino', 'volgare'],
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
            },
            {
              name: 'ordinamento',
              type: 'text',
            },
            {
              name: 'note_redazionali',
              type: 'textarea',
            },
            {
              name: 'pubblicato',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },

        // SEZIONE 2: Varianti Grafiche (Tab 2)
        {
          label: 'Varianti Grafiche',
          fields: [
            {
              name: 'varianti_action',
              type: 'ui',
              admin: {
                components: {
                  Field: VariantiGraphichePanel, // Custom component
                },
              },
            },
          ],
        },

        // SEZIONE 3: Definizioni (Tab 3)
        {
          label: 'Definizioni',
          fields: [
            {
              name: 'definizioni_action',
              type: 'ui',
              admin: {
                components: {
                  Field: DefinizioniPanel, // Custom component
                },
              },
            },
          ],
        },

        // SEZIONE 4: Riferimenti Incrociati (Tab 4)
        {
          label: 'Riferimenti',
          fields: [
            {
              name: 'riferimenti_action',
              type: 'ui',
              admin: {
                components: {
                  Field: RiferimentiPanel, // Custom component
                },
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    // Hook per gestire creazione/aggiornamento entità correlate
    afterChange: [
      handleDefinitionsAndRicorrenze,
      handleVarianti,
      handleRiferimenti,
    ],
  },
}
```

**Custom Component Example (React):**

```typescript
// DefinizioniPanel.tsx
import React, { useEffect, useState } from 'react'
import { usePayloadAPI } from 'payload/components/utilities'

export const DefinizioniPanel: React.FC<{ path: string }> = ({ path }) => {
  const [definizioni, setDefinizioni] = useState([])
  const [lemmaId, setLemmaId] = useState(null)

  useEffect(() => {
    // Estrai lemma ID dal context
    const id = window.location.pathname.split('/').pop()
    setLemmaId(id)

    // Carica definizioni correlate
    fetch(`/api/definizioni?where[lemma][equals]=${id}`)
      .then(r => r.json())
      .then(data => setDefinizioni(data.docs))
  }, [])

  const handleAddDefinizione = async (testo: string, numero: number) => {
    const res = await fetch('/api/definizioni', {
      method: 'POST',
      body: JSON.stringify({
        lemma: lemmaId,
        numero,
        testo,
      }),
    })
    const newDef = await res.json()
    setDefinizioni([...definizioni, newDef])
  }

  const handleAddRicorrenza = async (
    defId: string,
    fonteId: string,
    testo: string,
    pagina: string,
    livelloId: string,
  ) => {
    // Crea ricorrenza legata a questa definizione
    await fetch('/api/ricorrenze', {
      method: 'POST',
      body: JSON.stringify({
        definizione: defId,
        fonte: fonteId,
        testo_originale: testo,
        pagina,
        livello_razionalita: livelloId,
      }),
    })
  }

  return (
    <div className="panel-definizioni">
      <h3>Definizioni per "{lemma?.termine}"</h3>
      
      {definizioni.map(def => (
        <DefinizioneRow
          key={def.id}
          definizione={def}
          onAddRicorrenza={handleAddRicorrenza}
        />
      ))}
      
      <button onClick={() => handleAddDefinizione('', definizioni.length + 1)}>
        + Aggiungi Definizione
      </button>
    </div>
  )
}
```

**Pro:**
- ✅ Form integrato in Payload
- ✅ Mantiene normalizzazione DB
- ✅ Tab panel nativo di Payload
- ✅ Custom components potenti
- ✅ Facile estendere con JS
- ✅ Un'area visuale unificata

**Contro:**
- ⚠️ Richiede custom React components
- ⚠️ Complexity media di sviluppo
- ⚠️ API calls asincrone nel form
- ⚠️ Gestione errori più complessa
- ⚠️ Performance se liste grandi

**Complessità:** ⭐⭐⭐⭐ (Media-Alta)  
**Adatto per:** Progetti professionali, team dev esperto

**Verdict:** ✅ **CONSIGLIATO** - Bilancia UX e architettura

---

### SOLUZIONE 3: Nested Data Plugin (Payload v3 Feature)

**Descrizione:**  
Payload CMS v3 introduce `nestedData` collection per handle parent-child senza array fields.

**Implementazione:**

```typescript
// RiferimentiIncrociati.ts (già esiste, base pattern)
export const Definizioni: CollectionConfig = {
  slug: 'definizioni',
  admin: {
    group: 'Lemma Details',  // Raggruppa sotto Lemma
    useAsTitle: 'testo',
  },
  // Chiave: legare a Lemmi come "child"
  fields: [
    {
      name: 'lemma',
      type: 'relationship',
      relationTo: 'lemmi',
      required: true,
      hasMany: false,
      // Proprietà speciale (Payload v3+)
      admin: {
        description: 'Parent Lemma',
        readOnly: true, // Impostato dalla parent
      },
    },
    // ... altri campi
  ],
}

// Lemmi.ts - Parent collection
export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  fields: [
    // ... campi base
    
    // Payload v3 feature: inline child collections
    {
      name: 'definizioni_inline',
      type: 'relationship',
      relationTo: 'definizioni',
      hasMany: true,
      admin: {
        // Modalità "inline edit" simile ad array
        components: {
          Field: InlineRelationshipField,
        },
      },
    },
  ],
}
```

**Pro:**
- ✅ Feature moderna di Payload v3
- ✅ Mantiene struttura DB normalizzata
- ✅ Quasi come array ma con relazioni vere
- ✅ Supporto ufficiale Payload

**Contro:**
- ⚠️ Richiede Payload v3+
- ⚠️ Ancora in beta/evoluzione
- ⚠️ Documentazione limitata

**Complessità:** ⭐⭐⭐ (Media)  
**Adatto per:** Nuovi progetti su Payload v3+

**Verdict:** ⚠️ **VALUTARE** - Se utilizzi Payload v3

---

### SOLUZIONE 4: Multi-Step Form con Context (Recommendation Winner)

**Descrizione:**  
Form multi-step che mantiene un "session context" del lemma in edit, permettendo di saltare tra tab/step senza perdere contesto.

**Architettura:**

```
┌─────────────────────────────────────────┐
│  CONTEXT PROVIDER: LemmaEditContext     │
│  • lemmaId                              │
│  • lemmarioId                           │
│  • currentStep                          │
│  • isDirty (track unsaved changes)      │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Step 1     Step 2     Step 3
    Lemma      Varianti   Definizioni
    Base       Grafiche   + Ricorrenze
               
              (Share state via Context)
                   │
                   ▼
           ┌──────────────────┐
           │  Salvataggio     │
           │  Centralizzato   │
           │  (Post all)      │
           └──────────────────┘
```

**Implementazione:**

```typescript
// LemmaEditContext.ts
import React, { createContext, useReducer } from 'react'

export const LemmaEditContext = createContext()

export const lemmaEditReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LEMMA':
      return { ...state, lemma: action.payload }
    case 'SET_DEFINIZIONI':
      return { ...state, definizioni: action.payload }
    case 'SET_VARIANTI':
      return { ...state, varianti: action.payload }
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'MARK_DIRTY':
      return { ...state, isDirty: true }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Lemmi.ts - Custom Edit View
export const CustomLemmaEditView: React.FC = () => {
  const [state, dispatch] = useReducer(
    lemmaEditReducer,
    initialState
  )
  const lemmaId = useParams().id

  const handleSaveAll = async () => {
    try {
      // 1. Salva lemma
      await updateLemma(state.lemma)

      // 2. Salva definizioni (nuove, modificate, eliminate)
      await syncDefinizioni(lemmaId, state.definizioni)

      // 3. Salva varianti
      await syncVarianti(lemmaId, state.varianti)

      // 4. Salva riferimenti
      await syncRiferimenti(lemmaId, state.riferimenti)

      dispatch({ type: 'MARK_CLEAN' })
      showNotification('Lemma salvato completamente!')
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <LemmaEditContext.Provider value={{ state, dispatch }}>
      <div className="lemma-edit-form">
        <header>
          <h1>Modifica Lemma: {state.lemma.termine}</h1>
          <span className={state.isDirty ? 'unsaved' : 'saved'}>
            {state.isDirty ? '⚠️ Non salvato' : '✅ Salvato'}
          </span>
        </header>

        <StepTabs
          steps={[
            { id: 1, label: 'Base', component: <LemmaBaseStep /> },
            { id: 2, label: 'Varianti', component: <VariantiStep /> },
            { id: 3, label: 'Definizioni', component: <DefinizioniStep /> },
            { id: 4, label: 'Riferimenti', component: <RiferimentiStep /> },
          ]}
          currentStep={state.currentStep}
          onStepChange={step => dispatch({ type: 'SET_STEP', payload: step })}
        />

        <footer>
          <button onClick={handleSaveAll} disabled={!state.isDirty}>
            💾 Salva Tutto
          </button>
        </footer>
      </div>
    </LemmaEditContext.Provider>
  )
}
```

**Per implementare in Payload, aggiungi custom view:**

```typescript
// Lemmi.ts
export const Lemmi: CollectionConfig = {
  slug: 'lemmi',
  admin: {
    defaultColumns: ['termine', 'tipo', 'lemmario', 'pubblicato'],
    // Override default edit view
    components: {
      views: {
        Edit: CustomLemmaEditView, // Custom component
      },
    },
  },
  // ... fields standard (mantieni struttura)
  fields: [
    {
      name: 'lemmario',
      type: 'relationship',
      relationTo: 'lemmari',
      required: true,
    },
    // ... altri campi
  ],
}
```

**Pro:**
- ✅ **BEST UX**: Flusso naturale e intuitivo
- ✅ Context mantiene stato coerente
- ✅ Salvataggio atomico centralizzato
- ✅ Facile track unsaved changes
- ✅ Personalizzabile completamente
- ✅ DB normalizzato mantenuto
- ✅ Non dipende da Payload features

**Contro:**
- ⚠️ Richiede custom React components
- ⚠️ Complexity media-alta
- ⚠️ Test e manutenzione

**Complessità:** ⭐⭐⭐⭐ (Media-Alta)  
**Adatto per:** Progetti production-grade

**Verdict:** ✅✅ **CONSIGLIATO** - Soluzione vincente

---

## 📊 Matrice Comparativa

| Aspetto | Array Fields | Tab Panel | Nested v3 | Multi-Step |
|---------|---|---|---|---|
| **UX** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Complessità Impl.** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **DB Normalizzato** | ❌ | ✅ | ✅ | ✅ |
| **Query Globali** | ❌ | ✅ | ✅ | ✅ |
| **Atomicità Salvataggio** | ✅ | ⚠️ | ✅ | ✅ |
| **Scalabilità** | ❌ | ✅ | ✅ | ✅ |
| **Curva Apprendimento** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Manutenibilità** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 RACCOMANDAZIONE FINALE

### ✅ Implementare SOLUZIONE 4: Multi-Step Form con Context

**Motivazioni:**

1. **UX Ottimale**: Flusso naturale, utente sempre in contesto
2. **Architettura Solida**: Mantiene DB normalizzato e queryable
3. **Manutenibile**: Pattern React standard, facile testare
4. **Scalabile**: Aggiungere step/entità non è complesso
5. **Non Invasivo**: Non modifica collections, aggiunge custom view
6. **Payload-Native**: Sfrutta extension system ufficiale

### Implementazione a Fasi

#### FASE 1: Struttura Base (IMMEDIATE)
```
1. Creare LemmaEditContext.tsx
2. Creare CustomLemmaEditView.tsx
3. Creare LemmaBaseStep.tsx
4. Collegare a Lemmi.ts
5. Test base functionality
```

#### FASE 2: Step Varianti e Definizioni
```
1. VariantiStep.tsx
2. DefinizioniStep.tsx (con sub-ricorrenze)
3. API handlers per sync
4. Validation
```

#### FASE 3: Riferimenti Incrociati
```
1. RiferimentiStep.tsx
2. Hook bidirezionalità verification
3. Visualizzazione riferimenti esistenti
```

#### FASE 4: Polish & Testing
```
1. Error handling robusto
2. Confirmations e warnings
3. Test E2E
4. Documentation
```

---

## 🔧 Roadmap Implementazione

### Stack Tecnologico Consigliato

```typescript
// Frontend components
- React 18+ (already in Payload)
- React Context (built-in)
- Payload UI components (payload/components)
- TypeScript strict
- Zod per validation schema

// Backend
- Payload CMS hooks (già implementati)
- API endpoints existing (non serve new)
- Drizzle ORM (already configured)

// Testing
- React Testing Library
- MSW per API mocking
- Cypress E2E
```

### File da Creare

```
packages/payload-cms/src/
├── admin/
│   ├── views/
│   │   └── LemmaEditView/
│   │       ├── index.tsx (main view)
│   │       ├── context.tsx
│   │       ├── steps/
│   │       │   ├── BaseStep.tsx
│   │       │   ├── VariantiStep.tsx
│   │       │   ├── DefinizioniStep.tsx
│   │       │   ├── RiferimentiStep.tsx
│   │       │   └── index.ts
│   │       ├── components/
│   │       │   ├── StepTabs.tsx
│   │       │   ├── DefinzioneRow.tsx
│   │       │   ├── RicorrenzaForm.tsx
│   │       │   └── index.ts
│   │       └── hooks/
│   │           ├── useLemmaEdit.ts
│   │           └── useSync.ts
│   └── styles/
│       └── lemma-edit.scss

```

### Timeline Stima

- **FASE 1**: 2-3 giorni
- **FASE 2**: 3-4 giorni
- **FASE 3**: 2 giorni
- **FASE 4**: 2 giorni
- **Totale**: ~1 settimana

---

## ⚠️ Considerazioni Importanti

### 1. Migrazione Dati Existing

Le entità sono già separate nelle collection. La soluzione:
- **Non modifica** la struttura dati existing
- **Aggiunge solo** una custom view per edit
- **Query e API** rimangono identiche
- **Compatibile** con dati legacy

### 2. Access Control

```typescript
// La custom view deve rispettare ACL
const CustomLemmaEditView = ({ req }) => {
  // Verifica hasLemmarioAccess su lemma.lemmario
  // Blocca edit se utente non ha permessi
  
  if (!canEdit(req.user, lemma.lemmario)) {
    return <AccessDenied />
  }
  
  // ... render form
}
```

### 3. Versioning & Draft Management

Payload supporta versioning:
```typescript
hooks: {
  afterChange: [
    ({ doc, operation, version }) => {
      if (operation === 'update') {
        // Salva snapshot delle entità correlate
        saveSnapshot(doc.id, version)
      }
    },
  ],
}
```

### 4. Performance

Per lemmi con molte definizioni/ricorrenze:
```typescript
// Lazy loading
const DefinizioniStep = () => {
  const [expanded, setExpanded] = useState(false)
  
  if (!expanded) {
    return <button onClick={() => setExpanded(true)}>
      Carica Definizioni ({count})
    </button>
  }
  
  return <DefinizioniList />
}
```

---

## 📝 Documento d'Implementazione

Una volta approvata questa soluzione, creerò:

- **PIANO_IMPLEMENTAZIONE_LEMMA_EDIT_VIEW.md**
  - Dettagli tecnici implementazione
  - Codice di esempio completo
  - Test strategy
  - Deployment plan

Desideri procedere con questa soluzione?
