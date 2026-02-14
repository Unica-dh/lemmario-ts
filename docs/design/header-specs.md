# Header Redesign - Specifiche di Design

Data: 2026-02-14
Riferimento mockup: `docs/design/Dettaglio glossario.png`

---

## 1. InstitutionalBar (riga superiore)

### Layout attuale
- Altezza fissa: `h-11` (44px)
- Contenuto: solo testo centrato "Universita degli Studi di Cagliari . Digital Humanities"
- Classe testo: `label-uppercase` (11px, uppercase, letter-spacing 0.15em, font-weight 500)
- Sticky `top-0`, z-index 50
- Bordo inferiore `border-b border-[var(--color-border)]`

### Layout proposto

```
+------------------------------------------------------------------+
|  [Logo UniCa]  UNIVERSITA DI CAGLIARI . DIGITAL HUMANITIES [DH]  |
+------------------------------------------------------------------+
```

**Struttura flex:**
- Container: `flex items-center justify-center` (come ora)
- Contenuto interno: `inline-flex items-center gap-2` per raggruppare logo-testo-logo
- Il blocco logo+testo+logo e centrato come unita singola nella pagina

**Logo UniCa (sinistra):**
- Posizione: immediatamente a sinistra del testo
- Altezza: **14px** (allineata alla line-height del testo label-uppercase a 11px font)
- Larghezza: auto (proporzionale, ~87px basato su viewBox 430x69 => ratio ~6.23:1 => 14*6.23 = ~87px)
- Gap dal testo: `gap-2` (8px)

**Logo DH (destra):**
- Posizione: immediatamente a destra di "Digital Humanities"
- Altezza: **14px** (stessa del logo UniCa per simmetria visiva)
- Larghezza: auto (proporzionale, viewBox quadrato 106x106 => ~14px)
- Gap dal testo: `gap-2` (8px)

### Gestione colori loghi per dark/light mode

**Problema:** Entrambi i loghi SVG usano `fill="#fff"` (bianco hardcoded), non `currentColor`.

**Soluzione raccomandata: CSS filter**

Questa e la soluzione piu semplice e manutenibile, senza duplicare file SVG:

```css
/* Light mode: logo bianco -> nero tramite invert */
.institutional-logo {
  filter: invert(1);   /* bianco -> nero */
}

/* Dark mode: logo bianco -> resta bianco (nessun filtro) */
.dark .institutional-logo {
  filter: none;
}
```

**Perche CSS filter e non alternative:**
- `currentColor`: richiederebbe modificare manualmente i path SVG di entrambi i loghi (UniCa ha 144 path elements), fragile e difficile da manutenere
- File SVG duplicati (black/white): duplicazione, piu file da gestire, logica condizionale per scegliere il file
- CSS filter: zero modifiche ai file SVG sorgente, una sola riga CSS, supporto browser universale

**Nota:** `filter: invert(1)` funziona perfettamente perche entrambi i loghi sono monocromatici bianchi. Se i loghi avessero piu colori, servirebbero filtri piu complessi.

### Altezza della barra
- Mantenere `h-11` (44px): sufficiente per il testo + loghi a 14px
- Il contenuto (14px loghi + gap) sta comodamente entro i 44px

---

## 2. MainNav (riga di navigazione)

### Layout attuale
- Link allineati a sinistra con `flex items-center space-x-6`
- ThemeToggle e MobileMenu a destra con `ml-auto`
- Sticky `top-11` (sotto InstitutionalBar), z-index 40
- Padding: `py-3`, bordo inferiore

### Layout proposto (dal mockup)

```
+------------------------------------------------------------------+
|           HOME    PROGETTO    METODOLOGIA    [Theme]              |
+------------------------------------------------------------------+
```

I link nel mockup sono **centrati** nella pagina, con il toggle tema allineato accanto.

**Struttura proposta:**

```
Container flex justify-center:
  [Links centrati]                                    [ThemeToggle]
```

**Opzione raccomandata:** Usare `justify-center` per il container dei link, con il ThemeToggle posizionato in `absolute` a destra per non influenzare il centraggio, oppure usare un layout a 3 colonne:

```
flex items-center:
  [spacer flex-1]  [nav-links flex-none]  [theme-toggle flex-1 justify-end]
```

La struttura a 3 colonne e preferibile: i link sono naturalmente centrati, il toggle resta a destra, nessun posizionamento assoluto.

**Link specifici del lemmario:**
- Nel mockup i link mostrati sono: HOME, PROGETTO, METODOLOGIA
- Quando si naviga un lemmario specifico, i link aggiuntivi (Bibliografia, contenuti del lemmario) appaiono dopo un separatore `·`
- Tutti i link restano centrati come gruppo

**Stile link (dal mockup):**
- Classe: `label-uppercase` (come attuale)
- Colore: `text-[var(--color-text-muted)]` con hover a `text-[var(--color-text)]`
- Spaziatura tra link: `space-x-6` (24px) - confermato dal mockup

**Hamburger mobile:**
- Rimane nascosto su desktop (`md:hidden`)
- Su mobile appare a destra

---

## 3. Scroll Behavior - Header compresso

### Stato attuale
- InstitutionalBar: sticky `top-0`, sempre visibile
- MainNav: sticky `top-11`, sempre visibile
- Le due righe occupano complessivamente ~88px (44px + ~44px)

### Comportamento proposto

**Trigger:** scroll Y > **60px** (circa quando il contenuto del titolo inizia a scorrere via)

**Stato espanso (scroll = 0):**
```
+-----------------------------------------------------------+  44px
|  [UniCa]  UNIVERSITA DI CAGLIARI . DIGITAL HUMANITIES [DH]|
+-----------------------------------------------------------+
|           HOME    PROGETTO    METODOLOGIA    [Theme]       |  44px
+-----------------------------------------------------------+
                                                         Tot: 88px
```

**Stato compresso (scroll > 60px):**
```
+-----------------------------------------------------------+  36px
|  [UniCa] UNICA . DH    HOME  PROGETTO  METODOLOGIA [Theme]|
+-----------------------------------------------------------+
                                                         Tot: 36px
```

### Dettagli versione compressa

**Layout a singola riga:**
```
flex items-center justify-between:
  [Logo UniCa + "UNICA . DH"]    [nav links]    [ThemeToggle]
```

- Il testo istituzionale si accorcia: "UNICA . DH" (da "Universita degli Studi di Cagliari . Digital Humanities")
- Logo UniCa: altezza ridotta a **12px**
- Logo DH: nascosto (spazio insufficiente, ridondante con "DH" nel testo)
- Font link nav: stesso `label-uppercase` (11px), spaziatura ridotta `space-x-4` (16px)
- Altezza barra: **36px** (`h-9`)
- Padding verticale: `py-1.5` (6px)
- Un unico bordo inferiore

**Alternativa semplificata (raccomandata):**
Se la complessita di fusione e eccessiva, una versione piu semplice:
- Su scroll > 60px: nascondere InstitutionalBar (slide-up), MainNav si sposta a `top-0`
- InstitutionalBar riappare quando si scrolla verso l'alto (scroll direction detection)
- Questo approccio e molto piu semplice da implementare e mantiene la separazione dei componenti

### Transizione/Animazione

**Per la versione compressa (fusione):**
```css
.header-wrapper {
  transition: height 250ms ease, padding 250ms ease;
}

.institutional-text {
  transition: opacity 200ms ease, max-width 200ms ease;
}
```

**Per la versione semplificata (nascondi/mostra):**
```css
.institutional-bar {
  transition: transform 300ms ease;
}

.institutional-bar.hidden-scroll {
  transform: translateY(-100%);
}

.main-nav {
  transition: top 300ms ease;
}
```

### Implementazione tecnica suggerita

Serve un componente wrapper client-side (`HeaderWrapper`) che:
1. Usa `useEffect` + `window.addEventListener('scroll', ...)` con throttling (requestAnimationFrame)
2. Traccia `scrollY` e opzionalmente `scrollDirection` (per show-on-scroll-up)
3. Applica classe CSS condizionale per lo stato compresso
4. InstitutionalBar e MainNav diventano figli di questo wrapper

```
<HeaderWrapper>        ← client component, gestisce scroll state
  <InstitutionalBar /> ← server component (wrappato)
  <MainNav />          ← server component (wrappato)
</HeaderWrapper>
```

**Nota:** MainNav e async server component. Per funzionare dentro un client wrapper, i dati devono essere fetchati nel layout e passati come props, oppure MainNav resta server component e il wrapper usa composition pattern (`children`).

---

## 4. Responsive / Mobile

### Breakpoint: < 768px (`md:`)

**InstitutionalBar mobile:**
- Il testo "UNIVERSITA DI CAGLIARI . DIGITAL HUMANITIES" potrebbe essere troppo lungo
- Opzione 1: accorciare a "UNICA . DH" su mobile
- Opzione 2: nascondere il testo, mostrare solo i loghi (troppo piccoli da soli)
- **Raccomandazione:** accorciare a "UNICA . DIGITAL HUMANITIES" o "UNICA . DH"
- Loghi: stessa altezza 14px
- Dal mockup: il testo appare invariato (desktop-first), la pagina non mostra viewport mobile

**MainNav mobile:**
- Gia gestito: hamburger menu con drawer slide-in da destra
- I link desktop sono `hidden md:flex`, l'hamburger e `md:hidden`
- Nessuna modifica necessaria al comportamento mobile esistente

**Scroll behavior mobile:**
- Stesso comportamento del desktop
- La versione compressa e ancora piu utile su mobile per risparmiare spazio verticale

### Breakpoint: < 640px (`sm:`)

- InstitutionalBar: testo abbreviato "UNICA . DH"
- Loghi: altezza ridotta a 12px per dare piu respiro

---

## 5. Riepilogo misure

| Elemento | Espanso | Compresso |
|----------|---------|-----------|
| InstitutionalBar altezza | 44px (`h-11`) | 0px (nascosta) o inclusa in riga unica |
| MainNav altezza | ~44px | 36px (`h-9`) se fusa, 44px se solo spostata |
| Altezza totale header | ~88px | 36-44px |
| Logo UniCa altezza | 14px | 12px |
| Logo DH altezza | 14px | nascosto |
| Font link | 11px label-uppercase | invariato |
| Gap tra link | 24px (`space-x-6`) | 16px (`space-x-4`) se fusa |
| Trigger scroll | - | scrollY > 60px |
| Transizione | - | 250-300ms ease |

---

## 6. File SVG da gestire

### Logo UniCa
- **Sorgente:** `https://www.unica.it/themes/custom/unica_base/images/Logo.svg`
- **Salvare come:** `packages/frontend/public/images/unica-logo.svg`
- **ViewBox:** 430 x 69 (orizzontale, ~6.2:1 ratio)
- **Colore nativo:** bianco (`#FFFFFF`)
- **Struttura:** 144 path elements, nessun testo

### Logo DH
- **Sorgente:** `docs/design/DH_logo_[white].svg`
- **Copiare in:** `packages/frontend/public/images/dh-logo.svg`
- **ViewBox:** 106.817 x 106.743 (quadrato)
- **Colore nativo:** bianco (`#fff`)
- **Struttura:** mix di path e polygon, nessun testo

### Applicazione CSS filter per entrambi
```css
.institutional-logo {
  height: 14px;
  width: auto;
  filter: invert(1);  /* bianco -> nero in light mode */
}

.dark .institutional-logo,
:root:not(.light) .institutional-logo {
  filter: none;  /* resta bianco in dark mode */
}
```

Il `@media (prefers-color-scheme: dark)` va gestito coerentemente con il pattern gia presente in `globals.css` (riga 37-51).

---

## 7. Accessibilita

- I loghi devono avere `alt` text appropriato: "Logo Universita di Cagliari", "Logo Digital Humanities"
- Se usati come `<img>`, aggiungere `role="img"` e `alt`
- Se decorativi (il testo gia descrive l'istituzione), usare `alt=""` e `aria-hidden="true"`
- **Raccomandazione:** i loghi sono decorativi (il testo adiacente gia identifica l'istituzione), quindi `aria-hidden="true"` e `alt=""`
- Il header compresso deve mantenere tutti i link navigabili da tastiera
- Il cambio di layout su scroll non deve spostare il focus

---

## 8. Raccomandazione implementativa

**Approccio consigliato:** versione semplificata dello scroll behavior.

Piuttosto che fondere le due righe in una sola (che richiede logica complessa e potenziali problemi con server components), l'approccio piu pulito e:

1. Su scroll > 60px: InstitutionalBar scorre via (slide-up con `transform: translateY(-100%)`)
2. MainNav resta sticky e si sposta a `top-0` (da `top-11`)
3. Su scroll verso l'alto (opzionale): InstitutionalBar riappare

Questo approccio:
- Mantiene la separazione dei componenti
- Non richiede ristrutturare i server components
- E il pattern piu comune nei siti istituzionali
- Produce lo stesso effetto visivo di risparmio spazio

La fusione in una riga unica resta un'opzione futura se richiesta esplicitamente.
