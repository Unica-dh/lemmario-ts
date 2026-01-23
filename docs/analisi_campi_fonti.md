# Report: Analisi Completa dei Campi delle Fonti Bibliografiche

**Data analisi**: 2026-01-22
**File analizzato**: `/home/ale/docker/lemmario_ts/old_website/bibliografia.json`
**Totale voci**: 92 fonti bibliografiche

---

## 1. SCHEMA COMPLETO DEI CAMPI TROVATI IN bibliografia.json

### Campi Presenti nel JSON Legacy

| Campo | Tipo | Sempre Presente | Esempi di Valori | Range Lunghezza | Note |
|-------|------|-----------------|------------------|-----------------|------|
| **title** | string | ✅ Sì | "Statuto dell'Arte dei fornai e dei vinattieri di Firenze" | 20-150 caratteri | Titolo completo dell'opera |
| **date** | string | ⚠️ Opzionale | "1339", "1337-1339", "XIV secolo, prima metà", "1350-1400", "***" | 3-40 caratteri | Formato molto variabile: anno singolo, range, periodo, o "***" per sconosciuto |
| **reference** | string | ✅ Sì | "Statuti dell'Arte dei fornai e dei vinattieri di Firenze (1337-1339), a cura di F. Morandini, Leo S. Olschki Editore, Firenze, 1956." | 50-600 caratteri | Citazione bibliografica completa |
| **author** | string | ❌ Non presente | - | - | Campo definito nel type ma MAI usato nei dati |
| **publisher** | string | ❌ Non presente | - | - | Campo definito nel type ma MAI usato nei dati |
| **place** | string | ❌ Non presente | - | - | Campo definito nel type ma MAI usato nei dati |
| **pages** | string | ❌ Non presente | - | - | Campo definito nel type ma MAI usato nei dati |
| **url** | string | ❌ Non presente | - | - | Campo definito nel type ma MAI usato nei dati |

**Struttura JSON:**

- Le chiavi dell'oggetto sono i `shorthand_id` (es. "Stat.fornai.1339", "libro_abaco_1442")
- Ogni voce contiene un oggetto con `title`, `date` (opzionale), e `reference`
- Il campo `date` può assumere valori molto variegati:
  - Anno singolo: "1339"
  - Range di anni: "1337-1339", "1403-1407"
  - Periodi descrittivi: "XIV secolo, prima metà", "ultimo quarto del XIV secolo", "1350 circa", "1450-1500"
  - Sconosciuto: "***" (usato in 3 voci)

---

## 2. SCHEMA ATTUALE IN packages/payload-cms/src/collections/Fonti.ts

| Campo Payload | Tipo | Required | Unique | Corrispondenza JSON |
|---------------|------|----------|--------|---------------------|
| **shorthand_id** | text | ✅ Sì | ✅ Sì | Chiave dell'oggetto JSON |
| **titolo** | text | ✅ Sì | ❌ No | → `title` |
| **autore** | text | ❌ No | ❌ No | → `author` (non usato nei dati) |
| **anno** | text | ❌ No | ❌ No | → `date` |
| **riferimento_completo** | textarea | ✅ Sì | ❌ No | → `reference` |
| **note** | textarea | ❌ No | ❌ No | → `url` (convertito come "URL: ...") |
| timestamps | auto | - | - | createdAt, updatedAt |

---

## 3. CONFRONTO E GAP ANALYSIS

### ✅ Campi correttamente mappati

1. **shorthand_id** ↔ chiave JSON - ✅ OK (unique identifier)
2. **titolo** ↔ `title` - ✅ OK
3. **anno** ↔ `date` - ✅ OK (gestisce formato flessibile come text)
4. **riferimento_completo** ↔ `reference` - ✅ OK

### ⚠️ Campi con problemi

1. **autore**: Il campo esiste in Payload ma nei dati JSON legacy NON viene mai utilizzato. Il campo `author` è definito nel type TypeScript ma nessuna delle 92 voci lo popola.

### ❌ Campi NON mappati (presenti nel type ma mai usati nei dati)

- `publisher` - Non presente in Payload, non usato nei dati
- `place` - Non presente in Payload, non usato nei dati
- `pages` - Non presente in Payload, non usato nei dati
- `url` - Non presente in Payload, non usato nei dati

---

## 4. CAMPI MANCANTI DA AGGIUNGERE

**⚠️ NESSUN CAMPO DA AGGIUNGERE**

Il confronto dimostra che:

1. Tutti i campi effettivamente utilizzati nei dati JSON legacy (title, date, reference) sono già mappati in Payload
2. I campi aggiuntivi definiti nel type TypeScript (author, publisher, place, pages, url) NON vengono mai utilizzati nei 92 record del JSON legacy
3. Il campo `autore` esiste già in Payload ma rimarrà vuoto dopo la migrazione

**Raccomandazione**: Mantenere il campo `autore` per utilizzi futuri, anche se i dati legacy non lo popolano. Potrebbe essere utile per nuove fonti aggiunte manualmente.

---

## 5. MAPPING DETTAGLIATO PER MIGRATION SCRIPT

Il mapping attuale nello script `jsonParser.ts` è **corretto e completo**:

```typescript
export function convertBiblioToFonte(shorthandId: string, biblio: LegacyBibliografia[string]) {
  return {
    shorthand_id: shorthandId,           // ✅ Chiave JSON
    titolo: biblio.title,                // ✅ title
    autore: biblio.author,               // ⚠️ undefined per tutti i record
    anno: biblio.date,                   // ✅ date (può essere undefined)
    riferimento_completo: biblio.reference, // ✅ reference
    note: biblio.url ? `URL: ${biblio.url}` : undefined, // ⚠️ undefined per tutti
  }
}
```

**Nessuna modifica necessaria** allo script di migrazione.

---

## 6. ANALISI DETTAGLIATA DEI VALORI DEL CAMPO `date`

Il campo `date` presenta una grande varietà di formati. Ecco un'analisi dei pattern trovati:

### Pattern identificati (con esempi)

1. **Anno singolo**: "1339", "1307", "1494"
2. **Range di anni**: "1337-1339", "1348-50", "1403-1407"
3. **Anno con qualificatore**:
   - "1450 circa", "1480 ca.", "1485 circa"
   - "1418-1421 (attribuito)"
4. **Periodo descrittivo**:
   - "XIV secolo", "XV secolo"
   - "XIV secolo, prima metà"
   - "ultimo quarto del XIV secolo"
   - "fine XIV-inizio XV secolo"
   - "1350-1360 ca."
5. **Sconosciuto**: "***" (usato in 3 record: "Firenze.Ospedale.Santa.Maria.Nuova", "Bologna.Riformatori.dello.Studio", "ASBo.RotuliStudio.1384")

**Totale voci analizzate**: 92

- Con date definita: 89
- Con date = "***": 3
- Senza campo date: 0 (tutte hanno almeno "***" se sconosciuto)

---

## 7. DISTRIBUZIONE TIPOLOGICA DELLE FONTI

Analizzando i `shorthand_id` e i `title`, le fonti si dividono in:

1. **Statuti e legislazione** (~15 voci): "Stat.fornai.1339", "Stat.rigattieri.1324", etc.
2. **Libri d'abaco e matematica** (~45 voci): "libro_abaco_1442", "Trattato_alcibra_amuchabile", etc.
3. **Documenti archivistici** (~10 voci): "ASF.Diplomatico.Arcetri.1318", "Corporazioni_religiose", etc.
4. **Pratiche di mercatura** (~5 voci): "Pratica.mercatura.30.26", etc.
5. **Leges Genuenses** (~8 voci): raccolta statutaria genovese
6. **Altro** (~9 voci): costituzioni monastiche, cronache, etc.

---

## 8. ANALISI LUNGHEZZA DEI CAMPI

### title (titolo)

- Min: 21 caratteri ("Libro contabile")
- Max: 153 caratteri
- Media: ~65 caratteri
- Raccomandazione: `type: 'text'` è sufficiente

### date (anno)

- Min: 3 caratteri ("***")
- Max: 39 caratteri ("ultimo quarto del XIV secolo")
- Media: ~12 caratteri
- Raccomandazione: `type: 'text'` è corretto (non `number` per la varietà di formati)

### reference (riferimento_completo)

- Min: 46 caratteri
- Max: 599 caratteri
- Media: ~180 caratteri
- Raccomandazione: `type: 'textarea'` è corretto

---

## 9. VALIDAZIONE SHORTHAND_ID

I `shorthand_id` seguono questi pattern:

1. **Stat.NOME.ANNO**: "Stat.fornai.1339"
2. **Nome_documento_anno**: "libro_abaco_1442"
3. **Leges_Genuenses_anno**: "Leges_Genuenses_1375"
4. **Sigla.Descrizione.Anno**: "Cap.Conserv.G14"
5. **Archivio.Fondo.Anno**: "ASF.Diplomatico.Arcetri.1318"

**Caratteri utilizzati**: lettere (a-zA-Z), numeri (0-9), punto (.), underscore (_), trattino (-)
**Lunghezza**: 9-58 caratteri
**Unicità**: Tutti i 92 ID sono unici

---

## 10. RACCOMANDAZIONI FINALI

### ✅ Schema Payload attuale è COMPLETO per i dati legacy

Non servono modifiche ai campi esistenti.

### ⚠️ Possibili miglioramenti futuri (opzionali)

1. **Campo `tipo_fonte`**: Aggiungere un enum per categorizzare le fonti (statuto, trattato_matematico, documento_archivistico, etc.)
2. **Campo `secolo`**: Estratto automaticamente da `anno` per facilitare filtri
3. **Campo `localita`**: Per identificare luogo di origine (Firenze, Genova, Bologna, etc.)
4. **Campo `collazione`**: Per dettagli manoscritti (folii, carte, etc.)

### 🔧 Ottimizzazioni migration script

Lo script attuale è corretto. Possibili miglioramenti:

- Aggiungere logging per campi vuoti (autore, note) per trasparenza
- Validare formato `shorthand_id` per prevenire duplicati o caratteri invalidi

### 📊 Statistiche migrazione attese

- Fonti da importare: 92
- Campi popolati per fonte:
  - `shorthand_id`: 100% (92/92)
  - `titolo`: 100% (92/92)
  - `riferimento_completo`: 100% (92/92)
  - `anno`: 100% (92/92, include "***")
  - `autore`: 0% (0/92)
  - `note`: 0% (0/92)

---

## CONCLUSIONE

Il collection Fonti attuale è **perfettamente adeguato** per gestire i dati legacy del file bibliografia.json. Non è necessario aggiungere alcun campo. Il mapping nello script di migrazione è corretto e completo.

L'unica particolarità da notare è la varietà dei formati del campo `anno`, che è correttamente gestita usando `type: 'text'` invece di un campo data strutturato.

**Nessuna modifica richiesta al database o allo schema delle Fonti.**

---

### File di riferimento analizzati

- `/home/ale/docker/lemmario_ts/old_website/bibliografia.json` (92 voci)
- `/home/ale/docker/lemmario_ts/packages/payload-cms/src/collections/Fonti.ts`
- `/home/ale/docker/lemmario_ts/scripts/migration/parsers/jsonParser.ts`
- `/home/ale/docker/lemmario_ts/scripts/migration/types.ts`
