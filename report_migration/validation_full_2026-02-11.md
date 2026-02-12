# Report Validazione Migrazione Legacy -> Produzione

**Data**: 11/02/2026, 18:36:56
**Livello**: full

---

## Conteggi Collection

| Collection | Legacy | Produzione | Stato |
|---|---|---|---|
| lemmi | 234 | 234 | OK |
| fonti | 86 | 86 | OK |
| definizioni | 449 | 449 | OK |
| ricorrenze | 851 | 851 | OK |
| varianti-grafiche | N/A | 0 | INFO |
| riferimenti-incrociati | N/A | 0 | INFO |
| livelli-razionalita | N/A | 6 | INFO |

**Cross-references nel legacy**: 104 (non migrati - gap noto)

---

## Risultati Full Check

**Nessuna discrepanza trovata.**

---

## Gap Noti (non errori)

- **Varianti grafiche**: non estratte dal parser di migrazione (0 in produzione)
- **Riferimenti incrociati**: presenti nel legacy HTML (`data-lemma`), non migrati (0 in produzione)
- **forma.html (latino)**: 6 citazioni troncate nel dato sorgente (`<<` senza `>>` di chiusura)
- **ragione.html (volgare)**: 8 ricorrenze con fonti non parsabili
- **libro.html (volgare)**: 1 citazione incompleta

---

*Report generato automaticamente il 11/02/2026, 18:36:56*