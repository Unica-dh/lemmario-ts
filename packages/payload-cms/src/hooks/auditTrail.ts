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

  try {
    // Estrai informazioni dal request
    const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || 'unknown'
    const userAgent = req.headers?.['user-agent'] || 'unknown'

    // Crea record di audit trail
    await req.payload.create({
      collection: 'storico-modifiche',
      data: {
        tabella: req.collection.config.slug,
        record_id: doc.id,
        operazione: operation,
        dati_precedenti: operation === 'create' ? null : previousDoc,
        dati_successivi: operation === 'delete' ? null : doc,
        utente: req.user?.id || null,
        timestamp: new Date().toISOString(),
        ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      },
    })
  } catch (error) {
    // Log error ma non bloccare l'operazione principale
    console.error('Errore creazione audit trail:', error)
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

  try {
    const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || 'unknown'
    const userAgent = req.headers?.['user-agent'] || 'unknown'

    await req.payload.create({
      collection: 'storico-modifiche',
      data: {
        tabella: req.collection.config.slug,
        record_id: doc.id,
        operazione: 'delete',
        dati_precedenti: doc,
        dati_successivi: null,
        utente: req.user?.id || null,
        timestamp: new Date().toISOString(),
        ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      },
    })
  } catch (error) {
    console.error('Errore creazione audit trail delete:', error)
  }
}
