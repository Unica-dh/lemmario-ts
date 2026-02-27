Bug (Errori di sistema o di dati)


Definizioni vuote e sfasamento numerico
Descrizione: Alcune definizioni appaiono vuote o sballate a causa di un errore di numerazione nel file sorgente.
Specifiche: Nel file di origine del lemma "ragione", la definizione 21 è sdoppiata (indicata due volte come "21 calcolo/rapporto"), il che fa saltare l'associazione delle ricorrenze per le definizioni successive.
Esempi: Le definizioni 22, 24 e 26 del termine "ragione" risultano vuote nel sistema.


--------------------------------------------------------------------------------
Modifiche e Migliorie (Evolutive)
Aggiornamento Label "Livelli di Razionalità"
Descrizione: I nomi attuali dei livelli (es. "uso specialistico generico") non corrispondono alla terminologia corretta del progetto.
Specifiche: Aggiornare i nomi nel backend affinché si riflettano su tutto il sito.
Esempi: Il livello 1 deve diventare "Concetti astratti" (non "uso corrente"); il livello 2 "Operazioni"; il livello 6 "Istituzioni".


Sdoppiamento fonte "Statuti della Repubblica Fiorentina"
Descrizione: La fonte bibliografica attuale accorpa due manoscritti distinti, creando conflitti con le abbreviazioni "C" (Capitano) e "P" (Podestà) che vengono confuse con "carta" o "pagina".
Specifiche: Duplicare la voce bibliografica in due entità separate ("Capitano" e "Podestà") e riassociare correttamente le circa 157 ricorrenze in base ai marcatori "C" e "P".
Esempio: Il lemma "Terminatore" utilizza questi riferimenti.

Filtro Voci Bibliografiche vuote
Descrizione: Alcune voci nella bibliografia non hanno lemmi associati (spesso duplicati del file JSON).
Specifiche: Applicare un filtro nella pagina bibliografia per mostrare solo le voci che hanno almeno un lemma associato, senza però cancellare le altre dal database.
Esempio: Doppioni della voce "Pacioli" che risultano vuoti.


Implementazione Download Database SQL
Descrizione: Consentire ai collaboratori di scaricare i dati aggiornati per replicare l'ambiente in locale.
Specifiche: Creare un link nel backend per scaricare il dump del database in formato .SQL e documentare la procedura di importazione locale tramite Docker.


Aggiornamento Loghi e Immagine Home Page
Descrizione: Miglioramento dell'estetica e dell'identità visiva del sito.
Specifiche:
Aggiungere il logo dell'Università di Firenze nella pagina progetto o nel footer, mantenendo il logo del progetto e di Cagliari come principali.
Sostituire l'immagine placeholder della Home (generata da AI) con una riproduzione autentica.
Esempio: Utilizzare il dettaglio dei due personaggi che contano con le dita dalla copertina del primo libro del progetto (affresco di Palazzo Trinci a Foligno).

TASK bassa priorità

Contenuto ignorato dal Parser (5 Lemmi)
Descrizione: Il sistema di migrazione ha ignorato alcune ricorrenze perché non rispettano i pattern previsti (es. citazioni senza fonte o virgolette non chiuse).
Specifiche: Poiché si tratta di soli 5 lemmi con problemi, si è deciso di procedere con una correzione manuale invece di creare nuove regole di parsing.
Esempi: Il lemma "forma" (latino) ha ricorrenze incomplete o troncate ("super interrogatorio...") e virgolette aperte ma mai chiuse nel testo originale.

Bug salvataggio Livelli di Razionalità nel Backend
Descrizione: Modificando il livello di razionalità dal menu a tendina all'interno del form di un lemma, la modifica non viene recepita dal database nonostante il messaggio di successo.
Specifiche: Il problema nasce dal fatto che il menu richiama l'oggetto "definizione" che è esterno al form del lemma.
Esempio: Tentativo di modifica del livello per il lemma "camarlingato" (o "camarlingato").