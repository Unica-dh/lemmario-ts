# Relazione di avanzamento - Portale Lemmario
## Riunione del 25/02/2026

---

### Interventi completati

**Correzioni dati e migrazione**

- **Ordine delle ricorrenze e datazione:** Ripristinato l'ordine cronologico originale delle citazioni, coerente con i file HTML sorgente. Aggiunta la datazione del documento come riga dedicata sotto il riferimento bibliografico. Richiede re-importazione dati in produzione.
- **Collegamenti bidirezionali latino/volgare:** Corretto il bug per cui i rimandi funzionavano solo dal latino al volgare. Ora i CFR sono visibili in entrambe le direzioni.
- **Riga ripetuta in *summa*:** Eliminata la citazione duplicata del riferimento a Benedetto Cotrugli. Richiede re-importazione dati in produzione.

**Bibliografia e riferimenti**

- **Titoli reali al posto delle chiavi tecniche:** Le chiavi del database (es. `Libro.arte.mercatura`) sono state sostituite con i titoli completi delle opere, resi cliccabili con rimando alla pagina bibliografia.
- **Lemmi associati per fonte:** La pagina bibliografia ora mostra, per ciascuna fonte, l'elenco dei lemmi che la citano, con link navigabili.

**Nuove funzionalita e interfaccia**

- **Pagina livelli di razionalita:** Creata una nuova pagina dinamica che raggruppa i lemmi per livello di razionalita, con link navigabili. Aggiunta la voce nel menu di navigazione.
- **Logo del progetto:** Aggiunto campo logo (PNG/SVG) alla scheda di ciascun lemmario. La pagina di dettaglio mostra il logo affiancato al titolo. Il logo PRIN "Redde Rationem" e stato caricato.

---

### Interventi ancora da completare

- **Normalizzazione lemmi plurale/singolare:** *visitatores* -> *visitator*, *notai* -> *notarius*. In attesa della lista completa dei lemmi da normalizzare.
- **Refuso *facere rationem*:** Aggiunta della "m" finale. In attesa di conferma del nome esatto del lemma nel database.
- **Gestione Statuto Fiorentino 1355 (Capitano/Podesta):** Separazione in due fonti distinte. In attesa della logica di distinzione tra le citazioni del Capitano e del Podesta.
- **Loghi universita (Cagliari, Firenze) nel footer/header:** In attesa dei file immagine e dei testi per la pagina "Progetto".
- **Sezione Pubblicazioni/Schede di approfondimento:** In attesa della scelta tra contenuto statico o collection strutturata, e dei contenuti iniziali da caricare.
