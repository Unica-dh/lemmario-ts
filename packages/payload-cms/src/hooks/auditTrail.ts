import { CollectionAfterChangeHook } from 'payload/types'

/**
 * Hook: Audit Trail
 * 
 * Crea automaticamente un record in StoricoModifiche per ogni operazione
 * di create/update/delete su una collection.
 * 
 * Utilizzo:
 * ```typescript
 * import { createAuditTrail } from '../hooks/auditTrail'
 * 
 * export const MyCollection: CollectionConfig = {
 *   hooks: {
 *     afterChange: [createAuditTrail],
 *   },
 * }
 * ```
 */
export const createAuditTrail: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  // Evita loop infiniti: non tracciare modifiche a StoricoModifiche
  if (req.collection.config.slug === 'storico-modifiche') {
    return doc
  }

  const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || 'unknown'
  const userAgent = req.headers?.['user-agent'] || 'unknown'
  const collectionSlug = req.collection.config.slug

  const auditData = {
    tabella: collectionSlug,
    record_id: doc.id,
    operazione: operation,
    dati_precedenti: operation === 'create' ? null : previousDoc,
    dati_successivi: doc,
    utente: req.user?.id || null,
    timestamp: new Date().toISOString(),
    ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  }

  // Per la collection utenti, la tabella storico_modifiche_rels ha un FK
  // verso utenti. Se attendiamo l'inserimento sincrono, il FK check blocca
  // perche' la riga utenti e' ancora lockata dalla transazione padre (usa
  // una connessione DB separata). Soluzione: fire-and-forget con setImmediate
  // per permettere alla transazione padre di completare prima.
  if (collectionSlug === 'utenti') {
    setImmediate(() => {
      req.payload.create({
        collection: 'storico-modifiche',
        data: auditData,
      }).catch((error: unknown) => {
        console.error('Errore creazione audit trail (utenti, async):', error)
      })
    })
  } else {
    try {
      await req.payload.create({
        collection: 'storico-modifiche',
        data: auditData,
      })
    } catch (error) {
      console.error('Errore creazione audit trail:', error)
    }
  }

  return doc
}

/**
 * Hook: Audit Trail per Delete
 * 
 * Versione specializzata per l'hook afterDelete, che non ha previousDoc.
 */
export const createAuditTrailDelete = async ({ req, doc }: any) => {
  // Evita loop infiniti
  if (req.collection.config.slug === 'storico-modifiche') {
    return
  }

  const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || 'unknown'
  const userAgent = req.headers?.['user-agent'] || 'unknown'
  const collectionSlug = req.collection.config.slug

  const auditData = {
    tabella: collectionSlug,
    record_id: doc.id,
    operazione: 'delete',
    dati_precedenti: doc,
    dati_successivi: null,
    utente: req.user?.id || null,
    timestamp: new Date().toISOString(),
    ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  }

  // Stessa logica di createAuditTrail: fire-and-forget per utenti
  if (collectionSlug === 'utenti') {
    setImmediate(() => {
      req.payload.create({
        collection: 'storico-modifiche',
        data: auditData,
      }).catch((error: unknown) => {
        console.error('Errore creazione audit trail delete (utenti, async):', error)
      })
    })
  } else {
    try {
      await req.payload.create({
        collection: 'storico-modifiche',
        data: auditData,
      })
    } catch (error) {
      console.error('Errore creazione audit trail delete:', error)
    }
  }
}
