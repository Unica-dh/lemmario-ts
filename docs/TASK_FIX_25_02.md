# Task List - Correzioni Post-Riunione 25/02/2026

**Deadline:** entro 4 marzo 2026 (seminario a Barcellona)

---

## I. Correzioni sui Dati e sulla Migrazione

### TASK 1: Correggere l'ordine delle ricorrenze + datazione + separazione citazioni

**Status:** Completato (codice) - In attesa di re-import dati

**Problema originale:** Le ricorrenze nel database non hanno un campo `ordine`. Il frontend le mostra nell'ordine in cui le riceve dal database, senza garanzia di corrispondenza con l'ordine originale.

**Indicazioni dalla riunione 25/02:**

- L'ordine deve ripristinare la struttura originale del file HTML sorgente (confermato)
- Le citazioni multiple dalla stessa fonte devono restare come paragrafi separati (gia funzionante nel parser)
- La datazione del documento va mostrata in una riga dedicata sotto il riferimento bibliografico
- Necessario un nuovo giro di importazione per ripristinare l'ordine corretto

**Interventi effettuati:**

1. Aggiunto campo `ordine` (number) alla collection Ricorrenze
2. Creata migrazione Payload (`20260225_150000.ts`) per la nuova colonna
3. Aggiornato script di import con contatore ordine progressivo per definizione
4. Aggiornato tipo TypeScript frontend con campo `ordine`
5. Aggiunta ordinamento API (`sort: 'ordine'`) e sort client-side nel frontend
6. Aggiunta riga dedicata per la datazione (`fonte.anno`) nel `DefinizioneCard`
7. Verificato: la separazione citazioni (multiple `<p>` → ricorrenze separate) era gia funzionante nel parser

**Da fare in produzione:** Deploy + eseguire migrazione DB + re-import completo dati

---

### TASK 2: Correggere i collegamenti bidirezionali Latino-Volgare

**Problema:** I rimandi funzionano dal latino al volgare ma non viceversa. L'analisi del codice rivela due possibili cause:

1. **Deduplicazione nell'import:** In `scripts/migration/import.ts` (riga 412), la chiave canonica `Math.min(sourceId, targetId):Math.max(sourceId, targetId)` fa si che se entrambi i file HTML contengono un CFR reciproco, solo il primo viene importato e il secondo viene saltato come duplicato. Combinato con il filtro `auto_creato` nel frontend, un verso potrebbe non avere il riferimento esplicito.

2. **Filtro frontend:** Il componente `RiferimentiIncrociati.tsx` (riga 28) filtra `!rif.auto_creato`, mostrando solo i riferimenti creati manualmente. I riferimenti inversi auto-creati dall'hook non vengono mostrati.

**Interventi necessari:**
1. Modificare il componente `RiferimentiIncrociati.tsx` per mostrare ANCHE i riferimenti `auto_creato` (rimuovere il filtro, oppure invertire la logica: mostrare tutti i CFR dove il lemma corrente e `lemma_origine` O `lemma_destinazione`)
2. In alternativa, modificare `getRiferimentiByLemma()` in `payload-api.ts` per cercare il lemma sia come `lemma_origine` che come `lemma_destinazione`
3. Verificare sul database in produzione lo stato effettivo dei CFR (quanti auto_creato, quanti manuali)

**Ho tutti gli elementi?** Si. Il bug e riproducibile analizzando il codice. La soluzione piu pulita e modificare la query per cercare in entrambe le direzioni.

---

### TASK 3: Normalizzazione dei lemmi (plurale → singolare)

**Problema:** Alcuni lemmi sono al plurale e devono essere portati al singolare:
- `visitatores` → `visitator` (in `old_website/indice.json` riga 236)
- `notai` → `notarius` (in `old_website/indice.json` riga 129, file: `notai.html`)

**Interventi necessari:**
1. Modificare `old_website/indice.json`: cambiare il campo `nome` da plurale a singolare
2. Verificare se i file HTML (`notai.html`, `visitatores_lat.html`) devono essere rinominati o se basta il cambio nel JSON
3. Aggiornare eventuali riferimenti incrociati (CFR) che puntano ai vecchi nomi
4. Re-importare i dati
5. Verificare che gli slug generati siano corretti (`visitator-lat`, `notarius-lat`)

**Ho tutti gli elementi?** Parzialmente. Serve conferma:
- `visitatores` → `visitator` (singolare latino) - confermato nel documento
- `notai` → `notarius` (singolare latino) - il lemma `notai` e di tipo "latino", quindi il singolare latino `notarius` ha senso, ma **serve conferma del termine esatto**
- **Ci sono altri lemmi al plurale da normalizzare?** Il documento dice "le voci relative a istituzioni o magistrature" - serve la **lista completa** dal cliente

---

### TASK 4: Correzione refusi puntuali

**Problema A:** Il lemma latino `facere raccionem` ha un errore: `raccione` → `raccionem` (aggiungere la "m" finale).

**Problema B:** Nella voce `summa`, c'e una riga ripetuta nel riferimento a Benedetto Cotrugli. In `old_website/lemmi/summa_vol.html` (riga 11), la prima `<p>` all'interno del `<li>` ripete il titolo come citazione: `"Benedetto Cotrugli, Libro de l'arte de la mercatura" - p. 12`. Questa non e una vera citazione testuale ma un duplicato dell'intestazione.

**Interventi necessari:**
1. **Refuso raccione:** Cercare nel database il lemma esatto e correggere il campo `termine`. Se il dato proviene da `indice.json`, correggere la entry nel JSON e re-importare
2. **Summa ripetuta:** Modificare `old_website/lemmi/summa_vol.html` rimuovendo la `<p>` duplicata (riga 11), oppure gestirlo nel parser come caso speciale
3. Re-importare i dati dopo le correzioni

**Ho tutti gli elementi?** Parzialmente.
- Per la **summa**: si, il problema e chiaro nel file sorgente
- Per **raccionem**: il termine `raccione` o `raccionem` **non e stato trovato** nei file sorgente (`old_website/`). Potrebbe essere stato corretto nel sorgente ma non nel database in produzione, oppure il lemma ha un nome diverso. **Serve il nome esatto del lemma** o la URL della pagina dove il cliente ha visto l'errore

---

## II. Revisione della Bibliografia e dei Riferimenti

### TASK 5: Sostituire le chiavi tecniche con i titoli reali nelle fonti

**Problema:** Il frontend mostra le chiavi del database (es. `Libro.arte.mercatura`, `Stat.fornai.1339`) come titoli delle opere. Il campo `titolo` esiste nel database ed e popolato correttamente, ma i componenti frontend usano `shorthand_id`.

**Interventi necessari:**
1. **`FonteCard.tsx`** (riga 14): Sostituire `fonte.shorthand_id` con `fonte.titolo` come intestazione principale. Mantenere `shorthand_id` come label secondaria
2. **`DefinizioneCard.tsx`** (riga 53): Nelle ricorrenze, sostituire `fonte.shorthand_id` con `fonte.titolo`, rendere il titolo cliccabile con link alla pagina bibliografia (`/[lemmario-slug]/bibliografia#fonte-[id]`)
3. Aggiungere anchor (`id="fonte-{id}"`) a ogni fonte nella pagina bibliografia per il deep-linking
4. Aggiornare il componente `BibliografiaSearch.tsx` per usare il titolo come criterio di raggruppamento primario

**Ho tutti gli elementi?** Si. Il campo `titolo` e gia presente e popolato nel database. L'intervento e puramente frontend.

---

### TASK 6: Gestione dello Statuto Fiorentino del 1355 (Capitano/Podesta)

**Problema:** Le sigle "C" (Capitano) e "P" (Podesta) dello Statuto Fiorentino 1355 creano confusione con i simboli di carta e pagina nei riferimenti bibliografici.

**Stato attuale:** L'analisi dei file HTML sorgente mostra che le parole "Capitano" e "Podesta" sono sempre scritte per esteso, **non come sigle**. La fonte attuale nel database e una sola: `Firenze.Statuti.1355.volg`.

**Interventi necessari:**
1. Creare **due fonti distinte** nel `bibliografia.json`:
   - `Firenze.Statuti.1355.volg.C` → "Statuti della Repubblica fiorentina (Capitano del popolo)"
   - `Firenze.Statuti.1355.volg.P` → "Statuti della Repubblica fiorentina (Podesta)"
2. Aggiornare il parser per distinguere le citazioni del Capitano da quelle del Podesta (o farlo manualmente)
3. Aggiornare le ricorrenze esistenti per puntare alla fonte corretta
4. Re-importare o aggiornare i dati

**Ho tutti gli elementi?** No. Servono informazioni dal cliente:
- **Quali citazioni** specifiche si riferiscono al Capitano e quali al Podesta? Nei file HTML non c'e un modo automatico per distinguerle
- **Formato desiderato** delle nuove sigle: "Capitano C" e "Podesta C" (come da documento) o altro?
- Lo Statuto 1355 ha una suddivisione interna (libri, sezioni) che permette di distinguere automaticamente le due figure? **Serve la logica di split**

---

### TASK 7: Potenziamento della pagina Bibliografia con lemmi associati

**Problema:** La pagina bibliografia mostra solo le fonti con i dati bibliografici. Manca l'elenco dei lemmi che citano ciascuna fonte.

**Interventi necessari:**
1. Creare una nuova API function `getLemmiByFonte(fonteId)` in `payload-api.ts` che risalga la catena Fonte → Ricorrenze → Definizioni → Lemmi
2. Aggiornare la pagina bibliografia (`/[lemmario-slug]/bibliografia/page.tsx`) per caricare e mostrare i lemmi associati
3. Aggiornare `FonteCard.tsx` per includere la lista di lemmi con link navigabili verso `/${lemmario-slug}/lemmi/${lemma.slug}`
4. Considerare il caching/performance: questa query potrebbe essere pesante, valutare se pre-calcolarla o usare ISR

**Ho tutti gli elementi?** Si. La struttura relazionale `Fonte → Ricorrenze → Definizioni → Lemmi` esiste gia nel database. Serve implementare la query inversa e il rendering frontend.

---

## III. Nuove Funzionalita e Interfaccia

### TASK 8: Pagina Livelli di Razionalita

**Problema:** Non esiste una pagina dedicata che raggruppi i lemmi per livello di razionalita. Attualmente i livelli sono visibili solo nella `DefinizioneCard` del singolo lemma.

**Interventi necessari:**
1. Creare nuova API function `getLemmiByLivello(lemmarioId)` in `payload-api.ts`
2. Creare nuova route `/[lemmario-slug]/livelli/page.tsx` con:
   - Lista dei 6 livelli con nome e descrizione
   - Per ciascun livello, elenco dei lemmi le cui definizioni appartengono a quel livello
   - Link navigabili verso ciascun lemma
3. Aggiungere la voce "Livelli di razionalita" al menu di navigazione (`MainNav.tsx`)
4. Opzionale: aggiungere un link al livello nella `DefinizioneCard` per navigare alla pagina del livello

**Ho tutti gli elementi?** Si. I livelli esistono nel database (6 livelli con codice 1-6), le definizioni hanno il campo `livello_razionalita` come FK. Serve solo implementare la nuova pagina e la query.

---

### TASK 9: Inserimento loghi e titolo progetto (branding)

**Problema:** Mancano i loghi delle universita e del progetto PRIN nella testata/footer. Manca il titolo completo del progetto "RedRazionem".

**Interventi necessari:**
1. **Header/Footer:** Aggiungere al componente `InstitutionalBar.tsx` o `Footer.tsx`:
   - Logo Universita di Cagliari
   - Logo Universita di Firenze
   - Logo PRIN
   - Titolo progetto "Redde Rationem"
2. Ottimizzare i loghi come immagini Next.js (componente `Image` con `priority` per above-the-fold)
3. Aggiornare la pagina "Progetto" (contenuto statico) con i testi descrittivi

**Ho tutti gli elementi?** No. Servono dal cliente:
- **File immagine** dei loghi (Universita di Cagliari, Universita di Firenze, PRIN) in formato adeguato (SVG preferito, altrimenti PNG ad alta risoluzione)
- **Testi descrittivi** per la pagina "Progetto" (descrizione del progetto RedRazionem)
- **Posizionamento preferito**: header, footer, o entrambi?
- **Dimensioni/layout** desiderati per i loghi

---

### TASK 10: Sezione Pubblicazioni

**Problema:** Non esiste uno spazio per "Schede di approfondimento" o "Pubblicazioni" dove caricare PDF o link ai volumi del progetto.

**Opzioni di implementazione:**

**Opzione A - Usare ContenutiStatici esistente:**
- Pro: nessuna modifica al backend, funziona subito
- Contro: non ha campi specifici per pubblicazioni (autori, DOI, PDF upload)

**Opzione B - Creare nuova collection `Pubblicazioni`:**
- Campi: titolo, autori, anno, abstract, PDF (upload media), DOI/URL, lemmario
- Pro: struttura dati appropriata, ricerca e filtro specifici
- Contro: richiede piu tempo (collection + migrazione + frontend)

**Interventi necessari (Opzione B, consigliata):**
1. Creare collection `Pubblicazioni` in Payload CMS
2. Creare migrazione database
3. Creare route `/[lemmario-slug]/pubblicazioni/page.tsx`
4. Creare componente `PubblicazioneCard.tsx`
5. Aggiungere voce al menu di navigazione
6. Configurare upload media per PDF

**Ho tutti gli elementi?** No. Servono dal cliente:
- **Quale opzione** preferiscono (contenuti statici semplici vs collection strutturata)?
- **Quali campi** servono per ciascuna pubblicazione? (titolo, autori, anno, abstract, PDF, link, DOI?)
- **Contenuti iniziali** da caricare (se ci sono gia PDF o link pronti)
- Per la deadline del 4 marzo, l'**Opzione A** (contenuto statico) e piu veloce; l'**Opzione B** e piu strutturata ma richiede piu sviluppo

---

## Riepilogo Dipendenze e Informazioni Mancanti

| Task | Autonomo? | Info mancanti |
|------|-----------|---------------|
| 1. Ordine ricorrenze + datazione | **Completato** | Confermato: ordine HTML = ordine voluto. In attesa di re-import |
| 2. CFR bidirezionali | **Completato** | - |
| 3. Normalizzazione lemmi | Parziale | Lista completa lemmi da normalizzare, conferma forme singolari |
| 4a. Refuso raccionem | **No** | Nome esatto del lemma o URL pagina |
| 4b. Summa ripetuta | **Completato** | - |
| 5. Titoli vs chiavi | **Completato** | - |
| 6. Statuto Fiorentino | **No** | Logica di split Capitano/Podesta, formato sigle |
| 7. Lemmi per fonte | **Completato** | - |
| 8. Pagina livelli | **Completato** | - |
| 9. Loghi e branding | **No** | File loghi, testi progetto, layout preferito |
| 10. Pubblicazioni | **No** | Scelta opzione, campi richiesti, contenuti iniziali |

**Task immediatamente realizzabili (senza ulteriori input):** 2, 4b, 5, 7, 8

**Task che richiedono solo conferme minime:** 1, 3

**Task che richiedono input sostanziale dal cliente:** 4a, 6, 9, 10

---

## Ordine di Esecuzione Suggerito

1. **Task 2** (CFR bidirezionali) - fix critico, impatto immediato
2. **Task 5** (Titoli fonti) - fix frontend rapido, grande impatto visivo
3. **Task 8** (Pagina livelli) - nuova funzionalita, richiesta specifica
4. **Task 7** (Lemmi per fonte) - potenziamento bibliografia
5. **Task 4b** (Summa ripetuta) - fix dati, richiede re-import
6. **Task 1** (Ordine ricorrenze) - dopo conferma dal cliente
7. **Task 3** (Normalizzazione) - dopo lista completa dal cliente
8. **Task 9** (Loghi) - dopo ricezione materiali
9. **Task 10** (Pubblicazioni) - dopo decisione opzione
10. **Task 4a + 6** (Refusi + Statuto) - dopo informazioni dal cliente
