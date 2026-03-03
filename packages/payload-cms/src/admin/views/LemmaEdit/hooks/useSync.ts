import { useLemmaEdit } from '../context'

/**
 * Custom hook per gestire caricamento e salvataggio dati
 */

/**
 * Wrapper per fetch che verifica res.ok e lancia errore con messaggio Payload.
 * Gestisce risposte non-JSON (es. 502 HTML, DELETE 204 vuota).
 */
const checkedFetch = async (url: string, options?: RequestInit): Promise<any> => {
  const res = await fetch(url, options)

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status}: ${text.substring(0, 200)}`)
    }
    return {}
  }

  if (!res.ok) {
    const errorMsg = data.errors
      ? data.errors.map((e: any) => e.message).join(', ')
      : data.message || `Errore HTTP ${res.status}`
    throw new Error(errorMsg)
  }
  return data
}

/**
 * Converte stringhe vuote in undefined per campi relationship Payload
 */
const cleanRelationship = (value: any): any => {
  if (value === '' || value === null) return undefined
  const num = Number(value)
  if (!isNaN(num)) return num
  return value
}

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
      // 1. Carica lemma (depth=0 per avere relationship come ID, non oggetti espansi)
      const lemmaRes = await fetch(`${apiUrl}/lemmi/${id}?depth=0`)
      if (!lemmaRes.ok) throw new Error('Lemma non trovato')
      const lemmaData = await lemmaRes.json()
      dispatch({ type: 'SET_LEMMA', payload: lemmaData })

      // 2. Carica definizioni
      const defRes = await fetch(`${apiUrl}/definizioni?where[lemma][equals]=${id}&depth=0`)
      const defData = await defRes.json()
      const definizioni = defData.docs || []

      // 3. Per ogni definizione, carica ricorrenze con fonte popolata
      const defWithRic = await Promise.all(
        definizioni.map(async (def: any) => {
          const ricRes = await fetch(
            `${apiUrl}/ricorrenze?where[definizione][equals]=${def.id}&depth=2`
          )
          const ricData = await ricRes.json()

          // Normalizza fonte a ID ed estrai titolo per anteprima
          const ricorrenzeConTitolo = (ricData.docs || []).map((ric: any) => ({
            ...ric,
            fonte: typeof ric.fonte === 'object' ? ric.fonte?.id : ric.fonte,
            fonte_titolo: typeof ric.fonte === 'object' ? ric.fonte?.titolo : undefined,
          }))

          return {
            ...def,
            ricorrenze: ricorrenzeConTitolo,
          }
        })
      )

      dispatch({ type: 'SET_DEFINIZIONI', payload: defWithRic })

      // 4. Carica varianti grafiche
      const varRes = await fetch(`${apiUrl}/varianti-grafiche?where[lemma][equals]=${id}`)
      const varData = await varRes.json()
      dispatch({ type: 'SET_VARIANTI', payload: varData.docs || [] })

      // 5. Carica riferimenti incrociati (solo non auto-creati)
      try {
        const rifRes = await fetch(
          `${apiUrl}/riferimenti-incrociati?where[lemma_origine][equals]=${id}&depth=1`
        )
        if (rifRes.ok) {
          const rifData = await rifRes.json()
          // Filtra lato client solo quelli non auto-creati
          // Normalizza lemma_destinazione a ID (depth=1 lo espande a oggetto)
          const riferimenti = (rifData.docs || [])
            .filter((r: any) => !r.auto_creato)
            .map((r: any) => ({
              ...r,
              lemma_destinazione:
                typeof r.lemma_destinazione === 'object'
                  ? r.lemma_destinazione?.id
                  : r.lemma_destinazione,
            }))
          dispatch({ type: 'SET_RIFERIMENTI', payload: riferimenti })
        } else {
          console.warn('Errore caricamento riferimenti:', rifRes.status)
          dispatch({ type: 'SET_RIFERIMENTI', payload: [] })
        }
      } catch (err) {
        console.error('Errore fetch riferimenti:', err)
        dispatch({ type: 'SET_RIFERIMENTI', payload: [] })
      }

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

      // 1. Aggiorna lemma base (solo campi editabili, no relazioni espanse)
      await checkedFetch(`${apiUrl}/lemmi/${lemmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termine: lemma.termine,
          tipo: lemma.tipo,
          slug: lemma.slug,
          ordinamento: lemma.ordinamento,
          note_redazionali: lemma.note_redazionali,
          pubblicato: lemma.pubblicato,
          data_pubblicazione: lemma.data_pubblicazione,
        }),
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
        await checkedFetch(`${apiUrl}/varianti-grafiche/${variante.id}`, {
          method: 'DELETE',
        })
      } else if (variante._isNew) {
        // CREATE
        await checkedFetch(`${apiUrl}/varianti-grafiche`, {
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
        await checkedFetch(`${apiUrl}/varianti-grafiche/${variante.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            termine: variante.termine,
            ordine: variante.ordine,
            note: variante.note,
          }),
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
        await checkedFetch(`${apiUrl}/definizioni/${defId}`, {
          method: 'DELETE',
        })
        continue
      }

      if (def._isNew) {
        // CREATE definizione
        const created = await checkedFetch(`${apiUrl}/definizioni`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma: lemmaId,
            numero: def.numero,
            testo: def.testo,
            livello_razionalita: cleanRelationship(def.livello_razionalita),
          }),
        })
        defId = created.doc.id
      } else if (defId) {
        // UPDATE definizione
        await checkedFetch(`${apiUrl}/definizioni/${defId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: def.numero,
            testo: def.testo,
            livello_razionalita: cleanRelationship(def.livello_razionalita),
          }),
        })
      }

      // Sync Ricorrenze per questa definizione
      if (def.ricorrenze && defId) {
        for (const ric of def.ricorrenze) {
          if (ric._isDeleted && ric.id) {
            // DELETE
            await checkedFetch(`${apiUrl}/ricorrenze/${ric.id}`, {
              method: 'DELETE',
            })
          } else if (ric._isNew) {
            // CREATE
            await checkedFetch(`${apiUrl}/ricorrenze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                definizione: defId,
                fonte: ric.fonte,
                testo_originale: ric.testo_originale,
                pagina: ric.pagina,
                pagina_raw: ric.pagina_raw,
                tipo_riferimento: ric.tipo_riferimento,
                numero: ric.numero,
                numero_secondario: ric.numero_secondario,
                rubrica_numero: ric.rubrica_numero,
                rubrica_titolo: ric.rubrica_titolo,
                libro: ric.libro,
                capitolo: ric.capitolo,
                sezione: ric.sezione,
                supplemento: ric.supplemento,
                note: ric.note,
              }),
            })
          } else if (ric.id) {
            // UPDATE - invia solo campi editabili (no relazioni espanse come definizione)
            await checkedFetch(`${apiUrl}/ricorrenze/${ric.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fonte: typeof ric.fonte === 'object' ? ric.fonte?.id : ric.fonte,
                testo_originale: ric.testo_originale,
                pagina: ric.pagina,
                pagina_raw: ric.pagina_raw,
                tipo_riferimento: ric.tipo_riferimento,
                numero: ric.numero,
                numero_secondario: ric.numero_secondario,
                rubrica_numero: ric.rubrica_numero,
                rubrica_titolo: ric.rubrica_titolo,
                libro: ric.libro,
                capitolo: ric.capitolo,
                sezione: ric.sezione,
                supplemento: ric.supplemento,
                note: ric.note,
              }),
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
        await checkedFetch(`${apiUrl}/riferimenti-incrociati/${rif.id}`, {
          method: 'DELETE',
        })
      } else if (rif._isNew) {
        // CREATE (hook crea anche l'inverso)
        await checkedFetch(`${apiUrl}/riferimenti-incrociati`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma_origine: lemmaId,
            lemma_destinazione: rif.lemma_destinazione,
            tipo_riferimento: rif.tipo_riferimento,
            note: rif.note,
          }),
        })
      } else if (rif.id) {
        // UPDATE
        await checkedFetch(`${apiUrl}/riferimenti-incrociati/${rif.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lemma_destinazione: rif.lemma_destinazione,
            tipo_riferimento: rif.tipo_riferimento,
            note: rif.note,
          }),
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
