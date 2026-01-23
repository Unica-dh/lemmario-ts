# Analisi Completa Pattern Riferimenti Pagina/Carta

**Data analisi**: 2026-01-22
**Directory analizzata**: `/home/ale/docker/lemmario_ts/old_website/lemmi/`
**File HTML analizzati**: 239
**Totale riferimenti estratti**: 471

---

## STATISTICHE GENERALI

- **Totale riferimenti analizzati**: 471 (469 con "» -", 2 con "». -")
- **Pattern identificati**: 15 categorie principali con numerose varianti

---

## 1. PATTERN PAGINA SEMPLICE (p.)

### 1.1 Pagina singola senza recto/verso

**Pattern**: `p. N`
**Occorrenze**: 7
**Esempi**:

- `» - p. 135.`
- `» - p. 27.`
- `» - p. 44.`

**Regex proposta**:

```regex
» - p\. (\d+)\.
```

### 1.2 Pagina con recto (r)

**Pattern**: `p. Nr`
**Occorrenze**: 52
**Esempi**:

- `» - p. 157r.`
- `» - p. 227r.`
- `» - p. 88r.`
- `» - p. 69r.`
- `» - p. 268r.`
- `» - p. 148r.`
- `» - p. 53r.`
- `» - p. 94v.`
- `» - p. 59r.`
- `» - p. 76r.`

**Regex proposta**:

```regex
» - p\. (\d+)r\.
```

### 1.3 Pagina con verso (v)

**Pattern**: `p. Nv`
**Occorrenze**: 54
**Esempi**:

- `» - p. 157v.`
- `» - p. 85v.`
- `» - p. 100v.`
- `» - p. 102r.`
- `» - p. 103r.`
- `» - p. 104r.`
- `» - p. 104v.`
- `» - p. 109v.`
- `» - p. 114r.`
- `» - p. 130v.`

**Regex proposta**:

```regex
» - p\. (\d+)v\.
```

### 1.4 Range di pagine (p. N-M)

**Pattern**: `p. N-M`
**Occorrenze**: 7
**Esempi**:

- `» - p. 120-121, rubr. 29 "Di coloro che fanno e' fatti de' minori".`
- `» - p. 55-56.`

**Regex proposta**:

```regex
» - p\. (\d+)-(\d+)(?:, .*)?\.
```

---

## 2. PATTERN PAGINE MULTIPLE (pp.)

**Pattern**: `pp. N-M`
**Occorrenze**: 17
**Esempi**:

- `» - pp. 54-55.`
- `» - pp. 57-58.`
- `» - pp. 59-60.`
- `» - pp. 93-94, rubr. 15 "Della electione de gli amendatori dello statuto".`

**Regex proposta**:

```regex
» - pp\. (\d+)-(\d+)(?:, .*)?\.
```

---

## 3. PATTERN PAGINA + RUBRICA (Il più comune!)

**Pattern**: `p. N, rubr(ica). N, "Titolo"`
**Occorrenze**: 136
**Esempi**:

- `» - p. 100, rubrica 27, "De eleggiare coloro che sopra el salaro de' sartori proveggano".`
- `» - p. 101, rubr. 29, "De le provisioni da are sopra e' sensari".`
- `» - p. 102, rubrica 30, "Le infrascripte provisioni so' facte per certi savii negli anni Millecccxliiii sopra le decime".`
- `» - p. 105, rubrica 2, "De' richiami et del modo da procedare".`
- `» - p. 109, rubrica 12, "Che la pruova de la maggiore somma sia sufficiente".`
- `» - p. 112, rubr. 17 "De le compensationi".`
- `» - p. 115, rubr. 21 "Che l'erede del compagno stieno al libro de la compagnia".`
- `» - p. 116, rubrica 24, "De' compagni et fattori che vogliono rendere la ragione".`
- `» - p. 119, rubr. 25, "De' contratti et patti da osservare et tenere fermi".`
- `» - p. 120, rubr. 28, "Di choloro che richolgono l'avere altrui".`
- `» - p. 121, rubrica 30, "De le prestanze da ricogliare".`
- `» - p. 126, rubrica 4, "De' saramenti non liciti et pergiuri da punire".`
- `» - p. 127, rubr. 5, "Di coloro che comettaranno alchuna chosa contra l'onore de la Mercantia".`
- `» - p. 128, rubr. 8, "De falsi pesi et misure".`
- `» - p. 131, rubrica 16, "De coloro che peccaranno de' fatti de la moneta".`

**Regex proposta**:

```regex
» - p\. (\d+[rv]?), rubr(?:ica|\.) (\d+),? "([^"]+)"\.
```

---

## 4. PATTERN CARTA (c.)

### 4.1 Carta con recto (r)

**Pattern**: `c. Nr`
**Occorrenze**: 65
**Esempi**:

- `» - c. 150r.`
- `» - c. 112r.`
- `» - c. 116r.`
- `» - c. 119r.`
- `» - c. 120r.`
- `» - c. 122r.`
- `» - c. 128r.`
- `» - c. 131r.`
- `» - c. 132r.`
- `» - c. 133r.`

**Regex proposta**:

```regex
» - c\. (\d+)r\.
```

### 4.2 Carta con verso (v)

**Pattern**: `c. Nv`
**Occorrenze**: 58
**Esempi**:

- `» - c. 16v.`
- `» - c. 57v.`
- `» - c. 18v.`
- `» - c. 130v.`
- `» - c. 36v.`
- `» - c. 80v.`
- `» - c. 54v.`
- `» - c. 85v.`
- `» - c. 104v.`
- `» - c. 110v.`

**Regex proposta**:

```regex
» - c\. (\d+)v\.
```

### 4.3 Carta con range recto-verso

**Pattern**: `c. Nr-v`
**Occorrenze**: 6
**Esempi**:

- `» - c. 11r-v.`
- `» - c. 18r-v.`
- `» - c. 23r-v.`
- `» - c. 37r-v.`
- `» - c. 3r-v.`
- `» - c. 159r-v.`

**Regex proposta**:

```regex
» - c\. (\d+)r-v\.
```

---

## 5. PATTERN FOLIO (f.)

**Pattern**: `f. Nr`
**Occorrenze**: 2
**Esempi**:

- `» - f. 6r.`
- `» - f. 169r.`

**Regex proposta**:

```regex
» - f\. (\d+)([rv])\.
```

---

## 6. PATTERN COLONNA (col./colonna)

### 6.1 Colonna semplice (abbreviata)

**Pattern**: `col. N`
**Occorrenze**: 33
**Esempi**:

- `» - col. 899, rubrica "De curatoribus generalibus et eorum officio".`
- `» - col. 900, rubrica "De curatoribus generalibus et eorum officio".`
- `» - col. 902, rubrica "De contribuenda administratione inter contutores".`
- `» - col. 161.`
- `» - col. 162.`

**Regex proposta**:

```regex
» - col\. (\d+)(?:, .*)?\.
```

### 6.2 Colonna (forma estesa)

**Pattern**: `colonna N`
**Occorrenze**: 33
**Esempi**:

- `» - colonna 55, rubrica 51 "Qualiter debent compare disbitari ex suis residuis ut infra".`
- `» - colonna 413, rubrica 42 "De iunctis non dandis".`
- `» - colonna 452, rubrica 115 "De porcis restringendis, et quod non possint ire per civitatem, nixi ut infra".`
- `» - colonna 456, rubrica 119 "De axinariis et bestias ducentibus etc".`

**Regex proposta**:

```regex
» - colonna (\d+)(?:, .*)?\.
```

### 6.3 Colonna + rubrica

**Pattern**: `col(onna). N, rubr(ica). "Titolo"`
**Occorrenze**: 110
**Esempi**:

- `» - col. 102, rubr. 176 "De quinque soldis pro qualibet condennatione exigendis ultra condemnationes que de cetero fient".`
- `» - col. 115, rubr. 194 "Quod scribe aliquid non petant pro instrumentis que fecerint pro comuni Ianue et de notariis ab aliquo interrogatis".`
- `» - col. 156, rubr. 258 "De observandis omnibus et singulis factis et firmatis et promissis officio assignationis mutuorum MCCCIII".`

**Regex proposta**:

```regex
» - col(?:onna|\.) (\d+), rubr(?:ica|\.)\.? (?:(\d+) )?"([^"]+)"\.
```

---

## 7. PATTERN COLONNA + SUPPLEMENTO

**Pattern**: `col. N, supplemento [numero romano/arabo], rubr. "Titolo"`
**Occorrenze**: 3
**Esempi**:

- `» - col. 741, supplemento I, rubr. "De reddenda ratione accomendatariis infra sex menses".`
- `» - col. 741, supplemento n. 2, rubr. "De electione officii Gazarie".`
- `» - col. 785, supplemento II, rubr. "De manifestando veram portatam navigiorum".`

**Regex proposta**:

```regex
» - col\. (\d+), supplemento (n\. \d+|[IVX]+), rubr\. "([^"]+)"\.
```

---

## 8. PATTERN SEZIONE

**Pattern**: Varie combinazioni con "sezione"
**Occorrenze**: 30
**Esempi**:

- `» - p. 187, prima sezione degli statuti del Comune che trattano di questioni di pertinenza della Mercanzia, rubrica 1, "De la provisione de' consoli de la Mercantia de la città di Siena".`
- `» - p. 197, seconda sezione dello statuto del Comune, rubr. 1, "De la prestanza et dipositi de' minori".`
- `» - p. 210, seconda sezione degli statuti del Comune, rubr. 29 "Che de le sententie diffinitive date per li consoli de la Mercantia non si possa appellare".`

**Regex proposta**:

```regex
» - p\. (\d+), (prima|seconda|terza|quarta) sezione (?:degli statuti del Comune|dello statuto del Comune)(?:.*?), rubr(?:ica|\.) (\d+),? "([^"]+)"\.
```

---

## STATISTICHE RIEPILOGATIVE

### Per tipo di riferimento principale

| Tipo | Occorrenze | Percentuale |
|------|------------|-------------|
| Carta (c.) | 170 | 36.1% |
| Pagina (p./pp.) | 153 | 32.5% |
| Colonna (col./colonna) | 110 | 23.4% |
| Altri (lib., sezione, etc.) | 37 | 7.9% |

### Con elementi strutturali

| Elemento | Occorrenze | Percentuale |
|----------|------------|-------------|
| Con rubrica/rubr. | 253 | 53.7% |
| Con titolo rubrica "..." | 252 | 53.5% |
| Con Libro/lib. | 66 | 14.0% |
| Con cap./capitolo | 86 | 18.3% |
| Con sezione | 30 | 6.4% |
| Con supplemento | 3 | 0.6% |
| Con prologo/Introduzione | 8 | 1.7% |

### Notazione recto/verso

| Tipo | Occorrenze |
|------|------------|
| Pagina con r | 52 |
| Pagina con v | 54 |
| Carta con r | 65 |
| Carta con v | 58 |
| Carta con range r-v | 6 |
| Folio con r | 2 |

---

## SUGGERIMENTI PER LA STRUTTURA DATI

### Opzione 1: Campo di testo strutturato (RACCOMANDATO)

Mantenere il campo `pagina` come campo di testo libero ma parsabile con regex. Questo è il più flessibile e mantiene la fedeltà ai dati originali.

```typescript
interface Ricorrenza {
  testo_originale: string;
  pagina: string; // "p. 123, rubr. 45 \"De titulo\""
  riferimento_fonte: string; // ID della fonte
}
```

### Opzione 2: Campo JSON strutturato

Creare un campo JSON per catturare tutti gli elementi strutturati:

```typescript
interface RiferimentoPagina {
  tipo: 'pagina' | 'carta' | 'colonna' | 'folio' | 'misto';
  numero_principale: string; // "123" o "123r" o "123-125"
  numero_secondario?: string; // per riferimenti misti (c. + p.)
  rubrica?: {
    numero?: string;
    titolo?: string;
  };
  libro?: string; // "IV", "II"
  capitolo?: string;
  sezione?: string; // "prima sezione", "seconda sezione"
  supplemento?: string; // "I", "n. 2"
  note?: string; // "Prologo", "Introduzione", etc.
}

interface Ricorrenza {
  testo_originale: string;
  riferimento_pagina: RiferimentoPagina;
  riferimento_fonte: string;
}
```

### Opzione 3: Campi separati (consigliata per query avanzate)

Separare gli elementi più comuni in campi distinti per facilitare ricerche e filtri:

```typescript
interface Ricorrenza {
  testo_originale: string;

  // Riferimento principale
  tipo_riferimento: 'pagina' | 'carta' | 'colonna' | 'folio' | 'misto';
  numero: string; // "123", "123r", "123-125"
  numero_secondario?: string; // per misti

  // Elementi strutturali comuni
  rubrica_numero?: string;
  rubrica_titolo?: string;

  // Elementi opzionali
  libro?: string;
  capitolo?: string;
  sezione?: string;
  supplemento?: string;

  // Testo originale completo per riferimento
  pagina_raw: string; // "p. 123, rubr. 45 \"De titulo\""

  riferimento_fonte: string;
}
```

---

## RACCOMANDAZIONI FINALI

1. **Mantenere il testo originale**: Conservare sempre il testo originale completo del riferimento in un campo `pagina_raw` per evitare perdita di informazioni durante il parsing.

2. **Struttura ibrida consigliata**: Utilizzare sia campi strutturati (per query e filtri) sia il testo originale (per visualizzazione e verifica).

3. **Validazione**: Implementare validazione durante l'import per segnalare riferimenti che non matchano nessun pattern noto.

4. **Estensibilità**: La struttura dati dovrebbe essere estensibile per futuri pattern non ancora incontrati.

5. **Indicizzazione**: Creare indici su `tipo_riferimento`, `numero`, e `rubrica_numero` per ottimizzare le query.

6. **Pattern speciali**: Prestare particolare attenzione ai riferimenti misti (carta + pagina) e ai riferimenti con sezioni del Comune, che sono piuttosto complessi.
