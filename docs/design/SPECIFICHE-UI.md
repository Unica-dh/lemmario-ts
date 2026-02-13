# Specifiche UI - Nuovo Design Lemmario

Documento di analisi del mockup "Dettaglio glossario.png" e specifiche per l'implementazione del nuovo design su tutte le pagine del frontend.

---

## 1. Design System Generale

### 1.1 Estetica
Il design ha un'impronta **accademica e tipografica**, minimalista, con ampio uso di bianco/nero e grigio chiaro. L'atmosfera richiama pubblicazioni editoriali e cataloghi di ricerca umanistica. Nessun colore primario vivace (il blu sky attuale va eliminato).

### 1.2 Palette Colori (dedotta dal mockup)

| Ruolo | Colore | Uso |
|-------|--------|-----|
| Testo principale | `#1a1a1a` / nero quasi pieno | Titoli, termini dei lemmi |
| Testo secondario | `#6b6b6b` / grigio medio | Metadati, label (DEF., FONTI), badge tipo |
| Testo corpo | `#3a3a3a` / grigio scuro | Testo delle definizioni, paragrafi |
| Sfondo pagina | `#ffffff` | Sfondo principale |
| Sfondo header istituzionale | `#1a1a1a` / nero | Barra superiore istituzionale |
| Testo header istituzionale | `#ffffff` lettere spaziate | Label "UNIVERSITA DI CAGLIARI..." |
| Linee divisorie | `#d4d4d4` / grigio chiaro | Separatori orizzontali, bordi sezioni |
| Hover/Active link | da definire | Non visibile nel mockup statico |
| Sidebar alfabetica | `#9a9a9a` / grigio | Lettere non selezionate |
| Sidebar lettera attiva | `#1a1a1a` / nero con sfondo | Lettera corrente evidenziata |

### 1.3 Tipografia

| Elemento | Font | Peso | Dimensione stimata | Stile |
|----------|------|------|--------------------|-------|
| Titolo glossario (hero) | Serif (es. Playfair Display, Cormorant Garamond) | Regular/Normal | ~48-56px | Normale, interlinea stretta |
| Termine lemma (card) | Serif (stesso del titolo) | Bold | ~22-24px | Normale |
| Testo definizione (card) | Sans-serif (es. Inter, Source Sans) | Regular | ~15-16px | Normale, interlinea 1.5-1.6 |
| Label metadati (DEF., FONTI) | Sans-serif | Medium/Regular | ~11-12px | MAIUSCOLETTO (letter-spacing ampio) |
| Badge tipo (VOLGARE, LATINE) | Sans-serif | Regular | ~11-12px | MAIUSCOLETTO, grigio, allineato a destra |
| Navigazione | Sans-serif | Regular | ~12-13px | MAIUSCOLETTO con letter-spacing |
| Barra istituzionale | Sans-serif | Regular | ~11px | MAIUSCOLETTO con letter-spacing largo |
| Sezione/conteggio | Serif (italico) | Regular | ~14px | Italico |
| Footer label | Sans-serif | Regular | ~11px | MAIUSCOLETTO |
| Footer testo | Serif | Regular/Italic | ~14-15px | Italico per nomi istituzione |
| Paginazione | Sans-serif | Regular | ~13px | MAIUSCOLETTO per PRECEDENTE/SUCCESSIVA |

**Caratteristica dominante:** uso estensivo di **maiuscoletto con letter-spacing** per tutti gli elementi UI (navigazione, label, badge, paginazione, footer). Contrasto forte tra il serif grande dei titoli e il sans-serif piccolo delle label.

### 1.4 Spaziatura e Layout

- **Layout complessivo:** max-width ~1200px, centrato, con padding orizzontale generoso (~80-100px)
- **Griglia lemmi:** 2 colonne con gap orizzontale ~40-60px e verticale ~40-50px
- **Separatori:** linee sottili orizzontali (`1px solid #d4d4d4`) usate tra sezioni
- **Whitespace:** molto generoso, il design "respira" - margini verticali ampi tra sezioni

---

## 2. Componenti Individuali

### 2.1 Barra Istituzionale (Institutional Bar)

**Posizione:** Fissa in cima alla pagina, full-width
**Aspetto:** Sfondo nero, testo bianco in maiuscoletto con letter-spacing largo
**Contenuto:** "UNIVERSITA DI CAGLIARI  DIGITAL HUMANITIES" (con bullet/dot separator)
**Altezza:** ~40-44px
**Comportamento:** Sempre visibile. Precede la navigazione.

**Domande:**
- [Q1] Il testo e il link dell'istituzione sono configurabili dal CMS o hardcoded?
- [Q2] Questa barra deve essere presente su TUTTE le pagine o solo sulla homepage del glossario?

---

### 2.2 Navigazione Principale (Main Nav)

**Posizione:** Sotto la barra istituzionale, con sfondo bianco
**Elementi:**
- Link: HOME, PROGETTO, METODOLOGIA (maiuscoletto, sans-serif, letter-spacing)
- Icona a destra: toggle tema chiaro/scuro (cerchio mezzo nero/mezzo bianco)
**Allineamento:** Centrato orizzontalmente
**Separatore:** Nessun bordo inferiore visibile, si fonde col contenuto

**Comportamento:**
- I link corrispondono alle pagine statiche (ContenutiStatici) del lemmario corrente
- HOME punta alla pagina del glossario (lista lemmi)
- PROGETTO e METODOLOGIA puntano a `/[lemmario-slug]/pagine/[slug]`

**Domande:**
- [Q3] Le voci di navigazione sono fisse (HOME, PROGETTO, METODOLOGIA) o dinamiche dal CMS?
- [Q4] Il toggle tema scuro va implementato? Se si, cosa cambia? (sfondo scuro, testo chiaro, inversione colori?)
- [Q5] La navigazione deve diventare sticky allo scroll o scorre via con il contenuto?

---

### 2.3 Sidebar Alfabetica (Alphabet Index)

**Posizione:** Fissa a sinistra, verticale, dalla A alla Z
**Aspetto:** Lettere singole in colonna, grigio chiaro. La lettera attiva (corrispondente alla sezione corrente) ha sfondo scuro con testo bianco (nel mockup la "B" sembra evidenziata)
**Dimensione:** ~20px per lettera, spaziatura verticale ~4-6px

**Comportamento:**
- Click su una lettera filtra i lemmi mostrando solo quelli che iniziano con quella lettera
- Aggiorna l'indicatore "Sezione: X" e il conteggio lemmi
- Potrebbe aggiornare l'URL (query param `?lettera=B` o segmento)
- Se una lettera non ha lemmi, appare disabilitata (grigio piu chiaro) o nascosta

**Domande:**
- [Q6] La sidebar alfabetica deve essere fissa (sticky) durante lo scroll o scorrevole?
- [Q7] Le lettere senza lemmi devono essere visibili ma disabilitate, oppure nascoste?
- [Q8] Il filtro per lettera agisce lato client (filtra dati gia caricati) o lato server (nuova query API)?
- [Q9] La sidebar deve apparire su mobile? Se si, come? (barra orizzontale scrollabile in alto?)

---

### 2.4 Area Hero / Titolo Glossario

**Posizione:** Sezione superiore principale, sotto la nav
**Contenuto:**
- Titolo del glossario in font serif grande: "Glossario dei termini su Ordine, Calcolo e Ragione nell'Italia tardomedievale"
- Sottotitolo/conteggio: "Sezione: B -- 224 lemmi catalogati" (serif italico, centrato)
- Separatore orizzontale sotto il sottotitolo

**Comportamento:**
- Il titolo viene dal campo `nome` o `descrizione` del Lemmario
- Il conteggio e la sezione si aggiornano dinamicamente al cambio lettera
- Il formato "Sezione: X -- N lemmi catalogati" mostra la lettera attiva e il conteggio filtrato

**Domande:**
- [Q10] Il titolo grande corrisponde al campo `nome` del Lemmario nel CMS? O e un campo separato?
- [Q11] "224 lemmi catalogati" conta tutti i lemmi del glossario o solo quelli pubblicati?
- [Q12] Il sottotitolo deve mostrare anche il conteggio totale quando nessuna lettera e selezionata? (es. "Tutti -- 224 lemmi catalogati")

---

### 2.5 Barra di Ricerca

**Posizione:** Sotto il separatore dell'hero, centrata, larghezza ~60% del contenuto
**Aspetto:** Input field con icona lente a sinistra, placeholder "Cerca un termine nel glossario...", bordo inferiore sottile (stile underline, non box completo)
**Stile:** Minimale, senza bordi laterali/superiore -- solo underline

**Comportamento:**
- Ricerca in tempo reale con debounce (~300ms)
- Filtra i lemmi visibili per termine (contiene la stringa cercata)
- Interagisce con il filtro alfabetico: la ricerca potrebbe resettare il filtro lettera o cercare trasversalmente
- Possibile dropdown di suggerimenti (autocomplete) sotto l'input

**Domande:**
- [Q13] La ricerca filtra solo i lemmi della sezione/lettera corrente o cerca in tutto il glossario?
- [Q14] Deve esserci un dropdown di autocomplete o basta il filtraggio della lista?
- [Q15] La ricerca deve cercare anche nel testo delle definizioni o solo nel termine del lemma?

---

### 2.6 Card Lemma (Lemma Card)

**Struttura di ogni card:**

```
+-----------------------------------------+
| termine (serif, bold)        VOLGARE    |
| 2 DEF. . 5 FONTI                       |
|                                         |
| Testo della prima definizione,          |
| troncato a ~3 righe con ellipsis...     |
+-----------------------------------------+
```

**Elementi:**
1. **Termine** (es. "abbattere"): Font serif bold, ~22px, colore nero. E un link cliccabile alla pagina di dettaglio del lemma
2. **Badge tipo** (es. "VOLGARE", "LATINE"): Allineato a destra, maiuscoletto, sans-serif, grigio. Nessun bordo o sfondo colorato
3. **Metadati** (es. "2 DEF. . 5 FONTI"): Riga sotto il termine, maiuscoletto piccolo, grigio, con dot separator. Mostra il numero di definizioni e il numero totale di fonti citate
4. **Preview testo**: Prime ~3 righe della prima definizione (o un abstract). Testo sans-serif, grigio scuro, con troncamento `line-clamp`

**Layout:** Griglia a 2 colonne. Le card non hanno bordi visibili ne sfondo diverso -- si distinguono per il whitespace e la tipografia.

**Comportamento:**
- Click sul termine naviga a `/[lemmario-slug]/lemmi/[termine]`
- Hover: possibile underline sul termine o leggero cambio opacita
- Le card si alternano per riempire la griglia da sinistra a destra, dall'alto in basso

**Domande:**
- [Q16] "5 FONTI" indica il numero di fonti distinte o il numero totale di ricorrenze?
- [Q17] Il testo di preview e la prima definizione troncata, o un campo "abstract" separato?
- [Q18] Le card devono avere effetto hover? (es. sfondo grigio leggerissimo, ombra leggera?)
- [Q19] Su mobile la griglia diventa 1 colonna?

---

### 2.7 Paginazione

**Posizione:** Sotto la griglia dei lemmi, separata da linea orizzontale
**Elementi:**
- "PRECEDENTE" a sinistra (maiuscoletto)
- Numeri pagina al centro: 1, 2, 3, ..., 24
- "SUCCESSIVA" a destra (maiuscoletto)
- Pagina corrente (1) in grassetto/evidenziata

**Stile:** Minimalista, nessun bordo sui numeri, solo testo. L'ellipsis (...) indica le pagine intermedie nascoste.

**Comportamento:**
- Aggiorna la lista lemmi senza ricaricare la pagina (o con query param `?page=N`)
- La paginazione riflette il filtro attivo (lettera + ricerca)
- "PRECEDENTE" disabilitato a pagina 1, "SUCCESSIVA" disabilitato all'ultima pagina

**Domande:**
- [Q20] Quanti lemmi per pagina? (dal mockup: 6 card visibili, 3 righe x 2 colonne -- quindi 6 per pagina?)
- [Q21] La paginazione deve essere lato client (tutti i lemmi caricati, paginati in JS) o lato server (API paginata)?

---

### 2.8 Footer

**Struttura a 2 colonne principali:**

| ISTITUZIONE | CORRISPONDENZA |
|---|---|
| Universita di Cagliari | info@unica-dh.it (link) |
| *Dipartimento di Lettere, Lingue e Beni Culturali* | |
| *Laboratorio di Digital Humanities per il Medioevo.* | |

**Sotto le colonne:**
- Copyright: "@ 2024 UNICA" (maiuscoletto)
- Link: PRIVACY, CONTATTI (maiuscoletto)

**Stile:**
- Label (ISTITUZIONE, CORRISPONDENZA) in maiuscoletto sans-serif
- Testo in serif italico
- Email con underline
- Separatore superiore (linea orizzontale)

**Domande:**
- [Q22] I contenuti del footer (istituzione, email, copyright) sono configurabili dal CMS o hardcoded?
- [Q23] I link PRIVACY e CONTATTI puntano a pagine statiche del CMS?

---

## 3. Applicazione alle Altre Pagine

Il design del mockup definisce un **sistema coerente** riutilizzabile. Ecco come i componenti si mappano sulle altre pagine:

### 3.1 Homepage Globale (lista lemmari)

La pagina che elenca tutti i glossari/lemmari disponibili.

**Componenti condivisi:** Barra istituzionale, Nav (senza voci specifiche), Footer
**Differenze:**
- Nessuna sidebar alfabetica
- Nessuna barra di ricerca (o una generica)
- Titolo hero diverso (es. "Digital Humanities - Glossari")
- Grid di card lemmari (non lemmi) -- potrebbe usare lo stesso layout a 2 colonne

**Domande:**
- [Q24] La homepage globale deve avere un design specifico o segue lo stesso pattern del glossario?
- [Q25] Le card dei lemmari devono mostrare conteggio lemmi, descrizione breve, o altro?

### 3.2 Pagina Dettaglio Lemma

La pagina che mostra tutte le informazioni di un singolo lemma.

**Componenti condivisi:** Barra istituzionale, Nav, Sidebar alfabetica (?), Footer
**Contenuto specifico:**
- Termine in grande (serif)
- Badge tipo (VOLGARE/LATINE)
- Varianti grafiche
- Lista definizioni complete (non troncate)
- Per ogni definizione: livello di razionalita, ricorrenze con citazioni
- Riferimenti incrociati (CFR, VEDI, VEDI_ANCHE)
- Eventuale etimologia

**Domande:**
- [Q26] La sidebar alfabetica deve apparire anche nel dettaglio lemma (per navigare ai lemmi adiacenti)?
- [Q27] C'e un mockup per la pagina dettaglio lemma? O devo dedurre lo stile dal design system?
- [Q28] Come vengono visualizzate le ricorrenze? Testo originale medievale in evidenza (citazione)?
- [Q29] I riferimenti incrociati devono essere link cliccabili al lemma collegato?

### 3.3 Pagina Ricerca

**Componenti condivisi:** Barra istituzionale, Nav, Footer
**Contenuto specifico:**
- Barra di ricerca prominente (stessa del glossario ma piu grande?)
- Risultati come lista di card lemma (stesso formato)
- Filtri aggiuntivi? (per tipo, per lettera, per glossario)

**Domande:**
- [Q30] La pagina di ricerca e separata o integrata nella pagina glossario tramite la search bar?

### 3.4 Pagine Statiche (Progetto, Metodologia, etc.)

**Componenti condivisi:** Barra istituzionale, Nav, Footer
**Contenuto specifico:**
- Titolo pagina in serif grande (stile hero)
- Contenuto Lexical renderizzato con stili coerenti
- Nessuna sidebar alfabetica

### 3.5 Bibliografia

**Componenti condivisi:** Barra istituzionale, Nav, Footer
**Contenuto specifico:**
- Lista fonti, possibilmente raggruppate per lettera o tipo
- Stessa estetica tipografica delle card

**Domande:**
- [Q31] La pagina bibliografia deve usare lo stesso layout a 2 colonne o una lista verticale?

---

## 4. Cambiamenti Rispetto al Frontend Attuale

Il nuovo design richiede modifiche significative:

| Aspetto | Attuale | Nuovo |
|---------|---------|-------|
| Colore primario | Sky blue (`#0ea5e9`) | Nero/grigio (`#1a1a1a`) |
| Font titoli | Merriweather | Serif editoriale (Playfair Display / Cormorant Garamond) |
| Font body | Inter | Inter o simile sans-serif (confermato) |
| Card style | Bordi + ombre + sfondo bianco | Nessun bordo, solo tipografia e whitespace |
| Badge | Pill colorate (primary, success, etc.) | Testo maiuscoletto grigio, nessun background |
| Header | Sticky bianco con logo "Lemmario" | Barra nera istituzionale + nav centrata |
| Footer | 3 colonne con sfondo grigio | 2 colonne minimali su bianco |
| Sidebar alfabetica | Non presente | Nuova, fissa a sinistra |
| Paginazione | Stile pill/bottoni | Testo puro maiuscoletto |
| Estetica generale | Web app moderna SaaS | Pubblicazione accademica digitale |

---

## 5. Riepilogo Domande per il Committente

### Configurazione e Dati
- **Q1**: La barra istituzionale e configurabile dal CMS?
- **Q2**: La barra istituzionale appare su tutte le pagine?
- **Q3**: Le voci di navigazione sono fisse o dinamiche?
- **Q10**: Il titolo del glossario corrisponde a quale campo del CMS?
- **Q11**: Il conteggio lemmi include solo i pubblicati?
- **Q16**: "FONTI" = fonti distinte o totale ricorrenze?
- **Q17**: Il testo preview delle card e la prima definizione troncata?
- **Q22**: I contenuti del footer sono configurabili?
- **Q23**: PRIVACY e CONTATTI sono pagine statiche CMS?

### Comportamento Interattivo
- **Q4**: Il toggle tema scuro va implementato?
- **Q5**: La navigazione deve essere sticky?
- **Q6**: La sidebar alfabetica deve essere sticky?
- **Q8**: Il filtro lettera agisce lato client o server?
- **Q13**: La ricerca e globale o filtrata per lettera?
- **Q14**: Serve un autocomplete dropdown?
- **Q15**: La ricerca include il testo delle definizioni?
- **Q20**: Quanti lemmi per pagina?
- **Q21**: Paginazione lato client o server?
- **Q30**: Ricerca separata o integrata?

### Responsive e Mobile
- **Q7**: Lettere senza lemmi: disabilitate o nascoste?
- **Q9**: Sidebar alfabetica su mobile?
- **Q18**: Le card hanno effetto hover?
- **Q19**: Su mobile la griglia diventa 1 colonna?

### Altre Pagine
- **Q24**: La homepage globale ha un design specifico?
- **Q25**: Cosa mostrano le card dei lemmari?
- **Q26**: Sidebar alfabetica nel dettaglio lemma?
- **Q27**: Esiste un mockup per il dettaglio lemma?
- **Q28**: Come si visualizzano le ricorrenze?
- **Q29**: I riferimenti incrociati sono link cliccabili?
- **Q31**: Layout della pagina bibliografia?

---

## 6. Raccomandazioni Tecniche

### Font
Consiglio di valutare queste opzioni serif per i titoli (tutte Google Fonts, gratuite):
1. **Cormorant Garamond** - Molto simile allo stile del mockup, elegante e accademico
2. **Playfair Display** - Alto contrasto, editoriale
3. **Spectral** - Progettato per la lettura su schermo, buona resa a piccole dimensioni
4. **EB Garamond** - Classico, ottimo per contesti umanistici

### Implementazione Sidebar Alfabetica
- Componente client (`'use client'`) con stato per lettera attiva
- CSS `position: sticky` con `top` calcolato
- Su mobile: trasformare in barra orizzontale scrollabile (`overflow-x: auto`)

### Dark Mode
Se implementato:
- CSS variables per i colori (`--color-text`, `--color-bg`, etc.)
- `prefers-color-scheme` media query + toggle manuale
- Salvare preferenza in `localStorage`

### Tailwind Config
Aggiornare `tailwind.config.js` con:
- Nuova palette colori (nero/grigio)
- Font serif personalizzato
- Utility per maiuscoletto (`tracking-widest` + `uppercase` + `text-xs`)
