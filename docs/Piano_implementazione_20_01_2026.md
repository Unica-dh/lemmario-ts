# Piano Dettagliato di Implementazione
## Riepilogo Modifiche dal Cliente - 20/01/2026

---

## 📋 MODIFICA 1: Spostare Livello di Razionalità da Ricorrenze a Definizioni

### Stato Attuale
Il campo `livello_razionalita` è attualmente nella collection [Ricorrenze.ts:65-72](../packages/payload-cms/src/collections/Ricorrenze.ts#L65-L72), ma dovrebbe essere nella collection [Definizioni.ts](../packages/payload-cms/src/collections/Definizioni.ts).

### Impatto
- ⚠️ **Database**: Modifica dello schema con migrazione dati
- ⚠️ **Migration Script**: Aggiornamento logica di importazione in [htmlParser.ts:32-37](../scripts/migration/parsers/htmlParser.ts#L32-L37)
- ⚠️ **Admin UI**: Aggiornamento form custom in [DefinizioniStep.tsx](../packages/payload-cms/src/admin/views/LemmaEdit/steps/DefinizioniStep.tsx)
- ⚠️ **Frontend**: Aggiornamento visualizzazione lemmi

### Task di Implementazione
1. Aggiungere campo `livello_razionalita` a [Definizioni.ts](../packages/payload-cms/src/collections/Definizioni.ts)
2. Creare migration Payload per spostare i dati esistenti da Ricorrenze a Definizioni
3. Rimuovere campo `livello_razionalita` da [Ricorrenze.ts:65-72](../packages/payload-cms/src/collections/Ricorrenze.ts#L65-L72)
4. Aggiornare [htmlParser.ts](../scripts/migration/parsers/htmlParser.ts) per associare il livello alle definizioni
5. Aggiornare [DefinizioniStep.tsx](../packages/payload-cms/src/admin/views/LemmaEdit/steps/DefinizioniStep.tsx) nel form custom
6. Aggiornare frontend per leggere livello da Definizioni

### ❓ DOMANDE NECESSARIE
1. **Dati esistenti**: Hai già dati in produzione? Se sì, quanti record ci sono in Ricorrenze con livello_razionalita popolato?
R: No i dati attualmente presenti nel db possono essere cancellati e sostituiiti da una nuova importazione

2. **Logica di migrazione**: Se una definizione ha multiple ricorrenze con livelli diversi, quale livello dovrebbe essere mantenuto? (primo, ultimo, più frequente)

R:Tutti perché i livello di razionalità è associato alla definizione. Se un lema ha due definizioni ci saranno due valori i due campi livello di razionalità 


3. **Retrocompatibilità**: Durante la migrazione, devo mantenere temporaneamente il campo in entrambe le collezioni?

R:no
---

## 📋 MODIFICA 2: Campo Autocompletante per Selezione Fonte

### Stato Attuale
Il campo fonte è un semplice relationship dropdown. Deve diventare un campo autocompletante con ricerca.

### Impatto
- ⚠️ **Admin UI**: Modifica del form custom in [DefinizioniStep.tsx](../packages/payload-cms/src/admin/views/LemmaEdit/steps/DefinizioniStep.tsx)
- ℹ️ **UX**: Miglioramento significativo dell'esperienza utente

### Task di Implementazione
1. Implementare componente React autocompletante per fonti
2. Integrare con API Payload per ricerca fonti (`/api/fonti?where[or][0][titolo][contains]=...`)
3. Sostituire il campo dropdown nel form delle ricorrenze
4. Implementare debounce per ottimizzare le chiamate API

### ❓ DOMANDE NECESSARIE
1. **Campi di ricerca**: Su quali campi della fonte deve cercare l'autocomplete? (titolo, shorthand_id, autore, anno, tutti?)

R: tutti

2. **Formato visualizzazione**: Come devono essere visualizzate le fonti nei risultati? (es. "Stat.fornai.1339 - Statuti dei fornai (1339)")
R: Solo titolo

3. **Soglia minima**: Quanti caratteri deve digitare l'utente prima di avviare la ricerca?

R: 2 caratteri

4. **Numero risultati**: Quanti risultati massimi mostrare nell'autocomplete? (10, 20, 50?)

R: massimo 15

---

## 📋 MODIFICA 3: Creazione Inline di Entità Collegate

### Stato Attuale
Attualmente per creare una nuova fonte bisogna lasciare la pagina del lemma. Si richiede la possibilità di creare inline.

### Impatto
- ⚠️ **Admin UI**: Aggiunta modal/drawer per creazione rapida entità
- ⚠️ **UX**: Workflow significativamente migliorato

### Task di Implementazione
1. Creare componente modal per creazione rapida Fonte
2. Integrare modal nel form delle ricorrenze
3. Implementare logica di salvataggio e refresh del dropdown/autocomplete
4. Gestire validazione e errori inline
5. (Opzionale) Estendere a altre entità collegate (Varianti, Cross-references)

### ❓ DOMANDE NECESSARIE
1. **Entità target**: Quali entità devono supportare la creazione inline? Solo Fonti o anche VariantiGrafiche, RiferimentiIncrociati, altri?

R: Solo per la Fonte

2. **Campi richiesti**: Per la creazione rapida di una Fonte, quali campi sono obbligatori nel modal? Tutti o solo un subset minimo (shorthand_id, titolo, riferimento_completo)?
R: titolo e riferimento completo. shorthand_id è creato in automatico

3. **Modalità UI**: Preferisci un modal popup, un drawer laterale, o un panel espandibile inline?

R: Panel espandibile inline

4. **Post-creazione**: Dopo aver creato l'entità, cosa succede? Si chiude il modal e si seleziona automaticamente, o rimane aperto per crearne altre?

R: rimane aperto per crearne un altro

---

## 📋 MODIFICA 4: Anteprima Backend del Lemma

### Stato Attuale
Non esiste anteprima nel backend. I redattori devono andare nel frontend per vedere il risultato finale.

### Impatto
- ⚠️ **Admin UI**: Nuovo componente di preview
- ⚠️ **Performance**: Caricamento dati aggregati

### Task di Implementazione
1. Creare nuovo step "Anteprima" nel form custom del lemma
2. Implementare componente React che replica il layout frontend
3. Aggregare tutti i dati (lemma, varianti, definizioni, ricorrenze, fonti, cross-references)
4. Implementare stili CSS compatibili con admin UI Payload
5. Aggiungere pulsante "Apri nel frontend" per comparazione

### ❓ DOMANDE NECESSARIE
1. **Posizionamento**: L'anteprima deve essere un nuovo step del form (dopo "Riferimenti Incrociati"), o un tab separato sempre visibile?

R: Dovrebbe essere sempre visibile durante tutti gli steps, meglio sulla destra

2. **Stile**: Deve replicare esattamente il design del frontend o può usare uno stile semplificato "backend-friendly"?

R: No, deve essere uno stil semplificato

3. **Interattività**: L'anteprima deve essere interattiva (link cliccabili, espansioni) o solo statica?
R: Statica

4. **Aggiornamento**: L'anteprima deve aggiornarsi in tempo reale mentre modifichi i campi, o solo quando salvi?

R: Se non è complesso in tempo reale

---

## 📋 MODIFICA 5: Visualizzazione Completa dei Campi Fonte

### Stato Attuale
Lo screenshot mostra che le Fonti hanno campi aggiuntivi non presenti nella collection [Fonti.ts](../packages/payload-cms/src/collections/Fonti.ts):
- Edizione/curatela
- Titolo
- Statuti della Repubblica fiorentina
- Anno composto/abbreviato
- Anno
- Riferimenti completi
- Colonna bibliografica completa
- Note

La collection attuale ha solo: `shorthand_id`, `titolo`, `autore`, `anno`, `riferimento_completo`, `note`

### Impatto
- ⚠️ **Database**: Aggiunta nuovi campi
- ⚠️ **Migration Script**: Parsing di campi aggiuntivi
- ⚠️ **Admin UI**: Espansione form fonti

### Task di Implementazione
1. Analizzare tutti i campi presenti negli screenshot forniti
2. Aggiornare schema [Fonti.ts](../packages/payload-cms/src/collections/Fonti.ts) con i nuovi campi
3. Aggiornare migration script per popolare i nuovi campi
4. Aggiornare UI di visualizzazione fonte (autocomplete, preview)

### ❓ DOMANDE CRITICHE
1. **⚠️ Elenco campi completo**: Puoi fornire l'elenco completo e definitivo di TUTTI i campi che deve avere la collection Fonti? Con nome, tipo (testo/numero/data), obbligatorietà

R: Non lo conosco, devi dedurlo analizzando i file html di origine che usi nell'importazione

2. **Mappatura legacy**: Nei file JSON/HTML legacy ([old_website/bibliografia.json](../old_website/bibliografia.json)), quali sono i nomi dei campi corrispondenti?
3. **Visualizzazione selettore**: Quando si seleziona una fonte nel form ricorrenza, quali campi devono essere visualizzati oltre al titolo? (es. autore, anno, riferimento breve)
4. **Validazione**: Ci sono regole di validazione specifiche per i nuovi campi? (formati, pattern, intervalli)

---

## 📋 MODIFICA 6: Report Dettagliato di Importazione

### Stato Attuale
Lo script di migrazione in [import.ts](../scripts/migration/import.ts) produce solo log console. Non genera un report strutturato.

### Impatto
- ℹ️ **Script**: Enhancement degli script di migrazione
- ℹ️ **Qualità**: Miglior tracciabilità del processo

### Task di Implementazione
1. Creare struttura dati per tracking importazione (successi, errori, warning, contenuti ignorati)
2. Modificare [htmlParser.ts](../scripts/migration/parsers/htmlParser.ts) per tracciare testo ignorato
3. Modificare [import.ts](../scripts/migration/import.ts) per raccogliere statistiche
4. Generare report in formato JSON + HTML/Markdown
5. Salvare report con timestamp nella cartella `scripts/reports/`

### Formato Report Proposto
```json
{
  "timestamp": "2026-01-22T10:30:00Z",
  "summary": {
    "lemmi_processati": 150,
    "lemmi_importati": 145,
    "lemmi_errore": 5,
    "definizioni_create": 320,
    "ricorrenze_create": 1450,
    "fonti_mancanti": ["Fonte.X", "Fonte.Y"]
  },
  "dettagli_per_lemma": [
    {
      "termine": "additio",
      "status": "success",
      "definizioni_importate": 2,
      "ricorrenze_importate": 8,
      "contenuto_ignorato": ["<span class='unknown'>...</span>"]
    }
  ],
  "errori": [...],
  "contenuti_ignorati_globali": [...]
}
```

### ❓ DOMANDE NECESSARIE
1. **Formato preferito**: JSON, Markdown, HTML, o tutti e tre?

R: Markdown

2. **Livello di dettaglio**: Vuoi tracciare ogni singolo lemma o solo statistiche aggregate + errori?

R: entrambe

3. **Contenuto ignorato**: Cosa considerare come "ignorato"? Solo errori di parsing o anche tag HTML non riconosciuti?

R: Mi interessa che riporti le porzioni di testo presenti nell'html che non sono state importate nel db e quindi non disponibili al redattore nel campi del form del backend 

4. **Distribuzione**: Il report deve essere inviato via email, salvato in un percorso specifico, o entrambi?

R: salvato in una dir /report_migration
---

## 📋 MODIFICA 7: Analisi e Miglioramento Campo Pagina/Carta

### Stato Attuale
Il campo `pagina` in [Ricorrenze.ts:58-62](../packages/payload-cms/src/collections/Ricorrenze.ts#L58-L62) è un semplice campo testo. Il parser [htmlParser.ts:53-55](../scripts/migration/parsers/htmlParser.ts#L53-L55) estrae solo pattern base (`colonna|p.|pp.|f.|ff.`).

Il cliente richiede di analizzare **tutti i valori presenti nell'HTML dopo la chiusura delle virgolette** `...»` per catturare formati complessi come:
- `colonna 55, rubrica 51 "Qualiter debent.compare disblari ex..."`
- `colonna 452, rubrica 115 "De persicis redimendis..."`

### Impatto
- ⚠️ **Database**: Possibile ristrutturazione campo pagina (text → structured)
- ⚠️ **Migration Script**: Parser molto più sofisticato
- ⚠️ **Admin UI**: Possibile componente strutturato per input
- ⚠️ **Frontend**: Visualizzazione formattata

### Task di Implementazione
1. **FASE ANALISI**: Scansionare TUTTI i file HTML legacy per estrarre pattern completi del riferimento pagina/carta
2. Documentare tutti i formati trovati (regex, esempi)
3. Decidere struttura dati ottimale (campo singolo vs. campi multipli)
4. Implementare parser avanzato con supporto multi-formato
5. Aggiornare schema se necessario (campo strutturato vs. testo libero)
6. Aggiornare UI per input/visualizzazione

### Possibili Strutture Dati

**Opzione A: Campo Testo Unico (attuale)**
```typescript
pagina: "colonna 55, rubrica 51 \"Qualiter debent...\""
```

**Opzione B: Campo Strutturato**
```typescript
riferimento_fonte: {
  tipo: "colonna" | "pagina" | "foglio",
  numero: "55",
  rubrica_numero: "51",
  rubrica_titolo: "Qualiter debent.compare disblari ex...",
  note: ""
}
```

### ❓ DOMANDE CRITICHE
1. **⚠️ Esempi completi**: Puoi fornire 10-20 esempi reali di riferimenti pagina/carta diversi presi dai file HTML legacy? Questo è fondamentale per capire tutti i pattern

R: L'esempio lo hai già nell'html dei files da importare, vanno analizzati bene e tirato fuori un elenco di valori comprensivo di tutte le casistiche

2. **Struttura preferita**: Preferisci mantenere un campo testo libero o passare a una struttura dati con campi separati (tipo, numero, rubrica, etc.)?

R: Struttura di dati con campi

3. **Rubrica**: Il termine "rubrica" si riferisce a sezioni/capitoli del documento storico? Va sempre catturato come dato separato?

R: Si esatto per entrambe le domande

4. **Quote nel riferimento**: Il testo tra virgolette dopo "rubrica" è il titolo della rubrica? Va sempre preservato?

R: Sempre

5. **Retrocompatibilità**: I dati già importati con il formato vecchio devono essere re-importati o convertiti?

R: re-importati

---

## 🔄 Ordine di Implementazione Consigliato

### FASE 1: Chiarimenti (Ora)
- Raccogliere risposte a tutte le domande sopra
- Analizzare file HTML legacy per Modifica 7
- Definire elenco campi completo per Fonti (Modifica 5)

### FASE 2: Modifiche Database (Settimana 1)
1. Modifica 5: Espansione schema Fonti
2. Modifica 1: Spostamento livello_razionalita + migration dati
3. Modifica 7: Decisione e implementazione nuovo schema pagina/carta

### FASE 3: Miglioramenti Script (Settimana 1-2)
1. Modifica 6: Report di importazione
2. Modifica 7: Parser avanzato riferimenti
3. Aggiornamento migration con nuovi campi Fonti

### FASE 4: Miglioramenti UI (Settimana 2-3)
1. Modifica 2: Autocomplete fonti
2. Modifica 3: Creazione inline entità
3. Modifica 4: Anteprima backend

### FASE 5: Testing e Deployment
1. Test end-to-end di tutte le modifiche
2. Re-importazione dati completa con nuovi script
3. Validazione con cliente
4. Deployment produzione

---

## 📊 Stima Complessità

| Modifica | Complessità | Impatto DB | Rischio | Priorità |
|----------|-------------|------------|---------|----------|
| 1. Livello razionalità | Media | Alto | Alto | **Critica** |
| 2. Autocomplete fonte | Bassa | Nessuno | Basso | Alta |
| 3. Creazione inline | Media | Nessuno | Medio | Alta |
| 4. Anteprima backend | Media | Nessuno | Basso | Media |
| 5. Campi fonte completi | Alta | Alto | Alto | **Critica** |
| 6. Report importazione | Bassa | Nessuno | Basso | Media |
| 7. Analisi pagina/carta | Alta | Medio/Alto | Alto | **Critica** |

---

## ⚠️ Rischi e Considerazioni

1. **Modifiche Database in Produzione**: Le modifiche 1, 5, 7 richiedono migration dati. Serve backup completo e strategia di rollback
2. **Re-importazione**: Alcune modifiche potrebbero richiedere re-importazione completa dei dati legacy
3. **Downtime**: Le migration del database potrebbero richiedere breve finestra di manutenzione
4. **Testing**: Ogni modifica deve essere testata su copia dati produzione prima del deployment

---

## 📝 Prossimi Passi Immediati

1. **TU**: Rispondere alle domande evidenziate in ogni sezione
2. **TU**: Fornire esempi reali di riferimenti pagina/carta (Modifica 7)
3. **TU**: Confermare elenco completo campi Fonti (Modifica 5)
4. **IO**: Preparare environment di staging per test
5. **IO**: Iniziare analisi automatica file HTML per pattern riferimenti
