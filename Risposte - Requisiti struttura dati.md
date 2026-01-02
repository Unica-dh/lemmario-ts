Queste sono le risposte fornite dal cliente sulla base delle domande poste nel documento "Lemmario - requisiti struttura dati.md"

1. Livello di Razionalità Opzionale: Manterrei il "livello di razionalità" come opzionale in via operativa. Idealmente, ogni definizione dovrebbe avrere questo campo esplicitato.
2. Riferimenti Incrociati (CFR.): Si tratta di una relazione da mappare e può essere del tipo uno-a-molti, anche se nella maggior parte dei casi è uno-a-uno: da un lemma si rimanda eventualmente ad uno o più lemmi.
3. Grafie Multiple: Procederei con campi diversi (uno per "termine principale", altri per "varianti"), in modo da avere una struttura più chiara da gestire anche per sviluppi futuri.
4. Elenco Livelli: Sì, allego il file relativo.
5. Attributi Definizione: Manterrei la "parte del discorso" interna alla definizione, ad ora non vedo un vantaggio nel renderla campo autonomo.
6. Formato Datazione: Per semplicità terrei un campo testuale, con l'eventualità di adottare una convenzione per redattori, secondo cui e.g. "XIV secolo" diventa "1301-1400", a beneficio di un campo costituito da singolo anno o intervalli.
7. Fonti Multiple: In questi casi si tratta di due opere/documenti differenti.