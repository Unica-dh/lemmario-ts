# Payload CMS Hooks

Questa cartella contiene gli hooks personalizzati per Payload CMS utilizzati nel progetto Lemmario.

## Hooks Implementati

### 1. Audit Trail (`auditTrail.ts`)

**Scopo:** Tracciare automaticamente tutte le modifiche (create/update/delete) alle entità del sistema nella collection `StoricoModifiche`.

**Utilizzo:**
```typescript
import { createAuditTrail, createAuditTrailDelete } from '../hooks'

export const MyCollection: CollectionConfig = {
  hooks: {
    afterChange: [createAuditTrail],
    afterDelete: [createAuditTrailDelete],
  },
}
```

**Cosa traccia:**
- Tabella (collection slug)
- Record ID
- Operazione (create/update/delete)
- Dati precedenti (snapshot prima della modifica)
- Dati successivi (snapshot dopo la modifica)
- Utente che ha effettuato la modifica
- Timestamp
- IP address
- User agent

**Collections che lo utilizzano:**
- Lemmi
- Definizioni
- Fonti
- RiferimentiIncrociati

---

### 2. Bidirezionalità Riferimenti (`riferimentiIncrociati.ts`)

**Scopo:** Creare automaticamente riferimenti bidirezionali tra lemmi quando viene creato un riferimento A→B, creando anche B→A.

**Utilizzo:**
```typescript
import { createBidirezionalita, deleteBidirezionalita } from '../hooks'

export const RiferimentiIncrociati: CollectionConfig = {
  hooks: {
    afterChange: [createBidirezionalita],
    afterDelete: [deleteBidirezionalita],
  },
}
```

**Come funziona:**

1. **CREATE**: Quando viene creato un riferimento da lemma A a lemma B:
   - Verifica che non esista già un riferimento inverso
   - Crea automaticamente un riferimento da lemma B a lemma A
   - Imposta il flag `auto_creato: true` sul riferimento inverso

2. **DELETE**: Quando viene eliminato un riferimento A→B:
   - Trova il riferimento inverso B→A (dove `auto_creato: true`)
   - Lo elimina automaticamente

3. **Prevenzione loop infiniti**:
   - Usa il flag `auto_creato` per identificare i riferimenti creati automaticamente
   - Non crea l'inverso dell'inverso

**Esempio:**

```typescript
// Utente crea manualmente:
{
  lemma_origine: "ADDITIO",
  lemma_destinazione: "AGGIUNGERE",
  tipo_riferimento: "CFR",
  auto_creato: false
}

// Hook crea automaticamente:
{
  lemma_origine: "AGGIUNGERE",
  lemma_destinazione: "ADDITIO",
  tipo_riferimento: "CFR",
  auto_creato: true  // Flag per evitare loop
}
```

---

## Testing degli Hooks

### Test Audit Trail

1. Avvia Docker Compose:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

2. Accedi all'admin panel: http://localhost:3000/admin

3. Crea/modifica/elimina un lemma

4. Verifica in `StoricoModifiche` che sia stato creato un record

### Test Bidirezionalità

1. Crea un riferimento incrociato tra due lemmi

2. Verifica che sia stato creato automaticamente il riferimento inverso (con `auto_creato: true`)

3. Elimina il riferimento originale

4. Verifica che anche il riferimento inverso sia stato eliminato

---

## Best Practices

1. **Evitare loop infiniti**: Sempre controllare flag o condizioni per evitare che un hook triggeri se stesso
2. **Error handling**: Gli hooks loggano errori ma non bloccano l'operazione principale
3. **Performance**: Gli hooks sono asincroni ma bloccanti - mantenerli veloci
4. **Logging**: Usare `console.log` per debug, ma evitare log eccessivi in produzione

---

## Prossimi Sviluppi

- [ ] Hook per validazioni custom multi-lemmario
- [ ] Hook per notifiche agli utenti (email/webhook)
- [ ] Hook per cache invalidation (se implementato caching)
- [ ] Hook per generazione automatica slug
