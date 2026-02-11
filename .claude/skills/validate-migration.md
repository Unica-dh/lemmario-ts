# Validate Migration

Confronto automatizzato dati legacy (old_website/) vs produzione (glossari.dh.unica.it) con validazione frontend Playwright.

---

## Quando Usare

Usa questa skill quando:
- Hai appena eseguito una migrazione dati (via workflow `data-migration.yml` o manualmente)
- Vuoi verificare che tutti i lemmi, definizioni, ricorrenze e fonti siano stati importati correttamente
- Devi confrontare il contenuto tra sito legacy (lemmario.netlify.app) e produzione (glossari.dh.unica.it)
- Vuoi un report dettagliato dello stato della migrazione

---

## Prerequisiti

- Python 3.8+ (usa solo stdlib, nessuna dipendenza esterna)
- Accesso alla directory `old_website/` con dati legacy
- API di produzione raggiungibile: `https://glossari.dh.unica.it/api`
- Playwright MCP configurato (per Livello 4 - Visual Check)

---

## Livello 1: Quick Check (conteggi)

Confronto conteggi totali tra legacy e produzione. Durata: ~5 secondi.

```bash
python3 scripts/validation/validate-migration.py --level quick
```

Verifica:
- Lemmi: 234 attesi (da `old_website/indice.json`)
- Fonti: 86 attese (da `old_website/bibliografia.json`)
- Definizioni: ~449 attese (parse HTML locale)
- Ricorrenze: ~851 attese (parse HTML locale)

---

## Livello 2: Sample Check (10 lemmi + deep compare)

Quick Check + confronto dettagliato su 10 lemmi campione. Durata: ~30 secondi.

```bash
python3 scripts/validation/validate-migration.py --level sample --report
```

Lemmi campione: `additio(lat)`, `camera(lat)`, `camera(volg)`, `usura(lat)`, `usura(volg)`, `ragione(volg)`, `forma(lat)`, `moneta(volg)`, `algebra(volg)`, `visitatores(lat)`.

Per ogni lemma verifica:
- Conteggio definizioni legacy vs produzione
- Conteggio ricorrenze legacy vs produzione
- Livello di razionalita per ogni definizione
- Primi 60 chars del testo di ogni definizione

---

## Livello 3: Full Check (tutti i 234 lemmi)

Quick Check + validazione di tutti i lemmi, fonti, definizioni, ricorrenze. Durata: ~3-5 minuti.

```bash
python3 scripts/validation/validate-migration.py --level full --report
```

Verifica aggiuntiva:
- Ogni lemma presente in produzione con termine e tipo corretti
- Slug lemmi latini con suffisso `-lat`
- Tutti i lemmi `pubblicato: true`
- Ogni fonte con `shorthand_id` presente in produzione
- Confronto campi fonti (titolo)
- Conteggio definizioni e ricorrenze per ogni lemma

---

## Livello 4: Visual Check (playwright-cli cross-site)

Confronto visuale tra il sito legacy e produzione usando `playwright-cli` (installato globalmente).

### Comandi playwright-cli essenziali

```bash
playwright-cli open [url]       # Apri browser e naviga
playwright-cli goto <url>       # Naviga a URL (browser gia aperto)
playwright-cli snapshot         # Cattura snapshot accessibilita
playwright-cli eval '<func>'    # Esegui JavaScript nel DOM
playwright-cli close            # Chiudi browser
```

### 4.1 Verifica struttura pagina lemma (produzione)

Per ogni lemma campione, apri la pagina produzione ed estrai dati strutturati:

```bash
# Apri il browser sulla pagina del lemma
playwright-cli open "https://glossari.dh.unica.it/lemmario-ragioneria/lemmi/{slug}"

# Estrai dati strutturati dal DOM
playwright-cli eval '() => {
  const title = document.querySelector("h1") ? document.querySelector("h1").textContent.trim() : "";
  const defHeading = document.querySelector("h2") ? document.querySelector("h2").textContent.trim() : "";
  const defMatch = defHeading.match(/\((\d+)\)/);
  const defCount = defMatch ? parseInt(defMatch[1]) : 0;
  const ricHeadings = document.querySelectorAll("h4");
  let ricCount = 0;
  ricHeadings.forEach(function(h) {
    const text = h.textContent || "";
    const m = text.match(/Ricorrenz[ae]\s*\((\d+)\)/);
    if (m) ricCount += parseInt(m[1]);
    else if (text.includes("Ricorrenza:")) ricCount += 1;
  });
  return { title: title, defCount: defCount, ricCount: ricCount, url: window.location.href };
}'
```

Output atteso per `additio-lat`: `{ title: "Lemmario", defCount: 3, ricCount: 5 }`

### 4.2 Verifica sito legacy

Il sito legacy usa routing client-side (tutti i link sono `href="#"`). Per accedere a un lemma:

```bash
# Apri il sito legacy (o naviga se browser gia aperto)
playwright-cli goto "https://lemmario.netlify.app/"

# Clicca sul lemma desiderato via JavaScript
playwright-cli eval '() => {
  var links = Array.from(document.querySelectorAll("a"));
  var target = links.find(function(a) { return a.textContent.trim() === "Additio"; });
  if (target) { target.click(); return { clicked: true }; }
  return { clicked: false };
}'

# Estrai dati dal DOM legacy
playwright-cli eval '() => {
  var content = document.querySelector("#lemma");
  if (!content) return { error: "div#lemma non trovato" };
  var html = content.innerHTML;
  var sections = html.split("<hr>");
  var defCount = 0;
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].match(/<strong>\d+\.<\/strong>/)) defCount++;
  }
  var citCount = 0;
  var matches = html.match(/\xab[^]*?\xbb/g);
  if (matches) citCount = matches.length;
  return { defCount: defCount, citationCount: citCount };
}'
```

Output atteso per Additio: `{ defCount: 3, citationCount: 10 }`
(10 citazioni nel legacy, di cui 5 con fonte valida = 5 ricorrenze in produzione)

### 4.3 Confronto cross-site

Per ogni lemma campione:
1. Estrai dati da pagina produzione (4.1): `defCount`, `ricCount`
2. Estrai dati da pagina legacy (4.2): `defCount`, `citationCount`
3. Confronta: `defCount` deve corrispondere, `ricCount` <= `citationCount` (le citazioni senza fonte vengono scartate)

### 4.4 Verifica HTTP status pagine chiave

```bash
# Apri browser e verifica pagine in sequenza
playwright-cli open "https://glossari.dh.unica.it/lemmario-ragioneria"
# Verifica che snapshot mostri contenuto

playwright-cli goto "https://glossari.dh.unica.it/lemmario-ragioneria/lemmi/additio-lat"
playwright-cli goto "https://glossari.dh.unica.it/lemmario-ragioneria/lemmi/camera"
playwright-cli goto "https://glossari.dh.unica.it/lemmario-ragioneria/lemmi/ragione"
playwright-cli goto "https://glossari.dh.unica.it/ricerca"

# Chiudi browser alla fine
playwright-cli close
```

Per ogni pagina, verificare che il Page Title non contenga "404" o "Error".

---


## Formato Report

Lo script genera report Markdown in `report_migration/` con la struttura:

```
report_migration/
  validation_quick_YYYY-MM-DD.md
  validation_sample_YYYY-MM-DD.md
  validation_full_YYYY-MM-DD.md
```

Il report include:
- Tabella conteggi collection (legacy vs produzione)
- Cross-references legacy non migrati
- Dettaglio per lemma (solo sample e full)
- Lista problemi trovati
- Gap noti (non errori)

---

## Gap Noti (non errori)

Queste discrepanze sono attese e documentate:

| Gap | Causa | Impatto |
|-----|-------|---------|
| Varianti grafiche: 0 in produzione | Non estratte dal parser | Nessun dato perso, da implementare |
| Riferimenti incrociati: 0 in produzione | `data-lemma` non migrati | Feature da implementare |
| forma.html: -6 ricorrenze | Citazioni troncate nel sorgente (`<<` senza `>>`) | Dato sorgente corrotto |
| ragione.html: -8 ricorrenze | Fonti non parsabili | Formati riferimento non standard |
| libro.html: -1 ricorrenza | Citazione incompleta | Dato sorgente incompleto |
| scritta: 1 riferimento non parsato | Formato descrittivo non standard | Formato troppo libero |
| trarre: 1 riferimento non parsato | "XII, 106." - formato ambiguo | Manca identificativo fonte |
| 83 definizioni senza livello | Legacy HTML senza classificazione | Comportamento atteso |
| 25 fonti senza ricorrenze | Fonti in bibliografia ma non citate | Catalogo completo vs subset |

---

## Troubleshooting

### API non raggiungibile
```
ERRORE API: https://glossari.dh.unica.it/api/lemmi?limit=1&depth=0 -> <urlopen error ...>
```
- Verificare che il server sia attivo: `curl -s https://glossari.dh.unica.it/api/lemmi?limit=1 | jq .totalDocs`
- Se su rete universitaria, verificare VPN

### Conteggio definizioni diverso dal report precedente
Il parser Python replica la logica di `htmlParser.ts` ma potrebbe avere piccole differenze nei regex. Confrontare con il report di migrazione in `report_migration/migration_report_*.md`.

### Timeout API
Lo script ha retry automatico (2 tentativi) e rate limiting (100ms). Se l'API e' lenta, aumentare il delay modificando `RATE_LIMIT_MS` nello script.

### Differenze testo definizioni
Il confronto testo usa i primi 60 caratteri normalizzati (whitespace collassato, NFC). Piccole differenze di formattazione HTML possono causare falsi positivi.

---

## File Chiave

| File | Scopo |
|------|-------|
| [scripts/validation/validate-migration.py](scripts/validation/validate-migration.py) | Script Python validazione automatica |
| [old_website/indice.json](old_website/indice.json) | 234 lemmi (fonte di verita) |
| [old_website/bibliografia.json](old_website/bibliografia.json) | 86 fonti (fonte di verita) |
| [old_website/lemmi/](old_website/lemmi/) | 239 file HTML sorgente |
| [scripts/migration/parsers/htmlParser.ts](scripts/migration/parsers/htmlParser.ts) | Parser HTML di riferimento (TypeScript) |
| [report_migration/](report_migration/) | Directory report generati |
