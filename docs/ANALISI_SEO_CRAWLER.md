# Analisi SEO e Crawler - Lemmario

**Data analisi**: 4 Febbraio 2026
**Stato attuale**: Criticità multiple identificate

---

## Executive Summary

Il sito Lemmario presenta **carenze significative** nell'ottimizzazione per motori di ricerca e crawler AI. Le pagine più importanti (dettaglio lemmi) non hanno metadata dedicati, manca completamente una sitemap, non esiste robots.txt, e non ci sono dati strutturati JSON-LD per rich snippet.

---

## 1. CRITICITÀ IDENTIFICATE

### 1.1 robots.txt - ASSENTE ❌

**Stato**: Non esiste alcun file robots.txt (né statico né generato dinamicamente)

**Impatto**:
- I crawler non ricevono istruzioni su cosa indicizzare
- Nessun controllo sul crawl budget
- Rischio di indicizzazione di pagine admin/API
- Crawler AI (GPTBot, ClaudeBot, etc.) non hanno direttive specifiche

**Percorsi non protetti potenzialmente problematici**:
- `/api/*` - Endpoint API
- Pagine di errore
- Pagine con parametri di ricerca duplicati

---

### 1.2 sitemap.xml - ASSENTE ❌

**Stato**: Non esiste sitemap (né statica né dinamica)

**Impatto CRITICO**:
- I motori di ricerca devono scoprire le pagine solo tramite crawling
- **Migliaia di lemmi** potenzialmente non indicizzati
- URL dinamiche difficili da scoprire:
  - `/[lemmario]/lemmi/[termine]` - Pagine lemma
  - `/[lemmario]/pagine/[slug]` - Contenuti statici per lemmario
- Nessuna indicazione di priorità o frequenza di aggiornamento
- Google Search Console non può verificare copertura completa

---

### 1.3 Metadata Dinamici - INCOMPLETI ⚠️

**Pagine con metadata**: ✅
- Home page (`/`)
- Pagina lemmario (`/[lemmario]`)
- Contenuti statici (`/pagine/[slug]`, `/[lemmario]/pagine/[slug]`)

**Pagine SENZA metadata**: ❌ CRITICO
- **Dettaglio lemma** (`/[lemmario]/lemmi/[termine]`) - LA PAGINA PIÙ IMPORTANTE
- **Ricerca** (`/ricerca`)

**Impatto**:
- Le pagine lemma (il contenuto core) appaiono su Google con title/description generici
- CTR (Click-Through Rate) ridotto per mancanza di anteprime accattivanti
- Nessuna ottimizzazione per condivisione social

---

### 1.4 Open Graph e Twitter Cards - PARZIALI ⚠️

**Stato attuale**:
- Open Graph presente SOLO sulla home page
- Twitter Cards completamente assenti
- Nessuna immagine di anteprima configurata

**Impatto**:
- Condivisioni su social media senza anteprima ricca
- Facebook, LinkedIn, Twitter mostrano placeholder generici
- WhatsApp/Telegram non mostrano preview del contenuto

---

### 1.5 JSON-LD Structured Data - ASSENTE ❌

**Stato**: Zero implementazioni di schema.org

**Schema mancanti**:
| Schema | Uso | Beneficio |
|--------|-----|-----------|
| `WebSite` + `SearchAction` | Sitelink search box in Google | Ricerca diretta da SERP |
| `BreadcrumbList` | Breadcrumb strutturati | Navigazione visibile in SERP |
| `Article`/`ScholarlyArticle` | Contenuti editoriali | Rich snippet per articoli |
| `DefinedTerm` / `DefinedTermSet` | Lemmi e definizioni | Perfetto per dizionari |
| `CreativeWork` | Fonti bibliografiche | Citazioni strutturate |
| `Organization` | Info istituzionali | Knowledge panel |

**Impatto**:
- Nessun rich snippet nei risultati di ricerca
- Nessun sitelink search box
- Nessuna visualizzazione avanzata delle definizioni
- Perdita di visibilità semantica per crawler AI

---

### 1.6 Istruzioni per Crawler AI - ASSENTI ❌

**Stato**: Nessuna direttiva per crawler di intelligenza artificiale

**File/configurazioni mancanti**:
- `robots.txt` con direttive per GPTBot, ClaudeBot, etc.
- `ai.txt` (convenzione emergente)
- `llms.txt` (standard proposto per LLM)
- Meta tag `robots` specifici per AI
- Header HTTP `X-Robots-Tag`

**Impatto**:
- Nessun controllo su uso dei contenuti per training AI
- Nessuna possibilità di opt-out selettivo
- I crawler AI seguono solo robots.txt standard (se esistesse)

---

### 1.7 URL Canoniche - ASSENTI ❌

**Stato**: Nessun tag `<link rel="canonical">` implementato

**Rischi**:
- Contenuto duplicato per URL con parametri (`?page=1`, `?sort=asc`)
- Versioni HTTP/HTTPS non consolidate
- Trailing slash inconsistente

---

### 1.8 Configurazione Next.js - INCOMPLETA ⚠️

**Problemi in `next.config.js`**:
- Nessun dominio produzione configurato per immagini
- Nessun export di `headers()` per HTTP headers SEO
- Nessun export di `redirects()` per URL legacy
- Nessuna configurazione per trailing slash consistency

---

## 2. MATRICE DI PRIORITÀ

| Criticità | Severità | Effort | Priorità |
|-----------|----------|--------|----------|
| sitemap.xml dinamica | CRITICA | Medio | 🔴 P0 |
| Metadata pagina lemma | CRITICA | Basso | 🔴 P0 |
| robots.txt | ALTA | Basso | 🟠 P1 |
| JSON-LD base (WebSite, Breadcrumb) | MEDIA | Medio | 🟡 P2 |
| Open Graph completo | ALTA | Medio | 🟠 P1 |
| Twitter Cards | ALTA | Basso | 🟠 P1 |
| JSON-LD per lemmi (DefinedTerm) | MEDIA | Alto | 🟡 P2 |
| Istruzioni crawler AI | BASSA | Basso | 🟢 P3 |
| URL canoniche | MEDIA | Basso | 🟡 P2 |

---

## 3. DOMANDE PER DECISIONI DI IMPLEMENTAZIONE

### 3.1 Dominio e URL

**Q1**: Qual è il dominio di produzione definitivo del sito?
- [ ] `lemmario.it`
- [ ] `lemmario.unica.it`
- [ ] `dizionario.unica.it`
- [ ] Altro: _____________

**Q2**: Preferisci URL con o senza trailing slash?
- [ ] Con trailing slash: `lemmario.it/matematica/`
- [ ] Senza trailing slash: `lemmario.it/matematica`

---

### 3.2 Sitemap

**Q3**: Quanti lemmi esistono attualmente nel database (stima)?
- [ ] < 500
- [ ] 500 - 2.000
- [ ] 2.000 - 10.000
- [ ] > 10.000

**Q4**: Vuoi includere nella sitemap anche i lemmi NON pubblicati (pubblicato=false)?
- [ ] No, solo lemmi pubblicati
- [ ] Sì, tutti i lemmi

**Q5**: Preferisci sitemap singola o suddivisa per lemmario?
- [ ] Sitemap unica (`/sitemap.xml`)
- [ ] Sitemap index con sotto-sitemap (`/sitemap.xml` → `/sitemap-matematica.xml`, `/sitemap-economia.xml`)

---

### 3.3 Crawler e Indicizzazione

**Q6**: Ci sono sezioni del sito che NON devono essere indicizzate?
- [ ] Pagine di ricerca (`/ricerca?q=...`)
- [ ] Pagine con paginazione (`?page=2`)
- [ ] Altro: _____________

**Q7**: Vuoi permettere ai crawler AI (GPTBot, ClaudeBot, etc.) di:
- [ ] Indicizzare tutto il contenuto
- [ ] Indicizzare solo alcune sezioni (specificare: _____________)
- [ ] Bloccare completamente l'accesso
- [ ] Non ho preferenze, decidi tu

**Q8**: Il contenuto del sito è:
- [ ] Completamente pubblico, libero per qualsiasi uso
- [ ] Pubblico ma con licenza specifica (quale? _____________)
- [ ] Richiede attribuzione se usato
- [ ] Non deve essere usato per training AI

---

### 3.4 Social e Condivisione

**Q9**: Hai un'immagine di default da usare come anteprima social? (es. logo, copertina)
- [ ] Sì, path: _____________
- [ ] No, devo crearla
- [ ] Usa un placeholder generico

**Q10**: Il progetto ha account social ufficiali?
- [ ] Twitter/X: @_____________
- [ ] Facebook: _____________
- [ ] Nessuno

---

### 3.5 Dati Strutturati

**Q11**: Quale tipo di organizzazione gestisce il progetto?
- [ ] Università (quale? _____________)
- [ ] Istituto di ricerca
- [ ] Progetto indipendente
- [ ] Altro: _____________

**Q12**: Vuoi che i lemmi appaiano come "Definizioni" in Google (rich snippet tipo dizionario)?
- [ ] Sì, implementa DefinedTerm schema
- [ ] No, preferisco snippet standard

**Q13**: Vuoi implementare il sitelink search box (cerca direttamente da Google)?
- [ ] Sì
- [ ] No

---

### 3.6 Priorità e Risorse

**Q14**: Qual è la priorità principale?
- [ ] Indicizzazione completa (sitemap + robots)
- [ ] Aspetto nei risultati di ricerca (metadata + OG)
- [ ] Rich snippet avanzati (JSON-LD)
- [ ] Tutte, in ordine di effort minimo

**Q15**: Ci sono deadline o eventi imminenti che richiedono SEO funzionante?
- [ ] Sì, entro: _____________
- [ ] No, tempi normali

---

## 4. PROSSIMI PASSI

1. **Rispondi alle domande** nella sezione 3
2. **Revisiona le priorità** nella matrice (sezione 2)
3. Sulla base delle risposte, produrrò un **piano di implementazione dettagliato** con:
   - Task specifici
   - Codice da implementare
   - Test di verifica
   - Timeline suggerita

---

## 5. RIFERIMENTI TECNICI

### File da creare/modificare

```
packages/frontend/
├── public/
│   ├── robots.txt              # Statico o...
│   └── og-image.png            # Immagine social default
├── src/app/
│   ├── robots.ts               # ...dinamico
│   ├── sitemap.ts              # Sitemap dinamica
│   ├── [lemmario-slug]/
│   │   └── lemmi/
│   │       └── [termine]/
│   │           └── page.tsx    # Aggiungere generateMetadata()
│   └── ricerca/
│       └── page.tsx            # Aggiungere generateMetadata()
├── src/components/
│   └── seo/
│       ├── JsonLd.tsx          # Componente JSON-LD riutilizzabile
│       └── Breadcrumbs.tsx     # Con schema.org markup
└── next.config.js              # Headers, redirects
```

### Documentazione Next.js rilevante
- [Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/sitemap)
- [Robots](https://nextjs.org/docs/app/api-reference/file-conventions/robots)
- [Open Graph](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#opengraph)

---

*Documento generato da analisi automatica del codebase*
