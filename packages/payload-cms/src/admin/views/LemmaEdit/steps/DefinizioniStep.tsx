import React, { useState, useEffect } from 'react'
import { useLemmaEdit } from '../context'
import type { Definizione, Ricorrenza } from '../context'

/**
 * Step 3: Definizioni e Ricorrenze
 */

export const DefinizioniStep: React.FC = () => {
  const { state, dispatch } = useLemmaEdit()
  const { definizioni, lemma } = state

  const [fonti, setFonti] = useState<any[]>([])
  const [livelli, setLivelli] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Carica dropdown options (fonti e livelli razionalità)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [fontiRes, livelliRes] = await Promise.all([
          fetch('/api/fonti?limit=1000'),
          fetch(`/api/livelli-razionalita?where[lemmario][equals]=${lemma?.lemmario}&limit=100`),
        ])

        const fontiData = await fontiRes.json()
        const livelliData = await livelliRes.json()

        setFonti(fontiData.docs || [])
        setLivelli(livelliData.docs || [])
        setLoadingOptions(false)
      } catch (error) {
        console.error('Errore caricamento opzioni:', error)
        setLoadingOptions(false)
      }
    }

    if (lemma?.lemmario) {
      loadOptions()
    }
  }, [lemma?.lemmario])

  const activeDefinizioni = definizioni.filter((d) => !d._isDeleted)

  const handleAddDefinizione = () => {
    const nuovaDef: Definizione = {
      numero: activeDefinizioni.length + 1,
      testo: '',
      ricorrenze: [],
      _isNew: true,
    }
    dispatch({ type: 'ADD_DEFINIZIONE', payload: nuovaDef })
  }

  const handleDeleteDefinizione = (index: number) => {
    if (window.confirm('Eliminare questa definizione e tutte le sue ricorrenze?')) {
      dispatch({ type: 'DELETE_DEFINIZIONE', index })
    }
  }

  const handleUpdateDefinizione = (index: number, field: keyof Definizione, value: any) => {
    const updated = { ...definizioni[index], [field]: value }
    dispatch({ type: 'UPDATE_DEFINIZIONE', index, payload: updated })
  }

  const handleAddRicorrenza = (defIndex: number) => {
    const nuovaRic: Ricorrenza = {
      fonte: '',
      testo_originale: '',
      pagina: '',
      livello_razionalita: '',
      _isNew: true,
    }
    dispatch({ type: 'ADD_RICORRENZA', defIndex, payload: nuovaRic })
  }

  const handleDeleteRicorrenza = (defIndex: number, ricIndex: number) => {
    if (window.confirm('Eliminare questa ricorrenza?')) {
      dispatch({ type: 'DELETE_RICORRENZA', defIndex, ricIndex })
    }
  }

  const handleUpdateRicorrenza = (
    defIndex: number,
    ricIndex: number,
    field: keyof Ricorrenza,
    value: any
  ) => {
    const def = definizioni[defIndex]
    const ric = def.ricorrenze?.[ricIndex]
    if (!ric) return

    const updated = { ...ric, [field]: value }
    dispatch({ type: 'UPDATE_RICORRENZA', defIndex, ricIndex, payload: updated })
  }

  if (loadingOptions) {
    return <div>Caricamento fonti e livelli razionalità...</div>
  }

  return (
    <div className="definizioni-step">
      <h2>Definizioni e Ricorrenze</h2>
      <p className="description">
        Aggiungi i significati del lemma con le relative citazioni nelle fonti storiche
      </p>

      {/* Lista definizioni */}
      {activeDefinizioni.length > 0 && (
        <div className="definizioni-list">
          {activeDefinizioni.map((def, _defIdx) => {
            const realIndex = definizioni.indexOf(def)
            const activeRicorrenze = (def.ricorrenze || []).filter((r) => !r._isDeleted)

            return (
              <div key={realIndex} className="definizione-card">
                {/* Header Definizione */}
                <div className="def-header">
                  <span className="def-number">#{def.numero}</span>
                  <input
                    type="text"
                    className="def-testo"
                    value={def.testo}
                    onChange={(e) =>
                      handleUpdateDefinizione(realIndex, 'testo', e.target.value)
                    }
                    placeholder="Testo della definizione (es. Detrarre, Abbassare...)"
                  />
                  <button
                    type="button"
                    className="btn-delete-def"
                    onClick={() => handleDeleteDefinizione(realIndex)}
                  >
                    Elimina Definizione
                  </button>
                </div>

                {/* Ricorrenze per questa definizione */}
                <div className="ricorrenze-section">
                  <h4>Ricorrenze (Citazioni)</h4>

                  {activeRicorrenze.map((ric, _ricIdx) => {
                    const realRicIndex = (def.ricorrenze || []).indexOf(ric)

                    return (
                      <div key={realRicIndex} className="ricorrenza-item">
                        <div className="ric-row">
                          <div className="ric-field">
                            <label>Fonte *</label>
                            <select
                              value={ric.fonte}
                              onChange={(e) =>
                                handleUpdateRicorrenza(
                                  realIndex,
                                  realRicIndex,
                                  'fonte',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Seleziona fonte...</option>
                              {fonti.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.titolo} ({f.anno})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ric-field">
                            <label>Pagina/Carta</label>
                            <input
                              type="text"
                              value={ric.pagina || ''}
                              onChange={(e) =>
                                handleUpdateRicorrenza(
                                  realIndex,
                                  realRicIndex,
                                  'pagina',
                                  e.target.value
                                )
                              }
                              placeholder="es. p. 157v., c. 12r"
                            />
                          </div>

                          <div className="ric-field">
                            <label>Livello Razionalità</label>
                            <select
                              value={ric.livello_razionalita || ''}
                              onChange={(e) =>
                                handleUpdateRicorrenza(
                                  realIndex,
                                  realRicIndex,
                                  'livello_razionalita',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Nessuno</option>
                              {livelli.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.numero}. {l.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="ric-row">
                          <div className="ric-field full-width">
                            <label>Testo Originale *</label>
                            <textarea
                              value={ric.testo_originale}
                              onChange={(e) =>
                                handleUpdateRicorrenza(
                                  realIndex,
                                  realRicIndex,
                                  'testo_originale',
                                  e.target.value
                                )
                              }
                              placeholder="«Testo citato dalla fonte...»"
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="ric-actions">
                          <button
                            type="button"
                            className="btn-delete-ric"
                            onClick={() => handleDeleteRicorrenza(realIndex, realRicIndex)}
                          >
                            Elimina Ricorrenza
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    className="btn-add-ricorrenza"
                    onClick={() => handleAddRicorrenza(realIndex)}
                  >
                    + Aggiungi Ricorrenza
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottone aggiungi definizione */}
      <button type="button" className="btn-add-def" onClick={handleAddDefinizione}>
        + Aggiungi Definizione
      </button>

      {activeDefinizioni.length === 0 && (
        <p className="empty-state">Nessuna definizione aggiunta</p>
      )}
    </div>
  )
}
