<!-- markdownlint-disable-file -->
# Task Research Notes: Piano implementazione vs Riepilogo modifiche 20_01_2026

## Research Executed

### File Analysis
- /home/ale/docker/lemmario_ts/docs/PIANO_IMPLEMENTAZIONE.md
  - Piano completo con fasi, schema dati (definizioni con `livello_razionalita`), form integrato, migrazione, ricerca/autocomplete frontend.
- /home/ale/docker/lemmario_ts/docs/Riepilogo modifiche 20_01_2026.pdf
  - Elenco di 7 richieste di modifica (razionalità per definizione, autocomplete fonte in backend, creazione entità collegate in pagina, anteprima backend, visualizzazione campi fonte, report import con testo ignorato, analisi campi pagina/carta dopo ricorrenza).

### Code Search Results
- livello_razionalita|LivelliRazionalita|livello
  - Definizioni con `livello_razionalita` relazione a `livelli-razionalita`.
- autocomplet|autocomplete|fonte|fonti|anteprima|preview|report|import|ricorrenza|pagina|carta
  - Autocomplete previsto nel frontend (search), nessuna anteprima backend o gestione campi fonte; migrazione con log errori/successi.
- Form|multi-step|integrato|admin|backend
  - Form multi-step unificato per editing lemmi con entità correlate in unico contesto (riferimento generale).

### External Research
- #githubRepo:"N/A"
  - Nessuna ricerca esterna eseguita.
- #fetch:N/A
  - Nessuna ricerca esterna eseguita.

### Project Conventions
- Standards referenced: .github/copilot-instructions.md (overview monorepo, migrazione, access control)
- Instructions followed: Task Researcher mode (solo ricerca, documentazione in .copilot-tracking/research)

## Key Discoveries

### Project Structure
Piano con fasi (setup, CMS, business logic, frontend, migrazione, deploy) e focus su Payload CMS + Next.js, con form integrato già indicato come completato.

### Implementation Patterns
- Definizioni del lemma includono `livello_razionalita` come relazione dedicata.
- Ricorrenze includono `fonte` come relazione.
- Ricerca/autocomplete definita per frontend pubblico.
- Form Multi-Step Unificato per editing lemmi con entità correlate in unico contesto.
- Migrazione prevede logging errori/successi ma non un report dettagliato sul testo ignorato.

### Complete Examples
```markdown
Sezione "definizioni" con relazione livello_razionalita:
  name: 'definizioni'
  fields:
    - name: 'livello_razionalita'
      type: 'relationship'
      relationTo: 'livelli-razionalita'
```

### API and Schema Documentation
Schema dati nel piano: definizioni con relazione al livello di razionalità; ricorrenze con relazione fonte.

### Configuration Examples
```markdown
Frontend search/autocomplete (sezione 4.3): ricerca full-text con debounce e chiamata /api/lemmi?search=...
```

### Technical Requirements
- Autocomplete richiesto nel backend admin (chiarimento utente), mentre il piano copre solo frontend pubblico.
- Anteprima backend già implementata (chiarimento utente), ma non prevista nel piano e va documentata.
- Migrazione richiede report con estratti di testo ignorato per lemma (chiarimento utente), non presente nel piano.

## Recommended Approach
Aggiornare la mappatura tra PDF e piano: confermare coperture (livello di razionalità per definizione, form integrato per entità correlate, schema ricorrenze) e segnalare gap/ambiguità (autocomplete backend, anteprima backend non in piano, visualizzazione campi fonte nel backend, report import con testo ignorato per lemma, analisi/estensione campo pagina/carta).

## PDF-to-Plan Mapping (aggiornato)
1) **Livello di razionalità per definizione** → **Coperto**: definizioni con `livello_razionalita`.
2) **Autocomplete fonte in backend admin** → **Non coperto**: il piano descrive solo autocomplete frontend pubblico.
3) **Creazione entità collegate senza lasciare pagina** → **Parzialmente coperto**: “Form Multi-Step Unificato” con entità correlate nello stesso contesto.
4) **Anteprima backend** → **Non coperto nel piano** (ma già implementato secondo chiarimento utente) e va documentato.
5) **Visualizzazione altri campi fonte nel backend** → **Non coperto/ambiguo**: il piano non descrive UI admin per mostrare campi fonte selezionata.
6) **Report import con testi ignorati per lemma** → **Non coperto**: previsto solo log errori/successi; richiesti estratti del testo ignorato per ciascun lemma.
7) **Analisi valori post-ricorrenza e modifica pagina/carta** → **Non coperto**: schema ricorrenze mostra `posizione_citazione`, ma non esplicita analisi/estensione dei valori da HTML.

## Missing/Ambiguous Items (aggiornato)
- Autocomplete fonte nel backend admin (campo relazione con ricerca/autocompletamento lato admin).
- UI admin che mostri altri campi della `fonte` quando selezionata.
- Report import dettagliato con estratti di testo ignorato per lemma.
- Analisi/estensione del campo pagina/carta in import per includere tutti i valori post-ricorrenza.
- Anteprima backend non prevista nel piano (ma già implementata) e va documentata.

## Implementation Guidance
- **Objectives**: Mappare ogni punto del PDF a una sezione del piano, identificando copertura o gap.
- **Key Tasks**: Citare evidenze dal piano e segnare i punti senza riscontro; aggiungere sezione di documentazione anteprima backend; specificare formato report import con estratti di testo ignorato.
- **Dependencies**: PIANO_IMPLEMENTAZIONE.md, PDF Riepilogo modifiche 20_01_2026.
- **Success Criteria**: Tabella di mapping completa + lista sintetica di elementi mancanti.