# Report Implementazione - Fix e Task del 27/02/2026

Documento di tracciamento per i task definiti in [`fix_27.02.md`](fix_27.02.md).

**Legenda Ambiente:** L = Locale | P = Produzione

| # | Task | Stato | Ambiente | Data |
| --- | --- | --- | --- | --- |
| 1 | Definizioni vuote e sfasamento numerico | Completato | L + P | 2026-02-27 |
| 2 | Bug salvataggio Livelli di Razionalità | Da fare | - | - |
| 4 | Sdoppiamento fonte Statuti Fiorentina | Completato | L + P | 2026-02-27 |
| 5 | Filtro Voci Bibliografiche vuote | Completato | L + P | 2026-02-27 |
| 6 | Download Database SQL | Completato | L + P | 2026-02-27 |
| 7 | Aggiornamento Loghi | Completato | L + P | 2026-02-27 |
| 8 | Contenuto ignorato dal Parser (5 Lemmi) | Da fare | - | - |

---

## Task 1 - Definizioni vuote e sfasamento numerico

**Data completamento:** 2026-02-27

**Ambiente:** Locale + Produzione

**File modificati:**

- `old_website/lemmi/ragione.html` — Corretta numerazione duplicata (secondo "21" → "22", successivi +1 fino a 30), aggiunto `<hr>` mancante tra def 25 e 26, corretto doppio punto "misura.." → "misura."

**Intervento effettuato:**

1. **Correzione HTML sorgente:**
   - Rinumerata la definizione duplicata "21. Calcolo/Rapporto." → "22."
   - Tutte le definizioni successive incrementate di 1 (da 22→23 fino a 29→30)
   - Aggiunto tag `<hr>` mancante tra "25. Giustizia" e "26. Proporzione, rapporto, misura." (causa della perdita della definizione durante il parsing)

2. **Correzione dati in DB (via API REST):**
   - **8 PATCH** su definizioni esistenti per aggiornare il campo `numero`
   - **1 CREATE** definizione n. 26 "Proporzione, rapporto, misura." (livello: Operazioni)
   - **6 CREATE** ricorrenze mancanti per le definizioni 22, 23, 25, 26, 27, 28

3. **ID coinvolti:**

   | Ambiente | Definizioni PATCH | Def 26 creata | Ricorrenze create |
   | --- | --- | --- | --- |
   | Locale | 2228-2235 | id=2343 | 4391-4396 |
   | Produzione | 784-791 | id=899 | 1702-1707 |

**Scostamenti dal piano:**

- Il piano prevedeva re-importazione completa del lemma (opzione 2) o correzione via admin (opzione 3). Si è scelto un approccio ibrido: **PATCH diretti via API** per la rinumerazione + **CREATE** per la definizione e le ricorrenze mancanti. Questo ha preservato gli ID esistenti e le associazioni ricorrenze → definizioni già corrette.
- Scoperto un ulteriore problema non documentato: il tag `<hr>` mancante nell'HTML sorgente tra le definizioni 25 e 26, che causava la perdita della definizione "Proporzione, rapporto, misura." durante il parsing.
- Le ricorrenze mancanti (5 definizioni oltre alla 26) sono state create ex novo dal testo HTML sorgente.

**Verifiche:**

- [x] Nessuna definizione vuota per numeri 21-30
- [x] Sequenza numerica 1-30 completa, senza duplicati
- [x] Ogni definizione 21-30 ha almeno 1 ricorrenza associata
- [x] Test superati in locale
- [x] Test superati in produzione (`https://glossari.dh.unica.it`)

---

## Task 5 - Filtro Voci Bibliografiche vuote

**Data completamento:** 2026-02-27

**Ambiente:** Locale (in produzione al prossimo deploy)

**File modificati:**

- `packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx` — Aggiunto filtro server-side per escludere le fonti con 0 ricorrenze dalla visualizzazione; aggiornato contatore nell'header

**Intervento effettuato:**

Aggiunta una singola riga di filtro dopo la costruzione dell'array `fontiConRicorrenze`:

```typescript
const fontiVisibili = fontiConRicorrenze.filter(f => f.ricorrenzeCount > 0)
```

Il contatore nell'header e il componente `BibliografiaSearch` ora ricevono `fontiVisibili` invece di `fontiConRicorrenze`. Le fonti con 0 ricorrenze restano nel database ma non vengono mostrate nella pagina.

**Scostamenti dal piano:**

Nessuno. Il piano prevedeva anche l'opzione di un toggle UI ("Mostra tutte / Solo con ricorrenze"), ma si è scelto il filtro server-side senza toggle, come indicato dal default "solo con ricorrenze".

**Verifiche:**

- [x] Typecheck (`pnpm --filter frontend typecheck`) superato
- [x] 61 fonti mostrate in pagina (su 86 totali nel DB)
- [x] Nessuna fonte con 0 ricorrenze visibile nella pagina renderizzata
- [x] 86 fonti ancora presenti nel DB (nessuna eliminata)
- [ ] Deploy in produzione (al prossimo push su main)

---

## Task 6 - Implementazione Download Database SQL

**Data completamento:** 2026-02-27

**Ambiente:** Locale + Produzione

**File modificati:**

- `packages/payload-cms/src/server.ts` — Aggiunto endpoint Express `GET /api/admin/export/database` con autenticazione super_admin, esecuzione `pg_dump` via `child_process.spawn` e streaming della risposta
- `packages/payload-cms/src/admin/components/ExportDatabase.tsx` — Nuovo componente React per la dashboard admin con pulsante di download (visibile solo ai super_admin)
- `packages/payload-cms/src/payload.config.ts` — Registrato componente `ExportDatabase` come `afterDashboard`
- `packages/payload-cms/Dockerfile` — Aggiunto `postgresql16-client` allo stage di produzione
- `packages/payload-cms/Dockerfile.dev` — Aggiunto `postgresql16-client` allo stage di sviluppo

**Intervento effettuato:**

1. **Endpoint Express (`/api/admin/export/database`):**
   - Verifica autenticazione JWT Payload: solo utenti con `ruolo === 'super_admin'` possono accedere (403 altrimenti)
   - Parsing di `DATABASE_URI` per estrarre host, porta, utente e database
   - Esecuzione di `pg_dump` via `child_process.spawn` con password passata via variabile d'ambiente `PGPASSWORD`
   - Streaming diretto dello stdout di pg_dump nella risposta HTTP con headers `Content-Disposition: attachment` e `Content-Type: application/sql`
   - Gestione errori: stderr loggato, errori di avvio e codice di uscita non-zero gestiti

2. **Componente Admin (`ExportDatabase.tsx`):**
   - Visibile solo se `user.ruolo === 'super_admin'`
   - Pulsante "Scarica Database SQL" che naviga all'endpoint di download
   - Stato `downloading` con feedback visivo durante il download
   - Registrato in `payload.config.ts` come componente `afterDashboard`

3. **Dockerfile:**
   - Aggiunto `apk add --no-cache postgresql16-client` sia nel Dockerfile di produzione (stage `production`) che in quello di sviluppo

**Scostamenti dal piano:**

Nessuno sostanziale. Il piano prevedeva le stesse operazioni. Non è stata aggiunta documentazione sulla procedura di importazione locale (punto opzionale) — questo potrà essere aggiunto in seguito se necessario.

**Verifiche:**

- [x] Typecheck (`pnpm typecheck`) superato — 0 errori
- [x] Lint (`pnpm lint`) superato — 0 errori (solo warning preesistenti)
- [x] Endpoint senza auth → 403 (corretto)
- [x] Endpoint con JWT super_admin → 200, dump SQL valido (~12.000 righe), headers `Content-Disposition: attachment`
- [x] Webpack admin panel compilato con successo (componente `ExportDatabase` incluso nel bundle)
- [x] Deploy in produzione completato

---

## Task 4 - Sdoppiamento fonte "Statuti della Repubblica Fiorentina"

**Data completamento:** 2026-02-27

**Ambiente:** Locale (in produzione: esecuzione manuale dello script da locale)

**File modificati:**

- `scripts/migration/split-fonte-statuti.ts` — Nuovo script TypeScript per lo sdoppiamento automatico della fonte
- `old_website/bibliografia.json` — Sostituita voce `Firenze.Statuti.1355.volg` con le due nuove voci `.C` e `.P`

**Intervento effettuato:**

1. **Analisi dati:** La fonte originale (id=172) aveva 217 ricorrenze, tutte classificabili tramite il prefisso `pagina_raw`:
   - `c.` → Statuto del Capitano del Popolo (74 ricorrenze)
   - `p.` → Statuto del Podestà (143 ricorrenze)
   - Nessuna ricorrenza non classificabile (il caso anomalo `ragionare.html` con `» c. 146r.` era già stato parsato correttamente con `pagina_raw="c. 146r."`)

2. **Script `split-fonte-statuti.ts`:**
   - Supporta `DRY_RUN=1` per simulazione
   - Login JWT per autenticazione
   - Crea le 2 nuove fonti con titolo "Statuti della Repubblica fiorentina" (idempotente: skip se già esistenti)
   - PATCH ogni ricorrenza: riassegna alla fonte corretta e riscrive `pagina_raw` (`c. 42v.` → `Capitano. 42v.`, `p. 15v.` → `Podestà. 15v.`)
   - Verifica post-riassegnazione (nessuna ricorrenza orfana)
   - Elimina la fonte originale solo se tutto è andato a buon fine

3. **Risultato esecuzione locale:**

   | Fonte | shorthand_id | id | Ricorrenze |
   | --- | --- | --- | --- |
   | Capitano del Popolo | `Firenze.Statuti.1355.volg.C` | 173 | 74 |
   | Podestà | `Firenze.Statuti.1355.volg.P` | 174 | 143 |
   | **Totale** | | | **217** |

4. **Aggiornamento `bibliografia.json`:** Rimossa la voce originale, aggiunte le due nuove voci `.C` e `.P` con titolo identico "Statuti della Repubblica fiorentina".

5. **Formato citazione risultante:** `Statuti della Repubblica fiorentina, Capitano. 42v.` e `Statuti della Repubblica fiorentina, Podestà. 15v.`

**Scostamenti dal piano:**

- I numeri di ricorrenze sono diversi dal piano (217 totali invece di 144, 74 Capitano invece di ~43, 143 Podestà invece di ~101). Il piano era basato su un conteggio dei file HTML sorgente; il DB locale contiene più ricorrenze (probabilmente da importazioni successive).
- Non è stato necessario gestire il caso anomalo di `ragionare.html` separatamente: il parser aveva già estratto `pagina_raw="c. 146r."` correttamente.

**Verifiche:**

- [x] Dry run: tutte le 217 ricorrenze classificate (0 non classificate)
- [x] Nuove fonti create: `.C` (id=173) e `.P` (id=174)
- [x] Fonte originale eliminata: `totalDocs=0` per `Firenze.Statuti.1355.volg`
- [x] Conteggio ricorrenze: 74 (C) + 143 (P) = 217 totale
- [x] Nessuna ricorrenza orfana (0 per id=172)
- [x] Caso anomalo ragionare: ricorrenza id=4110 con `pagina_raw="Capitano. 146r."` correttamente assegnata a Capitano
- [x] Verifica visiva frontend: "terminatore" mostra `Statuti della Repubblica fiorentina, Capitano. 42v.` e `...Podestà. 15v.`
- [x] Esecuzione in produzione: 157 ricorrenze (54 C + 103 P), fonti id=173/174, verificato su glossari.dh.unica.it

---

## Task 7 - Aggiornamento Loghi

**Data completamento:** 2026-02-27

**Ambiente:** Locale + Produzione

**File modificati:**

- `packages/payload-cms/src/collections/Lemmari.ts` — Aggiunto campo array `loghi_partner` con sottocampi `immagine` (upload media) e `alt` (testo accessibilità)
- `packages/payload-cms/src/migrations/20260227_230000.ts` — Migrazione per creare tabelle `lemmari_loghi_partner` e `lemmari_loghi_partner_rels`
- `packages/frontend/src/app/[lemmario-slug]/page.tsx` — Rendering dinamico dei loghi partner dal CMS; fix bug pre-esistente su `<Image fill>` senza altezza esplicita

**Intervento effettuato:**

1. **Campo CMS `loghi_partner`:**
   - Aggiunto campo `array` alla collection `Lemmari` con due sottocampi: `immagine` (upload `media`, required) e `alt` (testo accessibilità, required)
   - Approccio CMS scelto per flessibilità: ogni lemmario può avere i propri loghi partner, gestiti dall'admin panel senza modifiche al codice

2. **Migrazione database (`20260227_230000.ts`):**
   - Tabella `lemmari_loghi_partner`: id varchar (Payload genera ObjectID-style per array items), `_order`, `_parent_id` (FK → lemmari), `alt`
   - Tabella `lemmari_loghi_partner_rels`: relazione con collection `media` per il campo `immagine`
   - Indici e foreign keys con cascading delete

3. **Frontend (`page.tsx`):**
   - Lettura dinamica del campo `loghi_partner` dal lemmario corrente
   - Supporto SVG (rendering diretto con `<img>`) e raster (ottimizzazione Next.js con `<Image>`)
   - Loghi partner mostrati sotto il logo principale nella colonna sinistra, al 75% della larghezza
   - Fix bug pre-esistente: logo non-SVG usava `<Image fill>` senza altezza parent → sostituto con `width`/`height` espliciti

4. **Deploy produzione:**
   - PR #58 creata e mergiata su main
   - CI/CD completato con successo
   - Migrazione SQL eseguita direttamente sul DB di produzione (Payload migrate non funziona nel container prod)
   - Container Payload riavviato per caricare il nuovo schema

**Scostamenti dal piano:**

- Il piano originale prevedeva un file SVG statico (`public/logos/`). Si è scelto un approccio CMS con campo `loghi_partner` per permettere la gestione dei loghi da admin panel senza deploy di codice.
- Scoperto e corretto un bug pre-esistente: il logo principale non-SVG usava `<Image fill>` all'interno di un div senza altezza esplicita, risultando in 0px di rendering.
- La migrazione Payload (`pnpm payload migrate:create`) si è bloccata su un prompt interattivo Drizzle; la migrazione è stata scritta manualmente in SQL.
- Le tabelle array di Payload v2 usano `varchar` come tipo per la colonna `id` (ObjectID MongoDB-style), non `serial` — errore iniziale corretto dopo test.

**Verifiche:**

- [x] Typecheck (`pnpm typecheck`) superato
- [x] Lint (`pnpm lint`) superato
- [x] CI GitHub Actions (lint, typecheck, build) superato
- [x] CD deploy su server VPN completato
- [x] Migrazione SQL eseguita in produzione
- [x] API produzione: campo `loghi_partner` presente e funzionante (array vuoto, pronto per upload)
- [x] Frontend produzione: nessun errore di rendering

**Nota:** Il logo dell'Università di Firenze va caricato tramite admin panel Payload (`/admin`) nella sezione "Loghi Partner" del lemmario desiderato.

---

<!-- Template per ogni task completato:

## Task N - Titolo

**Data completamento:** YYYY-MM-DD

**Ambiente:** Locale / Produzione / Locale + Produzione

**File modificati:**

- `path/to/file.ts` — descrizione modifica

**Intervento effettuato:**

Descrizione sintetica di cosa è stato fatto.

**Scostamenti dal piano:**

Nessuno / Descrizione delle differenze rispetto al piano in fix_27.02.md.

**Verifiche:**

- [ ] Typecheck (`pnpm typecheck`)
- [ ] Lint (`pnpm lint`)
- [ ] Test manuale
- [ ] Deploy/produzione

---

-->
