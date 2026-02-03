# Piano di Lavoro: Correzione Navigazione e Visualizzazione Frontend

**Data creazione**: 3 febbraio 2026  
**Responsabile**: Team di sviluppo  
**Stato**: 🔴 Da Iniziare

## Analisi Situazione Attuale

### Problemi Identificati

#### 1. **Home Page** - CRITICO ❌
- **Problema**: La home page (`/`) mostra "Nessun lemmario disponibile al momento" e fa redirect al primo lemmario, invece di elencare tutti i lemmari disponibili
- **File coinvolto**: [packages/frontend/src/app/page.tsx](../packages/frontend/src/app/page.tsx)
- **Comportamento attuale**: Redirect automatico a `/{slug-primo-lemmario}/`
- **Comportamento desiderato**: Griglia/lista di tutti i lemmari con blocchi visivi evidenti

#### 2. **Routing Lemmari** - CRITICO ❌
- **Problema**: Il lemmario "Matematica" è accessibile su `/lemmari` invece che su un URL corretto
- **URL attuale**: `http://localhost:3001/lemmari` (mostra direttamente i lemmi di matematica)
- **URL corretto**: Dovrebbe essere `/{lemmario-slug}` (es: `/matematica`)
- **File coinvolti**: 
  - [packages/frontend/src/app/[lemmario-slug]/page.tsx](../packages/frontend/src/app/%5Blemmario-slug%5D/page.tsx)
  - Possibile route `/lemmari` da eliminare o ristrutturare

#### 3. **Pagina Elenco Lemmi** - PARZIALE ⚠️
- **Stato**: Esiste ma con limitazioni
- **Filtri presenti**: ✅ Latino, Volgare, Tutti (funzionanti)
- **Motore di ricerca**: ❌ Assente
- **Filtro definizioni**: ❌ Assente
- **URL**: `/{lemmario-slug}` (corretto)
- **File**: [packages/frontend/src/app/[lemmario-slug]/page.tsx](../packages/frontend/src/app/%5Blemmario-slug%5D/page.tsx)

#### 4. **Dettaglio Lemma** - CRITICO ❌
- **Problema**: Mancano completamente le informazioni associate
- **Dati mancanti**:
  - ❌ Definizioni complete
  - ❌ Fonti bibliografiche
  - ❌ Ricorrenze nelle fonti
  - ❌ Varianti grafiche
  - ❌ Riferimenti incrociati
  - ❌ Livelli di razionalità
- **Link tornare indietro**: ✅ Presente ma va migliorato
- **File**: [packages/frontend/src/app/[lemmario-slug]/lemmi/[termine]/page.tsx](../packages/frontend/src/app/%5Blemmario-slug%5D/lemmi/%5Btermine%5D/page.tsx)

#### 5. **Breadcrumb e Navigazione** - PARZIALE ⚠️
- **Breadcrumb**: ✅ Presente ma incompleto
- **Link tornare indietro**: ✅ Presente
- **Navigazione contestuale**: ⚠️ Da migliorare

---

## Requisiti Dettagliati

### R1. Home Page - Lista Lemmari

#### R1.1 Layout e Visualizzazione
- **Must Have**:
  - Griglia responsive di card dei lemmari (1 col mobile, 2 col tablet, 3 col desktop)
  - Ogni card deve contenere:
    - Titolo del lemmario (es: "Lemmario di Matematica")
    - Descrizione breve (max 2 righe troncate con ellipsis)
    - Numero totale lemmi (es: "234 lemmi")
    - Periodo storico se disponibile
    - Badge "Attivo/Non attivo" se necessario
  - Effetti hover: elevazione shadow, cambio colore bordo
  - Click su card → naviga a `/{lemmario-slug}`

- **Nice to Have**:
  - Immagine di copertina per ogni lemmario (se disponibile nel CMS)
  - Filtro rapido per periodo storico
  - Ordinamento (alfabetico, più recenti, più lemmi)
  - Statistiche aggregate (totale lemmi, totale fonti)

#### R1.2 Gestione Stati
- **Loading**: Skeleton cards durante caricamento
- **Empty state**: Messaggio "Nessun lemmario pubblicato" con CTA per admin
- **Error state**: Messaggio errore con retry button

#### R1.3 SEO e Metadata
- Title: "Lemmario - Dizionari Storici della Matematica e Economia"
- Description dinamica con riassunto dei lemmari
- Open Graph tags per social sharing

---

### R2. Routing e Navigazione Lemmari

#### R2.1 Struttura URL Corretta
```
/ → Home page con lista lemmari
/{lemmario-slug}/ → Elenco lemmi del lemmario specifico
/{lemmario-slug}/lemmi/{termine} → Dettaglio singolo lemma
/ricerca → Ricerca globale cross-lemmari
/bibliografia → Bibliografia globale
/informazioni → Info sul progetto
```

#### R2.2 Eliminazione Route Errate
- Rimuovere o ridirigere `/lemmari` → `/` (home)
- Rimuovere `/lemmi` → redirect a primo lemmario o 404
- Aggiornare tutti i link interni nell'applicazione

#### R2.3 Redirect e Compatibilità
- Implementare redirect 301 per vecchi URL
- Gestire slug duplicati o invalidi con 404 personalizzato

---

### R3. Pagina Elenco Lemmi - Funzionalità Avanzate

#### R3.1 Motore di Ricerca Lemmi
- **Componente**: Search bar sticky in alto
- **Funzionalità**:
  - Ricerca real-time (debounced 300ms)
  - Cerca su: `termine`, `etimologia`, testo `definizioni`
  - Highlight dei risultati trovati
  - Counter "X risultati trovati"
  - Clear button per reset
- **UX**:
  - Placeholder: "Cerca lemmi e definizioni..."
  - Icon lente di ingrandimento
  - Keyboard shortcut: `/` per focus

#### R3.2 Filtri Avanzati
- **Filtri esistenti** (già implementati):
  - ✅ Tutti
  - ✅ Latino
  - ✅ Volgare

- **Nuovi filtri**:
  - Filtro per fonte bibliografica (dropdown multi-select)
  - Filtro per periodo/secolo (se presente nella fonte)
  - Filtro per livello di razionalità (se disponibile)
  - Filtro "Solo con ricorrenze"

- **UI**:
  - Panel espandibile "Filtri avanzati"
  - Chip per filtri attivi (removibili)
  - Reset all filters button

#### R3.3 Ordinamento
- Alfabetico A-Z / Z-A
- Per data creazione (più recenti)
- Per numero di definizioni
- Per numero di ricorrenze

#### R3.4 Paginazione e Performance
- Mantieni 24 lemmi per pagina
- Infinite scroll come opzione alternativa
- Virtual scrolling per grandi dataset (nice to have)

---

### R4. Dettaglio Lemma - Visualizzazione Completa

#### R4.1 Header e Informazioni Base
```tsx
<header>
  <h1>{termine}</h1>
  <metadata>
    - Tipo: Latino/Volgare
    - Lemmario: {nome-lemmario}
    - Data ultima modifica
  </metadata>
  <tags>
    {varianti grafiche come chips}
  </tags>
</header>
```

#### R4.2 Sezioni Principali

##### 4.2.1 Etimologia
- Campo rich text renderizzato
- Stile: Box con sfondo azzurro chiaro

##### 4.2.2 Definizioni
**Must Have**:
- Elenco numerato di tutte le definizioni
- Per ogni definizione mostrare:
  - Testo completo (Lexical richtext renderizzato)
  - Livello di razionalità (se presente) con badge colorato
    - 1: Molto Alto (verde scuro)
    - 2: Alto (verde)
    - 3: Medio-Alto (giallo-verde)
    - 4: Medio (giallo)
    - 5: Basso (arancione)
    - 6: Molto Basso (rosso)
  - Ordine di visualizzazione rispettato

**Nice to Have**:
- Collapse/expand per definizioni lunghe
- Numero ricorrenze per definizione

##### 4.2.3 Ricorrenze nelle Fonti
**Must Have**:
- Tabella o card list con:
  - Citazione originale (blockquote styling)
  - Fonte bibliografica completa
    - Titolo opera
    - Autore (se presente)
    - Anno
    - Shorthand ID per riferimento
  - Link alla fonte in bibliografia (se implementata)

**Layout proposto**:
```tsx
<section className="ricorrenze">
  <h2>Ricorrenze nelle Fonti</h2>
  {ricorrenze.map(r => (
    <article className="ricorrenza-card">
      <blockquote>{r.citazione}</blockquote>
      <footer>
        <cite>{r.fonte.titolo_opera}</cite>
        {r.fonte.anno && <span>({r.fonte.anno})</span>}
        <Link to={`/fonti/${r.fonte.shorthand_id}`}>
          Rif: {r.fonte.shorthand_id}
        </Link>
      </footer>
    </article>
  ))}
</section>
```

##### 4.2.4 Varianti Grafiche
- Lista inline con separatori (es: "visitatore • visitatori • visitatores")
- Ordine rispettato dal campo `ordine`
- Click su variante → search lemmi con quella variante (nice to have)

##### 4.2.5 Riferimenti Incrociati
- Lista di link ad altri lemmi correlati
- Con tipo di relazione se disponibile:
  - "Vedi anche"
  - "Contrario"
  - "Sinonimo"
  - "Derivato"

##### 4.2.6 Bibliografia del Lemma
- Elenco completo delle fonti citate
- Raggruppate e deduplicate
- Link a pagina bibliografia globale

##### 4.2.7 Note Redazionali
- Sezione collapsabile (default chiuso)
- Stile: sfondo giallo chiaro
- Visibile solo se presente

#### R4.3 Navigazione e Azioni

**Must Have**:
- **Breadcrumb completo**:
  - Home → {Nome Lemmario} → {Termine}
  - Tutti i livelli cliccabili

- **Back Button**:
  - "← Torna all'elenco lemmi" → `/{lemmario-slug}/`
  - Mantieni stato ricerca e filtri (query params)

- **Link ai lemmari correlati**:
  - Se lemma appartiene a più lemmari (multi-tenancy)

**Nice to Have**:
- Share button (social, copy link)
- Print view ottimizzata
- Export PDF
- Naviga lemma precedente/successivo

#### R4.4 Layout Responsive
- Mobile: Single column, sezioni impilate
- Tablet: 2 colonne per ricorrenze
- Desktop: Sidebar con ToC (Table of Contents) fisso

---

### R5. Requisiti Aggiuntivi

#### R5.1 Accessibilità (A11y)
- Semantic HTML5 (`<article>`, `<section>`, `<nav>`, `<aside>`)
- ARIA labels per elementi interattivi
- Keyboard navigation completa
- Focus indicators visibili
- Contrast ratio WCAG AA compliant
- Screen reader friendly

#### R5.2 Performance
- Lazy loading immagini
- Code splitting per componenti pesanti
- Ottimizzazione bundle size
- Prefetch link visibili in viewport
- Caching strategico (ISR/SSR)

#### R5.3 SEO
- Canonical URLs
- Structured data (JSON-LD) per lemmi
- Meta description dinamiche
- OG tags per social
- Sitemap dinamica

#### R5.4 Internazionalizzazione
- Preparare struttura per i18n (futuro)
- Date localizzate in italiano
- Numeri formattati italiano

---

## Piano di Implementazione

### Fase 1: Refactoring Routing e Home Page
**Durata stimata**: 2 giorni

#### Task 1.1: Ristrutturazione Home Page
- [ ] **File**: `packages/frontend/src/app/page.tsx`
- [ ] Rimuovere logica redirect automatico
- [ ] Implementare fetch di tutti i lemmari attivi
- [ ] Creare componente `LemmariGrid`
- [ ] Implementare card lemmario con design
- [ ] Gestire stati: loading, error, empty
- [ ] Test: Playwright per verifica rendering

**Accettazione**:
- Home page mostra griglia di lemmari
- Click su card naviga a `/{lemmario-slug}`
- Responsive su tutti i device

#### Task 1.2: Pulizia Route `/lemmari`
- [ ] **File**: Identificare file route `/lemmari`
- [ ] Implementare redirect 301 a `/`
- [ ] Aggiornare link in `Header.tsx`, `Footer.tsx`
- [ ] Test: Verificare redirect funziona

**Accettazione**:
- `/lemmari` redirige a `/`
- Nessun link interno punta a `/lemmari`

---

### Fase 2: Motore di Ricerca e Filtri Avanzati
**Durata stimata**: 3 giorni

#### Task 2.1: Componente SearchBar
- [ ] **File**: `packages/frontend/src/components/SearchBar.tsx`
- [ ] Input con debounce 300ms
- [ ] Integrazione API search endpoint
- [ ] Counter risultati
- [ ] Clear button
- [ ] Keyboard shortcuts

**Accettazione**:
- Search funziona in tempo reale
- Performance: nessun lag durante digitazione
- Test: ricerca su termine, etimologia, definizioni

#### Task 2.2: Filtri Avanzati
- [ ] **File**: `packages/frontend/src/components/AdvancedFilters.tsx`
- [ ] Panel espandibile
- [ ] Multi-select per fonti
- [ ] Filtri livello razionalità
- [ ] Active filters chips
- [ ] Reset button

**Accettazione**:
- Filtri applicabili e combinabili
- URL query params aggiornati
- Test: tutte le combinazioni filtri

#### Task 2.3: Ordinamento Lemmi
- [ ] Dropdown ordinamento
- [ ] Implementare sort logiche
- [ ] Persist in URL

**Accettazione**:
- Ordinamento funzionante per tutte le opzioni

---

### Fase 3: Dettaglio Lemma Completo
**Durata stimata**: 4 giorni

#### Task 3.1: Fetch Dati Completi
- [ ] **File**: `packages/frontend/src/lib/payload-api.ts`
- [ ] Aggiornare `getLemmaBySlug` con `depth: 3`
- [ ] Include: definizioni, ricorrenze, fonti, varianti, riferimenti
- [ ] Gestire errori e fallback

**Accettazione**:
- API ritorna tutti i dati necessari
- Type safety TypeScript

#### Task 3.2: Componente Definizioni
- [ ] **File**: `packages/frontend/src/components/lemma/Definizioni.tsx`
- [ ] Rendering Lexical richtext
- [ ] Badge livelli razionalità
- [ ] Ordinamento corretto

**Accettazione**:
- Tutte le definizioni visibili
- Livelli razionalità colorati correttamente

#### Task 3.3: Componente Ricorrenze
- [ ] **File**: `packages/frontend/src/components/lemma/Ricorrenze.tsx`
- [ ] Card con citazione + fonte
- [ ] Link a bibliografia
- [ ] Raggruppamento per fonte (nice to have)

**Accettazione**:
- Tutte le ricorrenze visibili
- Link a fonti funzionanti

#### Task 3.4: Varianti e Riferimenti
- [ ] **File**: `packages/frontend/src/components/lemma/VariantiGrafiche.tsx`
- [ ] **File**: `packages/frontend/src/components/lemma/RiferimentiIncrociati.tsx`
- [ ] Layout inline per varianti
- [ ] Lista link per riferimenti

**Accettazione**:
- Varianti ordinate correttamente
- Riferimenti cliccabili

#### Task 3.5: Bibliografia Lemma
- [ ] Sezione bibliografia dedicata
- [ ] Deduplicazione fonti
- [ ] Ordinamento alfabetico

**Accettazione**:
- Tutte le fonti del lemma visibili

#### Task 3.6: Layout e Navigazione
- [ ] Breadcrumb completo e cliccabile
- [ ] Back button con stato
- [ ] ToC sidebar (desktop)
- [ ] Layout responsive

**Accettazione**:
- Navigazione fluida
- Responsive su tutti i device

---

### Fase 4: Test End-to-End con Playwright
**Durata stimata**: 2 giorni

#### Task 4.1: Setup Playwright
- [ ] **File**: `packages/frontend/playwright.config.ts`
- [ ] Installazione Playwright
- [ ] Configurazione browser Chromium, Firefox, Safari
- [ ] Base URL: `http://localhost:3001`
- [ ] Screenshot on failure

#### Task 4.2: Test Suite Home Page
- [ ] **File**: `packages/frontend/tests/e2e/home.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page - Lista Lemmari', () => {
  test('dovrebbe mostrare la griglia dei lemmari', async ({ page }) => {
    await page.goto('/');
    
    // Verifica heading
    await expect(page.locator('h1')).toContainText('Lemmari');
    
    // Verifica presenza card lemmari
    const cards = page.locator('[data-testid="lemmario-card"]');
    await expect(cards).toHaveCount.greaterThan(0);
    
    // Verifica contenuto card
    const firstCard = cards.first();
    await expect(firstCard.locator('h2')).toBeVisible();
    await expect(firstCard.locator('[data-testid="lemmi-count"]')).toBeVisible();
  });

  test('click su card lemmario naviga a pagina corretta', async ({ page }) => {
    await page.goto('/');
    
    const firstCard = page.locator('[data-testid="lemmario-card"]').first();
    const lemmarioName = await firstCard.locator('h2').textContent();
    
    await firstCard.click();
    
    // Verifica URL
    await expect(page).toHaveURL(/\/.+/);
    
    // Verifica breadcrumb
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Home');
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText(lemmarioName || '');
  });

  test('stato empty: nessun lemmario disponibile', async ({ page }) => {
    // Mock API response vuota
    await page.route('**/api/lemmari*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ docs: [], totalDocs: 0 })
      });
    });

    await page.goto('/');
    
    await expect(page.locator('text=Nessun lemmario')).toBeVisible();
  });

  test('stato loading: skeleton visibile', async ({ page }) => {
    // Delay API response
    await page.route('**/api/lemmari*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });

    const navigationPromise = page.goto('/');
    
    // Verifica skeleton durante loading
    await expect(page.locator('[data-testid="skeleton-card"]')).toBeVisible();
    
    await navigationPromise;
  });
});
```

#### Task 4.3: Test Suite Elenco Lemmi
- [ ] **File**: `packages/frontend/tests/e2e/lemmi-list.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Elenco Lemmi - Filtri e Ricerca', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/matematica'); // Assumendo slug "matematica"
  });

  test('filtri Latino/Volgare/Tutti funzionano', async ({ page }) => {
    // Conta lemmi iniziali
    const initialCount = await page.locator('[data-testid="lemma-card"]').count();
    
    // Click filtro Latino
    await page.click('text=Latino');
    await expect(page).toHaveURL(/tipo=latino/);
    
    const latinCount = await page.locator('[data-testid="lemma-card"]').count();
    
    // Click filtro Volgare
    await page.click('text=Volgare');
    await expect(page).toHaveURL(/tipo=volgare/);
    
    const volgareCount = await page.locator('[data-testid="lemma-card"]').count();
    
    // Click Tutti
    await page.click('text=Tutti');
    await expect(page).toHaveURL(/^(?!.*tipo=)/); // Non deve avere param tipo
    
    const allCount = await page.locator('[data-testid="lemma-card"]').count();
    
    expect(allCount).toBe(latinCount + volgareCount);
  });

  test('search bar: ricerca funziona', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    await searchInput.fill('visitatores');
    
    // Wait for debounce
    await page.waitForTimeout(400);
    
    // Verifica risultati filtrati
    await expect(page.locator('[data-testid="lemma-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('[data-testid="results-count"]')).toContainText('risultati');
    
    // Verifica URL aggiornato
    await expect(page).toHaveURL(/search=visitatores/);
  });

  test('search bar: clear button reset ricerca', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(400);
    
    await page.click('[data-testid="search-clear"]');
    
    await expect(searchInput).toHaveValue('');
    await expect(page).toHaveURL(/^(?!.*search=)/);
  });

  test('paginazione: navigazione tra pagine', async ({ page }) => {
    // Verifica pagina 1
    await expect(page.locator('text=Pagina 1 di')).toBeVisible();
    
    // Click successiva
    await page.click('text=Successiva');
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('text=Pagina 2 di')).toBeVisible();
    
    // Click precedente
    await page.click('text=Precedente');
    await expect(page).toHaveURL(/page=1/);
  });

  test('ordinamento: cambia ordine lemmi', async ({ page }) => {
    const sortSelect = page.locator('[data-testid="sort-select"]');
    
    // Ordina Z-A
    await sortSelect.selectOption('z-a');
    
    const firstLemma = await page.locator('[data-testid="lemma-card"]').first().textContent();
    
    // Cambia a A-Z
    await sortSelect.selectOption('a-z');
    
    const newFirstLemma = await page.locator('[data-testid="lemma-card"]').first().textContent();
    
    expect(firstLemma).not.toBe(newFirstLemma);
  });

  test('click lemma naviga a dettaglio', async ({ page }) => {
    const firstCard = page.locator('[data-testid="lemma-card"]').first();
    const termine = await firstCard.locator('h3').textContent();
    
    await firstCard.click();
    
    // Verifica URL dettaglio
    await expect(page).toHaveURL(/\/matematica\/lemmi\/.+/);
    
    // Verifica pagina dettaglio caricata
    await expect(page.locator('h1')).toContainText(termine || '');
  });
});
```

#### Task 4.4: Test Suite Dettaglio Lemma
- [ ] **File**: `packages/frontend/tests/e2e/lemma-detail.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dettaglio Lemma - Visualizzazione Completa', () => {
  test('dovrebbe mostrare tutte le sezioni del lemma', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    // Header e metadata
    await expect(page.locator('h1')).toContainText('visitatores');
    await expect(page.locator('text=Latino')).toBeVisible();
    await expect(page.locator('text=Lemmario di Matematica')).toBeVisible();
    
    // Definizioni
    await expect(page.locator('h2:has-text("Definizioni")')).toBeVisible();
    const definizioni = page.locator('[data-testid="definizione"]');
    await expect(definizioni).toHaveCount.greaterThan(0);
    
    // Ricorrenze
    await expect(page.locator('h2:has-text("Ricorrenze nelle Fonti")')).toBeVisible();
    const ricorrenze = page.locator('[data-testid="ricorrenza-card"]');
    await expect(ricorrenze).toHaveCount.greaterThan(0);
    
    // Verifica citazione e fonte
    const primaRicorrenza = ricorrenze.first();
    await expect(primaRicorrenza.locator('blockquote')).toBeVisible();
    await expect(primaRicorrenza.locator('cite')).toBeVisible();
    
    // Bibliografia
    await expect(page.locator('h2:has-text("Bibliografia")')).toBeVisible();
    
    // Varianti grafiche (se presenti)
    const varianti = page.locator('[data-testid="varianti-grafiche"]');
    if (await varianti.isVisible()) {
      await expect(varianti).toContainText('•'); // Separatore
    }
  });

  test('livelli razionalità: badge colorati correttamente', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    const definizioniConLivello = page.locator('[data-testid="livello-razionalita"]');
    
    if (await definizioniConLivello.count() > 0) {
      const firstBadge = definizioniConLivello.first();
      
      // Verifica che abbia classe colore
      const classes = await firstBadge.getAttribute('class');
      expect(classes).toMatch(/bg-(green|yellow|orange|red)/);
      
      // Verifica testo livello
      await expect(firstBadge).toContainText(/Livello|Alto|Basso|Medio/i);
    }
  });

  test('riferimenti incrociati: link navigabili', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    const riferimenti = page.locator('[data-testid="riferimento-incrociato"]');
    
    if (await riferimenti.count() > 0) {
      const primoRiferimento = riferimenti.first();
      const href = await primoRiferimento.getAttribute('href');
      
      expect(href).toMatch(/\/matematica\/lemmi\/.+/);
      
      // Click e verifica navigazione
      await primoRiferimento.click();
      await expect(page).toHaveURL(/\/matematica\/lemmi\/.+/);
    }
  });

  test('breadcrumb: tutti i livelli cliccabili', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    
    await expect(breadcrumb.locator('a:has-text("Home")')).toBeVisible();
    await expect(breadcrumb.locator('a:has-text("Matematica")')).toBeVisible();
    await expect(breadcrumb.locator('text=visitatores')).toBeVisible();
    
    // Click Home
    await breadcrumb.locator('a:has-text("Home")').click();
    await expect(page).toHaveURL('/');
    
    await page.goBack();
    
    // Click Lemmario
    await breadcrumb.locator('a:has-text("Matematica")').click();
    await expect(page).toHaveURL('/matematica');
  });

  test('back button: torna a elenco lemmi', async ({ page }) => {
    // Naviga da elenco con filtro
    await page.goto('/matematica?tipo=latino&page=2');
    await page.click('[data-testid="lemma-card"]').first();
    
    // Verifica dettaglio
    await expect(page).toHaveURL(/\/matematica\/lemmi\/.+/);
    
    // Click back
    await page.click('text=Torna');
    
    // Verifica ritorno con stato preservato
    await expect(page).toHaveURL('/matematica?tipo=latino&page=2');
  });

  test('ricorrenze: link a fonti funzionanti', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    const linkFonte = page.locator('[data-testid="ricorrenza-card"] a[href*="/fonti/"]').first();
    
    if (await linkFonte.isVisible()) {
      const shorthandId = await linkFonte.textContent();
      
      await linkFonte.click();
      
      // Verifica navigazione a bibliografia
      await expect(page).toHaveURL(/\/fonti\/.+/);
      // Oppure se bibliografia non implementata, verifica 404 o fallback
    }
  });

  test('responsive: layout mobile corretto', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone
    
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    // Verifica layout stacking
    const main = page.locator('main');
    const width = await main.evaluate(el => el.getBoundingClientRect().width);
    
    expect(width).toBeLessThan(400);
    
    // Verifica sezioni impilate (non sidebar)
    await expect(page.locator('[data-testid="toc-sidebar"]')).not.toBeVisible();
  });
});
```

#### Task 4.5: Test Suite Accessibilità
- [ ] **File**: `packages/frontend/tests/e2e/a11y.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibilità WCAG', () => {
  test('home page: nessuna violazione A11y', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('elenco lemmi: nessuna violazione A11y', async ({ page }) => {
    await page.goto('/matematica');
    
    const results = await new AxeBuilder({ page }).analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('dettaglio lemma: nessuna violazione A11y', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    const results = await new AxeBuilder({ page }).analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation: tab attraverso elementi interattivi', async ({ page }) => {
    await page.goto('/matematica');
    
    // Tab attraverso search, filtri, lemmi
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Tutti');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Latino');
    
    // etc...
  });

  test('screen reader: semantic HTML e ARIA', async ({ page }) => {
    await page.goto('/matematica/lemmi/visitatores-lat');
    
    // Verifica landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
    
    // Verifica headings hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    const h2s = page.locator('h2');
    await expect(h2s.count()).toBeGreaterThan(0);
  });
});
```

#### Task 4.6: Test Suite Performance
- [ ] **File**: `packages/frontend/tests/e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('home page: carica in meno di 3 secondi', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('dettaglio lemma: carica in meno di 2 secondi', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/matematica/lemmi/visitatores-lat');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('search: debounce previene troppe richieste', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/lemmi*search=*', route => {
      requestCount++;
      route.continue();
    });
    
    await page.goto('/matematica');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Digita velocemente
    await searchInput.type('visitatores', { delay: 50 });
    
    // Attendi debounce
    await page.waitForTimeout(500);
    
    // Dovrebbe aver fatto solo 1-2 richieste, non 11
    expect(requestCount).toBeLessThan(3);
  });
});
```

---

### Fase 5: UI/UX e Styling
**Durata stimata**: 2 giorni

#### Task 5.1: Design System Components
- [ ] Badge component (livelli razionalità)
- [ ] Card component (lemmario, lemma, ricorrenza)
- [ ] Breadcrumb component
- [ ] SearchBar component
- [ ] Pagination component
- [ ] Skeleton loaders

#### Task 5.2: Tailwind Config
- [ ] Colori tema custom
- [ ] Typography scale
- [ ] Spacing system
- [ ] Breakpoints responsive

#### Task 5.3: Dark Mode (Nice to Have)
- [ ] Toggle dark/light
- [ ] Persist preference
- [ ] Accessibilità contrast

---

### Fase 6: Documentazione e Deploy
**Durata stimata**: 1 giorno

#### Task 6.1: Documentazione
- [ ] README frontend aggiornato
- [ ] Storybook per componenti (nice to have)
- [ ] API usage documentation

#### Task 6.2: CI/CD
- [ ] GitHub Actions per test Playwright
- [ ] Lint e TypeScript check
- [ ] Build verificato
- [ ] Deploy preview Vercel/Netlify

---

## Criteri di Accettazione Globali

### Funzionalità
- [ ] ✅ Home page mostra tutti i lemmari in griglia
- [ ] ✅ Click lemmario naviga a `/{lemmario-slug}`
- [ ] ✅ Elenco lemmi con search funzionante
- [ ] ✅ Filtri Latino/Volgare/Tutti operativi
- [ ] ✅ Ordinamento lemmi implementato
- [ ] ✅ Dettaglio lemma mostra tutte le informazioni:
  - Definizioni con livelli razionalità
  - Ricorrenze nelle fonti con citazioni
  - Varianti grafiche
  - Riferimenti incrociati
  - Bibliografia completa
- [ ] ✅ Breadcrumb completo e navigabile
- [ ] ✅ Back button preserva stato

### Qualità
- [ ] ✅ Tutti i test Playwright passano (100% success rate)
- [ ] ✅ Zero violazioni A11y (axe-core)
- [ ] ✅ TypeScript strict mode: 0 errori
- [ ] ✅ ESLint: 0 warnings
- [ ] ✅ Lighthouse score:
  - Performance: >85
  - Accessibility: 100
  - Best Practices: >90
  - SEO: >90

### Responsive
- [ ] ✅ Mobile (320px - 767px): Layout corretto
- [ ] ✅ Tablet (768px - 1023px): Layout adattato
- [ ] ✅ Desktop (1024px+): Layout ottimale

### Performance
- [ ] ✅ Home page FCP < 1.5s
- [ ] ✅ Dettaglio lemma TTI < 2.5s
- [ ] ✅ Bundle size < 250KB (gzipped)

---

## Struttura File e Componenti

### Nuovi File da Creare

```
packages/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx (REFACTOR)
│   │   ├── [lemmario-slug]/
│   │   │   ├── page.tsx (REFACTOR)
│   │   │   └── lemmi/
│   │   │       └── [termine]/
│   │   │           └── page.tsx (REFACTOR)
│   │   └── lemmari/ (ELIMINARE o REDIRECT)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx (NEW)
│   │   │   ├── Card.tsx (NEW)
│   │   │   ├── Skeleton.tsx (NEW)
│   │   │   └── Breadcrumb.tsx (NEW)
│   │   ├── lemmari/
│   │   │   ├── LemmariGrid.tsx (NEW)
│   │   │   └── LemmarioCard.tsx (NEW)
│   │   ├── lemmi/
│   │   │   ├── SearchBar.tsx (NEW)
│   │   │   ├── AdvancedFilters.tsx (NEW)
│   │   │   ├── SortDropdown.tsx (NEW)
│   │   │   └── LemmaCard.tsx (REFACTOR)
│   │   └── lemma-detail/
│   │       ├── DefinizioniSection.tsx (NEW)
│   │       ├── RicorrenzeSection.tsx (NEW)
│   │       ├── VariantiGrafiche.tsx (NEW)
│   │       ├── RiferimentiIncrociati.tsx (NEW)
│   │       ├── BiblografiaSection.tsx (NEW)
│   │       └── LivelloRazionalitaBadge.tsx (NEW)
│   ├── lib/
│   │   ├── payload-api.ts (REFACTOR)
│   │   └── utils.ts (NEW)
│   └── types/
│       └── payload.ts (REFACTOR - aggiungere tipi mancanti)
├── tests/
│   └── e2e/
│       ├── home.spec.ts (NEW)
│       ├── lemmi-list.spec.ts (NEW)
│       ├── lemma-detail.spec.ts (NEW)
│       ├── a11y.spec.ts (NEW)
│       └── performance.spec.ts (NEW)
├── playwright.config.ts (NEW)
└── package.json (UPDATE - add Playwright deps)
```

---

## Dipendenze da Aggiungere

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@axe-core/playwright": "^4.8.0"
  }
}
```

---

## Note Tecniche

### API Depth per Lemma Dettaglio
```typescript
// packages/frontend/src/lib/payload-api.ts

export async function getLemmaBySlug(
  slug: string,
  lemmarioId: number
): Promise<Lemma | null> {
  const response = await fetchFromPayload<PaginatedResponse<Lemma>>('/lemmi', {
    params: {
      where: JSON.stringify({
        slug: { equals: slug },
        lemmario: { equals: lemmarioId },
      }),
      depth: 3, // IMPORTANTE: include definizioni, ricorrenze, fonti
      limit: 1,
    },
  })
  
  return response.docs[0] || null
}
```

### State Management Search e Filtri
Usare URL query params per state management:
```typescript
// Esempio URL con tutti i filtri attivi:
// /matematica?search=visitatore&tipo=latino&sort=a-z&page=2&fonte=Statuti_Firenze

const searchParams = useSearchParams()
const router = useRouter()

function updateFilters(newFilters: Record<string, string>) {
  const params = new URLSearchParams(searchParams)
  
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
  })
  
  router.push(`?${params.toString()}`)
}
```

---

## Rischi e Mitigazioni

### Rischio 1: Performance con molti lemmi
**Mitigazione**:
- Virtual scrolling per liste >100 elementi
- Paginazione server-side
- Caching aggressivo

### Rischio 2: Dati mancanti da API
**Mitigazione**:
- Fallback UI per sezioni vuote
- Loading states chiari
- Error boundaries

### Rischio 3: Complessità Lexical richtext
**Mitigazione**:
- Usare libreria `@payloadcms/richtext-lexical` per rendering
- Sanitizzazione HTML
- Fallback a plain text

---

## Timeline Complessiva

| Fase | Durata | Inizio | Fine |
|------|--------|--------|------|
| Fase 1: Routing e Home | 2 giorni | Giorno 1 | Giorno 2 |
| Fase 2: Search e Filtri | 3 giorni | Giorno 3 | Giorno 5 |
| Fase 3: Dettaglio Lemma | 4 giorni | Giorno 6 | Giorno 9 |
| Fase 4: Test Playwright | 2 giorni | Giorno 10 | Giorno 11 |
| Fase 5: UI/UX | 2 giorni | Giorno 12 | Giorno 13 |
| Fase 6: Docs e Deploy | 1 giorno | Giorno 14 | Giorno 14 |

**Totale**: 14 giorni lavorativi (circa 3 settimane)

---

## Prossimi Step

1. ✅ Approvazione del piano
2. ⏳ Setup ambiente Playwright
3. ⏳ Iniziare Fase 1: Refactoring Home Page
4. ⏳ Daily standup per monitorare progressi
5. ⏳ Review incrementali dopo ogni fase

---

## Checklist Pre-Deploy

- [ ] Tutti i test Playwright passano in CI
- [ ] Lighthouse audit >85 su tutte le metriche
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing su device reali
- [ ] SEO audit completato
- [ ] Accessibility audit completato
- [ ] Performance profiling (no memory leaks)
- [ ] Security headers configurati
- [ ] Analytics implementato
- [ ] Error tracking (Sentry) configurato

---

**Documento creato**: 3 febbraio 2026  
**Ultima revisione**: 3 febbraio 2026  
**Versione**: 1.0
