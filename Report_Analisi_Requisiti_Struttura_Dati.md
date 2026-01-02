# Report di Analisi - Requisiti Struttura Dati Lemmario

**Data:** 02/01/2026
**Documento:** Verifica coerenza tra requisiti struttura dati e funzionalità applicazione corrente

---

## 1. Executive Summary

L'analisi comparativa tra i requisiti della struttura dati proposta e le funzionalità dell'applicazione corrente ha evidenziato che **la struttura dati è fondamentalmente corretta** e supporta le funzionalità core dell'applicazione esistente.

Tuttavia, sono emerse **2 lacune critiche** e **4 miglioramenti raccomandati** che devono essere affrontati prima di procedere con l'implementazione.

### Esito Complessivo
- ✅ **Funzionalità core:** Pienamente supportate
- ⚠️ **Funzionalità critiche mancanti:** 2 (riferimenti incrociati, varianti grafiche)
- ⚠️ **Contenuti statici:** Non gestiti nella struttura dati
- ✅ **Navigazione e filtraggio:** Pienamente supportati

---

## 2. Struttura Dati Proposta - Sintesi

### 2.1 Entità Principali (5)

| Entità | Descrizione | Stato |
|--------|-------------|-------|
| **Lemma** | Termine principale con lingua | ✅ Corretto |
| **Definizione** | Definizioni multiple per lemma | ✅ Corretto |
| **Livello di Razionalità** | Classificazione per livello | ⚠️ Da modificare |
| **Fonte** | Riferimenti bibliografici | ✅ Corretto |
| **Ricorrenza** | Citazioni con fonte | ✅ Corretto |

### 2.2 Relazioni Principali
```
Lemma (1) ──→ (N) Definizione
Definizione (N) ──→ (1) Livello di Razionalità [DA MODIFICARE: rendere opzionale]
Definizione (1) ──→ (N) Ricorrenza
Ricorrenza (N) ──→ (1) Fonte
```

---

## 3. Analisi Gap - Funzionalità Correnti vs Struttura Proposta

### 3.1 Funzionalità Core ✅ SUPPORTATE

| Funzionalità Corrente | Supporto Struttura Dati |
|----------------------|------------------------|
| Elenco lemmi | ✅ Tabella `Lemma` |
| Filtro per lingua (latino/volgare) | ✅ Campo `Lemma.lingua` |
| Definizioni multiple numerate | ✅ Tabella `Definizione` con campo `ordine` |
| Citazioni con fonti | ✅ Tabelle `Ricorrenza` + `Fonte` |
| Livelli di razionalità | ✅ Tabella `Livello di Razionalità` |
| Riferimenti bibliografici completi | ✅ Tabella `Fonte` |

### 3.2 Lacune Critiche ❌ NON SUPPORTATE

#### GAP 1: Sistema di Riferimenti Incrociati (CFR.)
**Problema:** La risposta del cliente (domanda 2) conferma che esistono riferimenti incrociati tra lemmi (relazione uno-a-molti), ma **non sono presenti nella struttura dati proposta**.

**Esempio dall'applicazione corrente:**
```
"CFR. LAT. ORDO" - riferimento da un lemma ad un altro
```

**Impatto:** **CRITICO** - Funzionalità presente nel sito corrente che andrebbe persa.

**Soluzione richiesta:**
```sql
Nuova tabella: RiferimentoIncrociato
- riferimento_id (PK)
- lemma_origine_id (FK → Lemma)
- lemma_destinazione_id (FK → Lemma)
- tipo_riferimento (VARCHAR) -- es. "CFR", "VEDI ANCHE"
- note (TEXT, opzionale)
```

#### GAP 2: Varianti Grafiche Multiple
**Problema:** La risposta del cliente (domanda 3) richiede esplicitamente campi separati per "termine principale" e "varianti", ma la struttura attuale ha solo un campo `termine`.

**Impatto:** **CRITICO** - Requisito esplicito del cliente non soddisfatto.

**Soluzione richiesta:**
```sql
Nuova tabella: VarianteGrafica
- variante_id (PK)
- lemma_id (FK → Lemma)
- testo (VARCHAR)
- is_principale (BOOLEAN)
- ordine (INT)
```

### 3.3 Contenuti Statici ⚠️ NON GESTITI

Il menu di navigazione corrente include sezioni che **non sono rappresentate nella struttura dati**:

| Sezione Menu | Presente in Struttura Dati | Criticità |
|-------------|---------------------------|-----------|
| Progetto | ❌ No | Media |
| Termini chiave | ❌ No | Media |
| Livelli di razionalità | ✅ Parziale (solo codici) | Bassa |
| Legenda | ❌ No | Media |
| Saggi | ❌ No | Media |
| Bibliografia | ⚠️ Parziale | Bassa |

**Soluzione raccomandata:**
```sql
Nuova tabella: ContenutoStatico
- contenuto_id (PK)
- sezione (ENUM: 'progetto', 'termini_chiave', 'legenda', 'saggio')
- titolo (VARCHAR)
- contenuto (TEXT)
- ordine (INT)
- data_creazione (TIMESTAMP)
- data_modifica (TIMESTAMP)
```

---

## 4. Impatto delle Risposte del Cliente

### 4.1 Modifiche alla Struttura Richieste

| Domanda | Risposta Cliente | Impatto Struttura Dati |
|---------|-----------------|------------------------|
| 1. Livello razionalità opzionale? | **SÌ - Opzionale operativamente** | ⚠️ **MODIFICA RICHIESTA:** Rendere `Definizione.livello_id` NULLABLE |
| 2. Riferimenti incrociati CFR? | **SÌ - Relazione uno-a-molti** | ❌ **NUOVA ENTITÀ RICHIESTA** |
| 3. Grafie multiple? | **SÌ - Campi separati** | ❌ **NUOVA ENTITÀ RICHIESTA** |
| 4. Elenco livelli? | Allegato file | ⚠️ **FILE NON TROVATO NEL PROGETTO** |
| 5. Parte del discorso separata? | **NO - Mantenerla nella definizione** | ✅ Nessuna modifica |
| 6. Formato datazione? | **Testo flessibile** | ✅ Nessuna modifica |
| 7. Fonti multiple? | **Record separati** | ✅ Nessuna modifica |

### 4.2 Chiarimenti Positivi (Nessuna Modifica)

Il cliente ha semplificato alcuni aspetti:
- ✅ Parte del discorso rimane nel testo della definizione
- ✅ Datazione può essere campo testuale flessibile
- ✅ Fonti multiple con date diverse = record separati

---

## 5. Raccomandazioni di Implementazione

### 5.1 Priorità CRITICA ⚠️

1. **Aggiungere entità `RiferimentoIncrociato`**
   - Gestire relazioni molti-a-molti tra lemmi
   - Tipizzare i riferimenti (CFR, VEDI, VEDI ANCHE, etc.)

2. **Aggiungere entità `VarianteGrafica`**
   - Campo principale vs varianti
   - Ordinamento delle varianti

3. **Modificare relazione Definizione-Livello**
   - Rendere `livello_id` nullable
   - Gestire caso in cui livello non è specificato

### 5.2 Priorità ALTA 📋

4. **Aggiungere entità `ContenutoStatico`**
   - Gestire pagine: Progetto, Termini chiave, Legenda, Saggi
   - Struttura flessibile per contenuti editabili

5. **Potenziare entità `Fonte` per Bibliografia completa**
   - Aggiungere campo `mostra_in_bibliografia` (BOOLEAN)
   - Distinguere fonti citate vs bibliografia generale

### 5.3 Priorità MEDIA 🔍

6. **Aggiungere indici per performance**
   - `Lemma(termine)` - ordinamento alfabetico
   - `Lemma(lingua)` - filtraggio
   - `Definizione(lemma_id)` - join
   - `Ricorrenza(definizione_id, fonte_id)` - join

7. **Supporto ricerca full-text**
   - Indici su `Lemma.termine`
   - Indici su `VarianteGrafica.testo`
   - Indici su `Definizione.testo_definizione`

---

## 6. Schema ER Rivisto (Proposta)

```
┌──────────────────┐
│     Lemma        │
│ - lemma_id (PK)  │
│ - termine        │
│ - lingua         │
└────────┬─────────┘
         │ 1
         │
         │ N
┌────────┴──────────────┐           ┌──────────────────────┐
│  VarianteGrafica      │           │ RiferimentoIncrociato│
│ - variante_id (PK)    │           │ - riferimento_id (PK)│
│ - lemma_id (FK)       │           │ - lemma_orig_id (FK) │
│ - testo               │           │ - lemma_dest_id (FK) │
│ - is_principale       │           │ - tipo_riferimento   │
│ - ordine              │           └──────────────────────┘
└───────────────────────┘

         ┌─────────────┐
         │ Definizione │
         │ - definizione_id (PK)
         │ - testo_definizione
         │ - ordine
         │ - lemma_id (FK)
         │ - livello_id (FK, NULLABLE) ← MODIFICATO
         └──────┬──────┘
                │ N           0..1
                │        ┌─────────────────────────┐
                ├────────┤ Livello di Razionalità  │
                │        │ - livello_id (PK)       │
                │        │ - codice                │
                │ 1      │ - descrizione           │
                │        └─────────────────────────┘
                │ N
         ┌──────┴──────┐
         │ Ricorrenza  │
         │ - ricorrenza_id (PK)
         │ - citazione
         │ - posizione_citazione
         │ - definizione_id (FK)
         │ - fonte_id (FK)
         └──────┬──────┘
                │ N
                │ 1
         ┌──────┴──────┐
         │   Fonte     │
         │ - fonte_id (PK)
         │ - titolo
         │ - datazione
         │ - riferimento_bibliografico
         │ - mostra_in_bibliografia ← NUOVO
         └─────────────┘

┌───────────────────────┐
│  ContenutoStatico     │  ← NUOVA ENTITÀ
│ - contenuto_id (PK)   │
│ - sezione             │
│ - titolo              │
│ - contenuto           │
│ - ordine              │
└───────────────────────┘
```

---

## 7. Domande di Chiarimento per il Cliente

### Domanda 1: File Livelli di Razionalità
**Contesto:** Nella risposta alla domanda 4, menzioni un file allegato con l'elenco completo dei livelli di razionalità, ma non è presente nel repository.

**Richiesta:** Puoi fornire questo file? È necessario per:
- Definire tutti i valori possibili per la tabella `Livello di Razionalità`
- Verificare se ci sono campi aggiuntivi da includere oltre a `codice` e `descrizione`

---

### Domanda 2: Ambito della Bibliografia
**Contesto:** Nel sito corrente esiste una sezione "Bibliografia" nel menu principale.

**Richiesta:** La sezione Bibliografia deve contenere:
- **Opzione A:** Solo le fonti effettivamente citate nei lemmi?
- **Opzione B:** Tutte le opere rilevanti per il progetto, anche se non citate direttamente?

**Implicazioni:** Se opzione B, serve un campo per distinguere fonti citate da bibliografia generale.

---

### Domanda 3: Tipologia Riferimenti Incrociati
**Contesto:** Hai confermato che esistono riferimenti incrociati tra lemmi (CFR.).

**Richieste:**
1. Esistono diversi **tipi** di riferimenti incrociati? (es. CFR, VEDI, VEDI ANCHE, SINONIMO, CONTRARIO)
2. Se sì, quali sono tutti i tipi possibili?
3. I riferimenti hanno una direzione specifica o sono bidirezionali? (es. se A→B allora anche B→A?)

---

### Domanda 4: Contenuto Sezioni Statiche
**Contesto:** Il sito corrente ha sezioni: Progetto, Termini chiave, Legenda, Saggi.

**Richieste:**
1. **Saggi:** Devono essere semplici pagine di testo o hanno una struttura più ricca (autore, data, collegamenti a lemmi specifici)?
2. **Termini chiave:** È un glossario separato dal lemmario principale? Ha la stessa struttura dei lemmi o è più semplice?
3. Queste sezioni devono essere **editabili** via CMS o possono rimanere statiche nel codice?

---

### Domanda 5: Priorità Funzionalità di Ricerca
**Contesto:** L'analisi dell'applicazione corrente indica che manca una funzionalità di ricerca.

**Richieste:**
1. Per la prima versione dinamica, quali funzionalità di ricerca sono **prioritarie**?
   - [ ] Ricerca per termine (nome del lemma)
   - [ ] Ricerca all'interno delle definizioni
   - [ ] Ricerca nelle citazioni
   - [ ] Ricerca per fonte bibliografica
   - [ ] Autocomplete durante la digitazione
   - [ ] Ricerca per varianti grafiche

2. La ricerca deve essere case-sensitive o case-insensitive?

---

### Domanda 6: Funzionalità Utente
**Contesto:** L'analisi suggerisce funzionalità come segnalibri, annotazioni, cronologia.

**Richiesta:** Quali di queste funzionalità sono richieste per la **prima release**?
- [ ] Segnalibri (lemmi preferiti)
- [ ] Annotazioni personali
- [ ] Cronologia consultazioni
- [ ] Condivisione link diretti a lemmi
- [ ] Export PDF
- [ ] Sistema di autenticazione utenti

---

### Domanda 7: Varianti Grafiche - Dettagli
**Contesto:** Hai confermato la necessità di gestire varianti grafiche separate.

**Richieste:**
1. Qual è il **numero massimo** previsto di varianti per lemma?
2. Le varianti devono essere **ricercabili** allo stesso modo del termine principale?
3. Nell'interfaccia, come devono essere visualizzate le varianti? (es. "ADDITIO (var: additione, aditio)")

---

### Domanda 8: Datazione Fonti - Convenzioni
**Contesto:** Hai indicato preferenza per campo testuale con eventuale convenzione.

**Richieste:**
1. Vuoi che il sistema **imponga** la convenzione (es. "XIV secolo" → "1301-1400") o sia solo una **linea guida** per i redattori?
2. Se imposta, serve validazione automatica durante l'inserimento?
3. Il sistema deve permettere **ricerche per periodo** (es. "tutti i lemmi del XIV secolo")?

---

### Domanda 9: Gestione Contenuti
**Contesto:** Migrazione da sito statico a applicazione dinamica.

**Richieste:**
1. Chi si occuperà dell'**inserimento e modifica** dei lemmi?
   - Singolo amministratore
   - Team di redattori
   - Altro

2. Serve un sistema di **workflow** (bozza → revisione → pubblicazione)?

3. Serve **storicizzazione** delle modifiche (versioning)?

---

## 8. Prossimi Passi Raccomandati

### Fase 1: Chiarimenti (QUESTA FASE)
- ✅ Completare analisi requisiti (fatto)
- ⏳ Ottenere risposte alle domande di chiarimento
- ⏳ Ricevere file livelli di razionalità

### Fase 2: Finalizzazione Schema Dati
- Aggiornare schema ER con entità mancanti
- Definire tutti i vincoli e indici
- Validare con stakeholder

### Fase 3: Migrazione Dati Legacy
- Analizzare file HTML attuali (239 lemmi)
- Creare script di parsing e importazione
- Mappare JSON bibliografia/indice → nuovo schema

### Fase 4: Implementazione
- Setup database PostgreSQL
- Implementazione API backend (Node.js/TypeScript)
- Sviluppo interfaccia frontend
- Testing e deployment

---

## 9. Conclusioni

La struttura dati proposta nei documenti di requisiti è **solida e ben progettata** per supportare le funzionalità core dell'applicazione Lemmario.

**Punti di forza:**
- ✅ Modellazione corretta di lemmi, definizioni, fonti e citazioni
- ✅ Supporto per classificazione multilivello
- ✅ Gestione relazioni molti-a-molti appropriate
- ✅ Flessibilità per gestire contenuti complessi

**Aree di intervento necessarie:**
- ❌ **CRITICO:** Aggiungere sistema riferimenti incrociati
- ❌ **CRITICO:** Aggiungere gestione varianti grafiche
- ⚠️ **IMPORTANTE:** Rendere opzionale il livello di razionalità
- ⚠️ **IMPORTANTE:** Aggiungere gestione contenuti statici

**Stima complessità modifiche:**
- Modifiche critiche: ~2-3 giorni di design + implementazione
- Miglioramenti raccomandati: ~3-5 giorni di design + implementazione
- Impatto su migrazione dati: +1-2 giorni per gestire varianti e riferimenti

**Raccomandazione finale:** **APPROVARE CON MODIFICHE** - La struttura è valida ma richiede le integrazioni evidenziate prima di procedere con l'implementazione.

---

**Redattore:** Claude Code
**Versione documento:** 1.0
**File di riferimento:**
- [Analisi_Lemmario_Razionale.md](Analisi_Lemmario_Razionale.md)
- [Lemmario - Requisiti struttura dati.md](Lemmario - Requisiti struttura dati.md)
- [Risposte - Requisiti struttura dati.md](Risposte - Requisiti struttura dati.md)
