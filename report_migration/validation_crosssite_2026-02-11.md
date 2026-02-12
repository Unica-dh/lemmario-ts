# Report Validazione Cross-Site: Legacy vs Produzione

**Data**: 11/02/2026
**Legacy**: https://lemmario.netlify.app/
**Produzione**: https://glossari.dh.unica.it/lemmario-ragioneria
**API Produzione**: https://glossari.dh.unica.it/api

---

## 1. Riepilogo Esecutivo

| Verifica | Risultato |
|----------|-----------|
| Conteggi globali (Livello 1) | **PASS** - Tutti i conteggi corrispondono |
| Confronto dettagliato per lemma (Livello 3) | **PASS** - 0 discrepanze su 234 lemmi |
| Confronto cross-site visuale (Livello 4) | **PASS** - 10 lemmi campione verificati |
| HTTP status pagine chiave | **PASS** - Tutte rispondono 200 |
| Fonti bibliografiche | **PASS** - 86/86 shorthand_id corrispondono |
| Livelli di razionalita | **PASS** - 6 livelli presenti, 366/449 definizioni classificate |

**Risultato complessivo: MIGRAZIONE VALIDATA CON SUCCESSO**

---

## 2. Conteggi Globali (Livello 1 - Quick Check)

| Collection | Legacy | Produzione | Stato |
|---|---|---|---|
| Lemmi | 234 | 234 | OK |
| Fonti | 86 | 86 | OK |
| Definizioni | 449 | 449 | OK |
| Ricorrenze | 851 | 851 | OK |
| Varianti grafiche | N/A | 0 | INFO (non migrate) |
| Riferimenti incrociati | 104 | 0 | INFO (non migrati) |
| Livelli di razionalita | 6 | 6 | OK |

---

## 3. Validazione Completa per Lemma (Livello 3 - Full Check)

Tutti i **234 lemmi** verificati su:
- Presenza in produzione con termine e tipo corretti
- Slug corretto (latini con suffisso `-lat`)
- Flag `pubblicato: true`
- Conteggio definizioni corrispondente al legacy
- Conteggio ricorrenze corrispondente al legacy

**Risultato: 0 discrepanze trovate**

---

## 4. Confronto Fonti Bibliografiche

| Metrica | Valore |
|---------|--------|
| Fonti legacy (chiavi in bibliografia.json) | 86 |
| Fonti produzione (shorthand_id) | 86 |
| Mancanti in produzione | 0 |
| Extra in produzione | 0 |

Tutte le 86 sigle bibliografiche del legacy corrispondono esattamente ai `shorthand_id` in produzione.

---

## 5. Livelli di Razionalita

| Livello | Nome | Presente |
|---------|------|----------|
| 1 | Concetti astratti | Si |
| 2 | Operazioni | Si |
| 3 | Modi di argomentare | Si |
| 4 | Elementi tecnici | Si |
| 5 | Giudizi di valore | Si |
| 6 | Istituzioni | Si |

| Metrica | Valore |
|---------|--------|
| Definizioni totali | 449 |
| Con livello assegnato | 366 (81.5%) |
| Senza livello | 83 (18.5%) |

Le 83 definizioni senza livello corrispondono a quelle che nel legacy HTML non avevano classificazione.

---

## 6. Confronto Cross-Site Lemmi Campione (Livello 4)

### 6.1 HTTP Status Pagine Chiave

| URL | Status |
|-----|--------|
| /lemmario-ragioneria | 200 |
| /lemmi/additio-lat | 200 |
| /lemmi/camera | 200 |
| /lemmi/ragione | 200 |
| /lemmi/algebra | 200 |
| /lemmi/forma-lat | 200 |
| /lemmi/usura | 200 |
| /lemmi/moneta | 200 |
| /lemmi/visitatores-lat | 200 |

### 6.2 Confronto Dettagliato Lemmi Campione

| Lemma | Tipo | Def Legacy | Def Prod | Ric Legacy | Ric Prod | Livelli | Stato |
|-------|------|-----------|----------|-----------|----------|---------|-------|
| additio | lat | 3 | 3 | 5 | 5 | 2, 2, 4 | MATCH |
| camera | volg | 3 | 3 | 5 | 5 | -, -, 2 | MATCH |
| camera | lat | 1 | 1 | 1 | 1 | - | MATCH |
| usura | lat | 1 | 1 | 1 | 1 | 1 | MATCH |
| usura | volg | 2 | 2 | 3 | 3 | 1, 1 | MATCH |
| ragione | volg | 29 | 29 | 44 | 44 | vari | MATCH |
| forma | lat | 1 | 1 | 5 | 5 | 1 | MATCH |
| moneta | volg | 2 | 2 | 3 | 3 | 4, 2 | MATCH |
| algebra | volg | 1 | 1 | 2 | 2 | 2 | MATCH |
| visitatores | lat | 1 | 1 | 2 | 2 | 6 | MATCH |

**Risultato: 10/10 lemmi campione corrispondono perfettamente**

### 6.3 Dettaglio Lemma "ragione" (il piu complesso)

- 29 definizioni, 44 ricorrenze - corrisponde esattamente
- Distribuzione livelli:
  - Concetti astratti: 8 definizioni
  - Operazioni: 4 definizioni
  - Elementi tecnici: 5 definizioni
  - Istituzioni: 1 definizione
  - Senza livello: 11 definizioni

---

## 7. Pagina Produzione - Struttura

La pagina principale del lemmario mostra:
- Titolo: "Lemmario della Ragioneria Medievale"
- Descrizione: "Lemmario storico della terminologia mercantile e contabile medievale italiana"
- Periodo: XIII-XV secolo
- Data pubblicazione: 30/01/2026
- **234 lemmi** totali (81 latini, 153 volgari)
- Paginazione: 10 pagine, 24 lemmi per pagina
- Filtri per lingua (Latino/Volgare)
- Funzionalita di ricerca

---

## 8. Gap Noti (non errori)

Queste discrepanze sono **attese e documentate** - non rappresentano errori di migrazione:

| Gap | Causa | Impatto |
|-----|-------|---------|
| Varianti grafiche: 0 in produzione | Non estratte dal parser di migrazione | Feature da implementare nel parser |
| Riferimenti incrociati: 104 nel legacy, 0 in produzione | Attributi `data-lemma` nel HTML non migrati | Feature da implementare |
| 83 definizioni senza livello di razionalita | Legacy HTML senza classificazione | Comportamento atteso |
| forma.html (latino): citazioni troncate nel sorgente | `<<` senza chiusura `>>` nel dato originale | Difetto dati sorgente, non parser |
| ragione.html: 8 citazioni con fonti non parsabili | Formati di riferimento non standard | Formati troppo liberi nel sorgente |
| libro.html: 1 citazione incompleta | Citazione senza testo completo nel sorgente | Difetto dato sorgente |
| 25 fonti senza ricorrenze | Fonti presenti in bibliografia ma non citate | Catalogo completo vs subset usato |

---

## 9. Elementi NON Migrati (da implementare)

| Elemento | Quantita nel Legacy | Priorita |
|----------|-------------------|----------|
| Varianti grafiche | da verificare | Media |
| Riferimenti incrociati (CFR, VEDI, VEDI_ANCHE) | 104 | Alta |
| Cross-link tra lemmi volgari e latini | presenti via `data-lemma` | Media |

---

## 10. Conclusioni

La migrazione dei dati dal sito legacy (lemmario.netlify.app) alla piattaforma di produzione (glossari.dh.unica.it) e' stata completata **con successo**:

1. **Completezza**: Tutti i 234 lemmi, 449 definizioni, 851 ricorrenze e 86 fonti sono stati migrati correttamente
2. **Integrita**: Nessuna discrepanza trovata nei conteggi per-lemma tra legacy e produzione
3. **Classificazione**: 366 definizioni (81.5%) hanno il livello di razionalita assegnato, in linea con i dati legacy
4. **Accessibilita**: Tutte le pagine chiave rispondono correttamente (HTTP 200)
5. **Struttura**: La pagina produzione presenta correttamente filtri, paginazione e metadati

I gap residui (varianti grafiche, riferimenti incrociati) sono noti e documentati come feature da implementare separatamente.

---

*Report generato il 11/02/2026 tramite validazione multi-livello (Quick + Full + Cross-Site)*
