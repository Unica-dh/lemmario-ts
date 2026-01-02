# Specifiche della struttura dati del lemmario

**Data:** 02/01/2026
**Versione:** 3.0 FINALE
**Precedente versione:** 03/11/2025 (v1.0)

**Obiettivo:** Definire un modello logico dei dati per sviluppare una applicazione e relativo database per il Lemmario basato sull'analisi del sito web https://lemmario.netlify.app/

**Nota:** Questo documento incorpora le modifiche richieste dal report di analisi del 02/01/2026 e **TUTTE** le risposte del cliente alle domande di chiarimento. Documento completo e pronto per la fase di design database fisico.

**Status:** ✅ COMPLETO - Nessuna domanda aperta

---

## 1. Entità Principali

Il modello dati è composto da **10 entità principali** (corrispondenti a 10 tabelle del database):

### Entità Core (Gestione Lemmi)
1. **Lemma** - Il termine principale (es. "ADDITIO", "AGGIUNGERE")
2. **VarianteGrafica** - Le varianti ortografiche alternative del lemma *(NUOVA)*
3. **Definizione** - Una delle possibili definizioni/significati di un lemma
4. **Livello di Razionalità** - La categoria che classifica una definizione (es. "2. Operazioni")
5. **Ricorrenza** - L'esempio di citazione specifica che collega una definizione a una fonte
6. **Fonte** - Il documento sorgente da cui è tratta una ricorrenza
7. **RiferimentoIncrociato** - Collegamenti tra lemmi correlati (CFR, VEDI, SINONIMO, CONTRARIO) *(NUOVA)*

### Entità di Supporto (CMS e Sistema)
8. **ContenutoStatico** - Contenuti delle sezioni statiche (Progetto, Saggi, Legenda, ecc.) *(NUOVA)*
9. **Utente** - Utenti del sistema (amministratori e redattori) *(NUOVA)*
10. **StoricoModifiche** - Tracking completo di tutte le modifiche al database *(NUOVA)*

---

## 2. Struttura e Attributi delle Entità

### 2.1. Entità: Lemma

Rappresenta una singola voce del lemmario presente nella lista di sinistra.

**Attributi:**
- `lemma_id` - Identificatore univoco (Primary Key)
- `termine` - Il termine principale del lemma (es. "ADDITIO")
  - Questo rappresenta la forma canonica/principale
- `lingua` - Tipologia del lemma, dedotta dai filtri "Solo latino" / "Solo volgare"
  - Valori possibili: `'latino'`, `'volgare'`

**Note implementative:**
- Il campo `termine` contiene solo la forma principale
- Le varianti grafiche sono gestite nell'entità separata `VarianteGrafica`
- Indice richiesto su `termine` per ordinamento alfabetico e ricerca
- Indice richiesto su `lingua` per filtraggio

**Relazioni:**
- Un Lemma può avere **molte** Definizioni (1:N)
- Un Lemma può avere **molte** VariantiGrafiche (1:N)
- Un Lemma può essere origine di **molti** RiferimentiIncrociati (1:N)
- Un Lemma può essere destinazione di **molti** RiferimentiIncrociati (1:N)

---

### 2.2. Entità: VarianteGrafica *(NUOVA)*

Rappresenta le varianti ortografiche alternative di un lemma.

**Attributi:**
- `variante_id` - Identificatore univoco (Primary Key)
- `lemma_id` - Riferimento al Lemma di appartenenza (Foreign Key)
- `testo` - Il testo della variante (es. "ADITIO", "ADDITIONE")
- `is_principale` - Flag booleano che indica se è la forma principale
  - `TRUE` per il termine principale (duplicato da `Lemma.termine` per uniformità)
  - `FALSE` per le varianti
- `ordine` - Numero per mantenere l'ordinamento di visualizzazione (1, 2, 3...)

**Esempio:**
Per il lemma "OSSERVAGIONE, OSSERVAZIONE":
```
lemma_id: 123, termine: "OSSERVAZIONE"

Varianti:
- variante_id: 1, lemma_id: 123, testo: "OSSERVAZIONE", is_principale: TRUE, ordine: 1
- variante_id: 2, lemma_id: 123, testo: "OSSERVAGIONE", is_principale: FALSE, ordine: 2
```

**Note implementative:**
- Indice richiesto su `lemma_id` per join efficienti
- Indice full-text su `testo` per ricerca per varianti
- Le varianti devono essere ricercabili con le stesse funzionalità del termine principale

**Relazioni:**
- Ogni VarianteGrafica appartiene a **un** Lemma (N:1)

---

### 2.3. Entità: Definizione

Rappresenta uno dei punti numerati sotto un lemma (es. "1.", "2.", "3.").

**Attributi:**
- `definizione_id` - Identificatore univoco (Primary Key)
- `lemma_id` - Riferimento al Lemma di appartenenza (Foreign Key)
- `testo_definizione` - Testo esplicativo della definizione
  - Include la parte del discorso (es. "s.f. Aggiunta. In relazione alla compravendita di merci...")
  - La parte del discorso (es. "s.f.") rimane **interna** al testo, non è campo separato
- `ordine` - Numero per mantenere l'ordinamento (1, 2, 3...)
- `livello_id` - Riferimento al Livello di Razionalità (Foreign Key, **NULLABLE**)

**Note implementative:**
- `livello_id` è **opzionale** (può essere NULL)
  - Operativamente mantenuto opzionale, ma idealmente ogni definizione dovrebbe averlo
- Indice richiesto su `lemma_id` per join
- Indice full-text su `testo_definizione` per ricerca nel contenuto

**Relazioni:**
- Ogni Definizione appartiene a **un** Lemma (N:1)
- Ogni Definizione può avere **zero o un** Livello di Razionalità (N:0..1) *[MODIFICATO]*
- Ogni Definizione può avere **una o più** Ricorrenze (1:N)

---

### 2.4. Entità: Livello di Razionalità

Rappresenta la classificazione "Livello di razionalità". È una tabella di lookup per evitare ripetizioni.

**Attributi:**
- `livello_id` - Identificatore univoco (Primary Key)
- `codice` - Codice numerico (1, 2, 3, 4, 5, 6)
- `descrizione` - Descrizione testuale

**Valori definiti (6 livelli):**

| codice | descrizione |
|--------|-------------|
| 1 | Concetti astratti |
| 2 | Operazioni |
| 3 | Modi di argomentare |
| 4 | Elementi tecnici |
| 5 | Giudizi di valore |
| 6 | Istituzioni |

**Note implementative:**
- Tabella con esattamente **6 record** predefiniti
- I valori sono fissi e non modificabili dall'utente
- Il campo `codice` può essere utilizzato per ordinamento

**Relazioni:**
- Un Livello può essere associato a **molte** Definizioni (1:N)

---

### 2.5. Entità: Ricorrenza

L'entità più complessa, funge da "ponte". Rappresenta l'istanza specifica di una citazione che giustifica una Definizione.

**Attributi:**
- `ricorrenza_id` - Identificatore univoco (Primary Key)
- `definizione_id` - Riferimento alla Definizione di appartenenza (Foreign Key)
- `fonte_id` - Riferimento alla Fonte da cui è tratta (Foreign Key)
- `citazione` - Testo esatto della citazione (es. "«...Volenti autem emere libras quatuor carnium...»")
- `posizione_citazione` - Riferimento preciso all'interno della fonte
  - Esempi: "colonna 413, rubrica 42", "pp. 55-56", "p. 157v"

**Note implementative:**
- Indice richiesto su `definizione_id` per join
- Indice richiesto su `fonte_id` per join
- Indice full-text opzionale su `citazione` per ricerca nel testo delle citazioni

**Relazioni:**
- Ogni Ricorrenza appartiene a **una** Definizione (N:1)
- Ogni Ricorrenza proviene da **una** Fonte (N:1)

---

### 2.6. Entità: Fonte

Rappresenta il documento sorgente. Queste informazioni compaiono quando si clicca su un link di ricorrenza.

**Attributi:**
- `fonte_id` - Identificatore univoco (Primary Key)
- `shorthand_id` - Identificatore mnemonico breve (VARCHAR, UNIQUE, NULLABLE) *(NUOVO)*
  - Esempi: "Statuto_Mercanzia_Siena", "Tractatus_algorismi", "Cap.Conserv.G83"
  - Utilizzato per:
    - Compatibilità con sistema legacy
    - URL amichevoli (es. `/fonte/Statuto_Mercanzia_Siena`)
    - Riferimenti esterni e citazioni
  - **Opzionale**: non obbligatorio per nuove fonti inserite manualmente
- `titolo` - Titolo del documento
  - Esempi: "Regulae Comperarum Capituli di Genova", "Statuto dei rigattieri di Firenze"
- `datazione` - Riferimento temporale (campo testuale flessibile)
  - Formati ammessi:
    - Secolo: "XIV secolo, prima metà"
    - Intervallo: "1383-1386"
    - Anno singolo: "1324"
  - Convenzione opzionale per redattori: "XIV secolo" → "1301-1400"
- `riferimento_bibliografico` - Citazione completa
  - Esempio: "Historiae Patriae Monumenta, vol. XVIII, Leges Genuenses, Torino, 1901"
- `mostra_in_bibliografia` - Flag booleano (default: TRUE)
  - `TRUE`: la fonte appare nella sezione "Bibliografia"
  - `FALSE`: fonte utilizzata solo per citazioni interne

**Note implementative:**
- Il campo `datazione` è testuale per massima flessibilità
- Non è prevista validazione automatica della convenzione di datazione
- Fonti con stesso titolo ma date diverse sono **record separati**
  - Esempio: "Capitula conservatorum di Genova (XIV secolo)" e "Capitula conservatorum di Genova (1383-1386)" sono due record distinti
- Il campo `shorthand_id` mantiene compatibilità con il sistema legacy dove ogni fonte aveva un ID testuale
- Indice UNIQUE su `shorthand_id` garantisce che non ci siano duplicati

**Relazioni:**
- Una Fonte può essere referenziata da **molte** Ricorrenze (1:N)

---

### 2.7. Entità: RiferimentoIncrociato *(NUOVA)*

Rappresenta i collegamenti tra lemmi correlati (es. "CFR. LAT. ORDO").

**Attributi:**
- `riferimento_id` - Identificatore univoco (Primary Key)
- `lemma_origine_id` - Riferimento al Lemma di partenza (Foreign Key → Lemma)
- `lemma_destinazione_id` - Riferimento al Lemma di arrivo (Foreign Key → Lemma)
- `tipo_riferimento` - Tipologia del riferimento (VARCHAR)
  - Valori possibili: da definire con il cliente (es. "CFR", "VEDI", "VEDI ANCHE")
  - Campo testuale per massima flessibilità
- `note` - Note aggiuntive opzionali (TEXT, nullable)

**Esempi:**
```
Lemma "COMPUTARE" contiene "CFR. LAT. ORDO"
→ riferimento_id: 1
  lemma_origine_id: 45 (COMPUTARE)
  lemma_destinazione_id: 78 (ORDO)
  tipo_riferimento: "CFR"
  note: NULL
```

**Note implementative:**
- Relazione molti-a-molti auto-referenziale su Lemma
- Indici richiesti su `lemma_origine_id` e `lemma_destinazione_id`
- La direzione del riferimento è specifica (da origine a destinazione)
- **Tipi di riferimento definiti:** "CFR", "VEDI", "SINONIMO", "CONTRARIO"
- **Bidirezionalità:** I riferimenti sono bidirezionali
  - Quando si crea un riferimento da A→B, il sistema crea automaticamente B→A
  - Visualizzazione: mostrare il tipo di relazione inversa (es. se A ha "SINONIMO→B", B mostra "SINONIMO←A")
  - L'eliminazione di un riferimento elimina anche l'inverso

**Relazioni:**
- Ogni RiferimentoIncrociato ha un Lemma di **origine** (N:1)
- Ogni RiferimentoIncrociato ha un Lemma di **destinazione** (N:1)
- Un Lemma può essere origine di **molti** RiferimentiIncrociati
- Un Lemma può essere destinazione di **molti** RiferimentiIncrociati

---

### 2.8. Entità: ContenutoStatico *(NUOVA)*

Rappresenta i contenuti delle sezioni statiche del sito (Progetto, Termini chiave, Legenda, Saggi).

**Attributi:**
- `contenuto_id` - Identificatore univoco (Primary Key)
- `sezione` - Tipologia della sezione (ENUM)
  - Valori possibili: `'progetto'`, `'termini_chiave'`, `'legenda'`, `'saggio'`
- `titolo` - Titolo del contenuto (VARCHAR)
- `contenuto` - Corpo del testo (TEXT)
  - Supporto per rich text/markdown da valutare in fase implementativa
- `ordine` - Numero per ordinamento (INT)
  - Utile per ordinare multipli saggi
- `data_creazione` - Timestamp di creazione (TIMESTAMP, auto-generato)
- `data_modifica` - Timestamp ultima modifica (TIMESTAMP, auto-aggiornato)

**Esempi:**
```
Sezione "Progetto":
- contenuto_id: 1, sezione: 'progetto', titolo: "Il Progetto Lemmario Razionale", ordine: 1

Sezione "Saggi" (multipli):
- contenuto_id: 5, sezione: 'saggio', titolo: "L'algebra nel XIV secolo", ordine: 1
- contenuto_id: 6, sezione: 'saggio', titolo: "Termini mercantili genovesi", ordine: 2
```

**Note implementative:**
- Per le sezioni uniche (progetto, legenda) `ordine` sarà sempre 1
- Per i saggi multipli, `ordine` determina la sequenza di visualizzazione
- **Specifiche ricevute:**
  - Editor WYSIWYG semplice per tutti i contenuti statici
  - Sezioni completamente editabili via CMS
  - Non richiesti campi aggiuntivi per saggi (autore, data)
  - "Termini chiave" sono semplice testo descrittivo

**Relazioni:**
- Entità standalone (nessuna relazione con altre entità)

---

### 2.9. Entità: Utente *(NUOVA)*

Rappresenta gli utenti del sistema di gestione dei contenuti.

**Attributi:**
- `utente_id` - Identificatore univoco (Primary Key)
- `email` - Email dell'utente (VARCHAR, UNIQUE, NOT NULL)
  - Utilizzata per login
- `password_hash` - Hash della password (VARCHAR, NOT NULL)
  - Memorizzato con algoritmo bcrypt o simile
- `nome` - Nome dell'utente (VARCHAR, NOT NULL)
- `cognome` - Cognome dell'utente (VARCHAR, NOT NULL)
- `ruolo` - Ruolo dell'utente nel sistema (ENUM, NOT NULL)
  - Valori possibili: `'admin'`, `'redattore'`
  - **admin**: accesso completo a tutte le funzionalità
  - **redattore**: può creare/modificare contenuti ma non gestire utenti
- `attivo` - Flag se l'utente è attivo (BOOLEAN, default TRUE)
  - Permette di disabilitare account senza eliminare i dati
- `data_creazione` - Timestamp di creazione account (TIMESTAMP, auto-generato)
- `ultimo_accesso` - Timestamp ultimo login (TIMESTAMP, nullable)

**Esempi:**
```
Utente amministratore:
- utente_id: 1
  email: "admin@lemmario.it"
  nome: "Mario"
  cognome: "Rossi"
  ruolo: 'admin'
  attivo: TRUE

Utente redattore:
- utente_id: 2
  email: "redattore@lemmario.it"
  nome: "Giulia"
  cognome: "Bianchi"
  ruolo: 'redattore'
  attivo: TRUE
```

**Note implementative:**
- Indice UNIQUE su `email` per garantire univocità
- L'autenticazione avviene tramite email + password
- Non è richiesto un sistema di workflow/approvazione
- Tutti gli utenti autorizzati possono modificare tutti i contenuti
- La password non viene mai memorizzata in chiaro

**Relazioni:**
- `Utente (1) → (N) StoricoModifiche` (utente che ha effettuato la modifica)
- Relazione implicita tramite campi `created_by` e `updated_by` in tutte le tabelle principali

---

### 2.10. Entità: StoricoModifiche *(NUOVA)*

Rappresenta il log completo di tutte le modifiche effettuate ai dati del sistema (audit trail).

**Attributi:**
- `storico_id` - Identificatore univoco (Primary Key)
- `tabella` - Nome della tabella modificata (VARCHAR, NOT NULL)
  - Esempi: "Lemma", "Definizione", "Fonte", etc.
- `record_id` - ID del record modificato (INT, NOT NULL)
  - Riferimento al Primary Key del record nella tabella specificata
- `operazione` - Tipo di operazione effettuata (ENUM, NOT NULL)
  - Valori possibili: `'INSERT'`, `'UPDATE'`, `'DELETE'`
- `dati_precedenti` - Snapshot dei dati prima della modifica (JSONB, nullable)
  - NULL per operazioni INSERT
  - JSON completo del record per UPDATE e DELETE
- `dati_successivi` - Snapshot dei dati dopo la modifica (JSONB, nullable)
  - JSON completo del record per INSERT e UPDATE
  - NULL per operazioni DELETE
- `utente_id` - Utente che ha effettuato la modifica (Foreign Key → Utente, NOT NULL)
- `timestamp` - Data e ora della modifica (TIMESTAMP, auto-generato)
- `note` - Note opzionali sulla modifica (TEXT, nullable)

**Esempi:**
```
Creazione nuovo lemma:
- storico_id: 1
  tabella: "Lemma"
  record_id: 15
  operazione: 'INSERT'
  dati_precedenti: NULL
  dati_successivi: {"lemma_id": 15, "termine": "ADDITIO", "lingua": "latino", ...}
  utente_id: 2
  timestamp: 2025-01-15 10:30:45

Modifica definizione:
- storico_id: 234
  tabella: "Definizione"
  record_id: 78
  operazione: 'UPDATE'
  dati_precedenti: {"definizione_id": 78, "testo_definizione": "Vecchio testo", ...}
  dati_successivi: {"definizione_id": 78, "testo_definizione": "Nuovo testo", ...}
  utente_id: 1
  timestamp: 2025-01-20 14:22:10
```

**Note implementative:**
- Trigger automatici su tutte le tabelle principali per popolare StoricoModifiche
- Utilizzo di JSONB per efficienza e possibilità di query sui campi modificati
- Indici compositi su (`tabella`, `record_id`) e (`utente_id`, `timestamp`)
- Questo sistema fornisce:
  - Audit trail completo di chi ha fatto cosa e quando
  - Possibilità di rollback/ripristino di versioni precedenti
  - Analisi delle modifiche per singolo record o utente
- Retention policy da definire (es. mantenere storico per N anni)

**Relazioni:**
- `StoricoModifiche (N) → (1) Utente`

---

## 3. Riepilogo delle Relazioni

### Relazioni per Entità

**Lemma:**
- `Lemma (1) → (N) Definizione`
- `Lemma (1) → (N) VarianteGrafica`
- `Lemma (N) ↔ (N) Lemma` [via RiferimentoIncrociato]

**VarianteGrafica:**
- `VarianteGrafica (N) → (1) Lemma`

**Definizione:**
- `Definizione (N) → (1) Lemma`
- `Definizione (N) → (0..1) Livello di Razionalità` *[Modificato: reso opzionale]*
- `Definizione (1) → (N) Ricorrenza`

**Livello di Razionalità:**
- `Livello di Razionalità (1) → (N) Definizione`

**Ricorrenza:**
- `Ricorrenza (N) → (1) Definizione`
- `Ricorrenza (N) → (1) Fonte`

**Fonte:**
- `Fonte (1) → (N) Ricorrenza`

**RiferimentoIncrociato:**
- `RiferimentoIncrociato (N) → (1) Lemma` [origine]
- `RiferimentoIncrociato (N) → (1) Lemma` [destinazione]

**ContenutoStatico:**
- Nessuna relazione (entità standalone)

**Utente:**
- `Utente (1) → (N) StoricoModifiche`
- Relazione implicita con tutte le tabelle principali tramite campi `created_by` e `updated_by`

**StoricoModifiche:**
- `StoricoModifiche (N) → (1) Utente`

### Esempi Pratici

**Esempio 1: Lemma "ADDITIO" con varianti, definizioni e citazioni**

```
Lemma:
- lemma_id: 15, termine: "ADDITIO", lingua: "latino"

VarianteGrafica:
- variante_id: 30, lemma_id: 15, testo: "ADDITIO", is_principale: TRUE, ordine: 1
- variante_id: 31, lemma_id: 15, testo: "ADITIO", is_principale: FALSE, ordine: 2

Definizione 1:
- definizione_id: 45, lemma_id: 15, ordine: 1
  testo_definizione: "s.f. Aggiunta. In relazione alla compravendita di merci: aggiunta sul peso."
  livello_id: 2 (→ "2. Operazioni")

  Ricorrenza:
  - ricorrenza_id: 120, definizione_id: 45
    fonte_id: 78 (→ "Capitula conservatorum di Genova (1383-1386)")
    citazione: "«...Volenti autem emere libras quatuor carnium...»"
    posizione_citazione: "colonna 413, rubrica 42"

Definizione 2:
- definizione_id: 46, lemma_id: 15, ordine: 2
  testo_definizione: "s.f. Aggiunta. In relazione alla compilazione degli statuti..."
  livello_id: 2 (→ "2. Operazioni")

  Ricorrenza 1:
  - ricorrenza_id: 121, definizione_id: 46
    fonte_id: 79 (→ "Regulae Comperarum Capituli di Genova (XIV secolo, prima metà)")
    citazione: "«...additio facta millesimo CCC XXVI...»"
    posizione_citazione: "colonna 55, rubrica 51"

  Ricorrenza 2:
  - ricorrenza_id: 122, definizione_id: 46
    fonte_id: 78 (→ "Capitula conservatorum di Genova (1383-1386)")
    citazione: "«...laudaverunt et confirmaverunt omnia...»"
    posizione_citazione: "colonna 452, rubrica 115"
```

**Esempio 2: Riferimento Incrociato**

```
Lemma "COMPUTARE" (lemma_id: 45) contiene "CFR. LAT. ORDO" (lemma_id: 78)

RiferimentoIncrociato:
- riferimento_id: 10
  lemma_origine_id: 45 (COMPUTARE)
  lemma_destinazione_id: 78 (ORDO)
  tipo_riferimento: "CFR"
  note: NULL
```

**Esempio 3: Fonte utilizzata in bibliografia**

```
Fonte:
- fonte_id: 78
  shorthand_id: "Cap.Conserv.G83"
  titolo: "Capitula conservatorum di Genova"
  datazione: "1383-1386"
  riferimento_bibliografico: "Historiae Patriae Monumenta, vol. XVIII, Leges Genuenses, Torino, 1901"
  mostra_in_bibliografia: TRUE

→ Questa fonte apparirà sia nelle citazioni che nella sezione "Bibliografia"
→ Accessibile anche tramite URL: /fonte/Cap.Conserv.G83
```

---

## 4. Diagramma Entità-Relazioni (ER Diagram)

```
┌──────────────────────┐
│       Lemma          │
│  - lemma_id (PK)     │
│  - termine           │
│  - lingua            │
└──────┬───────────────┘
       │
       ├─────────────────────────────────────────┐
       │ 1                                       │ 1
       │                                         │
       │ N                                       │ N
┌──────┴──────────────┐           ┌─────────────┴─────────────┐
│  VarianteGrafica    │           │  RiferimentoIncrociato    │
│ - variante_id (PK)  │           │ - riferimento_id (PK)     │
│ - lemma_id (FK)     │           │ - lemma_origine_id (FK)   │──┐
│ - testo             │           │ - lemma_dest_id (FK)      │  │
│ - is_principale     │           │ - tipo_riferimento        │  │
│ - ordine            │           │ - note                    │  │
└─────────────────────┘           └───────────────────────────┘  │
                                                                  │
                                  ┌───────────────────────────────┘
                                  │ riferisce a
                                  └─→ Lemma (auto-referenza)

       │ 1
       │
       │ N
┌──────┴─────────────────┐
│     Definizione        │
│ - definizione_id (PK)  │
│ - lemma_id (FK)        │
│ - testo_definizione    │
│ - ordine               │
│ - livello_id (FK, NULL)│─────┐
└──────┬─────────────────┘     │ N
       │ 1                     │
       │                       │ 0..1
       │ N               ┌─────┴──────────────────┐
┌──────┴─────────┐       │ Livello di Razionalità │
│  Ricorrenza    │       │ - livello_id (PK)      │
│ - ricorrenza_id│       │ - codice               │
│ - definiz_id   │       │ - descrizione          │
│ - fonte_id (FK)│───┐   └────────────────────────┘
│ - citazione    │   │
│ - posizione    │   │ N
└────────────────┘   │
                     │ 1
              ┌──────┴─────────────────────┐
              │         Fonte              │
              │ - fonte_id (PK)            │
              │ - titolo                   │
              │ - datazione                │
              │ - riferimento_bibliografico│
              │ - mostra_in_bibliografia   │
              └────────────────────────────┘


┌───────────────────────────┐
│    ContenutoStatico       │  (Entità standalone)
│ - contenuto_id (PK)       │
│ - sezione (ENUM)          │
│ - titolo                  │
│ - contenuto               │
│ - ordine                  │
│ - data_creazione          │
│ - data_modifica           │
│ - created_by (FK)         │──┐
│ - updated_by (FK)         │  │
└───────────────────────────┘  │
                               │
┌──────────────────────────┐   │
│        Utente            │◄──┘
│ - utente_id (PK)         │
│ - email (UNIQUE)         │
│ - password_hash          │
│ - nome                   │
│ - cognome                │
│ - ruolo (ENUM)           │
│ - attivo                 │
│ - data_creazione         │
│ - ultimo_accesso         │
└──────┬───────────────────┘
       │ 1
       │
       │ N
┌──────┴───────────────────┐
│   StoricoModifiche       │
│ - storico_id (PK)        │
│ - tabella                │
│ - record_id              │
│ - operazione (ENUM)      │
│ - dati_precedenti (JSONB)│
│ - dati_successivi (JSONB)│
│ - utente_id (FK)         │
│ - timestamp              │
│ - note                   │
└──────────────────────────┘

Note: Tutte le tabelle principali (Lemma, Definizione, Fonte, Ricorrenza,
      VarianteGrafica, RiferimentoIncrociato, ContenutoStatico) hanno
      campi audit: created_by, created_at, updated_by, updated_at (FK → Utente)
```

---

## 5. Indici e Ottimizzazioni

### Indici Richiesti per Performance

**Lemma:**
- PRIMARY KEY su `lemma_id`
- INDEX su `termine` (per ordinamento alfabetico)
- INDEX su `lingua` (per filtraggio latino/volgare)
- FULLTEXT INDEX su `termine` (per ricerca)

**VarianteGrafica:**
- PRIMARY KEY su `variante_id`
- INDEX su `lemma_id` (per join)
- FULLTEXT INDEX su `testo` (per ricerca varianti)
- INDEX su `is_principale` (per filtrare principale)

**Definizione:**
- PRIMARY KEY su `definizione_id`
- INDEX su `lemma_id` (per join)
- INDEX su `livello_id` (per join, nullable)
- FULLTEXT INDEX su `testo_definizione` (opzionale, per ricerca)

**Ricorrenza:**
- PRIMARY KEY su `ricorrenza_id`
- INDEX su `definizione_id` (per join)
- INDEX su `fonte_id` (per join)
- FULLTEXT INDEX su `citazione` (opzionale)

**Fonte:**
- PRIMARY KEY su `fonte_id`
- UNIQUE INDEX su `shorthand_id` (se presente, deve essere univoco)
- INDEX su `mostra_in_bibliografia` (per filtrare bibliografia)

**RiferimentoIncrociato:**
- PRIMARY KEY su `riferimento_id`
- INDEX su `lemma_origine_id` (per navigazione)
- INDEX su `lemma_destinazione_id` (per navigazione inversa)
- INDEX su `tipo_riferimento` (opzionale)

**ContenutoStatico:**
- PRIMARY KEY su `contenuto_id`
- INDEX su `sezione` (per filtraggio per tipo)
- INDEX su `ordine` (per ordinamento)

**Utente:**
- PRIMARY KEY su `utente_id`
- UNIQUE INDEX su `email` (per login e unicità)
- INDEX su `ruolo` (per filtrare per ruolo)
- INDEX su `attivo` (per filtrare utenti attivi)

**StoricoModifiche:**
- PRIMARY KEY su `storico_id`
- INDEX COMPOSITO su (`tabella`, `record_id`) (per storico di un record specifico)
- INDEX COMPOSITO su (`utente_id`, `timestamp`) (per storico di un utente)
- INDEX su `timestamp` (per query temporali)
- INDEX su `operazione` (opzionale, per filtrare tipo operazione)

---

## 6. Vincoli e Regole di Integrità

### Vincoli di Integrità Referenziale

1. **Definizione.lemma_id** → FOREIGN KEY su Lemma.lemma_id
   - ON DELETE CASCADE (eliminando un lemma si eliminano le sue definizioni)

2. **Definizione.livello_id** → FOREIGN KEY su Livello di Razionalità.livello_id
   - ON DELETE SET NULL (eliminando un livello, le definizioni rimangono con livello NULL)
   - **NULLABLE** (può essere NULL)

3. **Ricorrenza.definizione_id** → FOREIGN KEY su Definizione.definizione_id
   - ON DELETE CASCADE (eliminando una definizione si eliminano le sue ricorrenze)

4. **Ricorrenza.fonte_id** → FOREIGN KEY su Fonte.fonte_id
   - ON DELETE RESTRICT (non si può eliminare una fonte referenziata)

5. **VarianteGrafica.lemma_id** → FOREIGN KEY su Lemma.lemma_id
   - ON DELETE CASCADE (eliminando un lemma si eliminano le sue varianti)

6. **RiferimentoIncrociato.lemma_origine_id** → FOREIGN KEY su Lemma.lemma_id
   - ON DELETE CASCADE

7. **RiferimentoIncrociato.lemma_destinazione_id** → FOREIGN KEY su Lemma.lemma_id
   - ON DELETE CASCADE

8. **StoricoModifiche.utente_id** → FOREIGN KEY su Utente.utente_id
   - ON DELETE RESTRICT (non si può eliminare un utente con modifiche registrate)

9. **Campi audit su tutte le tabelle principali** (Lemma, Definizione, Fonte, Ricorrenza, VarianteGrafica, RiferimentoIncrociato, ContenutoStatico):
   - `created_by` → FOREIGN KEY su Utente.utente_id (NULLABLE)
   - `updated_by` → FOREIGN KEY su Utente.utente_id (NULLABLE)
   - ON DELETE SET NULL (se un utente viene eliminato, i riferimenti diventano NULL)

### Vincoli di Business Logic

1. **Lemma.lingua** → CHECK (lingua IN ('latino', 'volgare'))

2. **VarianteGrafica:** Per ogni lemma_id, **deve esistere esattamente UNA** variante con `is_principale = TRUE`
   - Da implementare tramite UNIQUE INDEX parziale o trigger

3. **Definizione.ordine** → Per ogni lemma_id, i valori di ordine devono essere sequenziali e univoci (1, 2, 3...)
   - UNIQUE (lemma_id, ordine)

4. **Ricorrenza:** Una Ricorrenza non può collegare la stessa Definizione alla stessa Fonte con la stessa citazione
   - UNIQUE (definizione_id, fonte_id, citazione) - opzionale, da valutare

5. **ContenutoStatico.sezione** → CHECK (sezione IN ('progetto', 'termini_chiave', 'legenda', 'saggio'))

6. **RiferimentoIncrociato:** Un lemma non può avere riferimento a se stesso
   - CHECK (lemma_origine_id != lemma_destinazione_id)

7. **Utente.ruolo** → CHECK (ruolo IN ('admin', 'redattore'))

8. **Utente.email** → Deve essere formato email valido (validazione a livello applicativo)

9. **StoricoModifiche.operazione** → CHECK (operazione IN ('INSERT', 'UPDATE', 'DELETE'))

---

## 7. Modifiche Rispetto alla Versione 1.0

### Modifiche Critiche

1. **Aggiunta entità VarianteGrafica** (NUOVA)
   - Gestisce varianti ortografiche multiple per lemma
   - Risponde alla richiesta del cliente di campi separati per termine principale e varianti

2. **Aggiunta entità RiferimentoIncrociato** (NUOVA)
   - Gestisce riferimenti tra lemmi (es. CFR. LAT. ORDO)
   - Risponde alla conferma del cliente di relazioni uno-a-molti tra lemmi

3. **Modificata relazione Definizione-Livello di Razionalità**
   - Reso `Definizione.livello_id` **NULLABLE** (prima era obbligatorio)
   - Risponde alla richiesta del cliente di rendere il livello opzionale

### Modifiche Importanti

4. **Aggiunta entità ContenutoStatico** (NUOVA)
   - Gestisce contenuti delle sezioni: Progetto, Termini chiave, Legenda, Saggi
   - Permette editabilità dinamica di contenuti precedentemente statici

5. **Aggiunta entità Utente** (NUOVA)
   - Gestisce autenticazione e autorizzazione
   - Due ruoli: admin e redattore
   - Sistema multi-utente senza workflow di approvazione

6. **Aggiunta entità StoricoModifiche** (NUOVA)
   - Audit trail completo di tutte le modifiche
   - Snapshot JSONB di dati precedenti e successivi
   - Tracciamento completo: chi, cosa, quando

7. **Aggiunta campi audit a tutte le tabelle principali**
   - `created_by`, `created_at`, `updated_by`, `updated_at`
   - Tracciamento completo della cronologia di creazione/modifica

8. **Potenziata entità Fonte**
   - Aggiunto campo `mostra_in_bibliografia` (BOOLEAN)
   - Aggiunto campo `shorthand_id` (VARCHAR, UNIQUE, NULLABLE)
   - Permette compatibilità con sistema legacy e URL amichevoli

### Chiarimenti Incorporati

9. **Parte del discorso**
   - Confermato: rimane **interna** al testo della definizione (non campo separato)

10. **Datazione fonti**
   - Confermato: campo testuale flessibile
   - Convenzione opzionale per redattori (non imposta dal sistema)

11. **Fonti multiple**
   - Confermato: stesso documento con date diverse = record separati

---

## 8. Punti Aperti e Domande Residue

### 8.1. Risposte Ricevute e Specifiche Definitive

Tutte le domande aperte sono state risolte dal cliente. Di seguito le specifiche definitive:

#### A. Varianti Grafiche ✅ RISOLTO
**Specifiche:**
1. **Numero massimo:** Non c'è un limite rigido, ma mai oltre **30 varianti** per lemma
2. **Visualizzazione:** Le varianti devono apparire **subito sotto il lemma** (non inline)
3. **Ricercabilità:** Le varianti devono essere **ricercabili con la stessa priorità** del termine principale

**Impatto implementativo:**
- Tabella `VarianteGrafica` con massimo teorico di 30 record per lemma
- UI: Mostrare varianti in sezione dedicata sotto il titolo del lemma
- Full-text index su `VarianteGrafica.testo` con stessa priorità di `Lemma.termine`

---

#### B. Datazione Fonti - Ricerca per Periodo ✅ RISOLTO
**Specifiche:**
1. **Ricerca per periodo:** **SÌ**, il sistema deve permettere ricerche per periodo
2. **Implementazione:** Utilizzare **pattern matching testuale** (non parsing strutturato)

**Impatto implementativo:**
- Non serve campo aggiuntivo `secolo_numerico`
- Implementare ricerca full-text con pattern matching su campo `Fonte.datazione`
- Query esempio: `WHERE datazione LIKE '%XIV secolo%'` o `WHERE datazione ~ '1[34][0-9]{2}'`

---

#### C. Riferimenti Incrociati ✅ RISOLTO
**Specifiche:**
1. **Tipi di riferimenti:** 4 tipi definiti
   - `"CFR"` - Confronta
   - `"VEDI"` - Vedi
   - `"SINONIMO"` - Termine sinonimo
   - `"CONTRARIO"` - Termine contrario
2. **Direzione:** I riferimenti sono **BIDIREZIONALI**
3. **Visualizzazione inversa:** **SÌ**, serve visualizzare i riferimenti inversi

**Impatto implementativo:**
- Campo `RiferimentoIncrociato.tipo_riferimento` → ENUM('CFR', 'VEDI', 'SINONIMO', 'CONTRARIO')
- Quando si crea un riferimento A→B, il sistema deve automaticamente creare B→A
- Query per riferimenti inversi: `SELECT * FROM RiferimentoIncrociato WHERE lemma_destinazione_id = ?`
- UI: Mostrare sezione "Collegamenti" con tab per riferimenti diretti e inversi

---

#### D. Ambito Bibliografia ✅ RISOLTO
**Specifica:** La sezione Bibliografia deve contenere **tutte le opere rilevanti per il progetto, anche se non citate direttamente** (Opzione B)

**Impatto implementativo:**
- Il campo `Fonte.mostra_in_bibliografia` può essere TRUE anche per fonti non ancora citate
- Serve interfaccia admin per aggiungere fonti alla bibliografia indipendentemente dalle citazioni
- Query bibliografia: `SELECT * FROM Fonte WHERE mostra_in_bibliografia = TRUE ORDER BY titolo`

---

#### E. Contenuto Sezioni Statiche ✅ RISOLTO
**Specifiche:** Le sezioni (Progetto, Termini chiave, Legenda, Saggi) sono **semplici pagine descrittive** con:
- **Titolo**
- **Body** editabile con editor WYSIWYG
- Nessun campo aggiuntivo (autore, data, abstract)
- Nessun collegamento strutturato a lemmi

**Impatto implementativo:**
- La struttura `ContenutoStatico` attuale è adeguata
- Campo `contenuto` deve supportare HTML rich text da editor WYSIWYG
- Non servono campi aggiuntivi
- Interfaccia admin con editor WYSIWYG (es. TinyMCE, CKEditor, Quill)

---

#### F. Funzionalità di Ricerca ✅ RISOLTO
**Funzionalità prioritarie per la prima release:**
1. ✅ Ricerca per termine (nome del lemma)
2. ✅ Ricerca all'interno delle definizioni
3. ✅ Ricerca nelle citazioni
4. ✅ Ricerca per fonte bibliografica
5. ✅ Autocomplete durante la digitazione

**NON prioritarie (escluse da prima release):**
- ❌ Ricerca per varianti grafiche (da implementare successivamente)

**Modalità:** Ricerca **case-insensitive**

**Impatto implementativo:**
- Full-text index REQUIRED su:
  - `Lemma.termine` (case-insensitive)
  - `Definizione.testo_definizione` (case-insensitive)
  - `Ricorrenza.citazione` (case-insensitive)
  - `Fonte.titolo` e `Fonte.riferimento_bibliografico` (case-insensitive)
- Implementare autocomplete con debouncing
- PostgreSQL: utilizzare `ILIKE` o `to_tsvector` con configurazione italiana

---

#### G. Gestione Contenuti e Workflow ✅ RISOLTO
**Specifiche:**
1. **Utenti:** **Team di redattori** (multipli utenti)
2. **Workflow editoriale:** **NO** - Pubblicazione diretta (no bozza/revisione)
3. **Storicizzazione:** **SÌ** - Tracking completo delle modifiche

**Impatto implementativo:**

**Nuova tabella richiesta: `Utente`**
```sql
Utente:
- utente_id (PK)
- email (UNIQUE)
- password_hash
- nome
- cognome
- ruolo (ENUM: 'admin', 'redattore')
- attivo (BOOLEAN)
- data_creazione
- ultimo_accesso
```

**Nuova tabella richiesta: `StoricoModifiche`**
```sql
StoricoModifiche:
- storico_id (PK)
- tabella (VARCHAR) - nome tabella modificata
- record_id (INT) - ID del record modificato
- operazione (ENUM: 'INSERT', 'UPDATE', 'DELETE')
- dati_precedenti (JSONB) - snapshot prima della modifica
- dati_successivi (JSONB) - snapshot dopo la modifica
- utente_id (FK → Utente)
- timestamp
```

**Campi da aggiungere a tutte le tabelle principali:**
- `created_by` (FK → Utente, nullable)
- `created_at` (TIMESTAMP)
- `updated_by` (FK → Utente, nullable)
- `updated_at` (TIMESTAMP)

**Tabelle interessate:**
- Lemma
- VarianteGrafica
- Definizione
- Ricorrenza
- Fonte
- RiferimentoIncrociato
- ContenutoStatico

**Note:**
- Implementare trigger database per popolare automaticamente `StoricoModifiche`
- Non serve campo `stato_pubblicazione` (pubblicazione diretta)
- Sistema di autenticazione JWT o session-based

---

#### H. Funzionalità Utente - Prima Release ✅ RISOLTO
**Funzionalità richiesta:**
- ✅ **Sistema di autenticazione utenti** (SOLO questa)

**NON richieste per prima release:**
- ❌ Segnalibri (lemmi preferiti)
- ❌ Annotazioni personali
- ❌ Cronologia consultazioni
- ❌ Condivisione link diretti a lemmi
- ❌ Export PDF

**Impatto implementativo:**
- Tabella `Utente` (vedi sezione G)
- Sistema di autenticazione (login/logout)
- Protezione route admin/editing
- NON servono tabelle: Segnalibro, Annotazione, Cronologia

---

## 9. Mapping con Dati Legacy

### Dati Esistenti da Migrare

**Fonte:** Cartella `/old_website`

1. **File: indice.json**
   - Contiene lista di 239 lemmi con metadati
   - Struttura: `{ "nome": "...", "tipo": "latino|volgare", "file": "..." }`
   - **Mapping:** → Tabella `Lemma` + `VarianteGrafica`

2. **File: bibliografia.json**
   - Contiene riferimenti bibliografici con shorthand ID
   - Struttura: `{ "id": { "title": "...", "date": "...", "reference": "..." } }`
   - **Mapping:** → Tabella `Fonte`
     - Chiave JSON → `Fonte.shorthand_id`
     - `title` → `Fonte.titolo`
     - `date` → `Fonte.datazione`
     - `reference` → `Fonte.riferimento_bibliografico`

3. **Directory: lemmi/**
   - 239 file HTML con struttura:
     - Titolo lemma
     - Definizioni numerate
     - Ricorrenze con citazioni
     - Livello di razionalità
     - Eventuali riferimenti CFR
     - Collegamenti bibliografici via `data-biblio="shorthand_id"`
   - **Mapping:** → Tabelle `Lemma`, `Definizione`, `Ricorrenza`, `RiferimentoIncrociato`
     - Attributo HTML `data-biblio` → `Fonte.shorthand_id` → `Ricorrenza.fonte_id`

### Script di Migrazione Necessari

1. **Parser HTML** per estrarre dati strutturati da file lemmi/*.html
   - Estrarre attributo `data-biblio` dai link bibliografici
   - Risolvere shorthand ID a `fonte_id` tramite lookup su `bibliografia.json`
2. **Importer JSON** per bibliografia.json e indice.json
   - Creare mapping `shorthand_id` → `fonte_id`
   - Popolare campo `Fonte.shorthand_id` con chiavi JSON
3. **Validator** per verificare integrità referenziale
   - Verificare che tutti gli shorthand ID in HTML esistano in bibliografia.json
   - Verificare unicità di `shorthand_id`
4. **Mapper** per collegamenti shorthand bibliografia → fonte_id
   - Creare dizionario di lookup durante l'import
   - Utilizzarlo per popolare `Ricorrenza.fonte_id`

---

## 10. Considerazioni Tecniche Implementative

### Database Consigliato

**PostgreSQL** (versione 14+)

**Motivazioni:**
- Supporto eccellente per FULLTEXT search (anche multilingua)
- JSON fields disponibili per estensioni future
- Robustezza per dati strutturati complessi
- Performance eccellenti con indici appropriati

### Alternative

- **MySQL** (8.0+): Valida alternativa, supporto full-text buono
- **SQLite**: Solo per sviluppo/testing, non per produzione

### Stima Dimensioni Database

**Assunzioni:**
- 239 lemmi attuali
- Media 2 definizioni per lemma
- Media 2 ricorrenze per definizione
- Crescita futura: 500-1000 lemmi

**Stima storage:**
- Lemmi: ~500 record × 1KB = 500KB
- Definizioni: ~1000 record × 2KB = 2MB
- Ricorrenze: ~2000 record × 1.5KB = 3MB
- Fonti: ~200 record × 1KB = 200KB
- Varianti: ~300 record × 0.5KB = 150KB
- **Totale stimato:** ~10-20MB (molto contenuto)

### Performance

Con struttura così piccola, performance non sarà problema. Indici appropriati garantiranno tempi di risposta <100ms anche con query complesse.

---

## 11. Prossimi Passi

### Fase 1: Finalizzazione Requisiti (CORRENTE)
- ✅ Analisi gap completata
- ✅ Struttura dati aggiornata con entità mancanti
- ✅ Livelli di razionalità definiti (6 livelli completi)
- ⏳ **In attesa risposte domande residue (sezione 8: 8 punti aperti)**

### Fase 2: Design Database Fisico
- Creare DDL SQL completo (CREATE TABLE)
- Definire tutti i vincoli e trigger
- Pianificare script di migrazione

### Fase 3: Sviluppo
- Setup PostgreSQL database
- Implementazione API backend (Node.js/TypeScript)
- Sviluppo interfaccia frontend (React/Next.js)
- Migrazione dati legacy

### Fase 4: Testing e Deploy
- Testing funzionale
- Performance testing
- Deploy su ambiente produzione

---

## 12. Conclusioni

Questo documento rappresenta la **versione 3.0 FINALE** dei requisiti della struttura dati per il Lemmario, completamente aggiornata sulla base dell'analisi comparativa con l'applicazione esistente e di **TUTTE** le risposte del cliente.

**Modifiche principali rispetto alla v1.0:**
- ✅ Aggiunta gestione varianti grafiche (richiesta cliente)
- ✅ Aggiunta sistema riferimenti incrociati bidirezionali (richiesta cliente)
- ✅ Reso opzionale il livello di razionalità (richiesta cliente)
- ✅ Definiti tutti i 6 livelli di razionalità (fornito dal cliente)
- ✅ Aggiunta gestione contenuti statici con editor WYSIWYG (gap identificato)
- ✅ Potenziata gestione bibliografia (gap identificato)
- ✅ Aggiunto campo `shorthand_id` a Fonte (compatibilità legacy + URL amichevoli)
- ✅ Aggiunto sistema di autenticazione e gestione utenti (2 ruoli: admin/redattore)
- ✅ Implementato audit trail completo con StoricoModifiche (JSONB snapshots)
- ✅ Aggiunti campi audit (created_by, updated_by, created_at, updated_at) a tutte le tabelle
- ✅ Definite tutte le funzionalità di ricerca (5 feature specifiche, case-insensitive)
- ✅ Specificate regole di visualizzazione varianti grafiche (sotto lemma, max 30, ricercabili)
- ✅ Definita gestione date per ricerca (text matching su campo testuale)

**Entità finali (10 totali):**

*Entità Core (7):*
1. Lemma
2. VarianteGrafica
3. Definizione
4. Livello di Razionalità (6 livelli definiti)
5. Ricorrenza
6. Fonte
7. RiferimentoIncrociato (4 tipi: CFR, VEDI, SINONIMO, CONTRARIO)

*Entità di Supporto (3):*
8. ContenutoStatico (progetto, termini_chiave, legenda, saggio)
9. Utente (admin, redattore)
10. StoricoModifiche (audit trail completo)

**Stato corrente:**
- **Struttura dati:** ✅ COMPLETA E DEFINITIVA
- **Gap critici:** ✅ Tutti risolti
- **Livelli di razionalità:** ✅ Definiti (6 livelli)
- **Domande residue:** ✅ **NESSUNA** - Tutte le 8 domande risolte con risposte del cliente
- **Funzionalità di ricerca:** ✅ Completamente specificate
- **Sistema multi-utente:** ✅ Definito (autenticazione + autorizzazione)
- **Audit trail:** ✅ Implementato (versioning completo)

**Pronto per:**
- ✅ **Fase di Design Database Fisico** (SQL schema design)
- ✅ **Fase di Implementazione Backend** (API design)
- ✅ **Fase di Migrazione Dati** (da HTML/JSON a PostgreSQL)

---

**Versione documento:** 3.0 FINALE
**Data:** 02/01/2026
**Redattore:** Claude Code
**Status:** Completo - Tutte le domande risolte
**File correlati:**
- [Report_Analisi_Requisiti_Struttura_Dati.md](Report_Analisi_Requisiti_Struttura_Dati.md)
- [Risposte - Requisiti struttura dati.md](Risposte - Requisiti struttura dati.md)
- [Analisi_Lemmario_Razionale.md](Analisi_Lemmario_Razionale.md)
- Lemmario - Requisiti struttura dati.md (v1.0 - sostituita da questo documento)
