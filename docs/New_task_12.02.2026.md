L'incontro ha avuto come obiettivo principale la revisione del prototipo del nuovo portale per i lemmari (o glossari), con un focus specifico sul **Lemmario della ragioneria medievale**.

Di seguito sono riportati i punti principali discussi, suddivisi per aree tematiche:

### 1. Struttura e Navigazione del Portale
*   **Organizzazione della Home Page:** La pagina principale è concepita come un contenitore che ospita diversi blocchi, ognuno corrispondente a un diverso lemmario.
*   **Ricerca e Filtri:** È stato implementato un motore di ricerca con autocompletamento che permette di filtrare i lemmi man mano che si digita. Sono presenti filtri per distinguere tra lemmi in **volgare** e in **latino**.
*   **Indice Alfabetico:** Su suggerimento dei partecipanti, verrà aggiunto un filtro basato sulle **lettere dell'alfabeto** (indice A-Z) per facilitare la navigazione, simile a quanto già fatto per altri progetti accademici.

### 2. Visualizzazione dei Lemmi e Correzioni Tecniche
*   **Dettaglio del Lemma:** Ogni voce include definizioni, occorrenze (ricorrenze) e riferimenti bibliografici.
*   **Correzioni sull'Importazione Dati:** Sono stati rilevati alcuni errori sistematici da correggere nel prossimo ciclo di importazione:
    *   **Livelli di razionalità:** Devono essere resi visibili nell'interfaccia, sebbene siano già presenti nel database.
    *   **Duplicazione delle date:** Spesso la data del documento compare sia nel titolo dell'opera che nel campo specifico "datazione"; si è deciso di spostare la datazione in una riga dedicata sotto il riferimento bibliografico.
    *   **Separazione delle citazioni:** In casi in cui un'unica fonte contenga più passi citati, la struttura deve riflettere chiaramente questa separazione, evitando che i testi vengano fusi o invertiti.

### 3. Nuove Funzionalità e Governance dei Contenuti
*   **Riferimenti Incrociati:** Si è discussa la possibilità di creare link tra lemmi latini e volgari corrispondenti e, in prospettiva, di permettere il salto ipertestuale da una parola presente in una definizione alla sua voce di glossario dedicata.
*   **Gestione Editoriale (Backend):** L'interfaccia di amministrazione permetterà ai ricercatori di modificare i testi mantenendo la **formattazione HTML** (grassetto, corsivo), utile specialmente per far risaltare il termine cercato all'interno delle citazioni.
*   **Nomenclatura e Identità:** È stato proposto di rinominare lo strumento da "Lemmario" a **"Glossario"** per renderlo più comprensibile all'utente finale. Il titolo provvisorio suggerito è: *"Glossario dei termini su ragione, calcolo e razionalità nelle fonti tardo medievali"*. Verranno inoltre integrati i loghi dell'Università di Cagliari, di Firenze e del progetto PRIN.

### 4. Estetica e Design Grafico
*   **Stile "Dizionario Classico":** Dopo aver valutato alcune bozze grafiche più elaborate, si è deciso di optare per un'estetica sobria in **bianco e nero**, ispirata ai grandi dizionari cartacei come il *Rocci*. 
*   **Layout a due colonne:** L'elenco dei lemmi sarà organizzato in due colonne con un sistema a "schede" o box per separare visivamente le voci e migliorare la leggibilità, mantenendo comunque un'anteprima del contenuto.




