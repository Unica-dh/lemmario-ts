# Fix e Task - Riunione 27/02/2026

## Tracking implementazione

Man mano che ogni task viene completato, documentare l'intervento effettivo in [`docs/REPORT_FIX_27.02.md`](REPORT_FIX_27.02.md) con:

- Numero e titolo del task
- Data di completamento
- File modificati (con link)
- Descrizione sintetica dell'intervento
- Eventuali note o scostamenti rispetto al piano originale
- Esito dei test / verifiche effettuate

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

**Verifica completamento:**

```bash
# 1. Verificare che le definizioni 22, 24, 26 di "ragione" NON siano vuote
API_URL="http://localhost:3000/api"  # o https://glossari.dh.unica.it/api

# Recupera il lemma "ragione" (volgare)
LEMMA_ID=$(curl -s "$API_URL/lemmi?where[termine][equals]=ragione&where[tipo][equals]=volgare" | jq '.docs[0].id')

# Recupera TUTTE le definizioni del lemma
curl -s "$API_URL/definizioni?where[lemma][equals]=$LEMMA_ID&sort=numero&limit=50" | \
  jq '.docs[] | {numero, testo: (.testo[0:80] // "VUOTA!")}'

# ATTESO: tutte le definizioni dalla 21 in poi devono avere testo non vuoto
# FALLITO SE: definizioni 22, 24 o 26 mostrano "VUOTA!"
```

```bash
# 2. Verificare la sequenza numerica (nessun duplicato)
curl -s "$API_URL/definizioni?where[lemma][equals]=$LEMMA_ID&sort=numero&limit=50" | \
  jq '[.docs[].numero] | if (. | unique | length) == (. | length) then "OK: nessun duplicato" else "ERRORE: numeri duplicati trovati" end'
```

```bash
# 3. Verificare che le ricorrenze delle definizioni 22+ siano associate correttamente
for DEF_NUM in 22 24 26; do
  DEF_ID=$(curl -s "$API_URL/definizioni?where[lemma][equals]=$LEMMA_ID&where[numero][equals]=$DEF_NUM" | jq '.docs[0].id')
  COUNT=$(curl -s "$API_URL/ricorrenze?where[definizione][equals]=$DEF_ID" | jq '.totalDocs')
  echo "Definizione $DEF_NUM (id=$DEF_ID): $COUNT ricorrenze"
done
# ATTESO: ogni definizione deve avere ≥1 ricorrenza (verificare con file HTML sorgente)
```

---

### 2. Bug salvataggio Livelli di Razionalità nel Backend

**Descrizione:** Modificando il livello di razionalità dal menu a tendina all'interno del form di un lemma nel backend, la modifica non viene recepita dal database nonostante il messaggio di successo.

**Specifiche:** Il problema nasce dal fatto che il menu richiama l'oggetto "definizione" che è esterno al form del lemma, ovvero è una entità referenziata esterna al lemma.

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

**Verifica completamento:**

```bash
# 1. Verifica statica: ogni fetch in useSync.ts deve avere un check response.ok
FILE="packages/payload-cms/src/admin/views/LemmaEdit/hooks/useSync.ts"

# Conta i fetch e i response.ok — devono corrispondere
FETCH_COUNT=$(grep -c 'await fetch(' "$FILE")
CHECK_COUNT=$(grep -c 'response\.ok\|res\.ok\|\.ok ===' "$FILE")
echo "Fetch calls: $FETCH_COUNT | Response checks: $CHECK_COUNT"
# ATTESO: CHECK_COUNT >= FETCH_COUNT
```

```bash
# 2. Verifica che non esista più il pattern "fetch senza check"
# Cerca blocchi fetch seguiti da uso diretto senza controllo errore
grep -n -A3 'await fetch(' "$FILE" | grep -v 'ok\|throw\|error\|Error'
# ATTESO: nessun risultato (ogni fetch è seguito da gestione errore)
```

```bash
# 3. Verifica che index.tsx gestisca errori nel catch
grep -A5 'catch' "packages/payload-cms/src/admin/views/LemmaEdit/index.tsx"
# ATTESO: il catch mostra un messaggio di errore specifico, NON solo "Errore generico"
```

**Test manuale (Admin UI):**

1. Aprire <http://localhost:3000/admin> → Lemmi → "camarlingato"
2. Nella sezione Definizioni, cambiare il `livello_razionalita` da menu a tendina
3. Salvare il lemma
4. **Ricaricare la pagina** (F5)
5. ATTESO: il livello di razionalità è quello appena selezionato
6. FALLITO SE: il livello è tornato al valore precedente

**Test errore (simulazione):**

1. Aprire DevTools → Network
2. Modificare un campo e salvare
3. ATTESO: se una PATCH fallisce (es. 409), l'utente vede un messaggio di errore rosso specifico (NON "Lemma salvato con successo!")

---

## Modifiche e Migliorie (Evolutive)

### 4. Sdoppiamento fonte "Statuti della Repubblica Fiorentina"

**Descrizione:** La fonte bibliografica attuale accorpa due manoscritti distinti, creando conflitti con le abbreviazioni "C" (Capitano) e "P" (Podestà) che vengono confuse con "carta" o "pagina".

**Specifiche:** Duplicare la voce bibliografica in due entità separate ("Capitano" e "Podestà") e riassociare correttamente le ricorrenze in base ai marcatori "c." e "p.".

**Esempio:** Il lemma "Terminatore" utilizza questi riferimenti.

**Analisi tecnica:**
- Fonte originale in DB: `shorthand_id = "Firenze.Statuti.1355.volg"`
- Nei file HTML sorgente, le citazioni usano `c.` (Capitano) e `p.` (Podestà) come prefisso del riferimento:
  - `c. 42v.`, `c. 54r.`, `c. 150r.` → Statuto del Capitano del Popolo (**43 citazioni**)
  - `p. 15v.`, `p. 77v.`, `p. 104r.` → Statuto del Podestà (**101 citazioni**)
  - 1 citazione anomala senza trattino in `ragionare.html` (`» c. 146r.`)
- Totale ricorrenze: ~144 (distribuite su 44 lemmi diversi)

**Decisioni prese:**

| Aspetto | Decisione |
| --- | --- |
| **shorthand_id** | `Firenze.Statuti.1355.volg.C` (Capitano) e `Firenze.Statuti.1355.volg.P` (Podestà) |
| **Titoli** | Generati automaticamente: "Statuti della Repubblica fiorentina - Statuto del Capitano del Popolo (1355)" e "...del Podestà (1355)" |
| **Riferimento bibliografico** | Stesso testo per entrambi (dall'originale) |
| **Fonte originale** | Eliminare dopo riassegnazione completa |
| **Metodo** | Script automatico TypeScript |

**Intervento richiesto:**

1. Creare script in `scripts/migration/` che:
   - Crea le 2 nuove fonti via API con i `shorthand_id` sopra
   - Query tutte le ricorrenze collegate alla fonte originale
   - Analizza il campo `pagina_raw` di ogni ricorrenza per il prefisso `c.` o `p.`
   - PATCH ogni ricorrenza per puntare alla fonte corretta (`.C` o `.P`)
   - Gestisce il caso anomalo (ragionare.html: `» c. 146r.` senza trattino)
   - Report finale con conteggio riassegnazioni e eventuali ricorrenze non classificabili
2. Eliminare la fonte originale `Firenze.Statuti.1355.volg`
3. Aggiornare `old_website/bibliografia.json` con le due nuove voci

**Priorità:** Media-Alta
**Stima complessità:** Media (script automatico ~100 righe)

**Verifica completamento:**

```bash
API_URL="http://localhost:3000/api"  # o https://glossari.dh.unica.it/api

# 1. Verificare che le 2 nuove fonti esistano
curl -s "$API_URL/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg.C" | \
  jq '{found: (.totalDocs > 0), titolo: .docs[0].titolo}'
# ATTESO: found=true, titolo contiene "Capitano del Popolo"

curl -s "$API_URL/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg.P" | \
  jq '{found: (.totalDocs > 0), titolo: .docs[0].titolo}'
# ATTESO: found=true, titolo contiene "Podestà"
```

```bash
# 2. Verificare che la fonte originale sia stata eliminata
curl -s "$API_URL/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg&limit=5" | \
  jq '.totalDocs'
# ATTESO: 0 (fonte originale rimossa)
# NOTA: le fonti .C e .P NON devono matchare (equals, non contains)
```

```bash
# 3. Contare le ricorrenze riassegnate per ciascuna nuova fonte
FONTE_C=$(curl -s "$API_URL/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg.C" | jq '.docs[0].id')
FONTE_P=$(curl -s "$API_URL/fonti?where[shorthand_id][equals]=Firenze.Statuti.1355.volg.P" | jq '.docs[0].id')

RIC_C=$(curl -s "$API_URL/ricorrenze?where[fonte][equals]=$FONTE_C&limit=0" | jq '.totalDocs')
RIC_P=$(curl -s "$API_URL/ricorrenze?where[fonte][equals]=$FONTE_P&limit=0" | jq '.totalDocs')

echo "Capitano: $RIC_C ricorrenze (attese ~43)"
echo "Podestà: $RIC_P ricorrenze (attese ~101)"
echo "Totale: $(($RIC_C + $RIC_P)) (atteso ~144)"
# ATTESO: totale ≈144, nessuna ricorrenza rimasta orfana
```

```bash
# 4. Verificare che nessuna ricorrenza punti ancora alla fonte originale
# (se la fonte è stata eliminata, questo conferma che non ci sono orfani)
curl -s "$API_URL/ricorrenze?where[fonte][equals]=null&limit=5" | jq '.totalDocs'
# ATTESO: 0 ricorrenze orfane
```

```bash
# 5. Verificare il caso anomalo (ragionare.html: "» c. 146r.")
LEMMA_RAG=$(curl -s "$API_URL/lemmi?where[termine][equals]=ragionare" | jq '.docs[0].id')
# Verificare che le ricorrenze di "ragionare" con fonte Statuti siano assegnate a .C
curl -s "$API_URL/ricorrenze?where[fonte][equals]=$FONTE_C&depth=2&limit=200" | \
  jq '[.docs[] | select(.definizione.lemma.termine == "ragionare")] | length'
# ATTESO: ≥1 (il caso anomalo è stato gestito)
```

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

**Verifica completamento:**

```bash
API_URL="http://localhost:3000/api"  # o https://glossari.dh.unica.it/api

# 1. Contare le fonti con 0 ricorrenze (devono esistere nel DB ma non nella pagina)
TOTAL_FONTI=$(curl -s "$API_URL/fonti?limit=0" | jq '.totalDocs')
echo "Fonti totali nel DB: $TOTAL_FONTI"
# Questo numero deve essere > delle fonti mostrate in pagina
```

**Test automatico (curl sulla pagina):**

```bash
# 2. Verificare che la pagina bibliografia non mostri fonti vuote
# La pagina server-rendered deve contenere solo fonti con ricorrenze
SLUG="lemmario-italiano-di-matematica-e-economia"  # slug del lemmario
curl -s "http://localhost:3001/$SLUG/bibliografia" | grep -c 'data-ricorrenze="0"'
# ATTESO: 0 (nessuna fonte con 0 ricorrenze visibile nella pagina)
```

**Test manuale (Browser):**

1. Aprire la pagina Bibliografia del lemmario
2. Scorrere tutte le voci: nessuna deve mostrare "(0 ricorrenze)" o essere priva di lemmi associati
3. ATTESO: ogni voce visibile ha almeno 1 lemma collegato
4. Se implementato toggle: verificare che "Mostra tutte" riveli le fonti vuote, e che il default sia "Solo con ricorrenze"

**Verifica integrità dati:**

```bash
# 3. Le fonti vuote devono ancora esistere nel DB (NON eliminate)
curl -s "$API_URL/fonti?limit=500" | \
  jq '[.docs[].shorthand_id] | length'
# ATTESO: uguale a $TOTAL_FONTI (nessuna fonte eliminata)
```

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

**Verifica completamento:**

```bash
# 1. Verificare che postgresql-client sia installato nel container Payload
docker compose exec payload pg_dump --version
# ATTESO: pg_dump (PostgreSQL) 16.x
# FALLITO SE: command not found
```

```bash
# 2. Verificare che l'endpoint esista e richieda autenticazione
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/admin/export/database"
# ATTESO: 401 o 403 (accesso negato senza autenticazione)
# FALLITO SE: 404 (endpoint non creato) o 200 (nessuna auth!)
```

```bash
# 3. Verificare il download con autenticazione super_admin
# Login per ottenere token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/utenti/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lemmario.dev","password":"password"}' | jq -r '.token')

# Scaricare il dump
curl -s -D- "http://localhost:3000/api/admin/export/database" \
  -H "Authorization: JWT $TOKEN" -o /tmp/test_dump.sql

# Verificare headers
# ATTESO: Content-Disposition: attachment; filename=lemmario_backup_*.sql
# ATTESO: Content-Type: application/sql o application/octet-stream
```

```bash
# 4. Verificare che il dump SQL sia valido
head -5 /tmp/test_dump.sql
# ATTESO: deve iniziare con commenti pg_dump (--) e comandi SET/CREATE
# FALLITO SE: file vuoto, HTML, o messaggio di errore JSON

wc -l /tmp/test_dump.sql
# ATTESO: migliaia di righe (dump completo)
```

```bash
# 5. Verificare che un utente NON super_admin non possa scaricare
# (se esiste un utente redattore di test)
TOKEN_RED=$(curl -s -X POST "http://localhost:3000/api/utenti/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"redattore@test.it","password":"password"}' | jq -r '.token')

curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/admin/export/database" \
  -H "Authorization: JWT $TOKEN_RED"
# ATTESO: 403 (solo super_admin può scaricare)
```

---

### 7. Aggiornamento Loghi

**Descrizione:** Aggiungere il logo dell'Università di Firenze nella pagina del lemmario.

**Specifiche:**
- Il logo di Firenze deve essere visibile solo nella home page del singolo lemmario (`/[lemmario-slug]`), accanto al campo "logo" del lemmario già esistente nel CMS
- Il logo del progetto (UniCa) e DH restano nella barra istituzionale come ora

**Analisi tecnica:**
- Logo Firenze SVG disponibile in `docs/design/Logo_universita_firenze.svg` (215 KB, non ancora committato)
- La home page del lemmario (`packages/frontend/src/app/[lemmario-slug]/page.tsx`) mostra già il logo del lemmario caricato dal CMS
- Il logo Firenze va aggiunto come asset statico e mostrato accanto a quello del lemmario

**Intervento richiesto:**

1. Committare `docs/design/Logo_universita_firenze.svg` e copiarlo in `packages/frontend/public/logos/`
2. Modificare `packages/frontend/src/app/[lemmario-slug]/page.tsx` per mostrare il logo Firenze accanto al logo del lemmario

**File coinvolti:**
- `packages/frontend/src/app/[lemmario-slug]/page.tsx` (aggiunta logo)
- `packages/frontend/public/logos/` (nuovo asset)

**Priorità:** Media-Bassa
**Stima complessità:** Bassa

**Verifica completamento:**

```bash
# 1. Verificare che il file SVG esista in public/logos/
ls -la packages/frontend/public/logos/Logo_universita_firenze.svg
# ATTESO: file presente, dimensione ~215 KB
```

```bash
# 2. Verificare che il logo sia referenziato nel codice della home page
grep -n "Logo_universita_firenze\|firenze\|unifi" \
  packages/frontend/src/app/\[lemmario-slug\]/page.tsx
# ATTESO: almeno 1 riferimento al logo Firenze
```

**Test automatico (pagina renderizzata):**

```bash
# 3. Verificare che la pagina home del lemmario includa il logo Firenze
SLUG="lemmario-italiano-di-matematica-e-economia"
curl -s "http://localhost:3001/$SLUG" | grep -c "Logo_universita_firenze"
# ATTESO: ≥1 (logo presente nell'HTML renderizzato)
```

**Test manuale (Browser):**

1. Aprire la home page del lemmario (es. `http://localhost:3001/lemmario-italiano-di-matematica-e-economia`)
2. ATTESO: il logo dell'Università di Firenze è visibile accanto al logo del lemmario
3. Verificare responsive: su mobile il logo deve essere visibile e non sovrapporsi
4. ATTESO: il logo NON appare nella home globale (`/`) né in altre pagine (lemmi, bibliografia, ecc.)
5. ATTESO: il logo NON appare nella barra istituzionale (quella resta con UniCa + DH)

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

**Verifica completamento:**

```bash
API_URL="http://localhost:3000/api"  # o https://glossari.dh.unica.it/api

# 1. Verificare il conteggio ricorrenze per ciascun lemma problematico
# I numeri attesi includono le ricorrenze originali + quelle aggiunte manualmente

declare -A LEMMI_CHECK=(
  ["forma-lat"]="latino"    # 6 ricorrenze mancanti
  ["ragione"]="volgare"     # 8 ricorrenze mancanti
  ["libro"]="volgare"       # 1 ricorrenza mancante
  ["scritta"]="volgare"     # 1 ricorrenza mancante
  ["trarre"]="volgare"      # 1 ricorrenza mancante
)

for SLUG in "${!LEMMI_CHECK[@]}"; do
  TIPO="${LEMMI_CHECK[$SLUG]}"
  TERMINE="${SLUG%-lat}"  # rimuovi suffisso -lat per il termine

  LEMMA_ID=$(curl -s "$API_URL/lemmi?where[slug][equals]=$SLUG" | jq '.docs[0].id')

  # Conta definizioni del lemma
  DEF_IDS=$(curl -s "$API_URL/definizioni?where[lemma][equals]=$LEMMA_ID&limit=50" | jq '[.docs[].id]')

  # Conta ricorrenze totali per tutte le definizioni
  TOTAL=0
  for DEF_ID in $(echo "$DEF_IDS" | jq '.[]'); do
    COUNT=$(curl -s "$API_URL/ricorrenze?where[definizione][equals]=$DEF_ID&limit=0" | jq '.totalDocs')
    TOTAL=$((TOTAL + COUNT))
  done

  echo "Lemma '$TERMINE' ($TIPO, slug=$SLUG): $TOTAL ricorrenze totali"
done
```

**Conteggi attesi post-fix (ricorrenze originali + mancanti):**

| Lemma | Mancanti | Verifica |
| ----- | -------- | -------- |
| forma (latino) | +6 | Contare e confrontare con pre-fix |
| ragione (volgare) | +8 | Contare e confrontare con pre-fix |
| libro (volgare) | +1 | Contare e confrontare con pre-fix |
| scritta (volgare) | +1 | Contare e confrontare con pre-fix |
| trarre (volgare) | +1 | Contare e confrontare con pre-fix |

**Test manuale per ogni lemma:**

1. Aprire il form admin Payload per ciascun lemma
2. Verificare che le ricorrenze aggiunte abbiano:
   - `testo_originale` compilato (anche se troncato per le citazioni incomplete)
   - `fonte` correttamente associata
   - `pagina_raw` compilato per i riferimenti non standard (scritta, trarre)
3. Aprire la pagina pubblica del lemma nel frontend e verificare che le nuove ricorrenze siano visibili
