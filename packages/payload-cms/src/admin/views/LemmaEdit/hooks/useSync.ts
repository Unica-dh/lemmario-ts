import { useLemmaEdit } from '../context'

/**
 * Custom hook per gestire caricamento e salvataggio dati
 */

interface UseSyncOptions {
  apiUrl?: string
}

export const useSync = ({ apiUrl = '/api' }: UseSyncOptions = {}) => {
  const { state, dispatch } = useLemmaEdit()

  /**
   * Carica lemma e tutte le entità correlate
   */
  const loadLemma = async (id: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // 1. Carica lemma
      const lemmaRes = await fetch(`${apiUrl}/lemmi/${id}`)
      if (!lemmaRes.ok) throw new Error('Lemma non trovato')
      const lemmaData = await lemmaRes.json()
      dispatch({ type: 'SET_LEMMA', payload: lemmaData })

      // 2. Carica definizioni
      const defRes = await fetch(`${apiUrl}/definizioni?where[lemma][equals]=${id}&depth=0`)
      const defData = await defRes.json()
      const definizioni = defData.docs || []

      // 3. Per ogni definizione, carica ricorrenze
      const defWithRic = await Promise.all(
        definizioni.map(async (def: any) => {
          const ricRes = await fetch(
            `${apiUrl}/ricorrenze?where[definizione][equals]=${def.id}&depth=1`
          )
          const ricData = await ricRes.json()
          return {
            ...def,
            ricorrenze: ricData.docs || [],
          }
        })
      )

      dispatch({ type: 'SET_DEFINIZIONI', payload: defWithRic })

      // 4. Carica varianti grafiche
      const varRes = await fetch(`${apiUrl}/varianti-grafiche?where[lemma][equals]=${id}`)
      const varData = await varRes.json()
      dispatch({ type: 'SET_VARIANTI', payload: varData.docs || [] })

      // 5. Carica riferimenti incrociati (solo non auto-creati)
      const rifRes = await fetch(
        `${apiUrl}/riferimenti-incrociati?where[lemma_sorgente][equals]=${id}&depth=1`
      )
      const rifData = await rifRes.json()
      // Filtra lato client solo quelli non auto-creati
      const riferimenti = (rifData.docs || []).filter((r: any) => !r.auto_creato)
      dispatch({ type: 'SET_RIFERIMENTI', payload: riferimenti })

      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  /**
   * Salva tutte le modifiche in modo atomico
   */
  const saveAll = async () => {
    dispatch({ type: 'SET_SAVING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const { lemma, definizioni, varianti, riferimenti } = state

      if (!lemma || !lemma.id) {
        throw new Error('Lemma ID mancante')
      }

      const lemmaId = lemma.id

      // 1. Aggiorna lemma base
      await fetch(`${apiUrl}/lemmi/${lemmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lemma),
      })

      // 2. Sync Varianti
      await syncVarianti(lemmaId, varianti)

      // 3. Sync Definizioni (e ricorrenze nested)
      await syncDefinizioni(lemmaId, definizioni)

      // 4. Sync Riferimenti
      await syncRiferimenti(lemmaId, riferimenti)

      // Mark as clean
      dispatch({ type: 'MARK_CLEAN' })
      dispatch({ type: 'SET_SAVING', payload: false })

      return true
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      dispatch({ type: 'SET_SAVING', payload: false })
      throw error
    }
  }

  /**
   * Sync Varianti Grafiche
   */
  const syncVarianti = async (lemmaId: string | number, varianti: any[]) => {
    for (const variante of varianti) {
      if (variante._isDeleted && variante.id) {
        // DELETE
        await fetch(`${apiUrl}/varianti-grafiche/${variante.id}`, {
          method: 'DELETE',
        })
      } else if (variante._isNew) {
        // CREATE
        await fetch(`${apiUrl}/varianti-grafiche`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma: lemmaId,
            termine: variante.termine,
            ordine: variante.ordine,
            note: variante.note,
          }),
        })
      } else if (variante.id) {
        // UPDATE
        await fetch(`${apiUrl}/varianti-grafiche/${variante.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variante),
        })
      }
    }
  }

  /**
   * Sync Definizioni e Ricorrenze
   */
  const syncDefinizioni = async (lemmaId: string | number, definizioni: any[]) => {
    for (const def of definizioni) {
      let defId = def.id

      if (def._isDeleted && defId) {
        // DELETE definizione (cascade elimina ricorrenze)
        await fetch(`${apiUrl}/definizioni/${defId}`, {
          method: 'DELETE',
        })
        continue
      }

      if (def._isNew) {
        // CREATE definizione
        const res = await fetch(`${apiUrl}/definizioni`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma: lemmaId,
            numero: def.numero,
            testo: def.testo,
          }),
        })
        const created = await res.json()
        defId = created.doc.id
      } else if (defId) {
        // UPDATE definizione
        await fetch(`${apiUrl}/definizioni/${defId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: def.numero,
            testo: def.testo,
          }),
        })
      }

      // Sync Ricorrenze per questa definizione
      if (def.ricorrenze && defId) {
        for (const ric of def.ricorrenze) {
          if (ric._isDeleted && ric.id) {
            // DELETE
            await fetch(`${apiUrl}/ricorrenze/${ric.id}`, {
              method: 'DELETE',
            })
          } else if (ric._isNew) {
            // CREATE
            await fetch(`${apiUrl}/ricorrenze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                definizione: defId,
                fonte: ric.fonte,
                testo_originale: ric.testo_originale,
                pagina: ric.pagina,
                livello_razionalita: ric.livello_razionalita,
                note: ric.note,
              }),
            })
          } else if (ric.id) {
            // UPDATE
            await fetch(`${apiUrl}/ricorrenze/${ric.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ric),
            })
          }
        }
      }
    }
  }

  /**
   * Sync Riferimenti Incrociati
   */
  const syncRiferimenti = async (lemmaId: string | number, riferimenti: any[]) => {
    for (const rif of riferimenti) {
      if (rif._isDeleted && rif.id) {
        // DELETE (hook elimina anche l'inverso)
        await fetch(`${apiUrl}/riferimenti-incrociati/${rif.id}`, {
          method: 'DELETE',
        })
      } else if (rif._isNew) {
        // CREATE (hook crea anche l'inverso)
        await fetch(`${apiUrl}/riferimenti-incrociati`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma_sorgente: lemmaId,
            lemma_destinazione: rif.lemma_destinazione,
            tipo_riferimento: rif.tipo_riferimento,
            note: rif.note,
          }),
        })
      } else if (rif.id) {
        // UPDATE
        await fetch(`${apiUrl}/riferimenti-incrociati/${rif.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rif),
        })
      }
    }
  }

  return {
    loadLemma,
    saveAll,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
  }
}
