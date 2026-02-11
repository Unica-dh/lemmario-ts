# Report Validazione Migrazione Legacy -> Produzione

**Data**: 11/02/2026, 18:06:31
**Livello**: sample

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

## Dettaglio Lemmi Campione

| Lemma | Tipo | Def Legacy | Def Prod | Ric Legacy | Ric Prod | Stato |
|---|---|---|---|---|---|---|
| additio | latino | 3 | 3 | 5 | 5 | OK |
| camera | latino | 1 | 1 | 1 | 1 | OK |
| camera | volgare | 3 | 3 | 5 | 5 | OK |
| usura | latino | 1 | 1 | 1 | 1 | OK |
| usura | volgare | 2 | 2 | 3 | 3 | OK |
| ragione | volgare | 29 | 29 | 44 | 44 | ISSUES |
| forma | latino | 1 | 1 | 5 | 5 | OK |
| moneta | volgare | 2 | 2 | 3 | 3 | OK |
| algebra | volgare | 1 | 1 | 2 | 2 | OK |
| visitatores | latino | 1 | 1 | 2 | 2 | OK |

### Dettaglio Problemi

**ragione (volgare)**:
- Def 21 ricorrenze: legacy=0 prod=1

---

## Gap Noti (non errori)

- **Varianti grafiche**: non estratte dal parser di migrazione (0 in produzione)
- **Riferimenti incrociati**: presenti nel legacy HTML (`data-lemma`), non migrati (0 in produzione)
- **forma.html (latino)**: 6 citazioni troncate nel dato sorgente (`<<` senza `>>` di chiusura)
- **ragione.html (volgare)**: 8 ricorrenze con fonti non parsabili
- **libro.html (volgare)**: 1 citazione incompleta

---

*Report generato automaticamente il 11/02/2026, 18:06:31*