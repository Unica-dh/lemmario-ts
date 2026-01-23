# Modifiche Componente Anteprima - MODIFICA 4 (Espansa)

## Data: 2026-01-23

## Modifiche Apportate

### 1. Interfacce TypeScript Aggiornate

**File:** `packages/payload-cms/src/admin/views/LemmaEdit/context.tsx`

**Modifiche a `Definizione`:**
```typescript
export interface Definizione {
  id?: string | number
  numero: number
  testo: string
  livello_razionalita?: string | number  // ✨ NUOVO CAMPO
  ricorrenze?: Ricorrenza[]
  _isNew?: boolean
  _isDeleted?: boolean
}
```

**Modifiche a `Ricorrenza`:**
```typescript
export interface Ricorrenza {
  id?: string | number
  fonte: string | number
  fonte_titolo?: string              // ✨ NUOVO - per visualizzazione
  testo_originale: string
  pagina?: string                    // Campo legacy
  pagina_raw?: string                // ✨ NUOVO - riferimento completo
  tipo_riferimento?: 'pagina' | 'carta' | 'colonna' | 'folio' | 'misto'  // ✨ NUOVO
  numero?: string                    // ✨ NUOVO
  numero_secondario?: string         // ✨ NUOVO
  rubrica_numero?: string            // ✨ NUOVO
  rubrica_titolo?: string            // ✨ NUOVO
  libro?: string                     // ✨ NUOVO
  capitolo?: string                  // ✨ NUOVO
  sezione?: string                   // ✨ NUOVO
  supplemento?: string               // ✨ NUOVO
  note?: string
  _isNew?: boolean
  _isDeleted?: boolean
}
```

### 2. Componente Anteprima Espanso

**File:** `packages/payload-cms/src/admin/views/LemmaEdit/components/AnteprimaLemma.tsx`

**Nuove visualizzazioni:**

#### A. Header Definizione con Livello Razionalità
```typescript
<div className="def-header">
  <span className="def-numero">#{def.numero}</span>
  {def.livello_razionalita && (
    <span className="livello-badge">Liv. {def.livello_razionalita}</span>
  )}
</div>
```

#### B. Lista Ricorrenze Completa
```typescript
<div className="ricorrenze-list">
  <div className="ricorrenze-header">
    <strong>Ricorrenze ({activeRicorrenze.length}):</strong>
  </div>
  {activeRicorrenze.map((ric, ricIdx) => (
    <div key={ricIdx} className="ric-item">
      <div className="ric-fonte">
        📚 {ric.fonte_titolo || `Fonte ID: ${ric.fonte}`}
        {ric.pagina_raw && <span className="ric-pagina"> - {ric.pagina_raw}</span>}
      </div>
      {ric.testo_originale && (
        <div className="ric-testo">
          "{ric.testo_originale.substring(0, 100)}
          {ric.testo_originale.length > 100 ? '...' : ''}"
        </div>
      )}
    </div>
  ))}
</div>
```

### 3. Stili CSS Aggiunti

**File:** `packages/payload-cms/src/admin/views/LemmaEdit/index.tsx`

Aggiunti 30+ nuovi stili per:
- `.def-header` - Header definizione con badge
- `.livello-badge` - Badge verde per livello razionalità
- `.ricorrenze-list` - Container lista ricorrenze
- `.ricorrenze-header` - Intestazione ricorrenze
- `.ric-item` - Singola ricorrenza con bordo blu
- `.ric-fonte` - Titolo fonte in grassetto
- `.ric-pagina` - Riferimento pagina
- `.ric-testo` - Testo citazione in corsivo

## Cosa Mostra Ora l'Anteprima

### Prima (Versione Minimalista)
```
📄 Anteprima

visitatoreslatino

Definizioni (1):
#1
[Testo definizione]
2 citazioni
```

### Dopo (Versione Dettagliata)
```
📄 Anteprima

visitatoreslatino

Definizioni (1):
#1  Liv. 3

Ufficiale con funzioni di verifica.

Ricorrenze (2):
  📚 Leges_Genuenses_1157 - col. 123, rubr. 45
  "Item statuimus quod visitatores..."

  📚 Statuto_Mercanzia_Siena - p. 234
  "De visitatoribus et eorum officio..."
```

## Come Testare

1. Accedi all'admin: http://localhost:3000/admin
2. Login con: `admin@lemmario.test` / `admin123`
3. Vai su Lemmi → Modifica un lemma (es. "visitatores")
4. Naviga allo step "Definizioni"
5. Osserva la sidebar destra

### Verifica che mostri:
- ✅ Numero definizione + badge livello razionalità (se presente)
- ✅ Testo completo della definizione
- ✅ Sezione "Ricorrenze (N):" espansa
- ✅ Per ogni ricorrenza:
  - Titolo fonte (o ID se titolo non disponibile)
  - Riferimento pagina/carta (campo `pagina_raw`)
  - Preview testo originale (primi 100 caratteri)

## Limitazioni Note

1. **Titolo Fonte**:
   - Il campo `fonte_titolo` non è popolato dal backend
   - Fallback su "Fonte ID: [numero]"
   - Per risolvere: serve una query JOIN o caricamento asincrono

2. **Aggiornamento Real-time**:
   - L'anteprima si aggiorna mentre modifichi i campi
   - Ma NON mostra i titoli delle fonti fino al salvataggio
   - Necessario reload del context dopo cambio fonte

## File Modificati

| File | Righe | Tipo Modifica |
|------|-------|---------------|
| context.tsx | 10-39 | Interfacce TypeScript aggiornate |
| AnteprimaLemma.tsx | 56-101 | Logica visualizzazione espansa |
| index.tsx | 313+ | Stili CSS (+30 regole) |

## Prossimi Miglioramenti Possibili

1. **Caricamento titoli fonti**: Hook useEffect per caricare titoli via API
2. **Espansione/Collasso**: Ricorrenze collassabili per definizioni lunghe
3. **Highlight campi**: Evidenziare campi modificati non salvati
4. **Link cliccabili**: Navigazione rapida alle fonti
5. **Scroll sync**: Scroll automatico alla definizione attiva

## Status Deployment

✅ Codice modificato
✅ Container ricompilato (webpack)
✅ Servizio attivo su http://localhost:3000
✅ Pronto per test utente
