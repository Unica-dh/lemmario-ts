# Report Esecuzione Fix - 25/02/2026

Questo documento descrive le modifiche effettuate per ciascun task, con i file coinvolti e le istruzioni per replicare in produzione.

**Verifica:** `pnpm typecheck` e `pnpm lint` superati senza errori.

**Per applicare in produzione:** Fare push su `main` per attivare la pipeline CI/CD automatica. I Task 1 e 4b richiedono anche migrazione DB e re-importazione dei dati.

---

## Task 1: Ordine ricorrenze + datazione documento

**Status:** Completato (codice) - Richiede migrazione DB + re-import dati in produzione

**Problema:** Le ricorrenze nel database non avevano un campo `ordine`. Il frontend le mostrava nell'ordine di risposta del database, senza garanzia di corrispondenza con la struttura originale dei file HTML sorgente. Inoltre, la datazione del documento non era visibile nelle citazioni.

**Indicazioni dalla riunione 25/02:**

- L'ordine deve ripristinare la struttura originale del file HTML sorgente
- La datazione del documento va in una riga dedicata sotto il riferimento bibliografico
- Le citazioni multiple dalla stessa fonte devono restare come paragrafi separati (gia funzionante)

**Fix applicato:**

### 1. Backend: campo `ordine` su Ricorrenze

- Aggiunto campo `ordine` (type: number) alla collection Ricorrenze
- Creata migrazione Payload `20260225_150000.ts` che aggiunge la colonna `ordine` alla tabella `ricorrenze`

### 2. Script di importazione

- Aggiunto contatore `ordineRicorrenza` per definizione, parte da 1
- Ogni ricorrenza riceve `ordine: ordineRicorrenza++` durante l'import
- L'ordine segue la posizione del `<p>` nel file HTML (iterato in document order dal parser)

### 3. Frontend: ordinamento e datazione

- API: aggiunto `sort: 'ordine'` ai params della fetch in `getRicorrenzeByDefinizioniIds`
- DefinizioneCard: sort client-side `[...ricorrenze].sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0))`
- DefinizioneCard: aggiunta riga dedicata per `fonte.anno` sotto il riferimento bibliografico
- Tipo TypeScript `Ricorrenza`: aggiunto campo `ordine?: number`

### 4. Separazione citazioni (gia funzionante)

- Verificato: il parser (`htmlParser.ts:253`) itera `paragraphs.each((j, p) => ...)` creando una ricorrenza per ogni `<p>` dentro il `<li>` — le citazioni multiple sono gia separate correttamente

**File creati:**

- `packages/payload-cms/src/migrations/20260225_150000.ts` - Migrazione per colonna `ordine`

**File modificati:**

- `packages/payload-cms/src/collections/Ricorrenze.ts` - Aggiunto campo `ordine`
- `scripts/migration/import.ts` - Contatore ordine progressivo per definizione
- `packages/frontend/src/types/payload.ts` - Campo `ordine` su interfaccia `Ricorrenza`
- `packages/frontend/src/lib/payload-api.ts` - Aggiunto `sort: 'ordine'` nella fetch ricorrenze
- `packages/frontend/src/components/lemma/DefinizioneCard.tsx` - Sort per ordine + riga datazione

**Per produzione:** Dopo il deploy, eseguire migrazione DB (`pnpm db:migrate`) e poi re-import completo dei dati.

---

## Task 2: Fix CFR bidirezionali latino/volgare

**Status:** Completato

**Problema:** I riferimenti incrociati funzionavano dal latino al volgare ma non viceversa. Il componente frontend filtrava i riferimenti con `auto_creato=true`, escludendo i link inversi creati automaticamente dall'hook di bidirezionalita.

**Causa root:** Quando il sistema di migrazione importa un CFR A->B, l'hook Payload crea automaticamente l'inverso B->A con flag `auto_creato=true`. Il componente `RiferimentiIncrociati.tsx` filtrava `!rif.auto_creato`, eliminando tutti i riferimenti inversi dalla visualizzazione.

**Fix applicato:**
- Rimosso il filtro `auto_creato` dal componente `RiferimentiIncrociati.tsx`
- Ora tutti i CFR (manuali e auto-creati) sono visibili in entrambe le direzioni

**File modificati:**
- `packages/frontend/src/components/lemma/RiferimentiIncrociati.tsx`
  - Rimosso: `const filtered = riferimenti.filter((rif) => !rif.auto_creato)` e relativo check `if (filtered.length === 0)`
  - Il loop ora itera direttamente su `riferimenti` invece che su `filtered`

**Nessuna modifica al database o al backend necessaria.** Il fix e puramente frontend.

**Per produzione:** Deploy automatico con push su main.

---

## Task 4b: Rimozione riga ripetuta Cotrugli in summa_vol.html

**Status:** Completato

**Problema:** Nel lemma `summa` (volgare), la prima citazione sotto la fonte "Benedetto Cotrugli, Libro de l'arte de la mercatura" ripeteva il titolo dell'opera come fosse una citazione testuale: `"Benedetto Cotrugli, Libro de l'arte de la mercatura" - p. 12`.

**Fix applicato:**
- Rimossa la riga `<p>` duplicata (riga 11 originale) dal file HTML sorgente

**File modificati:**
- `old_website/lemmi/summa_vol.html` - Rimossa la `<p>` che conteneva la ripetizione del titolo

**Per produzione:** Dopo il deploy del codice, e necessario **re-importare i dati** per il lemma `summa` (volgare):
```bash
# Sul server VPN, dopo il deploy
# Opzione 1: re-import completo
cd /home/dhruby/lemmario-ts/scripts
API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate

# Opzione 2: cancellare e reimportare solo summa_vol
# (richiede eliminazione manuale del lemma "summa" dall'admin e re-import)
```

---

## Task 5: Mostrare titoli reali fonti invece di chiavi tecniche

**Status:** Completato

**Problema:** Il frontend mostrava le chiavi tecniche del database (es. `Libro.arte.mercatura`, `Stat.fornai.1339`) come titoli delle opere, sia nelle ricorrenze dei lemmi che nella pagina bibliografia.

**Fix applicato:**
Tre file modificati per mostrare il campo `titolo` (gia popolato nel database) al posto di `shorthand_id`:

### 1. FonteCard.tsx (pagina bibliografia)
- `h3` ora mostra `fonte.titolo` (con fallback a `shorthand_id`)
- `shorthand_id` mostrato come label secondaria sotto il titolo
- `riferimento_completo` mostrato come riga separata (prima era mischiato con il titolo)
- Aggiunto `id={fonte-${fonte.id}}` per deep-linking dalle ricorrenze

### 2. DefinizioneCard.tsx (pagina lemma, sezione ricorrenze)
- Aggiunto prop `lemmarioSlug` al componente
- Fonte ora mostra `fonte.titolo` (con fallback a `shorthand_id`)
- Titolo reso cliccabile con `<Link>` verso `/{lemmarioSlug}/bibliografia#fonte-{id}`
- Stile: underline dotted per indicare link

### 3. Pagina lemma (page.tsx)
- Aggiunto passaggio di `lemmarioSlug={lemmario.slug}` a `DefinizioneCard`

**File modificati:**
- `packages/frontend/src/components/bibliografia/FonteCard.tsx` - Riscrittura completa
- `packages/frontend/src/components/lemma/DefinizioneCard.tsx` - Aggiunto import `Link`, nuovo prop `lemmarioSlug`, fonte cliccabile con titolo
- `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx` - Passato `lemmarioSlug` a DefinizioneCard

**Nessuna modifica al database.** Il campo `titolo` era gia presente e popolato.

**Per produzione:** Deploy automatico con push su main.

---

## Task 7: Aggiungere lemmi associati nella pagina bibliografia

**Status:** Completato

**Problema:** La pagina bibliografia mostrava solo le fonti con i dati bibliografici e il conteggio ricorrenze. Mancava l'elenco dei lemmi che citano ciascuna fonte.

**Fix applicato:**
La catena relazionale `Fonte -> Ricorrenze -> Definizioni -> Lemmi` viene ora percorsa per estrarre i lemmi associati a ciascuna fonte.

### 1. Pagina bibliografia (page.tsx)
- Fetch ricorrenze cambiato da `depth=0` a `depth=2` per ottenere la catena completa
- Costruita mappa `lemmiPerFonte` dal traversal: `ricorrenza.definizione.lemma`
- Deduplicazione per evitare lemmi ripetuti (un lemma puo avere piu ricorrenze dalla stessa fonte)
- Lemmi ordinati alfabeticamente per fonte
- Definito tipo `LemmaRef { id, slug, termine }`
- Passati `lemmiAssociati` e `lemmarioSlug` a `BibliografiaSearch`

### 2. BibliografiaSearch.tsx
- Aggiornata interfaccia `FonteConRicorrenze` con campo `lemmiAssociati: LemmaRef[]`
- Aggiunto prop `lemmarioSlug`
- Propagati `lemmiAssociati` e `lemmarioSlug` a `FonteCard`

### 3. FonteCard.tsx
- Aggiunti props opzionali `lemmiAssociati` e `lemmarioSlug`
- Rendering dei lemmi come lista di link cliccabili verso `/{lemmarioSlug}/lemmi/{slug}`
- Stile: label "Lemmi:", poi lista separata da virgole con underline dotted

**File modificati:**
- `packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx` - Logica estrazione lemmi, props aggiuntive
- `packages/frontend/src/components/bibliografia/BibliografiaSearch.tsx` - Nuove interfacce e props
- `packages/frontend/src/components/bibliografia/FonteCard.tsx` - Rendering lemmi associati

**Nessuna modifica al database.** La relazione `Fonte -> Ricorrenze -> Definizioni -> Lemmi` esiste gia.

**Per produzione:** Deploy automatico con push su main.

---

## Task 8: Nuova pagina livelli di razionalita

**Status:** Completato

**Problema:** Non esisteva una pagina dedicata ai livelli di razionalita. I livelli erano visibili solo come etichetta nella `DefinizioneCard` del singolo lemma.

**Fix applicato:**

### 1. Nuova route `/[lemmario-slug]/livelli/page.tsx`
- Pagina server-side con `force-dynamic`
- Fetch dei 6 livelli di razionalita tramite `getLivelliRazionalita(lemmarioId)`
- Fetch di tutte le definizioni con `depth=2` per risalire ai lemmi associati a ciascun livello
- Deduplicazione: un lemma che ha piu definizioni allo stesso livello appare una sola volta
- Lemmi ordinati alfabeticamente per livello
- Per ciascun livello:
  - Numero e nome del livello
  - Descrizione (se presente)
  - Conteggio e lista lemmi con link navigabili
  - Indicazione "(lat.)" per lemmi latini
- Layout coerente con la pagina bibliografia (back link, hero, sezioni)
- Metadata SEO

### 2. Menu navigazione (MainNav.tsx)
- Aggiunta voce "Livelli" nel menu desktop (prima di "Bibliografia")
- Aggiunta voce "Livelli di razionalita" nel menu mobile

**File creati:**
- `packages/frontend/src/app/[lemmario-slug]/livelli/page.tsx` - Nuova pagina

**File modificati:**
- `packages/frontend/src/components/MainNav.tsx` - Link "Livelli" in menu desktop e mobile

**Nessuna modifica al database.** I livelli e le definizioni con FK a livello esistevano gia.

**Per produzione:** Deploy automatico con push su main.

---

## Task 9: Logo lemmario nella pagina di dettaglio

**Status:** Completato

**Problema:** La pagina di dettaglio del lemmario mostrava solo il titolo centrato nell'hero section. Mancava il logo del progetto (es. "Redde Rationem") accanto al titolo. Inoltre non esisteva un campo dedicato per il logo nella collection Lemmari.

**Fix applicato:**

### 1. Backend: campo `logo` su Lemmari

- Aggiunto campo `logo` (type: upload, relationTo: media) alla collection Lemmari
- Supporta PNG e SVG (la collection Media li gestiva gia)
- Posizionato nella sidebar dell'admin panel
- Nessuna migrazione DB necessaria: il campo usa la tabella `lemmari_rels` gia esistente (stessa struttura del campo `foto`, distinto tramite colonna `path`)

### 2. Frontend: tipo TypeScript

- Aggiunto `logo?: number | PayloadMedia` all'interfaccia `Lemmario` in `payload.ts`

### 3. Frontend: hero section pagina di dettaglio

- Layout hero modificato: se presente un logo, diventa flex orizzontale (logo a sinistra, titolo a destra)
- SVG: usa `<img>` con URL pubblico (`getPublicMediaUrl`) perche il browser deve caricare direttamente
- PNG/raster: usa `next/image` con URL interno Docker (`getMediaUrl`) per ottimizzazione
- Senza logo: fallback al layout centrato originale
- Allineamento: logo allineato alla parte alta del titolo (`items-start`)
- Responsive: su mobile logo sopra, titolo sotto; su desktop affiancati

### 4. Utility: getPublicMediaUrl

- Creata nuova funzione `getPublicMediaUrl` in `media-url.ts`
- A differenza di `getMediaUrl`, non riscrive mai gli URL verso l'hostname Docker interno
- Necessaria per `<img>` standard dove il browser fetcha direttamente l'immagine

**File modificati:**

- `packages/payload-cms/src/collections/Lemmari.ts` - Aggiunto campo `logo`
- `packages/frontend/src/types/payload.ts` - Campo `logo` su interfaccia `Lemmario`
- `packages/frontend/src/app/[lemmario-slug]/page.tsx` - Hero section con logo + titolo affiancati
- `packages/frontend/src/lib/media-url.ts` - Nuova funzione `getPublicMediaUrl`

**Nessuna migrazione database necessaria.** Il campo `logo` riusa la tabella relazionale `lemmari_rels` gia esistente.

**Per produzione:** Deploy automatico con push su main. Dopo il deploy, caricare il logo SVG/PNG nell'admin panel del lemmario.

---

## Riepilogo file modificati

| File | Tipo modifica |
|------|--------------|
| `packages/payload-cms/src/collections/Ricorrenze.ts` | Modificato (Task 1) |
| `packages/payload-cms/src/migrations/20260225_150000.ts` | **Nuovo** (Task 1) |
| `scripts/migration/import.ts` | Modificato (Task 1) |
| `packages/frontend/src/types/payload.ts` | Modificato (Task 1) |
| `packages/frontend/src/lib/payload-api.ts` | Modificato (Task 1) |
| `packages/frontend/src/components/lemma/DefinizioneCard.tsx` | Modificato (Task 1, 5) |
| `packages/frontend/src/components/lemma/RiferimentiIncrociati.tsx` | Modificato (Task 2) |
| `old_website/lemmi/summa_vol.html` | Modificato (Task 4b) |
| `packages/frontend/src/components/bibliografia/FonteCard.tsx` | Riscritto (Task 5, 7) |
| `packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx` | Modificato (Task 5) |
| `packages/frontend/src/app/[lemmario-slug]/bibliografia/page.tsx` | Riscritto (Task 7) |
| `packages/frontend/src/components/bibliografia/BibliografiaSearch.tsx` | Riscritto (Task 7) |
| `packages/frontend/src/app/[lemmario-slug]/livelli/page.tsx` | **Nuovo** (Task 8) |
| `packages/frontend/src/components/MainNav.tsx` | Modificato (Task 8) |
| `packages/payload-cms/src/collections/Lemmari.ts` | Modificato (Task 9) |
| `packages/frontend/src/app/[lemmario-slug]/page.tsx` | Modificato (Task 9) |
| `packages/frontend/src/lib/media-url.ts` | Modificato (Task 9) |

## Istruzioni per deploy in produzione

1. **Push su main** per attivare la pipeline CI/CD
2. La pipeline esegue: lint -> typecheck -> build Docker -> push GHCR -> deploy su VPN
3. **Dopo il deploy**, eseguire migrazione DB e re-importazione dati (necessari per Task 1 e 4b):

   ```bash
   ssh dhruby@90.147.144.147
   cd /home/dhruby/lemmario-ts

   # 1. Eseguire migrazione DB (aggiunge colonna ordine a ricorrenze)
   docker compose exec payload pnpm db:migrate

   # 2. Re-import completo dei dati
   cd scripts
   source ~/.nvm/nvm.sh && nvm use 22
   API_URL=http://localhost:3000/api LEMMARIO_ID=2 pnpm migrate
   ```

**Nota:** I Task 2, 5, 7, 8, 9 sono puramente frontend/config e non richiedono re-importazione dati. I Task 1 e 4b richiedono migrazione DB + re-import. Il Task 9 richiede il caricamento manuale del logo nell'admin panel dopo il deploy.
