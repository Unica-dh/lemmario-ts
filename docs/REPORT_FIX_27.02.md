# Report Implementazione - Fix e Task del 27/02/2026

Documento di tracciamento per i task definiti in [`fix_27.02.md`](fix_27.02.md).

**Legenda Ambiente:** L = Locale | P = Produzione

| # | Task | Stato | Ambiente | Data |
| --- | --- | --- | --- | --- |
| 1 | Definizioni vuote e sfasamento numerico | Completato | L + P | 2026-02-27 |
| 2 | Bug salvataggio Livelli di Razionalità | Da fare | - | - |
| 4 | Sdoppiamento fonte Statuti Fiorentina | Da fare | - | - |
| 5 | Filtro Voci Bibliografiche vuote | Da fare | - | - |
| 6 | Download Database SQL | Da fare | - | - |
| 7 | Aggiornamento Loghi | Da fare | - | - |
| 8 | Contenuto ignorato dal Parser (5 Lemmi) | Da fare | - | - |

---

## Task 1 - Definizioni vuote e sfasamento numerico

**Data completamento:** 2026-02-27

**Ambiente:** Locale + Produzione

**File modificati:**

- `old_website/lemmi/ragione.html` — Corretta numerazione duplicata (secondo "21" → "22", successivi +1 fino a 30), aggiunto `<hr>` mancante tra def 25 e 26, corretto doppio punto "misura.." → "misura."

**Intervento effettuato:**

1. **Correzione HTML sorgente:**
   - Rinumerata la definizione duplicata "21. Calcolo/Rapporto." → "22."
   - Tutte le definizioni successive incrementate di 1 (da 22→23 fino a 29→30)
   - Aggiunto tag `<hr>` mancante tra "25. Giustizia" e "26. Proporzione, rapporto, misura." (causa della perdita della definizione durante il parsing)

2. **Correzione dati in DB (via API REST):**
   - **8 PATCH** su definizioni esistenti per aggiornare il campo `numero`
   - **1 CREATE** definizione n. 26 "Proporzione, rapporto, misura." (livello: Operazioni)
   - **6 CREATE** ricorrenze mancanti per le definizioni 22, 23, 25, 26, 27, 28

3. **ID coinvolti:**

   | Ambiente | Definizioni PATCH | Def 26 creata | Ricorrenze create |
   | --- | --- | --- | --- |
   | Locale | 2228-2235 | id=2343 | 4391-4396 |
   | Produzione | 784-791 | id=899 | 1702-1707 |

**Scostamenti dal piano:**

- Il piano prevedeva re-importazione completa del lemma (opzione 2) o correzione via admin (opzione 3). Si è scelto un approccio ibrido: **PATCH diretti via API** per la rinumerazione + **CREATE** per la definizione e le ricorrenze mancanti. Questo ha preservato gli ID esistenti e le associazioni ricorrenze → definizioni già corrette.
- Scoperto un ulteriore problema non documentato: il tag `<hr>` mancante nell'HTML sorgente tra le definizioni 25 e 26, che causava la perdita della definizione "Proporzione, rapporto, misura." durante il parsing.
- Le ricorrenze mancanti (5 definizioni oltre alla 26) sono state create ex novo dal testo HTML sorgente.

**Verifiche:**

- [x] Nessuna definizione vuota per numeri 21-30
- [x] Sequenza numerica 1-30 completa, senza duplicati
- [x] Ogni definizione 21-30 ha almeno 1 ricorrenza associata
- [x] Test superati in locale
- [x] Test superati in produzione (`https://glossari.dh.unica.it`)

---

<!-- Template per ogni task completato:

## Task N - Titolo

**Data completamento:** YYYY-MM-DD

**Ambiente:** Locale / Produzione / Locale + Produzione

**File modificati:**

- `path/to/file.ts` — descrizione modifica

**Intervento effettuato:**

Descrizione sintetica di cosa è stato fatto.

**Scostamenti dal piano:**

Nessuno / Descrizione delle differenze rispetto al piano in fix_27.02.md.

**Verifiche:**

- [ ] Typecheck (`pnpm typecheck`)
- [ ] Lint (`pnpm lint`)
- [ ] Test manuale
- [ ] Deploy/produzione

---

-->
