import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload/types'

/**
 * Hook: Bidirezionalità Riferimenti Incrociati
 * 
 * Quando viene creato un riferimento A→B, crea automaticamente B→A.
 * Quando viene eliminato A→B, elimina automaticamente B→A.
 * 
 * IMPORTANTE: Usa il flag `auto_creato` per evitare loop infiniti.
 */

/**
 * Hook afterChange: crea riferimento bidirezionale
 */
export const createBidirezionalita: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Solo per operazione CREATE
  if (operation !== 'create') {
    return doc
  }

  // Se questo è un riferimento auto-creato, non creare l'inverso (evita loop)
  if (doc.auto_creato === true) {
    return doc
  }

  try {
    const { lemma_origine, lemma_destinazione, tipo_riferimento, note } = doc

    // Estrai ID dai campi relationship (possono essere oggetti popolati o ID numerici)
    const origineId = typeof lemma_origine === 'object' ? lemma_origine.id : lemma_origine
    const destinazioneId = typeof lemma_destinazione === 'object' ? lemma_destinazione.id : lemma_destinazione

    // Verifica che i campi necessari esistano
    if (!origineId || !destinazioneId) {
      console.warn('Riferimento incrociato senza lemma_origine o lemma_destinazione:', doc.id)
      return doc
    }

    // Verifica se il riferimento inverso esiste già
    const existing = await req.payload.find({
      collection: 'riferimenti-incrociati',
      where: {
        and: [
          { lemma_origine: { equals: destinazioneId } },
          { lemma_destinazione: { equals: origineId } },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`Riferimento inverso già esistente per ${doc.id}`)
      return doc
    }

    // Crea riferimento inverso
    await req.payload.create({
      collection: 'riferimenti-incrociati',
      data: {
        lemma_origine: destinazioneId,
        lemma_destinazione: origineId,
        tipo_riferimento: tipo_riferimento,
        note: note ? `[Auto] ${note}` : '[Auto] Riferimento bidirezionale',
        auto_creato: true, // Flag per evitare loop
      },
    })

    console.log(`✓ Creato riferimento bidirezionale per ${lemma_origine} ↔ ${lemma_destinazione}`)
  } catch (error) {
    console.error('Errore creazione bidirezionalità:', error)
    // Non bloccare l'operazione principale
  }

  return doc
}

/**
 * Hook afterDelete: elimina riferimento bidirezionale
 */
export const deleteBidirezionalita: CollectionAfterDeleteHook = async ({ req, doc }) => {
  // Se questo è un riferimento auto-creato, non eliminare l'inverso
  // (sarà già stato eliminato dall'operazione principale)
  if (doc.auto_creato === true) {
    return
  }

  try {
    const { lemma_origine, lemma_destinazione } = doc

    // Estrai ID dai campi relationship (possono essere oggetti popolati o ID numerici)
    const origineId = typeof lemma_origine === 'object' ? lemma_origine.id : lemma_origine
    const destinazioneId = typeof lemma_destinazione === 'object' ? lemma_destinazione.id : lemma_destinazione

    if (!origineId || !destinazioneId) {
      return
    }

    // Trova e elimina il riferimento inverso
    const inverse = await req.payload.find({
      collection: 'riferimenti-incrociati',
      where: {
        and: [
          { lemma_origine: { equals: destinazioneId } },
          { lemma_destinazione: { equals: origineId } },
          { auto_creato: { equals: true } },
        ],
      },
      limit: 1,
    })

    if (inverse.docs.length > 0) {
      await req.payload.delete({
        collection: 'riferimenti-incrociati',
        id: inverse.docs[0].id,
      })

      console.log(`✓ Eliminato riferimento bidirezionale per ${lemma_origine} ↔ ${lemma_destinazione}`)
    }
  } catch (error) {
    console.error('Errore eliminazione bidirezionalità:', error)
  }
}

/**
 * Hook afterUpdate: gestisce aggiornamenti (se necessario)
 * 
 * Per ora non implementato - gli update ai riferimenti sono rari.
 * Se necessario, implementare logica simile a create/delete.
 */
export const updateBidirezionalita: CollectionAfterChangeHook = async ({
  doc,
  // req,
  operation,
  // previousDoc,
}) => {
  if (operation !== 'update') {
    return doc
  }

  // TODO: Se cambiano lemma_origine o lemma_destinazione,
  // eliminare vecchio riferimento inverso e crearne uno nuovo
  
  return doc
}
