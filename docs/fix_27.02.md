# Fix e Task - Riunione 27/02/2026

## Bug (Errori di sistema o di dati)

### 1. Definizioni vuote e sfasamento numerico

**Descrizione:** Alcune definizioni appaiono vuote o sballate a causa di un errore di numerazione nel file sorgente.

**Specifiche:** Nel file di origine del lemma "ragione", la definizione 21 è sdoppiata (indicata due volte come "21 calcolo/rapporto"), il che fa saltare l'associazione delle ricorrenze per le definizioni successive.

**Esempi:** Le definizioni 22, 24 e 26 del termine "ragione" risultano vuote nel sistema.

**Analisi tecnica:**
- File sorgente: `old_website/lemmi/ragione.html`, righe 355-382
- La definizione "21. Conto, totale." appare correttamente, poi dopo l'`<hr>` appare di nuovo "21. Calcolo/Rapporto." invece di "22"
- Il parser (`scripts/migration/parsers/htmlParser.ts`) prende il numero dal tag `<strong>N.</strong>` senza validare la sequenza
- Questo sfasamento propaga l'errore a tutte le definizioni successive (22→vuota, 24→vuota, 26→vuota)

**Intervento richiesto:**
1. Correggere manualmente la numerazione nel file `old_website/lemmi/ragione.html` (rinumerare da "21" duplicato in poi)
2. Re-importare il lemma "ragione" (eliminare le definizioni esistenti e reimportare)
3. Alternativa: correzione diretta via admin Payload delle definizioni sfasate

**Priorità:** Alta
**Stima complessità:** Bassa (correzione dati)

---

### 2. Bug salvataggio Livelli di Razionalità nel Backend

**Descrizione:** Modificando il livello di razionalità dal menu a tendina all'interno del form di un lemma, la modifica non viene recepita dal database nonostante il messaggio di successo.

**Specifiche:** Il problema nasce dal fatto che il menu richiama l'oggetto "definizione" che è esterno al form del lemma.

**Esempio:** Tentativo di modifica del livello per il lemma "camarlingato".

**Analisi tecnica:**
- Il campo `livello_razionalita` **viene correttamente inviato** nella richiesta PATCH a `/api/definizioni/{id}` (file `packages/payload-cms/src/admin/views/LemmaEdit/hooks/useSync.ts`, riga 202)
- Il **vero bug** è l'assenza di controllo sulla risposta HTTP in tutte le richieste fetch di `useSync.ts`:
  - Riga 196-204: PATCH definizioni — nessun check su `response.ok`
  - Riga 105-109: PATCH lemma base — stesso problema
  - Righe 139-160: Varianti sync — stesso problema
  - Righe 212-246: Ricorrenze sync — stesso problema
- Se l'API restituisce un errore (400, 409, 500), l'errore viene ignorato silenziosamente
- Il messaggio "Lemma salvato con successo!" appare SEMPRE perché nessuna eccezione viene lanciata (`packages/payload-cms/src/admin/views/LemmaEdit/index.tsx`, riga 56)

**Intervento richiesto:**
1. Aggiungere controllo `response.ok` dopo ogni `fetch` in `useSync.ts`
2. In caso di errore, raccogliere i messaggi e lanciarli come eccezione
3. Aggiornare il feedback utente con messaggi di errore specifici per campo/entità
4. Verificare che il tipo del valore inviato (string vs number) sia accettato da Payload per i relationship fields

**File coinvolti:**
- `packages/payload-cms/src/admin/views/LemmaEdit/hooks/useSync.ts` (file principale da modificare)
- `packages/payload-cms/src/admin/views/LemmaEdit/index.tsx` (feedback utente)

**Priorità:** Alta
**Stima complessità:** Media (refactor error handling in useSync.ts)

---

## Modifiche e Migliorie (Evolutive)

### 4. Sdoppiamento fonte "Statuti della Repubblica Fiorentina"

**Descrizione:** La fonte bibliografica attuale accorpa due manoscritti distinti, creando conflitti con le abbreviazioni "C" (Capitano) e "P" (Podestà) che vengono confuse con "carta" o "pagina".

**Specifiche:** Duplicare la voce bibliografica in due entità separate ("Capitano" e "Podestà") e riassociare correttamente le circa 157 ricorrenze in base ai marcatori "C" e "P".

**Esempio:** Il lemma "Terminatore" utilizza questi riferimenti.

**Analisi tecnica:**
- In `old_website/bibliografia.json` esiste una sola voce: `Firenze.Statuti.1355.volg` ("Statuti della Repubblica fiorentina", 1355)
- Collection Fonti: `packages/payload-cms/src/collections/Fonti.ts` — campo `shorthand_id` è unique
- Le ricorrenze collegano a fonti via relationship field `fonte` in collection `Ricorrenze`

**Domande aperte — CRITICHE per implementazione:**
1. Quali `shorthand_id` usare per le due nuove fonti? (es. `Firenze.Statuti.1355.Capitano` e `Firenze.Statuti.1355.Podesta`?)
2. Quali sono i titoli completi e i riferimenti bibliografici per ciascuna delle due fonti separate?
3. Come distinguere le 157 ricorrenze: il marcatore "C"/"P" è nel campo `pagina_raw` della ricorrenza? Esempio concreto del formato?
4. Le ricorrenze del lemma "Terminatore" possono essere usate come campione di test?
5. Dopo lo sdoppiamento, la fonte originale va eliminata o mantenuta come alias?

**Intervento richiesto:**
1. Creare 2 nuove voci Fonti con shorthand_id distinti
2. Query tutte le ricorrenze collegate alla fonte originale (`GET /api/ricorrenze?where[fonte][equals]=ID`)
3. Per ogni ricorrenza, analizzare `pagina_raw` per determinare se contiene "C" o "P"
4. PATCH ogni ricorrenza per puntare alla nuova fonte corretta
5. Gestire la fonte originale (eliminare o disattivare)

**Priorità:** Media-Alta
**Stima complessità:** Media (richiede analisi manuale delle 157 ricorrenze)

---

### 5. Filtro Voci Bibliografiche vuote

**Descrizione:** Alcune voci nella bibliografia non hanno lemmi associati (spesso duplicati del file JSON).

**Specifiche:** Applicare un filtro nella pagina bibliografia per mostrare solo le voci che hanno almeno un lemma associato, senza però cancellare le altre dal database.

**Esempio:** Doppioni della voce "Pacioli" che risultano vuoti.

**Analisi tecnica:**
- La pagina bibliografia (`packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx`) già calcola `ricorrenzeCount` per ogni fonte
- Le fonti con 0 ricorrenze vengono attualmente mostrate comunque
- Il componente client `BibliografiaSearch.tsx` gestisce filtro testuale e raggruppamento alfabetico
- Il dato `ricorrenzePerFonte: Map<fonteId, count>` è già disponibile lato server

**Intervento richiesto:**
1. Filtrare lato server le fonti con `ricorrenzeCount === 0` prima di passarle al componente client
2. Oppure: aggiungere un toggle nel componente `BibliografiaSearch.tsx` ("Mostra tutte / Solo con ricorrenze") — default: solo con ricorrenze
3. NON eliminare le fonti dal DB

**File coinvolti:**
- `packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx` (filtro server-side)
- `packages/frontend/src/components/bibliografia/BibliografiaSearch.tsx` (eventuale toggle UI)

**Priorità:** Media
**Stima complessità:** Bassa (poche righe di filtro)

---

### 6. Implementazione Download Database SQL

**Descrizione:** Consentire ai collaboratori di scaricare i dati aggiornati per replicare l'ambiente in locale.

**Specifiche:** Creare un link nel backend per scaricare il dump del database in formato .SQL e documentare la procedura di importazione locale tramite Docker.

**Analisi tecnica:**
- Esistono già script di backup: `scripts/deploy/deploy-lemmario.sh` (backup automatico ad ogni deploy) e `scripts/deploy/reset-db-lemmario.sh`
- Il comando usato è: `docker compose exec -T postgres pg_dump -U lemmario_user lemmario_db`
- Il server Express (`packages/payload-cms/src/server.ts`) ha attualmente solo un redirect `/` → `/admin`
- Non esiste endpoint di download né accesso al Docker socket dall'interno del container

**Domande aperte:**
1. Chi deve poter scaricare il dump? Solo super_admin o anche admin di lemmario?
2. È accettabile un endpoint Express custom (`GET /api/admin/export/database`) che esegue `pg_dump` via `child_process`?
3. Alternativa più semplice: generare il dump periodicamente via CI/CD e renderlo scaricabile da un link statico (es. GitHub Release)?
4. Serve documentazione sulla procedura di importazione locale (Docker + `psql < dump.sql`)?

**Intervento richiesto (opzione endpoint):**
1. Creare route Express `GET /api/admin/export/database` in `server.ts`
2. Verificare autenticazione (solo super_admin)
3. Eseguire `pg_dump` via `child_process.spawn` direttamente (il container Payload ha accesso al DB via `DATABASE_URI`)
4. Installare `pg_dump` nel Dockerfile di Payload (aggiungere `postgresql-client`)
5. Streamare il risultato con header `Content-Disposition: attachment; filename=lemmario_backup_YYYYMMDD.sql`
6. Aggiungere link nella dashboard admin di Payload

**File coinvolti:**
- `packages/payload-cms/src/server.ts` (nuovo endpoint)
- `packages/payload-cms/Dockerfile` (aggiungere postgresql-client)
- `packages/payload-cms/src/admin/` (eventuale componente UI per il link)

**Priorità:** Media
**Stima complessità:** Media

---

### 7. Aggiornamento Loghi e Immagine Home Page

**Descrizione:** Miglioramento dell'estetica e dell'identità visiva del sito.

**Specifiche:**
- Aggiungere il logo dell'Università di Firenze nella pagina progetto o nel footer, mantenendo il logo del progetto e di Cagliari come principali. Il logo deve essere visibile solo nella pagina del so lemmaria insieme al campo "logo" che c'è già


**Analisi tecnica:**
- Logo UniCa + DH già presenti in `InstitutionalBar.tsx` (barra superiore sticky)
- Logo Firenze SVG disponibile in `docs/design/Logo_universita_firenze.svg` (215 KB, non ancora committato)
- La home page globale (`packages/frontend/src/app/page.tsx`) mostra il titolo "Glossario" con un `hr` decorativo — attualmente nessuna immagine hero
- Le home page dei singoli lemmari (`packages/frontend/src/app/[lemmario-slug]/page.tsx`) mostrano il logo del lemmario se presente nel CMS
- Il footer (`packages/frontend/src/components/Footer.tsx`) attualmente non mostra loghi

**Domande aperte:**
1. Il logo di Firenze va nel footer (accanto a UniCa e DH) o in una pagina "Progetto" dedicata?
2. L'immagine dell'affresco: è già disponibile in formato digitale? Chi fornisce il file?
3. L'immagine va nella home globale (`/`) o nella home del lemmario specifico (`/matematica`)?
4. Dimensioni/formato preferiti per l'immagine hero? (attualmente nessuno standard)
5. Serve un componente banner/hero dedicato o basta un'immagine nel layout esistente?

**Intervento richiesto:**
1. Committare `docs/design/Logo_universita_firenze.svg` e copiarlo in `packages/frontend/public/logos/`
2. Aggiungere il logo Firenze nel footer o nella pagina progetto (da confermare)
3. Ricevere il file immagine dell'affresco dal cliente
4. Implementare il componente hero/banner nella home page
5. Ottimizzare l'immagine per web (compressione, formati WebP/AVIF, responsive sizes)

**File coinvolti:**
- `packages/frontend/src/components/Footer.tsx` o pagina "Progetto"
- `packages/frontend/src/app/page.tsx` (home globale) o `app/[lemmario-slug]/page.tsx`
- `packages/frontend/public/logos/` (nuovi asset)

**Priorità:** Media-Bassa
**Stima complessità:** Bassa (quando i file immagine sono disponibili)

---

## TASK bassa priorità

### 8. Contenuto ignorato dal Parser (5 Lemmi)

**Descrizione:** Il sistema di migrazione ha ignorato alcune ricorrenze perché non rispettano i pattern previsti (es. citazioni senza fonte o virgolette non chiuse).

**Specifiche:** Poiché si tratta di soli 5 lemmi con problemi, si è deciso di procedere con una correzione manuale invece di creare nuove regole di parsing.

**Esempi:** Il lemma "forma" (latino) ha ricorrenze incomplete o troncate ("super interrogatorio...") e virgolette aperte mai chiuse nel testo originale.

**Analisi tecnica — Dettaglio dei 5 lemmi (da report migrazione 2026-02-25):**

| Lemma | Elementi ignorati | Tipo problema |
|-------|-------------------|---------------|
| **forma** (latino) | 6 ricorrenze | Citazioni troncate: `«` senza `»` di chiusura (fonte: Stat.fornai.1337) |
| **ragione** (volgare) | 8 ricorrenze | Citazioni incomplete da fonti multiple, testo troncato |
| **libro** (volgare) | 1 ricorrenza | Guillemets non chiusi (fonte: Benedetto Cotrugli) |
| **scritta** (volgare) | 1 ricorrenza | Riferimento complesso non parsato: "seconda sezione degli statuti..." |
| **trarre** (volgare) | 1 ricorrenza | Formato "XII, 106." (numero romano + pagina) non riconosciuto |

Totale: 17 elementi ignorati su ~850 ricorrenze importate (98% success rate).

**Report dettagliato:** `report_migration/migration_report_2026-02-25T*.md`

**Intervento richiesto:**
1. Per ogni lemma, aprire il form admin Payload
2. Aggiungere manualmente le ricorrenze mancanti consultando il file HTML sorgente in `old_website/lemmi/`
3. Per le citazioni troncate (forma, ragione, libro): inserire il testo disponibile anche se incompleto, con nota nelle osservazioni
4. Per i riferimenti non parsati (scritta, trarre): inserire la ricorrenza con il riferimento nel campo `pagina_raw`

**Priorità:** Bassa
**Stima complessità:** Bassa (lavoro manuale, ~30 min)
