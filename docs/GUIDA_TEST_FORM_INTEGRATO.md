# Guida Test: Form Lemma Integrato Multi-Step

**Data:** 15 gennaio 2026  
**Obiettivo:** Testare il nuovo form unificato per editing lemmi con tutte le entità correlate

---

## 🚀 Avvio Rapido

### 1. Avvia Docker Environment

```bash
cd /home/ale/docker/lemmario_ts

# Avvia tutti i servizi
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Verifica che i container siano running
docker ps | grep -E "postgres|payload"
```

**Output atteso:**
```
CONTAINER ID   IMAGE         STATUS    PORTS
xxxxx          postgres:15   Up        0.0.0.0:5432->5432/tcp
xxxxx          payload-cms   Up        0.0.0.0:3000->3000/tcp
```

### 2. Verifica API Raggiungibile

```bash
curl -s http://localhost:3000/api/lemmi | jq '.totalDocs'
```

**Output atteso:** Numero di lemmi (es. `247`)

### 3. Accedi al Payload Admin

```
URL: http://localhost:3000/admin
```

Se non hai ancora un utente admin, creane uno al primo accesso.

---

## 📋 Test Scenario 1: Visualizzare Lemma "Abbattere"

### Obiettivo
Verificare che il form multi-step carichi correttamente tutti i dati correlati di un lemma esistente.

### Passi

**1. Naviga a Lemmi**
- Dal menu laterale, clicca "Lemmi"
- Cerca "Abbattere" nella lista
- Clicca sul lemma per aprirlo

**2. Verifica STEP 1: Dati Base**
✅ Controlli:
- [ ] Form caricato senza errori
- [ ] Campo "Termine" = `abbattere`
- [ ] Campo "Tipo" = `Volgare (Italiano)`
- [ ] Campo "Slug" = `abbattere`
- [ ] Checkbox "Pubblicato" = checked/unchecked
- [ ] Status badge mostra "✅ Salvato"

**3. Verifica STEP 2: Varianti Grafiche**
- Clicca tab "Varianti Grafiche"

✅ Controlli:
- [ ] Tab cambiato senza warning (nessuna modifica fatta)
- [ ] Lista varianti caricata (se presenti nel DB)
- [ ] Bottone "+ Aggiungi Variante" visibile
- [ ] Ogni variante ha input termine e note

**4. Verifica STEP 3: Definizioni**
- Clicca tab "Definizioni"

✅ Controlli:
- [ ] Definizione #1 caricata
- [ ] Testo definizione = `Detrarre`
- [ ] Sezione "Ricorrenze" presente
- [ ] Ricorrenza caricata con:
  - Fonte: `Statuti della Repubblica fiorentina (1355)`
  - Pagina: `p. 157v.`
  - Testo originale: `«in questo caso...»`
  - Livello Razionalità: `2. Operazioni`

**5. Verifica STEP 4: Riferimenti**
- Clicca tab "Riferimenti"

✅ Controlli:
- [ ] Lista riferimenti caricata (se presenti)
- [ ] Ogni riferimento mostra:
  - Tipo riferimento
  - Lemma destinazione
  - Note (se presenti)
  - Badge "Auto-creato" se bidirezionale

**6. Screenshot**
Fai screenshot di ogni tab e salvali in `docs/screenshots/form-lemma-abbattere-*.png`

---

## 📋 Test Scenario 2: Modifica Lemma Esistente

### Obiettivo
Verificare che le modifiche vengano salvate correttamente su tutte le entità.

### Passi

**1. Apri Lemma "Abbattere"**

**2. STEP 1: Modifica Dati Base**
- Cambia "Note redazionali" → `Test modifica form integrato 15/01/2026`
- ✅ Verifica: Status badge diventa "⚠️ Non salvato"

**3. STEP 2: Aggiungi Variante**
- Clicca tab "Varianti Grafiche"
- ⚠️ Se appare alert "Modifiche non salvate", clicca "OK" per confermare
- Inserisci nuova variante: `abattere-test`
- Clicca "+ Aggiungi Variante"
- ✅ Verifica: Variante aggiunta alla lista

**4. STEP 3: Aggiungi Ricorrenza**
- Clicca tab "Definizioni"
- Nella Definizione #1, clicca "+ Aggiungi Ricorrenza"
- Compila:
  - Fonte: Seleziona una fonte dal dropdown
  - Pagina: `p. 999 (test)`
  - Testo Originale: `«Testo di test per ricorrenza»`
  - Livello Razionalità: Seleziona `2. Operazioni`
- ✅ Verifica: Ricorrenza aggiunta sotto la definizione

**5. Salva le Modifiche**
- Clicca "💾 Salva Tutto" (header o footer)
- ✅ Verifica:
  - Alert `✅ Lemma salvato con successo!`
  - Status badge diventa "✅ Salvato"
  - Nessun errore in console browser

**6. Verifica Persistenza**
- Ricarica la pagina (F5)
- Naviga tra i tab
- ✅ Verifica che tutte le modifiche siano persistite:
  - [ ] Note redazionali aggiornate
  - [ ] Variante `abattere-test` presente
  - [ ] Ricorrenza test presente

**7. Cleanup (Opzionale)**
- Elimina la variante test
- Elimina la ricorrenza test
- Ripristina note redazionali
- Salva

---

## 📋 Test Scenario 3: Crea Nuovo Lemma Completo

### Obiettivo
Creare un nuovo lemma da zero con tutte le entità correlate.

### Passi

**1. Crea Nuovo Lemma**
- Vai a "Lemmi" → "Create New"
- ✅ Verifica: Form multi-step caricato vuoto

**2. STEP 1: Dati Base**
Compila:
- Termine: `Testare`
- Tipo: `Volgare (Italiano)`
- Slug: `testare` (auto-generato)
- Note redazionali: `Lemma di test creato il 15/01/2026`
- Pubblicato: ☑️ (checked)

**3. STEP 2: Varianti**
- Clicca tab "Varianti Grafiche"
- Aggiungi variante #1: `testar`
- Aggiungi variante #2: `testàre`
- ✅ Verifica: 2 varianti nella lista

**4. STEP 3: Definizione + Ricorrenza**
- Clicca tab "Definizioni"
- Clicca "+ Aggiungi Definizione"
  - Numero: `1` (auto)
  - Testo: `Verificare il funzionamento`
- Clicca "+ Aggiungi Ricorrenza"
  - Fonte: Seleziona prima disponibile
  - Pagina: `p. 1`
  - Testo Originale: `«Testare è fondamentale»`
  - Livello Razionalità: `2. Operazioni`
- ✅ Verifica: Definizione con 1 ricorrenza creata

**5. STEP 4: Riferimenti**
- Clicca tab "Riferimenti"
- Clicca "+ Aggiungi Riferimento"
  - Tipo: `VEDI ANCHE`
  - Lemma Destinazione: Seleziona "Abbattere"
  - Note: `Riferimento di test`
- ✅ Verifica: Riferimento aggiunto

**6. Salva il Nuovo Lemma**
- Clicca "💾 Salva Tutto"
- ✅ Verifica:
  - Alert successo
  - URL cambia da `/create` a `/lemmi/<nuovo-id>`
  - Status badge "✅ Salvato"

**7. Verifica Bidirezionalità**
- Vai a "Lemmi" → "Abbattere"
- Clicca tab "Riferimenti"
- ✅ Verifica:
  - Riferimento inverso `VEDI ANCHE → Testare` presente
  - Badge "Auto-creato (bidirezionale)" visibile

**8. Verifica API**
```bash
# Cerca il nuovo lemma
curl -s "http://localhost:3000/api/lemmi?where[termine][equals]=Testare" | jq

# Verifica definizioni
LEMMA_ID=$(curl -s "http://localhost:3000/api/lemmi?where[termine][equals]=Testare" | jq '.docs[0].id')
curl -s "http://localhost:3000/api/definizioni?where[lemma][equals]=$LEMMA_ID" | jq

# Verifica ricorrenze
DEF_ID=$(curl -s "http://localhost:3000/api/definizioni?where[lemma][equals]=$LEMMA_ID" | jq '.docs[0].id')
curl -s "http://localhost:3000/api/ricorrenze?where[definizione][equals]=$DEF_ID" | jq
```

**9. Cleanup**
- Elimina il lemma "Testare" (questo eliminerà anche tutte le entità correlate via cascade)
- ✅ Verifica: Riferimento inverso su "Abbattere" eliminato automaticamente

---

## 📋 Test Scenario 4: Eliminazione con Cascade

### Obiettivo
Verificare che eliminando una definizione vengano eliminate anche le ricorrenze.

### Passi

**1. Apri Lemma "Abbattere"**

**2. Naviga a STEP 3: Definizioni**

**3. Conta Ricorrenze Prima dell'Eliminazione**
```bash
# Trova ID definizione #1 di Abbattere
curl -s "http://localhost:3000/api/definizioni?where[lemma][equals]=<abbattere-id>&where[numero][equals]=1" | jq '.docs[0].id'

# Conta ricorrenze
curl -s "http://localhost:3000/api/ricorrenze?where[definizione][equals]=<def-id>" | jq '.totalDocs'
```
Nota il numero (es. `1`)

**4. Elimina Definizione**
- Clicca "Elimina Definizione" sulla Definizione #1
- Conferma l'alert
- Salva

**5. Verifica Cascade Delete**
```bash
# Verifica ricorrenze eliminate
curl -s "http://localhost:3000/api/ricorrenze?where[definizione][equals]=<def-id>" | jq '.totalDocs'
```
✅ **Output atteso:** `0`

**6. Ripristina (se necessario)**
Se hai eliminato dati di produzione, puoi:
1. Reimportare da migrazione
2. O ricreare manualmente

---

## 🐛 Checklist Troubleshooting

### Problema: Form non si carica

**Sintomi:** Schermata bianca o errore 404

**Debug:**
```bash
# 1. Verifica Payload running
docker logs -f lemmario_ts-payload-cms-1

# 2. Verifica build
cd packages/payload-cms
pnpm build

# 3. Restart
docker-compose restart payload-cms
```

### Problema: Dropdown vuoti (fonti/livelli)

**Sintomi:** Dropdown "Fonte" o "Livello Razionalità" senza opzioni

**Debug:**
```bash
# Verifica fonti nel DB
curl -s "http://localhost:3000/api/fonti?limit=10" | jq '.totalDocs'

# Verifica livelli razionalità
curl -s "http://localhost:3000/api/livelli-razionalita?limit=10" | jq '.totalDocs'
```

**Fix:** Se `totalDocs == 0`, esegui seed:
```bash
cd packages/payload-cms
pnpm db:seed
```

### Problema: Modifiche non salvate

**Sintomi:** Alert "✅ Salvato" ma dati non persistiti

**Debug:**
1. Apri DevTools → Network
2. Filtra per "lemmi", "definizioni", "ricorrenze"
3. Ripeti salvataggio
4. Verifica response status (200 = OK, 400/500 = ERROR)
5. Leggi response body per errori specifici

**Logs:**
```bash
docker logs -f lemmario_ts-payload-cms-1 | grep ERROR
```

### Problema: Bidirezionalità non funziona

**Sintomi:** Riferimento A→B creato ma B→A mancante

**Debug:**
```bash
# Verifica hook collegato
grep -r "createBidirezionalita" packages/payload-cms/src/collections/RiferimentiIncrociati.ts

# Verifica riferimenti auto-creati
curl -s "http://localhost:3000/api/riferimenti-incrociati?where[auto_creato][equals]=true" | jq
```

**Fix:** Verifica che hook sia in `hooks: { afterChange: [createBidirezionalita] }`

---

## 📊 Report Template

Compila dopo i test:

```markdown
## Test Report - Form Lemma Integrato

**Data:** 15/01/2026  
**Tester:** [Nome]  
**Browser:** [Chrome/Firefox/Safari] [Versione]  
**Ambiente:** Docker Compose Development

### Scenario 1: Visualizza Lemma Esistente
- [ ] ✅ PASS | ❌ FAIL
- Note: ___________

### Scenario 2: Modifica Lemma
- [ ] ✅ PASS | ❌ FAIL
- Note: ___________

### Scenario 3: Crea Nuovo Lemma
- [ ] ✅ PASS | ❌ FAIL
- Note: ___________

### Scenario 4: Eliminazione Cascade
- [ ] ✅ PASS | ❌ FAIL
- Note: ___________

### Problemi Riscontrati
1. ___________
2. ___________

### Screenshots
- [ ] Allegati in docs/screenshots/

### Raccomandazioni
___________
```

---

## ✅ Successo!

Se tutti i test passano:

🎉 **Il form multi-step integrato funziona correttamente!**

Prossimi passi:
1. Training redattori sul nuovo flusso
2. Documentazione utente finale
3. Deploy in production (dopo backup!)
4. Monitor logs per prime settimane

---

**Buon Testing!** 🚀
