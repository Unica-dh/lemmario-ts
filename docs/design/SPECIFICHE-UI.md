# Specifiche UI - Nuovo Design Lemmario

Documento completo di specifiche per l'implementazione del nuovo design frontend. Tutte le domande sono state risolte.

Mockup di riferimento: `docs/design/Dettaglio glossario.png`

---

## 1. Design System Generale

### 1.1 Estetica

Il design ha un'impronta **accademica e tipografica**, minimalista, con ampio uso di bianco/nero e grigio chiaro. L'atmosfera richiama pubblicazioni editoriali e cataloghi di ricerca umanistica. Nessun colore primario vivace (il blu sky attuale va eliminato). Supporto **dark mode** previsto fin dall'inizio.

### 1.2 Palette Colori

#### Light Mode (dal mockup)

| Ruolo | Colore | CSS Variable | Uso |
| ----- | ------ | ------------ | --- |
| Testo principale | `#1a1a1a` | `--color-text` | Titoli, termini dei lemmi |
| Testo secondario | `#6b6b6b` | `--color-text-muted` | Metadati, label, badge tipo |
| Testo corpo | `#3a3a3a` | `--color-text-body` | Testo definizioni, paragrafi |
| Sfondo pagina | `#ffffff` | `--color-bg` | Sfondo principale |
| Sfondo secondario | `#f5f5f5` | `--color-bg-subtle` | Hover card, sezioni alternate |
| Sfondo header istituzionale | `#1a1a1a` | `--color-bg-inverse` | Barra superiore |
| Testo header istituzionale | `#ffffff` | `--color-text-inverse` | Testo barra superiore |
| Linee divisorie | `#d4d4d4` | `--color-border` | Separatori orizzontali |
| Sidebar alfabetica | `#9a9a9a` | `--color-text-disabled` | Lettere non selezionate |
| Sidebar lettera attiva | `#1a1a1a` su sfondo | -- | Lettera corrente evidenziata |

#### Dark Mode

| Ruolo | Colore |
| ----- | ------ |
| Sfondo pagina | `#121212` |
| Sfondo secondario | `#1e1e1e` |
| Testo principale | `#e8e8e8` |
| Testo corpo | `#c8c8c8` |
| Testo secondario | `#8a8a8a` |
| Linee divisorie | `#333333` |
| Barra istituzionale | `#0a0a0a` con testo `#d0d0d0` |

### 1.3 Tipografia

| Elemento | Font | Peso | Dimensione | Stile |
| -------- | ---- | ---- | ---------- | ----- |
| Titolo glossario (hero) | Serif (Cormorant Garamond) | Regular | ~48-56px | Interlinea stretta |
| Termine lemma (card) | Serif (idem) | Bold | ~22-24px | Normale |
| Testo definizione (card) | Sans-serif (Inter) | Regular | ~15-16px | Interlinea 1.5-1.6 |
| Label metadati | Sans-serif | Medium | ~11-12px | MAIUSCOLETTO, letter-spacing ampio |
| Badge tipo | Sans-serif | Regular | ~11-12px | MAIUSCOLETTO, grigio, allineato dx |
| Navigazione | Sans-serif | Regular | ~12-13px | MAIUSCOLETTO, letter-spacing |
| Barra istituzionale | Sans-serif | Regular | ~11px | MAIUSCOLETTO, letter-spacing largo |
| Sezione/conteggio | Serif | Regular | ~14px | Italico |
| Footer label | Sans-serif | Regular | ~11px | MAIUSCOLETTO |
| Footer testo | Serif | Italic | ~14-15px | Italico |
| Paginazione | Sans-serif | Regular | ~13px | MAIUSCOLETTO |

**Caratteristica dominante:** uso estensivo di **maiuscoletto con letter-spacing** per tutti gli elementi UI. Contrasto forte tra serif grande dei titoli e sans-serif piccolo delle label.

### 1.4 Spaziatura e Layout

- **Max-width:** ~1200px, centrato, padding orizzontale ~80-100px
- **Griglia lemmi:** 2 colonne desktop, 1 colonna mobile, gap ~40-60px orizzontale, ~40-50px verticale
- **Lemmi per pagina:** 16 (8 righe x 2 colonne)
- **Separatori:** `1px solid var(--color-border)`
- **Whitespace:** molto generoso

---

## 2. Componenti Individuali

### 2.1 Barra Istituzionale (Institutional Bar)

- **Posizione:** Fissa in cima, full-width, presente su **tutte le pagine**
- **Aspetto:** Sfondo nero, testo bianco maiuscoletto, letter-spacing largo
- **Contenuto:** Derivato dalle **pagine statiche globali** (ContenutiStatici non associate a nessun glossario)
- **Altezza:** ~40-44px

### 2.2 Navigazione Principale (Main Nav)

- **Posizione:** Sotto la barra istituzionale, sfondo bianco/`var(--color-bg)`, **sticky** (resta fissa allo scroll)
- **Elementi:**
  - Link **dinamici**: generati dalle pagine statiche (ContenutiStatici) del lemmario corrente, in maiuscoletto
  - HOME punta alla pagina del glossario corrente
  - Le altre voci puntano a `/[lemmario-slug]/pagine/[slug]`
  - Toggle tema chiaro/scuro (icona cerchio mezzo nero/mezzo bianco) allineato a destra
- **Allineamento:** Centrato orizzontalmente

**Dark mode:** CSS custom properties + `prefers-color-scheme` + toggle manuale. Preferenza in `localStorage`. Tailwind `darkMode: 'class'`.

### 2.3 Sidebar Alfabetica (Alphabet Index)

- **Posizione:** Fissa a sinistra, verticale A-Z, **sticky** (resta visibile durante lo scroll della lista lemmi)
- **Aspetto:** Lettere in colonna, grigio. Lettera attiva: sfondo scuro + testo bianco
- **Lettere senza lemmi:** visibili ma **disabilitate** (grigio chiaro, non cliccabili)
- **Dimensione:** ~20px per lettera, spaziatura ~4-6px

**Comportamento:**

- Click su lettera: query API server-side per i lemmi che iniziano con quella lettera
- Aggiorna URL con `?lettera=B`
- Aggiorna indicatore "Sezione: X" e conteggio

**Mobile:** Drawer/modale alfabetico. Un bottone fisso (lettera corrente o icona "A-Z") apre un overlay con le 26 lettere in griglia 6x5. Lettere disabilitate in grigio chiaro. Click su lettera chiude drawer e filtra.

### 2.4 Area Hero / Titolo Glossario

- **Titolo:** Campo `nome` del Lemmario nel CMS, font serif grande
- **Sottotitolo con lettera attiva:** "Sezione: B -- N lemmi catalogati" (serif italico, centrato)
- **Sottotitolo senza lettera:** Solo "N lemmi catalogati" (senza prefisso "Sezione:")
- **Conteggio:** Solo lemmi **pubblicati**
- **Separatore:** Linea orizzontale sotto il sottotitolo

### 2.5 Barra di Ricerca

- **Posizione:** Sotto il separatore, centrata, ~60% larghezza
- **Aspetto:** Stile underline (solo bordo inferiore), icona lente a sinistra
- **Placeholder:** "Cerca un termine nel glossario..."

**Comportamento:**

- Debounce ~300ms
- Cerca nei **termini E nel testo delle definizioni**
- La ricerca **resetta il filtro lettera** (ricerca globale su tutto il glossario)
- **Nessun dropdown autocomplete**: aggiorna direttamente la griglia dei risultati
- La paginazione si adatta ai risultati filtrati

### 2.6 Card Lemma (Lemma Card)

```text
+-----------------------------------------------------+
| termine (serif, bold)                    VOLGARE     |
| 2 DEF. · 5 FONTI · 12 RICORRENZE                   |
|                                                      |
| Testo della prima definizione, troncato              |
| a ~3 righe con ellipsis...                           |
+-----------------------------------------------------+
```

**Elementi:**

1. **Termine**: Serif bold ~22px, nero. Link a `/[lemmario-slug]/lemmi/[termine]`
2. **Badge tipo**: "VOLGARE" o "LATINE", maiuscoletto grigio, allineato a destra, nessun bordo/sfondo
3. **Metadati**: "N DEF. · N FONTI · N RICORRENZE" -- maiuscoletto piccolo, grigio, dot separator. Fonti = fonti distinte, Ricorrenze = totale
4. **Preview**: Prima definizione troncata a ~3 righe con `line-clamp-3`

**Layout:** 2 colonne desktop, 1 colonna mobile. Nessun bordo visibile.

**Hover:** Sfondo `var(--color-bg-subtle)` con transizione morbida (~200ms).

### 2.7 Paginazione

- **Posizione:** Sotto la griglia, separata da linea orizzontale
- **Elementi:** "PRECEDENTE" -- numeri -- "SUCCESSIVA" (tutto maiuscoletto)
- **16 lemmi per pagina**, paginazione **lato server**
- Aggiorna URL con `?page=N`
- Riflette filtro lettera + ricerca attivi
- Pagina corrente in grassetto
- PRECEDENTE disabilitato a pagina 1, SUCCESSIVA all'ultima
- Ellipsis (...) per pagine intermedie

### 2.8 Footer

- **Separatore:** Linea orizzontale superiore
- **Contenuti:** Derivati dalle **pagine statiche globali** (non associate a glossario)

**Struttura 2 colonne:**

| ISTITUZIONE | CORRISPONDENZA |
| --- | --- |
| Universita di Cagliari | info@unica-dh.it (link mailto) |
| *Dipartimento di Lettere, Lingue e Beni Culturali* | |
| *Laboratorio di Digital Humanities per il Medioevo.* | |

**Riga inferiore:** (c) 2024 UNICA · PRIVACY · CONTATTI (link a pagine statiche CMS)

**Stile:** Label in maiuscoletto sans-serif, testo in serif italico, email con underline.

---

## 3. Pagine dell'Applicazione

### 3.1 Homepage Globale (lista lemmari)

**Route:** `/`

```text
+----------------------------------------------------------+
| [Barra Istituzionale]                                     |
| [Nav: voci da pagine statiche globali · toggle dark]      |
|                                                            |
|              Glossario                                     |
|         N glossari disponibili                             |
|         ─────────────────────                              |
|                                                            |
|  ┌──────────────────────┐  ┌──────────────────────┐      |
|  │  [foto]               │  │  [foto]               │      |
|  │  Nome Glossario       │  │  Nome Glossario       │      |
|  │  N LEMMI              │  │  N LEMMI              │      |
|  │  Descrizione breve    │  │  Descrizione breve    │      |
|  │  troncata...          │  │  troncata...          │      |
|  └──────────────────────┘  └──────────────────────┘      |
|                                                            |
| [Footer]                                                   |
+----------------------------------------------------------+
```

- **Titolo:** Statico, valore "Glossario"
- **Nessuna sidebar alfabetica**, nessuna barra di ricerca
- **Card lemmari** a 2 colonne desktop, 1 colonna mobile

**Card Lemmario:**

1. **Foto**: Immagine del lemmario (nuovo campo `foto` da aggiungere alla collection Lemmari nel backend, tipo Upload)
2. **Nome glossario**: Serif bold, link a `/[lemmario-slug]`
3. **Conteggio lemmi**: "N LEMMI" in maiuscoletto
4. **Descrizione**: Campo `descrizione` troncato a ~3 righe

**Modifica backend richiesta:** Aggiungere campo `foto` (tipo `upload`, media collection) alla collection **Lemmari**.

### 3.2 Pagina Glossario (lista lemmi)

**Route:** `/[lemmario-slug]`

Questa e la pagina del mockup. Componenti: Barra istituzionale + Nav sticky + Sidebar alfabetica sticky + Hero con titolo + Barra ricerca + Griglia card lemma (2 col) + Paginazione + Footer.

### 3.3 Pagina Dettaglio Lemma

**Route:** `/[lemmario-slug]/lemmi/[termine]`

```text
+----------------------------------------------------------+
| [Barra Istituzionale]                                     |
| [Nav sticky]                                               |
|                                                            |
|  ← Torna al glossario                                     |
|                                                            |
|        abbattere                           VOLGARE         |
|        ─────────────────────────────                       |
|                                                            |
|  VARIANTI GRAFICHE                                         |
|  abatere, abattere, abactere                              |
|                                                            |
|  ─────────────────────────────                             |
|                                                            |
|  DEFINIZIONE 1                    Livello: Pratico (3)     |
|                                                            |
|  Testo completo della definizione...                       |
|                                                            |
|    RICORRENZE                                              |
|    ┌──────────────────────────────────────────────┐       |
|    │ «testo originale medievale citato»             │       |
|    │         — Stat.fornai.1339, c. 12r, col. 2    │       |
|    └──────────────────────────────────────────────┘       |
|    ┌──────────────────────────────────────────────┐       |
|    │ «altra citazione dal testo»                    │       |
|    │         — Stat.senesi.1309, p. 45              │       |
|    └──────────────────────────────────────────────┘       |
|                                                            |
|  ─────────────────────────────                             |
|                                                            |
|  DEFINIZIONE 2                    Livello: Teorico (5)     |
|  ...                                                       |
|                                                            |
|  ─────────────────────────────                             |
|                                                            |
|  RIFERIMENTI                                               |
|  CFR → camera, moneta, ragione                            |
|  VEDI ANCHE → usura, mercatura                            |
|                                                            |
| [Footer]                                                   |
+----------------------------------------------------------+
```

**Componenti:**

- **Nessuna sidebar alfabetica** (navigazione via "Torna al glossario")
- **Nessuna navigazione prev/next** tra lemmi (basta "Torna al glossario")
- **Termine** in serif grande + badge tipo a destra
- **Varianti grafiche:** Elencate in serif italico, separate da virgola
- **Definizioni numerate:** Sezioni separate da linee orizzontali, livello di razionalita allineato a destra in maiuscoletto
- **Ricorrenze:** Blocchi citazione con:
  - Testo originale in serif italico tra guillemets «»
  - Fonte (shorthand) + campo `pagina_raw` **completo** (es. "c. 12r, colonna 2") allineati a destra con dash
- **Riferimenti incrociati:** Link cliccabili al lemma collegato, raggruppati per tipo (CFR, VEDI, VEDI_ANCHE)

### 3.4 Pagine Statiche (Progetto, Metodologia, etc.)

**Route:** `/[lemmario-slug]/pagine/[slug]`

```text
+----------------------------------------------------------+
| [Barra Istituzionale]                                     |
| [Nav sticky]                                               |
|                                                            |
|        Titolo della Pagina                                 |
|        ─────────────────────────────                       |
|                                                            |
|  Contenuto Lexical renderizzato:                           |
|  - Titoli in serif                                         |
|  - Paragrafi in sans-serif                                 |
|  - Blockquote con bordo sinistro                           |
|  - Max-width ~700px per leggibilita                        |
|                                                            |
| [Footer]                                                   |
+----------------------------------------------------------+
```

Layout a colonna singola centrata, max-width ~700px.

### 3.5 Bibliografia

**Route:** `/[lemmario-slug]/bibliografia`

```text
+----------------------------------------------------------+
| [Barra Istituzionale]                                     |
| [Nav sticky]                                               |
|                                                            |
|        Bibliografia                                        |
|        N fonti                                             |
|        ─────────────────────────────                       |
|  Cerca una fonte...                                        |
|                                                            |
|  A                                                         |
|  ─────────────────────────────                             |
|  Stat.Arte.Lana.1317                                      |
|  Statuto dell'Arte della Lana, Firenze, 1317              |
|  12 RICORRENZE                                             |
|                                                            |
|  B                                                         |
|  ─────────────────────────────                             |
|  ...                                                       |
+----------------------------------------------------------+
```

Lista verticale a colonna singola, raggruppata per lettera iniziale. Ogni fonte:

- Shorthand ID in serif bold
- Descrizione completa
- Conteggio ricorrenze in maiuscoletto

---

## 4. Cambiamenti Rispetto al Frontend Attuale

| Aspetto | Attuale | Nuovo |
| ------- | ------- | ----- |
| Colore primario | Sky blue (`#0ea5e9`) | Nero/grigio (`#1a1a1a`) |
| Dark mode | Non presente | Supporto completo con toggle |
| Font titoli | Merriweather | Cormorant Garamond (o simile) |
| Font body | Inter | Inter (confermato) |
| Card style | Bordi + ombre + sfondo bianco | Nessun bordo, hover subtle |
| Badge | Pill colorate | Testo maiuscoletto grigio |
| Header | Sticky bianco con logo "Lemmario" | Barra nera istituzionale + nav centrata sticky |
| Footer | 3 colonne con sfondo grigio | 2 colonne minimali su bianco |
| Sidebar alfabetica | Non presente | Sticky a sinistra (drawer su mobile) |
| Paginazione | Stile pill/bottoni | Testo puro maiuscoletto |
| Lemmi per pagina | Non definito | 16 |
| Ricerca | Solo termine | Termine + testo definizioni |
| Metadati card | Badge tipo | DEF + FONTI + RICORRENZE |
| Estetica | Web app SaaS | Pubblicazione accademica |

### Modifiche Backend Richieste

| Modifica | Collection | Dettaglio |
| -------- | ---------- | --------- |
| Nuovo campo `foto` | Lemmari | Campo upload (immagine) per la card nella homepage |

---

## 5. Tutte le Decisioni

| # | Domanda | Decisione |
| --- | ------- | --------- |
| Q1 | Barra istituzionale configurabile | Da pagine statiche globali (non associate a glossario) |
| Q2 | Barra su tutte le pagine | Si |
| Q3 | Voci navigazione | Dinamiche, da ContenutiStatici del lemmario corrente |
| Q4 | Dark mode | Implementato da subito |
| Q5 | Nav sticky | Si |
| Q6 | Sidebar sticky | Si |
| Q7 | Lettere senza lemmi | Visibili ma disabilitate |
| Q8 | Filtro lettera | Lato server (query API) |
| Q9 | Sidebar mobile | Drawer/modale con griglia lettere |
| Q10 | Titolo glossario | Campo `nome` del Lemmario. Homepage: statico "Glossario" |
| Q11 | Conteggio lemmi | Solo pubblicati |
| Q12 | Senza lettera selezionata | Solo "N lemmi catalogati", nessun prefisso "Sezione:" |
| Q13 | Ricerca e filtro lettera | Ricerca globale, resetta filtro lettera |
| Q14 | Autocomplete | No, aggiorna direttamente la griglia |
| Q15 | Ricerca definizioni | Si, termine + testo definizioni |
| Q16 | Metadati card | Fonti distinte + totale ricorrenze |
| Q17 | Preview card | Prima definizione troncata |
| Q18 | Hover card | Si, sfondo subtle con transizione |
| Q19 | Mobile griglia | 1 colonna |
| Q20 | Lemmi per pagina | 16 |
| Q21 | Paginazione | Lato server |
| Q22 | Footer | Da pagine statiche globali |
| Q23 | PRIVACY/CONTATTI | Pagine statiche CMS |
| Q24 | Homepage | Card lemmari a 2 colonne con foto |
| Q25 | Card lemmari | Nome + foto + descrizione + conteggio lemmi |
| Q26 | Nav prev/next lemma | No, basta "Torna al glossario" |
| Q27 | Mockup dettaglio | Design proposto in questo documento |
| Q28b | Ricorrenze | Mostra `pagina_raw` completo |
| Q29 | Riferimenti incrociati | Link cliccabili |
| Q30 | Pagina ricerca | Integrata nel glossario |
| Q31 | Bibliografia | Lista verticale, raggruppata per lettera |

---

## 6. Raccomandazioni Tecniche

### Font

Opzione consigliata: **Cormorant Garamond** (Google Fonts, gratuito). Molto simile allo stile del mockup, elegante e accademico. Alternative: Playfair Display, EB Garamond.

### Dark Mode

- CSS custom properties per tutti i colori
- Classe `.dark` su `<html>` controllata da toggle + `prefers-color-scheme`
- `localStorage` per persistenza preferenza
- Tailwind `darkMode: 'class'`

### Sidebar Alfabetica Mobile (Drawer)

- Bottone fisso in basso a destra con lettera corrente o icona "A-Z"
- Click apre overlay con griglia 6 colonne x 5 righe
- Lettere disabilitate in grigio chiaro
- Click su lettera chiude drawer e filtra

### Tailwind Config

- CSS variables per colori (supporto dark mode)
- Font serif: `Cormorant Garamond`
- Utility per maiuscoletto: `uppercase tracking-widest text-xs`
- `darkMode: 'class'`

### Componenti da Creare/Riscrivere

| Componente | Stato | Note |
| ---------- | ----- | ---- |
| InstitutionalBar | Nuovo | Barra nera in cima |
| MainNav | Riscrivere | Sticky, dinamico, dark mode toggle |
| AlphabetSidebar | Nuovo | Desktop: sticky laterale. Mobile: drawer |
| HeroSection | Nuovo | Titolo + sezione + conteggio |
| SearchBar | Riscrivere | Stile underline, ricerca globale |
| LemmaCard | Riscrivere | Serif, no bordi, metadati estesi |
| LemmarioCard | Riscrivere | Con foto, conteggio, descrizione |
| Pagination | Riscrivere | Maiuscoletto, testo puro |
| Footer | Riscrivere | 2 colonne, da pagine statiche globali |
| ThemeToggle | Nuovo | Icona mezzo cerchio, dark mode |
| LemmaDetail | Riscrivere | Ricorrenze con `pagina_raw`, riferimenti come link |
| BibliografiaList | Riscrivere | Raggruppata per lettera, ricerca |
